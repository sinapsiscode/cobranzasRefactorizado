/**
 * Script para generar db.json con datos masivos
 * Ejecutar: node utils/generateDb.js
 */

import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { generateClients, generatePayments } from './dataGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Usuarios base
const users = [
  {
    id: "admin-1",
    username: "admin",
    email: "admin@tvcable.com",
    password: "admin123",
    fullName: "Súper administrador Sistema",
    role: "admin",
    phone: "+51987654321",
    startDate: "2023-01-01",
    isActive: true,
    lastLogin: new Date().toISOString()
  },
  {
    id: "subadmin-1",
    username: "subadmin",
    email: "subadmin@tvcable.com",
    password: "super123",
    fullName: "Administrador",
    role: "subadmin",
    phone: "+51987654320",
    startDate: "2023-01-15",
    isActive: true,
    lastLogin: new Date().toISOString()
  },
  {
    id: "collector-1",
    username: "cobrador1",
    email: "carlos.garcia@gmail.com",
    password: "cobrador123",
    fullName: "Carlos García Pérez",
    alias: "Carlos",
    role: "collector",
    phone: "+51987654322",
    startDate: "2023-03-15",
    isActive: true,
    lastLogin: new Date().toISOString()
  },
  {
    id: "collector-2",
    username: "cobrador2",
    email: "jose.rodriguez@hotmail.com",
    password: "cobrador123",
    fullName: "José Rodríguez López",
    alias: "Pepito",
    role: "collector",
    phone: "+51987654323",
    startDate: "2023-04-01",
    isActive: true,
    lastLogin: new Date().toISOString()
  },
  {
    id: "collector-3",
    username: "cobrador3",
    email: "juan.martinez@yahoo.com",
    password: "cobrador123",
    fullName: "Juan Martínez Sánchez",
    alias: "Juan",
    role: "collector",
    phone: "+51987654324",
    startDate: "2023-05-10",
    isActive: true,
    lastLogin: new Date().toISOString()
  },
  {
    id: "client-1",
    username: "cliente1",
    email: "cliente@test.com",
    password: "123456",
    fullName: "Cliente Prueba",
    role: "client",
    phone: "+51987654325",
    isActive: true
  }
];

// Servicios
const services = [
  {
    id: "service-basic",
    name: "Plan Básico",
    type: "basic",
    price: 50,
    description: "Plan básico de TV Cable con canales nacionales",
    isActive: true,
    features: [
      "60+ canales",
      "Canales nacionales",
      "Soporte técnico básico"
    ],
    createdAt: "2023-01-01T00:00:00.000Z"
  },
  {
    id: "service-standard",
    name: "Plan Estándar",
    type: "standard",
    price: 80,
    description: "Plan estándar con canales internacionales",
    isActive: true,
    features: [
      "120+ canales",
      "Canales internacionales",
      "HD incluido",
      "Soporte técnico prioritario"
    ],
    createdAt: "2023-01-01T00:00:00.000Z"
  },
  {
    id: "service-premium",
    name: "Plan Premium",
    type: "premium",
    price: 120,
    description: "Plan premium con todos los canales y deportes",
    isActive: true,
    features: [
      "200+ canales",
      "Canales deportivos premium",
      "Películas y series",
      "Full HD",
      "Soporte técnico 24/7"
    ],
    createdAt: "2023-01-01T00:00:00.000Z"
  }
];

// Métodos de pago
const paymentMethods = [
  {
    id: "pm_efectivo",
    name: "Efectivo",
    description: "Pago en efectivo",
    isActive: true,
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2023-01-01T00:00:00.000Z"
  },
  {
    id: "pm_transferencia",
    name: "Transferencia",
    description: "Transferencia bancaria",
    isActive: true,
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2023-01-01T00:00:00.000Z"
  },
  {
    id: "pm_deposito",
    name: "Depósito",
    description: "Depósito bancario",
    isActive: true,
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2023-01-01T00:00:00.000Z"
  },
  {
    id: "pm_cheque",
    name: "Cheque",
    description: "Pago con cheque",
    isActive: true,
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2023-01-01T00:00:00.000Z"
  },
  {
    id: "pm_yape",
    name: "Yape",
    description: "Pago digital con Yape",
    isActive: true,
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2023-01-01T00:00:00.000Z"
  },
  {
    id: "pm_plin",
    name: "Plin",
    description: "Pago digital con Plin",
    isActive: true,
    createdAt: "2023-01-01T00:00:00.000Z",
    updatedAt: "2023-01-01T00:00:00.000Z"
  }
];

