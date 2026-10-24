export const permissions = {
  DASHBOARD_VIEW: 'dashboard.view',
  SALES_CREATE: 'sales.create',
  SALES_VIEW: 'sales.view',
  INVOICES_VIEW: 'invoices.view',
  INVENTORY_VIEW: 'inventory.view',
  INVENTORY_MANAGE: 'inventory.manage',
  CATEGORIES_VIEW: 'categories.view',
  PURCHASES_VIEW: 'purchases.view',
  SUPPLIERS_VIEW: 'suppliers.view',
  CASH_OPEN: 'cash.open',
  CASH_CLOSE: 'cash.close',
  REPORTS_VIEW: 'reports.view',
  SETTINGS_MANAGE: 'settings.manage',
  USERS_MANAGE: 'users.manage',
}

const rolePermissions = {
  ADMIN: Object.values(permissions),
  EMPLOYEE: [
    permissions.DASHBOARD_VIEW,
    permissions.SALES_CREATE,
    permissions.SALES_VIEW,
    permissions.INVOICES_VIEW,
    permissions.CASH_OPEN,
    permissions.CASH_CLOSE,
  ],
}

export const getPermissionsForRole = (role) => rolePermissions[role] ?? []

export const can = (user, permission) => Boolean(user && getPermissionsForRole(user.role).includes(permission))

export const authorize = (user, permission) => {
  if (!can(user, permission)) {
    throw new Error('No tienes permisos para realizar esta acción.')
  }
}
