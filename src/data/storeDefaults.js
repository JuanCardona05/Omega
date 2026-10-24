export const storageKey = 'pos-store-data-v1'
export const sessionStorageKey = 'pos-session'

export const defaultBusiness = {
  name: 'Omega',
  nit: '900123456-7',
  address: 'Calle 15 # 25-40',
  phone: '+57 300 123 4567',
  adminEmail: 'juangcb03@gmail.com',
  footer: 'Gracias por su compra',
}

export const defaultUsers = [
  {
    id: 'user-admin-development',
    name: 'Administrador',
    username: 'admin',
    password: 'admin123',
    role: 'ADMIN',
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]

export const defaultCashRegister = {
  isOpen: true,
  number: 'Caja 1',
  operator: 'Cajero',
  openedAt: new Date().toISOString(),
  openingAmount: 0,
  countedAmount: '',
  closedAt: null,
}

export const measurableUnits = ['Unidad', 'Kilogramo', 'Gramo', 'Litro', 'Mililitro']
export const decimalUnits = new Set(['Kilogramo', 'Gramo', 'Litro', 'Mililitro'])

export const defaultProducts = [
  {
    id: 1,
    code: 'ARZ001',
    name: 'Arroz Diana 1 kg',
    category: 'Granos',
    purchasePrice: 3500,
    salePrice: 4500,
    stock: 50,
    unit: 'Unidad',
    minStock: 10,
    maxStock: 100,
    description: 'Arroz blanco de alta calidad.',
  },
  {
    id: 2,
    code: 'ACE002',
    name: 'Aceite de Girasol 1L',
    category: 'Abarrotes',
    purchasePrice: 6200,
    salePrice: 8000,
    stock: 18,
    unit: 'Unidad',
    minStock: 5,
    maxStock: 50,
    description: 'Aceite para cocinar.',
  },
  {
    id: 3,
    code: 'GAS003',
    name: 'Gaseosa Cola 600ml',
    category: 'Bebidas',
    purchasePrice: 2100,
    salePrice: 3000,
    stock: 27,
    unit: 'Unidad',
    minStock: 10,
    maxStock: 80,
    description: 'Bebida gaseosa sabor cola.',
  },
  {
    id: 4,
    code: 'PAN004',
    name: 'Pan Integral',
    category: 'Panadería',
    purchasePrice: 1800,
    salePrice: 2600,
    stock: 12,
    unit: 'Unidad',
    minStock: 5,
    maxStock: 40,
    description: 'Pan integral recién horneado.',
  },
  {
    id: 5,
    code: 'LEC005',
    name: 'Leche Entera 1L',
    category: 'Lácteos',
    purchasePrice: 2800,
    salePrice: 3600,
    stock: 9,
    unit: 'Unidad',
    minStock: 10,
    maxStock: 50,
    description: 'Leche entera pasteurizada.',
  },
]

export const defaultSales = []

export const emptyProductForm = {
  code: '',
  name: '',
  category: '',
  purchasePrice: '',
  salePrice: '',
  stock: '',
  unit: 'Unidad',
  minStock: 10,
  maxStock: 100,
  description: '',
}

export const defaultCategories = ['Granos', 'Abarrotes', 'Bebidas', 'Panadería', 'Lácteos']
