import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Leer datos de simulación del frontend
const FRONTEND_DATA_PATH = join(__dirname, '../../../frontend/src/data')
const DB_FILE = join(__dirname, '../../db.json')

// Función para leer archivo JSON
const readJSONFile = (filePath) => {
  try {
    const data = readFileSync(filePath, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error(`Error leyendo archivo ${filePath}:`, error.message)
    return null
  }
}

// Función para migrar datos de clientes
const migrateClients = () => {
  const clientsFile = join(FRONTEND_DATA_PATH, 'simulation-clients.json')
  const clientsData = readJSONFile(clientsFile)

  if (!clientsData || !clientsData.clients) {
    console.warn('No se encontraron datos de clientes para migrar')
    return []
  }

  return clientsData.clients.map(client => ({
    ...client,
    status: 'active',
    balance: 0,
    lastPaymentDate: null,
    createdAt: client.installationDate ? new Date(client.installationDate).toISOString() : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }))
}

// Función para migrar datos de cajas
const migrateCashboxes = () => {
  const cashboxFile = join(FRONTEND_DATA_PATH, 'simulation-cashboxes.json')
  const cashboxData = readJSONFile(cashboxFile)

  if (!cashboxData || !cashboxData.cashboxes) {
    console.warn('No se encontraron datos de cajas para migrar')
    return []
  }

  return cashboxData.cashboxes.map(cashbox => ({
    ...cashbox,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }))
}

// Función para migrar pagos validados
const migratePayments = () => {
  const paymentsFile = join(FRONTEND_DATA_PATH, 'mock-payments-validated.json')
  const paymentsData = readJSONFile(paymentsFile)

  if (!paymentsData || !paymentsData.payments) {
    console.warn('No se encontraron datos de pagos para migrar')
    return []
  }

  return paymentsData.payments.map(payment => ({
    ...payment,
    createdAt: payment.paidAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }))
}

// Usuarios por defecto con contraseñas hasheadas (demo)
const defaultUsers = [
  {
    id: 'user-admin-001',
    username: 'admin',
    password: 'admin123', // En producción usar bcrypt
    email: 'admin@tvcable.com',
    firstName: 'Administrador',
    lastName: 'Sistema',
    role: 'admin',
    phone: '+51987654321',
    isActive: true,
    lastLogin: null,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'user-subadmin-001',
    username: 'subadmin',
    password: 'subadmin123',
    email: 'subadmin@tvcable.com',
    firstName: 'Sub Administrador',
    lastName: 'Sistema',
    role: 'subadmin',
    phone: '+51987654322',
    isActive: true,
    lastLogin: null,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'collector-1',
    username: 'collector1',
    password: 'collector123',
    email: 'cobrador1@tvcable.com',
    firstName: 'Carlos',
    lastName: 'Rodríguez',
    role: 'collector',
    phone: '+51987654323',
    isActive: true,
    lastLogin: null,
    neighborhoods: ['San Isidro', 'Surco', 'San Miguel'],
    commissionRate: 0.05,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'collector-2',
    username: 'collector2',
    password: 'collector123',
    email: 'cobrador2@tvcable.com',
    firstName: 'María',
    lastName: 'González',
    role: 'collector',
    phone: '+51987654324',
    isActive: true,
    lastLogin: null,
    neighborhoods: ['Miraflores', 'La Molina', 'Jesús María'],
    commissionRate: 0.05,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'collector-3',
    username: 'collector3',
    password: 'collector123',
    email: 'cobrador3@tvcable.com',
    firstName: 'Pedro',
    lastName: 'Martínez',
    role: 'collector',
    phone: '+51987654325',
    isActive: true,
    lastLogin: null,
    neighborhoods: ['San Borja', 'Lince', 'Pueblo Libre'],
    commissionRate: 0.05,
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  }
]

// Servicios disponibles
const defaultServices = [
  {
    id: 'service-basic',
    name: 'Básico',
    description: 'Plan básico de TV Cable',
    price: 25.00,
    channels: 40,
    internetSpeed: null,
    isActive: true,
    features: ['Canales nacionales', 'Canales internacionales básicos'],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'service-standard',
    name: 'Estándar',
    description: 'Plan estándar de TV Cable + Internet',
    price: 45.00,
    channels: 80,
    internetSpeed: '10 Mbps',
    isActive: true,
    features: ['Canales nacionales', 'Canales internacionales', 'Internet 10 Mbps'],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  },
  {
    id: 'service-premium',
    name: 'Premium',
    description: 'Plan premium de TV Cable + Internet de alta velocidad',
    price: 75.00,
    channels: 120,
    internetSpeed: '50 Mbps',
    isActive: true,
    features: ['Canales nacionales', 'Canales internacionales', 'Canales premium', 'Internet 50 Mbps', 'Netflix incluido'],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z'
  }
]

// Barrios disponibles
const defaultNeighborhoods = [
  { id: 'neighborhood-001', name: 'San Isidro', zone: 'Centro', isActive: true },
  { id: 'neighborhood-002', name: 'Surco', zone: 'Sur', isActive: true },
  { id: 'neighborhood-003', name: 'San Miguel', zone: 'Norte', isActive: true },
  { id: 'neighborhood-004', name: 'Miraflores', zone: 'Centro', isActive: true },
  { id: 'neighborhood-005', name: 'La Molina', zone: 'Este', isActive: true },
  { id: 'neighborhood-006', name: 'Jesús María', zone: 'Centro', isActive: true },
  { id: 'neighborhood-007', name: 'San Borja', zone: 'Centro', isActive: true },
  { id: 'neighborhood-008', name: 'Lince', zone: 'Centro', isActive: true },
  { id: 'neighborhood-009', name: 'Pueblo Libre', zone: 'Oeste', isActive: true },
  { id: 'neighborhood-010', name: 'Callao', zone: 'Oeste', isActive: true }
]

// Función principal de seeding
const seedDatabase = () => {
  console.log('🌱 Iniciando migración de datos...')

  // Migrar datos existentes
  const clients = migrateClients()
  const cashboxes = migrateCashboxes()
  const payments = migratePayments()

  console.log(`✅ Migrando ${clients.length} clientes`)
  console.log(`✅ Migrando ${cashboxes.length} cajas`)
  console.log(`✅ Migrando ${payments.length} pagos`)

  // Si no hay datos de frontend, usar datos básicos
  const finalClients = clients.length > 0 ? clients : [
    {
      id: 'client-001',
      fullName: 'Juan Pérez García',
      dni: '12345678',
      phone: '+51987654321',
      email: 'juan.perez@email.com',
      address: 'Av. Principal 123, Lima',
      neighborhood: 'San Isidro',
      servicePlan: 'standard',
      installationDate: '2025-01-15',
      preferredPaymentDay: 15,
      isActive: true,
      assignedCollector: 'collector-1',
      notes: 'Cliente de prueba',
      billingType: 'normal',
      status: 'active',
      balance: 0,
      lastPaymentDate: null,
      createdAt: '2025-01-15T00:00:00.000Z',
      updatedAt: '2025-01-15T00:00:00.000Z'
    }
  ]

  // Crear estructura completa de la base de datos
  const dbData = {
    users: defaultUsers,
    clients: finalClients,
    services: defaultServices,
    payments: payments,
    monthlyDebts: [],
    vouchers: [],
    cashboxes: cashboxes.length > 0 ? cashboxes : [{
      id: 'cashbox-001',
      name: 'Caja Principal',
      description: 'Caja principal del sistema',
      currentBalance: 0,
      isActive: true,
      assignedUsers: ['user-admin-001', 'user-subadmin-001'],
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z'
    }],
    cashBoxRequests: [],
    notifications: [],
    clientExtended: [],
    backups: [],
    neighborhoods: defaultNeighborhoods
  }

  // Escribir archivo de base de datos
  try {
    writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2))
    console.log('✅ Base de datos creada exitosamente en:', DB_FILE)
    console.log('📊 Estadísticas:')
    console.log(`   - Usuarios: ${dbData.users.length}`)
    console.log(`   - Clientes: ${dbData.clients.length}`)
    console.log(`   - Servicios: ${dbData.services.length}`)
    console.log(`   - Pagos: ${dbData.payments.length}`)
    console.log(`   - Cajas: ${dbData.cashboxes.length}`)
    console.log(`   - Barrios: ${dbData.neighborhoods.length}`)
  } catch (error) {
    console.error('❌ Error escribiendo base de datos:', error.message)
    process.exit(1)
  }
}

// Ejecutar seeding si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
}

export { seedDatabase }