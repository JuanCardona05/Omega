import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { loadStoreState as loadPersistedState, saveStoreState } from './services/storeRepository'
import { getLowStockProducts } from './services/inventoryService'
import { finalizeSale as finalizeSaleApplication } from './services/salesApplicationService'
import { closeCashRegister as closeCash, createCashHistoryEntry, openCashRegister as openCash, rollCashRegisterToDate } from './services/cashService'
import { validateAdminEmail, validateCashClosing, validateCashOpeningAmount, validateProduct, validateUserAccount } from './utils/validation'
import { dateToInputValue, formatCurrency, todayIs } from './utils/formatters'
import { getAdminContactUrl } from './utils/contactLinks'
import { authenticate, getValidSession, logout as logoutUser } from './services/authService'
import { authorize, can, permissions } from './services/permissions'
import { defaultBusiness, defaultCashRegister, defaultCategories, defaultProducts, defaultUsers } from './data/storeDefaults'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import NuevaVenta from './pages/NuevaVenta'
import Inventario from './pages/Inventario'
import Caja from './pages/Caja'
import Ventas from './pages/Ventas'
import Facturas, { PublicInvoice } from './pages/Facturas'
import Usuarios from './pages/Usuarios'
import ModulePlaceholder from './components/common/ModulePlaceholder'
import Categorias from './pages/Categorias'
import Reportes from './pages/Reportes'

const loadStoreState = () => {
  return loadPersistedState()
}

const findHighestInvoiceSequence = (sales) => sales.reduce((highest, sale) => {
  const sequence = String(sale.invoiceNumber || '').match(/^FAC-(\d+)$/)
  return Math.max(highest, Number(sequence?.[1] || 0))
}, 0)

