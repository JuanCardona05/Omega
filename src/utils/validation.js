export const validateProduct = (product, products = [], editingProductId = null) => {
  if (!product.code || !product.name || !product.category || product.salePrice <= 0) {
    return 'Completa los campos obligatorios del producto.'
  }

  if (product.purchasePrice < 0 || product.stock < 0 || product.minStock < 0 || product.maxStock < 0) {
    return 'Los precios y cantidades no pueden ser negativos.'
  }

  const duplicate = products.some((entry) => entry.id !== editingProductId && entry.code === product.code)

  return duplicate ? 'El código interno ya está registrado.' : null
}

export const validateUserAccount = (user, users = [], editingUserId = null) => {
  const name = user.name.trim()
  const username = user.username.trim().toLowerCase()

  if (!name || !username || (!editingUserId && !user.password)) {
    return 'Completa nombre, usuario y contraseña.'
  }

  if (users.some((entry) => entry.username.toLowerCase() === username && entry.id !== editingUserId)) {
    return 'Ese nombre de usuario ya existe.'
  }

  if (user.password && user.password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres.'
  }

  if (!['ADMIN', 'EMPLOYEE'].includes(user.role)) {
    return 'El rol seleccionado no es válido.'
  }

  if (!editingUserId && user.role === 'ADMIN') {
    return 'Solo se pueden crear empleados desde este módulo.'
  }

  return null
}

export const validateAdminEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ? null
    : 'Ingresa un correo válido para el administrador.'

export const validateSale = ({ cart, isCashOpen, cashReceived, total }) => {
  if (!isCashOpen) return 'Abre la caja antes de registrar una venta.'
  if (!cart.length) return 'Agrega productos al carrito antes de finalizar la venta.'
  if (Number(cashReceived || 0) < total) {
    return 'El efectivo recibido es menor que el total de la venta.'
  }
  return null
}

export const validateCashOpeningAmount = (openingAmount) =>
  openingAmount === '' || !Number.isFinite(Number(openingAmount)) || Number(openingAmount) < 0
    ? 'Ingresa un dinero inicial válido y no negativo.'
    : null

export const validateCashClosing = (countedAmount) =>
  countedAmount === '' || !Number.isFinite(Number(countedAmount)) || Number(countedAmount) < 0
    ? 'Ingresa el efectivo contado para cerrar la caja.'
    : null