// Configuración del sistema
const settings = {
  id: "settings-001",
  systemName: "TV Cable Cobranzas",
  companyName: "TV Cable SA",
  companyPhone: "+51987654321",
  companyEmail: "info@tvcable.com",
  companyAddress: "Av. Principal 123, Lima, Perú",
  currency: "S/",
  timezone: "America/Lima",
  defaultPaymentDueDays: 5,
  enableNotifications: true,
  enableEmailNotifications: false,
  autoSuspendAfterDays: 30,
  updatedAt: new Date().toISOString()
};

// Generar datos
console.log('🔄 Generando datos...\n');

console.log('👥 Generando clientes...');
const clients = generateClients(200);
console.log(`✅ ${clients.length} clientes generados`);

console.log('💰 Generando pagos...');
const payments = generatePayments(clients);
console.log(`✅ ${payments.length} pagos generados`);

// Generar solicitudes de caja
console.log('📦 Generando solicitudes de caja...');
const today = new Date().toISOString().split('T')[0];
const cashBoxRequests = [
  {
    id: `req-${today}-collector-1`,
    collectorId: "collector-1",
    collectorName: "Carlos García Pérez",
    requestDate: new Date().toISOString(),
    workDate: today,
    status: "pending",
    requestedInitialCash: {
      efectivo: 100,
      digital: {
        yape: 0,
        plin: 0,
        transferencia: 0,
        otros: 0
      }
    },
    approvedInitialCash: null,
    notes: "Solicitud de caja para jornada de cobranza",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    approvedBy: null,
    approvedAt: null
  }
];
console.log(`✅ ${cashBoxRequests.length} solicitudes generadas`);

// Generar notificaciones
console.log('🔔 Generando notificaciones...');
const notifications = [
  {
    id: "notif-001",
    userId: "admin-1",
    type: "payment",
    title: "Pagos pendientes de validación",
    message: `Hay ${payments.filter(p => p.status === 'collected').length} pagos pendientes de validación`,
    isRead: false,
    createdAt: new Date().toISOString(),
    data: {}
  },
  {
    id: "notif-002",
    userId: "admin-1",
    type: "alert",
    title: "Clientes con deuda vencida",
    message: `${clients.filter(c => c.status === 'debt').length} clientes tienen deudas vencidas`,
    isRead: false,
    createdAt: new Date().toISOString(),
    data: {}
  }
];
console.log(`✅ ${notifications.length} notificaciones generadas`);

// Generar deudas mensuales
console.log('📊 Generando deudas mensuales...');
const monthlyDebts = payments
  .filter(p => p.status === 'overdue')
  .map(payment => {
    const dueDate = new Date(payment.dueDate);
    const today = new Date();
    const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

    return {
      id: `debt-${payment.id}`,
      clientId: payment.clientId,
      paymentId: payment.id,
      month: payment.month,
      year: payment.year,
      amount: payment.amount,
      dueDate: payment.dueDate,
      status: 'overdue',
      daysOverdue: daysOverdue > 0 ? daysOverdue : 0,
      createdAt: payment.dueDate
    };
  });
console.log(`✅ ${monthlyDebts.length} deudas mensuales generadas`);

// Crear objeto completo de base de datos
const db = {
  users,
  clients,
  payments,
  services,
  paymentMethods,
  cashBoxRequests,
  notifications,
  monthlyDebts,
  vouchers: [],
  settings
};

// Guardar en archivo
const dbPath = join(__dirname, '..', 'db.json');
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

console.log('\n✅ db.json generado exitosamente!\n');
console.log('📊 Resumen:');
console.log(`   - Usuarios: ${users.length}`);
console.log(`   - Clientes: ${clients.length}`);
console.log(`   - Pagos: ${payments.length}`);
console.log(`   - Servicios: ${services.length}`);
console.log(`   - Métodos de pago: ${paymentMethods.length}`);
console.log(`   - Solicitudes de caja: ${cashBoxRequests.length}`);
console.log(`   - Notificaciones: ${notifications.length}`);
console.log(`   - Deudas mensuales: ${monthlyDebts.length}`);
console.log(`\n📁 Archivo: ${dbPath}`);
console.log('\n🚀 Puedes iniciar el servidor con: npm start\n');