function App() {
  const initialState = useMemo(() => loadStoreState(), [])
  const [products, setProducts] = useState(initialState.products)
  const [sales, setSales] = useState(initialState.sales)
  const [lastInvoiceNumber, setLastInvoiceNumber] = useState(Math.max(initialState.lastInvoiceNumber, findHighestInvoiceSequence(initialState.sales)))
  const [business, setBusiness] = useState(initialState.business)
  const [cashRegister, setCashRegister] = useState(initialState.cashRegister)
  const [cashHistory, setCashHistory] = useState(initialState.cashHistory || [])
  const [users, setUsers] = useState(initialState.users)
  const [categoriesState, setCategoriesState] = useState(initialState.categories || [...new Set(initialState.products.map((product) => product.category).filter(Boolean))])
  const [session, setSession] = useState(() => getValidSession(initialState.users))
  const [activeTab, setActiveTab] = useState('dashboard')
  const [invoicePreview, setInvoicePreview] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [publicInvoice] = useState(() => {
    const encodedInvoice = new URLSearchParams(window.location.search).get('invoice')
    if (!encodedInvoice) return null
    try {
      return JSON.parse(decodeURIComponent(encodedInvoice))
    } catch (error) {
      console.warn('El enlace contiene una factura inválida.', error)
      return null
    }
  })
  const [expandedGroups, setExpandedGroups] = useState({
    home: true,
    sales: true,
    inventory: true,
    supply: false,
    administration: true,
  })
  const [toast, setToast] = useState(null)
  const [currentDate, setCurrentDate] = useState(todayIs())
  const [installedVersion, setInstalledVersion] = useState('0.0.0')
  const [updateState, setUpdateState] = useState({
    status: 'idle',
    version: '',
    message: '',
    progress: 0,
    error: '',
    installOnClose: false,
    dismissed: false,
  })

  useEffect(() => {
    const api = window.electronAPI
    if (!api) return undefined

    const handleState = (state) => {
      setUpdateState((current) => ({ ...current, ...state }))
    }

    const unsubscribe = api.onUpdateState(handleState)
    Promise.all([api.getAppVersion(), api.getUpdateState()])
      .then(([version, state]) => {
        setInstalledVersion(version || '0.0.0')
        setUpdateState((current) => ({ ...current, ...state }))
      })
      .catch((error) => {
        console.error('No se pudo cargar el estado de actualización.', error)
      })

    return () => { if (unsubscribe) unsubscribe() }
  }, [])

  useEffect(() => {
    if (!window.electronAPI) return
    window.electronAPI.setInstallOnClose(Boolean(updateState.installOnClose)).catch(() => undefined)
  }, [updateState.installOnClose])

  useEffect(() => {
    if (!window.electronAPI) return
    const hasBillingActivity = activeTab === 'sale' || activeTab === 'cash' || activeTab === 'invoices'
    window.electronAPI.setCriticalOperation?.(hasBillingActivity).catch(() => undefined)
  }, [activeTab])

  useEffect(() => {
    saveStoreState({ products, sales, lastInvoiceNumber, business, cashRegister, cashHistory, users, categories: categoriesState })
  }, [products, sales, lastInvoiceNumber, business, cashRegister, cashHistory, users, categoriesState])

  useEffect(() => {
    const timer = window.setInterval(() => {
      const date = todayIs()
      if (date === currentDate) return
      const rolledCash = rollCashRegisterToDate(cashRegister, sales, cashHistory, date)
      if (rolledCash.changed) {
        setCashRegister(rolledCash.cashRegister)
        setCashHistory(rolledCash.cashHistory)
      }
      setCurrentDate(date)
    }, 60_000)
    return () => window.clearInterval(timer)
  }, [currentDate, cashRegister, sales, cashHistory])

  const notify = (message, tone = 'info') => {
    setToast({ message, tone })
    window.setTimeout(() => setToast(null), 3200)
  }

  const handleUpdateInstall = async () => {
    if (!window.electronAPI) return
    const result = await window.electronAPI.installUpdate()
    if (!result?.ok) {
      notify(result?.message || 'La actualización no está lista todavía.', 'warning')
    }
  }

  const runAuthorized = (permission, action) => {
    try {
      authorize(session, permission)
      return action()
    } catch (error) {
      notify(error.message, 'warning')
      return false
    }
  }

  const login = (username, password) => {
    const result = authenticate(users, username, password)
    if (result.ok) {
      setSession(result.session)
      setActiveTab('dashboard')
    }
    return result
  }

  const logout = () => {
    logoutUser()
    setSession(null)
    setActiveTab('dashboard')
  }

  const categories = ['Todas', ...categoriesState]
  const createCategory = (value) => runAuthorized(permissions.INVENTORY_MANAGE, () => {
    const category = value.trim()
    if (!category) {
      notify('Escribe un nombre para la categoría.', 'warning')
      return false
    }
    if (categoriesState.some((item) => item.toLowerCase() === category.toLowerCase())) {
      notify('La categoría ya existe.', 'warning')
      return false
    }
    setCategoriesState((current) => [...current, category])
    notify('Categoría creada correctamente.', 'success')
    return true
  }) || false
  const deleteCategory = (category) => runAuthorized(permissions.INVENTORY_MANAGE, () => {
    const affectedProducts = products.filter((product) => product.category === category).length
    setCategoriesState((current) => current.filter((item) => item !== category))
    if (affectedProducts) {
      setProducts((current) => current.map((product) => (
        product.category === category ? { ...product, category: '' } : product
      )))
    }
    notify(
      affectedProducts
        ? `Categoría eliminada. ${affectedProducts} producto${affectedProducts === 1 ? ' quedó sin categoría.' : 's quedaron sin categoría.'}`
        : 'Categoría eliminada.',
      'success',
    )
    return true
  }) || false

  const todaysSales = sales.filter((sale) => dateToInputValue(new Date(sale.date)) === todayIs())
  const lowStockProducts = getLowStockProducts(products)
  const revenueToday = todaysSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0)
  useEffect(() => {
    const handleShortcut = (event) => {
      if (event.key === 'F2') {
        event.preventDefault()
        setActiveTab('sale')
      }
    }
    window.addEventListener('keydown', handleShortcut)
    return () => window.removeEventListener('keydown', handleShortcut)
  }, [])

  const handleProductSubmit = (payload, editingProductId) => {
    if (!can(session, permissions.INVENTORY_MANAGE)) {
      notify('No tienes permisos para realizar esta acción.', 'warning')
      return false
    }
    const validationError = validateProduct(payload, products, editingProductId)
    if (validationError) {
      notify(validationError, 'error')
      return false
    }

    if (editingProductId) {
      setProducts((prev) => prev.map((product) => product.id === editingProductId ? { ...product, ...payload } : product))
    } else {
      setProducts((prev) => [{ id: Date.now(), ...payload }, ...prev])
    }
    return true
  }

  const deleteProduct = (productId) => {
    if (!can(session, permissions.INVENTORY_MANAGE)) {
      notify('No tienes permisos para realizar esta acción.', 'warning')
      return
    }
    setProducts((prev) => prev.filter((item) => item.id !== productId))
  }

  const finalizeSale = ({ cart, cashReceived, saleTotals }) => {
    if (!can(session, permissions.SALES_CREATE)) {
      notify('No tienes permisos para realizar esta acción.', 'warning')
      return false
    }
    const result = finalizeSaleApplication({
      cart,
      cashReceived,
      saleTotals,
      cashRegister,
      products,
      lastInvoiceNumber,
      createdBy: session.name,
      createdById: session.userId,
    })
    if (!result.ok) {
      const insufficientCash = result.error === 'El efectivo recibido es menor que el total de la venta.'
      const message = insufficientCash
        ? `El efectivo no alcanza. Faltan ${formatCurrency(Number(saleTotals.total) - Number(cashReceived || 0))} para completar la venta.`
        : result.error
      notify(message, insufficientCash ? 'error' : 'warning')
      if (result.shouldOpenCash) setActiveTab('cash')
      return false
    }

    setLastInvoiceNumber(result.nextInvoiceNumber)
    setProducts(result.updatedProducts)
    setSales((prev) => [result.sale, ...prev])
    setInvoicePreview(result.sale)
    setActiveTab('invoices')
    return true
  }

  const openCashRegister = (openingAmount) => {
    if (!can(session, permissions.CASH_OPEN)) {
      notify('No tienes permisos para realizar esta acción.', 'warning')
      return
    }
    const validationError = validateCashOpeningAmount(openingAmount)
    if (validationError) {
      notify(validationError, 'error')
      return
    }
    setCashRegister(openCash({
      number: cashRegister.number,
      operator: session.name,
      openingAmount: Number(openingAmount),
      businessDate: todayIs(),
    }))
    notify('Caja abierta correctamente.', 'success')
  }

  const closeCashRegister = (countedAmount) => {
    if (!can(session, permissions.CASH_CLOSE)) {
      notify('No tienes permisos para realizar esta acción.', 'warning')
      return
    }
    const validationError = validateCashClosing(countedAmount)
    if (validationError) {
      notify(validationError, 'error')
      return
    }
    const cashDate = cashRegister.businessDate || dateToInputValue(new Date(cashRegister.openedAt))
    const cashSales = sales
      .filter((sale) => dateToInputValue(new Date(sale.date)) === cashDate)
      .reduce((total, sale) => total + Number(sale.total || 0), 0)
    const actualCountedAmount = Number(countedAmount)
    const closedCashRegister = closeCash(cashRegister, actualCountedAmount, session.name)
    setCashRegister(closedCashRegister)
    const historyEntry = createCashHistoryEntry(cashRegister, cashSales, actualCountedAmount, session.name)
    setCashHistory((current) => [
      ...current.filter((entry) => entry.date !== historyEntry.date),
      historyEntry,
    ])
    notify('Caja cerrada correctamente.', 'success')
  }

  const formatStore = () => {
    if (session?.role !== 'ADMIN') {
      notify('Solo un administrador puede formatear la tienda.', 'warning')
      return
    }

    const confirmed = window.confirm(
      'Esta acción eliminará todas las ventas, facturas y usuarios creados, y restablecerá productos, caja y configuración. Se conservará únicamente el administrador inicial (admin / admin123). ¿Deseas continuar?',
    )
    if (!confirmed) return

    const initialAdmin = defaultUsers[0]
    const loginResult = authenticate(defaultUsers, initialAdmin.username, initialAdmin.password)
    if (!loginResult.ok) {
      notify(`No se pudo restablecer el acceso de administrador: ${loginResult.error}`, 'error')
      return
    }

    const freshCashRegister = {
      ...defaultCashRegister,
      openedAt: new Date().toISOString(),
    }
    setProducts(defaultProducts.map((product) => ({ ...product })))
    setSales([])
    setLastInvoiceNumber(0)
    setBusiness({ ...defaultBusiness })
    setCashRegister(freshCashRegister)
    setCashHistory([])
    setUsers(defaultUsers.map((user) => ({ ...user })))
    setCategoriesState([...defaultCategories])
    setSession(loginResult.session)
    setInvoicePreview(null)
    setActiveTab('dashboard')
    notify('Omega quedó restablecida. Acceso inicial: admin / admin123.', 'success')
  }

  const saveBusinessSettings = (event) => {
    event.preventDefault()
    if (!can(session, permissions.SETTINGS_MANAGE)) {
      notify('No tienes permisos para realizar esta acción.', 'warning')
      return
    }
    const name = business.name.trim()
    if (!name) {
      notify('El nombre del negocio es obligatorio.', 'error')
      return
    }
    const emailError = validateAdminEmail(business.adminEmail)
    if (emailError) {
      notify(emailError, 'error')
      return
    }
    setBusiness((current) => ({
      ...current,
      name,
      nit: current.nit.trim(),
      address: current.address.trim(),
      phone: current.phone.trim(),
      adminEmail: current.adminEmail.trim(),
      footer: current.footer.trim(),
    }))
    notify('Configuración guardada.', 'success')
  }

  const validateUserPayload = (payload, editingId = null) => {
    return validateUserAccount(payload, users, editingId)
  }

  const createUser = (payload) => runAuthorized(permissions.USERS_MANAGE, () => {
    const validationError = validateUserPayload(payload)
    if (validationError) return { ok: false, error: validationError }
    setUsers((current) => [...current, { id: `user-${Date.now()}`, name: payload.name.trim(), username: payload.username.trim().toLowerCase(), password: payload.password, role: payload.role, active: true, createdAt: new Date().toISOString() }])
    notify('Usuario creado correctamente.', 'success')
    return { ok: true }
  }) || { ok: false, error: 'No tienes permisos para realizar esta acción.' }

  const updateUser = (userId, payload) => runAuthorized(permissions.USERS_MANAGE, () => {
    const validationError = validateUserPayload(payload, userId)
    if (validationError) return { ok: false, error: validationError }
    const updatedUsers = users.map((user) => user.id === userId
      ? { ...user, name: payload.name.trim(), username: payload.username.trim().toLowerCase(), role: payload.role, ...(payload.password ? { password: payload.password } : {}) }
      : user)
    setUsers(updatedUsers)
    if (session?.userId === userId) setSession(getValidSession(updatedUsers))
    notify('Usuario actualizado correctamente.', 'success')
    return { ok: true }
  }) || { ok: false, error: 'No tienes permisos para realizar esta acción.' }

  const toggleUser = (userId) => runAuthorized(permissions.USERS_MANAGE, () => {
    setUsers((current) => current.map((user) => user.id === userId ? { ...user, active: !user.active } : user))
    notify('Estado del usuario actualizado.', 'success')
    return { ok: true }
  }) || { ok: false, error: 'No tienes permisos para realizar esta acción.' }

  const moduleCopy = {
    categories: {
      title: 'Categorías',
      description: 'Organiza tus productos para encontrarlos más rápido.',
      empty: 'Aún no hay categorías configuradas.',
      action: 'Crear categoría',
    },
    purchases: {
      title: 'Compras',
      description: 'Registra compras y abastecimiento de inventario.',
      empty: 'No hay compras registradas.',
      action: 'Registrar compra',
    },
    suppliers: {
      title: 'Proveedores',
      description: 'Centraliza la información de tus proveedores.',
      empty: 'Aún no hay proveedores registrados.',
      action: 'Agregar proveedor',
    },
    cash: {
      title: 'Caja',
      description: 'Controla la apertura, movimientos y cierre de caja.',
      empty: 'La caja está lista para iniciar una jornada.',
      action: 'Abrir caja',
    },
    reports: {
      title: 'Reportes',
      description: 'Analiza el rendimiento de ventas e inventario.',
      empty: 'Los reportes aparecerán cuando existan operaciones registradas.',
      action: 'Ver ventas',
    },
    settings: {
      title: 'Configuración',
      description: 'Personaliza la información comercial del negocio.',
      empty: 'Configura los datos que aparecerán en tus comprobantes.',
      action: 'Configurar negocio',
    },
    users: {
      title: 'Usuarios y empleados',
      description: 'Administra los accesos del equipo al sistema.',
      empty: 'Aún no hay usuarios configurados.',
      action: 'Crear usuario',
    },
  }

  const renderModulePage = (moduleId) => {
    if (moduleId === 'settings') {
      return (
        <section className="module-page">
          <div className="module-intro"><span className="module-kicker">NEGOCIO</span><h2>Configuración</h2><p>Estos datos aparecerán en los comprobantes generados.</p></div>
          <form className="panel settings-form" onSubmit={saveBusinessSettings}>
            <div className="form-section-title">Información del negocio</div>
            <div className="form-grid">
              <label>Nombre del negocio<input required value={business.name} onChange={(event) => setBusiness({ ...business, name: event.target.value })} /></label>
              <label>NIT o identificación<input value={business.nit} onChange={(event) => setBusiness({ ...business, nit: event.target.value })} /></label>
              <label>Dirección<input value={business.address} onChange={(event) => setBusiness({ ...business, address: event.target.value })} /></label>
              <label>Teléfono<input value={business.phone} onChange={(event) => setBusiness({ ...business, phone: event.target.value })} /></label>
              <label>Correo del administrador<input type="email" required autoComplete="email" value={business.adminEmail} onChange={(event) => setBusiness({ ...business, adminEmail: event.target.value })} /></label>
              <label className="full-width">Mensaje al final del comprobante<input value={business.footer} onChange={(event) => setBusiness({ ...business, footer: event.target.value })} /></label>
            </div>
            <button className="primary-btn" type="submit">Guardar configuración</button>
          </form>
          <section className="panel reset-store-panel">
            <div>
              <h3>Restablecer toda la tienda</h3>
              <p>Elimina ventas, facturas y usuarios creados; restaura productos, caja y configuración iniciales.</p>
            </div>
            <button className="danger-btn" type="button" onClick={formatStore}>Formatear todo</button>
          </section>
        </section>
      )
    }
    if (moduleId === 'categories') {
      return <Categorias categories={categoriesState} products={products} onCreateCategory={createCategory} onDeleteCategory={deleteCategory} />
    }
    if (moduleId === 'reports') {
      return <Reportes sales={sales} products={products} />
    }
    if (moduleId === 'users') {
      return <Usuarios users={users} currentUserId={session.userId} onCreateUser={createUser} onUpdateUser={updateUser} onToggleUser={toggleUser} />
    }
    if (moduleId === 'users') {
      return <Usuarios users={users} currentUserId={session.userId} onCreateUser={createUser} onUpdateUser={updateUser} onToggleUser={toggleUser} />
    }
    const module = moduleCopy[moduleId]
    return <ModulePlaceholder module={module} />
  }

  const pageTitles = {
    dashboard: ['Dashboard', 'Resumen operativo de tu negocio · actualizaciones automáticas'],
    sale: ['Nueva venta', 'Procesa una venta de forma rápida y precisa'],
    inventory: ['Inventario', 'Productos, existencias y precios'],
    invoices: ['Facturas', 'Comprobantes generados recientemente'],
    sales: ['Ventas', 'Consulta y seguimiento de tus operaciones'],
    categories: ['Categorías', 'Organiza tu catálogo'],
    purchases: ['Compras', 'Abastecimiento de inventario'],
    suppliers: ['Proveedores', 'Contactos y abastecimiento'],
    cash: ['Caja', 'Movimientos y cierre de jornada'],
    reports: ['Reportes', 'Indicadores para tomar decisiones'],
    settings: ['Configuración', 'Datos y preferencias del negocio'],
    users: ['Usuarios y empleados', 'Gestiona los accesos del equipo'],
  }
  const [pageTitle, pageSubtitle] = pageTitles[activeTab] || pageTitles.dashboard
  const navigationGroups = [
    {
      id: 'home',
      label: 'Inicio',
      items: [{ id: 'dashboard', label: 'Dashboard', permission: permissions.DASHBOARD_VIEW }],
    },
    {
      id: 'sales',
      label: 'Ventas',
      items: [
        { id: 'sale', label: 'Nueva venta', primary: true, permission: permissions.SALES_CREATE },
        { id: 'sales', label: 'Ventas', permission: permissions.SALES_VIEW },
        { id: 'invoices', label: 'Facturas', permission: permissions.INVOICES_VIEW },
      ],
    },
    {
      id: 'inventory',
      label: 'Inventario',
      items: [
        { id: 'inventory', label: 'Inventario', permission: permissions.INVENTORY_VIEW },
        { id: 'categories', label: 'Categorías', permission: permissions.CATEGORIES_VIEW },
      ],
    },
    {
      id: 'supply',
      label: 'Abastecimiento',
      items: [
        { id: 'purchases', label: 'Compras', permission: permissions.PURCHASES_VIEW },
        { id: 'suppliers', label: 'Proveedores', permission: permissions.SUPPLIERS_VIEW },
      ],
    },
    {
      id: 'administration',
      label: 'Administración',
      items: [
        { id: 'cash', label: 'Caja', permission: permissions.CASH_OPEN },
        { id: 'reports', label: 'Reportes', permission: permissions.REPORTS_VIEW },
        { id: 'settings', label: 'Configuración', permission: permissions.SETTINGS_MANAGE },
        { id: 'users', label: 'Usuarios', permission: permissions.USERS_MANAGE },
      ],
    },
  ]
  const visibleNavigationGroups = navigationGroups
    .map((group) => ({ ...group, items: group.items.filter((item) => can(session, item.permission)) }))
    .filter((group) => group.items.length)
  const toggleNavigationGroup = (groupId) => {
    setExpandedGroups((current) => ({ ...current, [groupId]: !current[groupId] }))
  }

  if (publicInvoice) return <PublicInvoice invoice={publicInvoice} business={business} />
  if (!session) return <Login businessName={business.name} adminEmail={business.adminEmail} onLogin={login} />

  return (
    <div className={sidebarCollapsed ? 'app-shell sidebar-collapsed' : 'app-shell'}>
      <aside className="sidebar">
        <div className="brand-box">
          <img className="app-brand-logo" src={`${import.meta.env.BASE_URL}omega-mark.png`} alt="" />
          <div className="brand-copy">
            <h1>Omega</h1>
            <span>POS & inventario</span>
          </div>
          <button
            type="button"
            className="mobile-nav-toggle"
            onClick={() => setMobileNavOpen((value) => !value)}
            aria-expanded={mobileNavOpen}
            aria-controls="main-navigation"
            aria-label={mobileNavOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        <nav id="main-navigation" className={mobileNavOpen ? 'nav-menu mobile-nav-open' : 'nav-menu'} aria-label="Navegación principal">
          {visibleNavigationGroups.map((group) => (
            <div className="nav-group" key={group.id}>
              <button
                type="button"
                className="nav-group-toggle"
                onClick={() => toggleNavigationGroup(group.id)}
                aria-expanded={sidebarCollapsed ? undefined : expandedGroups[group.id]}
                title={sidebarCollapsed ? group.label : undefined}
              >
                <span className="nav-group-label">{group.label}</span>
                <span className="nav-group-chevron" aria-hidden="true">
                  {expandedGroups[group.id] ? '−' : '+'}
                </span>
              </button>
              <div className={expandedGroups[group.id] ? 'nav-group-items' : 'nav-group-items collapsed'}>
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`${item.primary ? 'nav-item nav-item-primary' : 'nav-item'} ${activeTab === item.id ? 'active' : ''}`}
                    onClick={() => {
                      setActiveTab(item.id)
                      setMobileNavOpen(false)
                    }}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <span className="nav-dot" aria-hidden="true" />
                    <span className="nav-label">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="status-dot" /> {cashRegister.isOpen ? 'Caja abierta' : 'Caja cerrada'}
        </div>
      </aside>

      <main className="main-content">
        <header className="app-header">
          <div className="header-leading">
            <button type="button" className="icon-btn sidebar-toggle" onClick={() => setSidebarCollapsed((value) => !value)} aria-label="Contraer menú">
              {sidebarCollapsed ? '→' : '←'}
            </button>
            <div>
              <h1>{pageTitle}</h1>
              <p>{pageSubtitle}</p>
            </div>
          </div>
          <div className="header-actions">
            <span className={cashRegister.isOpen ? 'header-status' : 'header-status closed'}><span className="status-dot" /> Caja {cashRegister.isOpen ? 'abierta' : 'cerrada'}</span>
            {session.role === 'EMPLOYEE' && <a className="contact-admin-link" href={getAdminContactUrl(business.adminEmail, 'Soporte Omega')} target="_blank" rel="noreferrer">Contactar administrador</a>}
            <div className="user-chip"><span className="avatar">{session.name.slice(0, 2).toUpperCase()}</span><span>{session.name} · {session.role === 'ADMIN' ? 'Administrador' : 'Empleado'}</span><button type="button" className="ghost-btn tiny" onClick={logout}>Cerrar sesión</button></div>
          </div>
        </header>
        {activeTab === 'dashboard' && (
          <Dashboard
            todaysSales={todaysSales}
            revenueToday={revenueToday}
            lowStockProducts={lowStockProducts}
            products={products}
          />
        )}
        {activeTab === 'inventory' && (
          <Inventario
            products={products}
            categories={categories}
            categoryOptions={categoriesState}
            onProductSubmit={handleProductSubmit}
            onProductDelete={deleteProduct}
          />
        )}
        {activeTab === 'sale' && (
          <NuevaVenta
            products={products}
            notify={notify}
            onFinalizeSale={finalizeSale}
          />
        )}
        {activeTab === 'cash' && (
          <Caja
            key={currentDate}
            cashRegister={cashRegister}
            sales={sales}
            cashHistory={cashHistory}
            today={currentDate}
            onOpenCash={openCashRegister}
            onCloseCash={closeCashRegister}
          />
        )}
        {activeTab === 'invoices' && <Facturas sales={sales} invoicePreview={invoicePreview} business={business} notify={notify} />}
        {activeTab === 'sales' && <Ventas sales={sales} />}
        {activeTab !== 'cash' && Object.prototype.hasOwnProperty.call(moduleCopy, activeTab) && renderModulePage(activeTab)}
      </main>
      {window.electronAPI && !updateState.dismissed && ['available', 'downloading', 'downloaded', 'error'].includes(updateState.status) && (
        <div className="update-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="update-title">
          <div className="update-modal panel">
            <div className="section-header">
              <div>
                <span className="module-kicker">ACTUALIZACIÓN</span>
                <h2 id="update-title">Nueva actualización disponible</h2>
              </div>
            </div>
            <div className="update-version-row">
              <span>Instalada: {installedVersion}</span>
              <span>Disponible: {updateState.version || 'N/A'}</span>
            </div>
            {updateState.status === 'error' ? (
              <p className="update-message error">{updateState.error || 'No se pudo descargar la actualización.'}</p>
            ) : (
              <p className="update-message">{updateState.message || 'Hay una nueva versión lista para instalar.'}</p>
            )}

            {(updateState.status === 'downloading' || updateState.status === 'downloaded' || updateState.status === 'available') && (
              <div className="update-progress-block">
                <div className="update-progress-header">
                  <span>{updateState.status === 'downloaded' ? 'Descarga completada' : 'Descarga en progreso'}</span>
                  <strong>{Math.round(updateState.progress || 0)}%</strong>
                </div>
                <div className="update-progress-track" aria-hidden="true">
                  <span className="update-progress-bar" style={{ width: `${Math.min(Math.max(updateState.progress || 0, 0), 100)}%` }} />
                </div>
              </div>
            )}

            {updateState.status === 'downloaded' && (
              <p className="update-message success">La actualización está lista para instalarse.</p>
            )}
            <p className="update-data-notice">Tus facturas y productos se conservan en el perfil local durante la actualización.</p>

            <label className="update-toggle">
              <input
                type="checkbox"
                checked={Boolean(updateState.installOnClose)}
                onChange={(event) => setUpdateState((current) => ({ ...current, installOnClose: event.target.checked }))}
              />
              Instalar al cerrar la aplicación
            </label>

            <div className="button-row update-actions">
              {updateState.status === 'downloaded' || updateState.status === 'available' ? (
                <button type="button" className="primary-btn" onClick={handleUpdateInstall}>Actualizar y reiniciar</button>
              ) : null}
              <button type="button" className="ghost-btn" onClick={async () => {
                if (window.electronAPI) {
                  await window.electronAPI.dismissUpdate()
                }
                setUpdateState((current) => ({ ...current, dismissed: true }))
              }}>
                Recordarme más tarde
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className={`toast toast-${toast.tone}`} role="alert">{toast.message}</div>}
    </div>
  )
}

export default App
