// Generador de datos realistas según especificaciones de leer.md
import { db } from './db.js';
import { calculateBillingType, getFirstPaymentInfo } from '../../utils/billingCalculator.js';
import mockPaymentsValidation from '../../data/mock-payments-validation.json';
import mockPaymentsValidated from '../../data/mock-payments-validated.json';
import { DefaultPaymentMethods } from './schemas/paymentMethod.js';

// Nombres peruanos realistas
const PERU_FIRST_NAMES = [
  'Carlos', 'María', 'José', 'Ana', 'Luis', 'Carmen', 'Miguel', 'Rosa', 'Juan', 'Elena',
  'Pedro', 'Lucía', 'Jorge', 'Patricia', 'Roberto', 'Isabel', 'Fernando', 'Teresa',
  'Manuel', 'Gloria', 'Andrés', 'Silvia', 'Ricardo', 'Mónica', 'Diego', 'Sandra',
  'Alejandro', 'Pilar', 'Francisco', 'Victoria', 'Rafael', 'Beatriz', 'Eduardo', 'Claudia',
  'Sergio', 'Adriana', 'Gustavo', 'Roxana', 'Óscar', 'Vanessa', 'Antonio', 'Liliana',
  'Raúl', 'Karina', 'Víctor', 'Yolanda'
];

const PERU_LAST_NAMES = [
  'García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez',
  'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Álvarez',
  'Muñoz', 'Romero', 'Alonso', 'Gutierrez', 'Navarro', 'Torres', 'Domínguez', 'Vázquez',
  'Ramos', 'Gil', 'Ramírez', 'Serrano', 'Blanco', 'Suárez', 'Molina', 'Morales',
  'Ortega', 'Delgado', 'Castro', 'Ortiz', 'Rubio', 'Marín', 'Sanz', 'Iglesias',
  'Medina', 'Garrido', 'Cortés', 'Castillo', 'Santos', 'Lozano', 'Guerrero', 'Cano'
];

// Direcciones de Lima realistas
const LIMA_DISTRICTS = [
  'San Isidro', 'Miraflores', 'San Borja', 'Surco', 'La Molina', 'Jesús María',
  'Magdalena', 'San Miguel', 'Pueblo Libre', 'Lince', 'Breña', 'Lima Cercado',
  'Rímac', 'Los Olivos', 'San Martin de Porres', 'Independencia', 'Comas',
  'Carabayllo', 'Villa El Salvador', 'Villa María del Triunfo', 'San Juan de Miraflores',
  'Santiago de Surco', 'Ate', 'Santa Anita', 'El Agustino', 'Surquillo'
];

const STREET_NAMES = [
  'Jr. Lampa', 'Av. Arequipa', 'Jr. de la Unión', 'Av. Javier Prado', 'Jr. Camaná',
  'Av. Brasil', 'Jr. Azángaro', 'Av. Colonial', 'Jr. Quilca', 'Av. La Marina',
  'Jr. Huancavelica', 'Av. Universitaria', 'Jr. Callao', 'Av. Petit Thouars',
  'Jr. Chancay', 'Av. Tacna', 'Jr. Cusco', 'Av. Abancay', 'Jr. Ancash', 'Av. Garcilaso'
];

// Utilidades generadoras
const randomChoice = (array) => array[Math.floor(Math.random() * array.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => Math.random() * (max - min) + min;
const randomBool = (probability = 0.5) => Math.random() < probability;

// Generar DNI válido
const generateDNI = () => {
  return String(randomInt(10000000, 99999999));
};

// Generar teléfono peruano
const generatePhone = () => {
  const operators = ['9', '8', '7'];
  const operator = randomChoice(operators);
  const number = String(randomInt(10000000, 99999999));
  return `+51${operator}${number}`;
};

// Generar email
const generateEmail = (firstName, lastName) => {
  const domains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'];
  const name = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
  return `${name}@${randomChoice(domains)}`;
};

// Generar dirección de Lima
const generateAddress = () => {
  const street = randomChoice(STREET_NAMES);
  const number = randomInt(100, 9999);
  const district = randomChoice(LIMA_DISTRICTS);
  return {
    address: `${street} ${number}, ${district}, Lima`,
    neighborhood: district
  };
};

// Generar fecha aleatoria
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Generar datos de usuarios/cobradores
const generateUsers = () => {
  const users = [
    // SubAdministrador por defecto
    {
      id: 'subadmin-1',
      username: 'subadmin',
      email: 'subadmin@tvcable.com',
      password: 'super123',
      fullName: 'Administrador',
      role: 'subadmin',
      phone: '+51987654320',
      startDate: '2023-01-15',
      isActive: true,
      lastLogin: new Date().toISOString()
    },
    // Admin por defecto
    {
      id: 'admin-1',
      username: 'admin',
      email: 'admin@tvcable.com',
      password: 'admin123',
      fullName: 'Súper administrador Sistema',
      role: 'admin',
      phone: '+51987654321',
      startDate: '2023-01-01',
      isActive: true,
      lastLogin: new Date().toISOString()
    },
    // Cliente de prueba con deudas múltiples
    {
      id: 'client-1',
      username: 'cliente1',
      email: 'cliente@test.com',
      password: '123456',
      fullName: 'Cliente Prueba',
      role: 'client',
      phone: '+51987654322',
      isActive: true
    }
  ];

  // Generar cobradores con alias
  const collectorAliases = ['Carlos', 'Pepito', 'Juan'];
  for (let i = 1; i <= 3; i++) {
    const firstName = randomChoice(PERU_FIRST_NAMES);
    const lastName = randomChoice(PERU_LAST_NAMES);
    
    users.push({
      id: `collector-${i}`,
      username: `cobrador${i}`,
      email: generateEmail(firstName, lastName),
      password: 'cobrador123',
      fullName: `${firstName} ${lastName}`,
      alias: collectorAliases[i - 1],
      role: 'collector',
      phone: generatePhone(),
      startDate: randomDate(new Date(2023, 0, 1), new Date()).toISOString().split('T')[0],
      isActive: true,
      lastLogin: randomBool(0.8) ? randomDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date()).toISOString() : null
    });
  }

  return users;
};

// Generar datos de clientes (45 clientes según leer.md)
const generateClients = () => {
  const clients = [];
  const plans = ['basic', 'standard', 'premium'];
  
  for (let i = 1; i <= 45; i++) {
    const firstName = randomChoice(PERU_FIRST_NAMES);
    const lastName1 = randomChoice(PERU_LAST_NAMES);
    const lastName2 = randomChoice(PERU_LAST_NAMES);
    const fullName = `${firstName} ${lastName1} ${lastName2}`;
    
    // Fecha de instalación variada para demostrar prorrateo
    let installationDate;

    // Cliente 1 debe tener instalación hace 6+ meses para tener 5 meses de deuda
    if (i === 1) {
      // Instalación hace 6 meses exactos
      const currentDate = new Date();
      installationDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 6, 15);
    }
    // 30% de clientes con instalación reciente para mostrar más prorrateo
    else if (i <= 15) {
      // Instalación en los últimos 2 meses con días variados
      const currentDate = new Date();
      const monthsAgo = randomInt(0, 1); // 0 o 1 mes atrás
      
      // 60% con prorrateo (días 1-25), 40% mes gratis (días 26-31)
      let installDay;
      if (i % 3 === 0) {
        // Mes gratis (días 26-31)
        installDay = randomInt(26, 31);
      } else {
        // Prorrateo (días 1-25)
        installDay = randomInt(1, 25);
      }
      
      installationDate = new Date(
        currentDate.getFullYear(), 
        currentDate.getMonth() - monthsAgo, 
        installDay
      );
    } else {
      // Resto de clientes: instalación entre 2 meses y 2 años atrás
      installationDate = randomDate(
        new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000),
        new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
      );
    }

    // Determinar estado del cliente con distribución realista e historial más complejo
    let clientStatus = 'active';
    let statusHistory = [];
    let pauseStartDate = null;
    let pauseReason = null;
    let reactivationDate = null;

    // Cliente 1 siempre debe tener estado 'debt' para mostrar las 5 deudas
    if (i === 1) {
      clientStatus = 'debt';
      statusHistory.push({
        fromStatus: 'active',
        toStatus: 'debt',
        date: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(), // Hace 5 meses
        reason: 'Múltiples pagos vencidos - Cliente de prueba',
        changedBy: 'system'
      });
    } else {
      const statusRand = Math.random();

      if (statusRand < 0.70) {
        // 70% activos sin historial complejo
        clientStatus = 'active';
      } else if (statusRand < 0.75) {
        // 5% con deuda
        clientStatus = 'debt';
        statusHistory.push({
          fromStatus: 'active',
          toStatus: 'debt',
          date: new Date(Date.now() - randomInt(1, 30) * 24 * 60 * 60 * 1000).toISOString(),
          reason: 'Pago vencido detectado automáticamente',
          changedBy: 'system'
        });
      } else if (statusRand < 0.80) {
        // 5% en pausa
        clientStatus = 'paused';
        pauseStartDate = new Date(Date.now() - randomInt(1, 25) * 24 * 60 * 60 * 1000).toISOString();
        pauseReason = randomChoice(['Viaje temporal', 'Problemas económicos', 'Mudanza en proceso']);
        statusHistory.push({
          fromStatus: 'active',
          toStatus: 'paused',
          date: pauseStartDate,
          reason: pauseReason,
          changedBy: 'subadmin-1'
        });
      } else if (statusRand < 0.85) {
        // 5% suspendidos
        clientStatus = 'suspended';
        // Historial: activo -> deuda -> suspendido
        const debtDate = new Date(Date.now() - randomInt(20, 45) * 24 * 60 * 60 * 1000).toISOString();
        const suspensionDate = new Date(Date.now() - randomInt(5, 15) * 24 * 60 * 60 * 1000).toISOString();

        statusHistory.push({
          fromStatus: 'active',
          toStatus: 'debt',
          date: debtDate,
          reason: 'Pago vencido detectado automáticamente',
          changedBy: 'system'
        });
        statusHistory.push({
          fromStatus: 'debt',
          toStatus: 'suspended',
          date: suspensionDate,
          reason: 'Suspensión por falta de pago prolongado',
          changedBy: 'system'
        });
        } else if (statusRand < 0.92) {
        // 7% activos que fueron reactivados (tienen historial de baja/reactivación)
        clientStatus = 'active';
        reactivationDate = new Date(Date.now() - randomInt(10, 60) * 24 * 60 * 60 * 1000).toISOString();
        const terminationDate = new Date(Date.now() - randomInt(70, 120) * 24 * 60 * 60 * 1000).toISOString();

        // Historial: activo -> baja -> reactivado
        statusHistory.push({
          fromStatus: 'active',
          toStatus: 'terminated',
          date: terminationDate,
          reason: randomChoice(['Solicitud del cliente', 'Mudanza', 'Problemas económicos']),
          changedBy: 'admin-1'
        });
        statusHistory.push({
          fromStatus: 'terminated',
          toStatus: 'active',
          date: reactivationDate,
          reason: randomChoice(['Cliente solicitó reactivación', 'Regresó de mudanza', 'Mejoró situación económica']),
          changedBy: 'admin-1',
          isReactivation: true
        });
      } else if (statusRand < 0.97) {
        // 5% activos con historial complejo (múltiples cambios)
        clientStatus = 'active';

        // Historial complejo: activo -> deuda -> suspendido -> activo
        const debtDate = new Date(Date.now() - randomInt(60, 90) * 24 * 60 * 60 * 1000).toISOString();
        const suspensionDate = new Date(Date.now() - randomInt(40, 55) * 24 * 60 * 60 * 1000).toISOString();
        reactivationDate = new Date(Date.now() - randomInt(10, 30) * 24 * 60 * 60 * 1000).toISOString();
      
        statusHistory.push({
          fromStatus: 'active',
          toStatus: 'debt',
          date: debtDate,
          reason: 'Pago vencido',
          changedBy: 'system'
        });
        statusHistory.push({
          fromStatus: 'debt',
          toStatus: 'suspended',
          date: suspensionDate,
          reason: 'Suspensión por falta de pago',
          changedBy: 'system'
        });
        statusHistory.push({
          fromStatus: 'suspended',
          toStatus: 'active',
          date: reactivationDate,
          reason: 'Cliente regularizó pagos pendientes',
          changedBy: 'subadmin-1',
          isReactivation: true
        });
      } else {
        // 3% dados de baja definitivamente
        clientStatus = 'terminated';
        const terminationDate = new Date(Date.now() - randomInt(30, 180) * 24 * 60 * 60 * 1000).toISOString();

        statusHistory.push({
          fromStatus: 'active',
          toStatus: 'terminated',
          date: terminationDate,
          reason: randomChoice(['Solicitud definitiva del cliente', 'Mudanza permanente', 'Cambio de proveedor']),
          changedBy: 'admin-1'
        });
      }
    }

    // Determinar tipo de servicio (60% internet, 40% cable)
    // Determinar servicios del cliente
    // 40% solo internet, 30% solo cable, 30% DUO (ambos)
    const serviceRand = Math.random();
    let serviceType, services;
    
    if (serviceRand < 0.4) {
      // Solo Internet
      serviceType = 'internet';
      services = ['internet'];
    } else if (serviceRand < 0.7) {
      // Solo Cable
      serviceType = 'cable';
      services = ['cable'];
    } else {
      // DUO - Cable + Internet
      serviceType = 'cable'; // Servicio principal
      services = ['cable', 'internet'];
    }

    clients.push({
      id: i === 1 ? 'client-1' : `client-${String(i).padStart(3, '0')}`,
      fullName,
      dni: generateDNI(),
      phone: generatePhone(),
      email: randomBool(0.7) ? generateEmail(firstName, lastName1) : null,
      ...generateAddress(),
      servicePlan: randomChoice(plans),
      serviceType,
      services, // Array de servicios para soportar DUO
      installationDate: installationDate.toISOString().split('T')[0],
      preferredPaymentDay: randomInt(1, 28),
      paymentDueDays: randomInt(3, 7), // Días de gracia antes del vencimiento (3-7 días)
      isActive: clientStatus === 'active' || clientStatus === 'debt' || clientStatus === 'paused', // Compatibilidad
      
      // Nuevos campos de estado
      status: clientStatus,
      statusHistory: statusHistory,
      statusReason: statusHistory.length > 0 ? statusHistory[statusHistory.length - 1].reason : null,
      pauseStartDate: pauseStartDate,
      pauseReason: pauseReason,
      isArchived: clientStatus === 'terminated',
      archivedDate: clientStatus === 'terminated' ? statusHistory[statusHistory.length - 1].date : null,
      previousClientId: null,
      clientVersions: [],
      preservedDebts: [],
      lastLogin: clientStatus !== 'terminated' && randomBool(0.8) ? 
        randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()).toISOString() : null,
      reactivationDate: reactivationDate
    });
  }

  return clients;
};

// Generar datos de pagos (30 pagos históricos según leer.md)
const generatePayments = (clients) => {
  const payments = [];
  const currentDate = new Date();
  const planPrices = { basic: 80, standard: 120, premium: 160 };
  const paymentMethods = ['cash', 'transfer', 'deposit', 'voucher'];
  
  // Generar pagos para cada cliente de los últimos meses
  clients.forEach((client, clientIndex) => {
    // Los primeros 10 clientes tendrán MÚLTIPLES meses pendientes garantizados
    const isProblematicClient = clientIndex < 50; // TODOS los clientes tendrán múltiples deudas
    const clientInstallDate = new Date(client.installationDate);
    const installDay = clientInstallDate.getDate();
    const installMonth = clientInstallDate.getMonth();
    const installYear = clientInstallDate.getFullYear();
    
    // Determinar si el primer mes fue gratis o prorrateado
    const billing = calculateBillingType(client.installationDate);
    let isFirstPayment = true;
    
    // Generar pagos desde la fecha de instalación hasta ahora - MÁS MESES para demostrar
    for (let monthsBack = 8; monthsBack >= 0; monthsBack--) {
      const dueDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - monthsBack, client.preferredPaymentDay);
      
      // Solo generar si la fecha de pago es después de la instalación
      if (dueDate >= clientInstallDate) {
        const month = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`;
        
        // Calcular el monto según si es el primer mes y el tipo de facturación
        let amount = planPrices[client.servicePlan];
        let billingType = 'normal';
        
        // Si es el PRIMER PAGO después de la instalación, aplicar prorrateo/mes gratis
        if (isFirstPayment) {
          const paymentInfo = getFirstPaymentInfo(client.servicePlan, client.installationDate);
          amount = paymentInfo.amount;
          billingType = paymentInfo.type;
          isFirstPayment = false;
        }
        
        // Determinar estado del pago
        let status = 'paid';
        let paymentDate = null;
        let paymentMethod = null;
        
        // CASO ESPECIAL: client-1 debe tener exactamente 5 meses PENDING para subir múltiples vouchers
        if (client.id === 'client-1') {
          // Los últimos 5 meses: PENDING (para poder subir vouchers múltiples)
          if (monthsBack <= 4) {
            status = 'pending';
            paymentDate = null;
            paymentMethod = null;
            console.log(`CLIENT-1: Mes ${monthsBack} (${month}) = PENDING`);
          }
          // Meses anteriores: PAID
          else {
            status = 'paid';
            paymentMethod = 'cash';
            paymentDate = new Date(dueDate.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            console.log(`CLIENT-1: Mes ${monthsBack} (${month}) = PAID`);
          }
        }
        // Si es mes gratis, marcar como pagado con monto 0
        else if (billingType === 'free') {
          status = 'paid';
          paymentMethod = 'free';
          paymentDate = dueDate.toISOString().split('T')[0];
        } else if (isProblematicClient && monthsBack <= 4) {
          // Clientes problemáticos: los primeros 50 tendrán exactamente 5 meses pendientes GARANTIZADOS
          status = 'overdue';
        } else if (monthsBack === 0) {
          // Mes actual - MÁS pendientes/vencidos para demostrar funcionalidad
          if (randomBool(0.50)) { // 50% morosos/pendientes (aumentado más)
            status = dueDate < currentDate ? 'overdue' : 'pending';
          } else if (randomBool(0.15)) { // 15% cobrados pendientes de validación
            status = 'collected';
            paymentMethod = randomChoice(paymentMethods);
            paymentDate = randomDate(dueDate, currentDate).toISOString().split('T')[0];
          } else if (randomBool(0.08)) { // 8% parciales
            status = 'partial';
            paymentMethod = randomChoice(paymentMethods);
            paymentDate = randomDate(dueDate, currentDate).toISOString().split('T')[0];
          } else {
            paymentMethod = randomChoice(paymentMethods);
            paymentDate = randomDate(dueDate, currentDate).toISOString().split('T')[0];
          }
        } else if (monthsBack === 1) {
          // Mes pasado - MÁS pendientes para demostrar
          if (randomBool(0.45)) { // 45% no pagados (aumentado)
            status = 'overdue';
          } else if (randomBool(0.20)) { // 20% cobrados pendientes de validación
            status = 'collected';
            paymentMethod = randomChoice(paymentMethods);
            paymentDate = randomDate(dueDate, new Date(dueDate.getTime() + 15 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
          } else {
            paymentMethod = randomChoice(paymentMethods);
            // Pago dentro de los 10 días posteriores al vencimiento
            const maxPayDate = new Date(dueDate.getTime() + 10 * 24 * 60 * 60 * 1000);
            paymentDate = randomDate(dueDate, maxPayDate).toISOString().split('T')[0];
          }
        } else if (monthsBack === 2) {
          // Hace 2 meses - muchos pendientes para demostrar
          if (randomBool(0.40)) { // 40% no pagados (aumentado)
            status = 'overdue';
          } else if (randomBool(0.15)) { // 15% cobrados pendientes de validación
            status = 'collected';
            paymentMethod = randomChoice(paymentMethods);
            paymentDate = randomDate(dueDate, new Date(dueDate.getTime() + 15 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
          } else {
            paymentMethod = randomChoice(paymentMethods);
            const maxPayDate = new Date(dueDate.getTime() + 10 * 24 * 60 * 60 * 1000);
            paymentDate = randomDate(dueDate, maxPayDate).toISOString().split('T')[0];
          }
        } else if (monthsBack === 3) {
          // Hace 3 meses - algunos pendientes para demostrar
          if (randomBool(0.35)) { // 35% no pagados
            status = 'overdue';
          } else if (randomBool(0.12)) { // 12% cobrados pendientes de validación
            status = 'collected';
            paymentMethod = randomChoice(paymentMethods);
            paymentDate = randomDate(dueDate, new Date(dueDate.getTime() + 15 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
          } else {
            paymentMethod = randomChoice(paymentMethods);
            const maxPayDate = new Date(dueDate.getTime() + 10 * 24 * 60 * 60 * 1000);
            paymentDate = randomDate(dueDate, maxPayDate).toISOString().split('T')[0];
          }
        } else {
          // Meses anteriores - algunos pendientes pero menos
          if (randomBool(0.20)) { // 20% no pagados
            status = 'overdue';
          } else if (randomBool(0.10)) { // 10% cobrados pendientes de validación
            status = 'collected';
            paymentMethod = randomChoice(paymentMethods);
            paymentDate = randomDate(dueDate, new Date(dueDate.getTime() + 15 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
          } else {
            paymentMethod = randomChoice(paymentMethods);
            const maxPayDate = new Date(dueDate.getTime() + 10 * 24 * 60 * 60 * 1000);
            paymentDate = randomDate(dueDate, maxPayDate).toISOString().split('T')[0];
          }
        }

        payments.push({
          id: `payment-${client.id}-${month}`,
          clientId: client.id,
          serviceType: client.serviceType, // Heredar tipo de servicio del cliente
          collectorId: (status === 'paid' || status === 'collected') && billingType !== 'free' ? `collector-${randomInt(1, 3)}` : null,
          amount,
          billingType,
          dueDate: dueDate.toISOString().split('T')[0],
          paymentDate,
          status,
          paymentMethod,
          voucherUrl: paymentMethod === 'voucher' ? `https://via.placeholder.com/400x300?text=Voucher+${client.id}` : null,
          comments: billingType === 'free' ? 'Mes gratis por instalación' : 
                   billingType === 'prorated' ? `Prorrateo por instalación día ${installDay}` :
                   randomBool(0.2) ? 'Pago registrado por cobrador' : null,
          month,
          year: dueDate.getFullYear()
        });
      }
    }
  });

  return payments;
};

// Función para cargar pagos que requieren validación
const loadPaymentsRequiringValidation = () => {
  // Cargar los datos mock importados
  const paymentsForValidation = mockPaymentsValidation.paymentsRequiringValidation || [];
  const validatedPayments = mockPaymentsValidated.validatedPayments || [];
  
  // Combinar ambos conjuntos de datos
  return [...paymentsForValidation, ...validatedPayments];
};

// Función principal de seeding
export const seedDatabase = () => {
  // FORZAR REGENERACIÓN SIEMPRE PARA CLIENT-1 CON 5 MESES PENDING
  console.log('=== FORZANDO REGENERACIÓN TOTAL DE DATOS ===');
  localStorage.removeItem('tv-cable:seedVersion');

  console.log('Seeding database with realistic data...');
  
  try {
    // Limpiar datos existentes
    db.clear();

    // Generar y guardar usuarios
    const users = generateUsers();
    users.forEach(user => db.create('users', user));

    // Generar y guardar clientes
    const clients = generateClients();
    clients.forEach(client => db.create('clients', client));

    // Generar y guardar pagos
    const payments = generatePayments(clients);
    payments.forEach(payment => db.create('payments', payment));

    // Agregar pagos que requieren validación desde los datos mock
    const validationPayments = loadPaymentsRequiringValidation();
    validationPayments.forEach(payment => db.create('payments', payment));

    // Inicializar métodos de pago por defecto
    DefaultPaymentMethods.forEach(paymentMethod => db.create('paymentMethods', paymentMethod));
    
    // Marcar como inicializado con nueva versión
    localStorage.setItem('tv-cable:seedVersion', '10.3-CLIENT1-5MESES');
    
    // Crear solicitudes de caja pendientes para que el subadmin pueda aprobarlas
    const today = new Date().toISOString().split('T')[0];
    const collectors = users.filter(u => u.role === 'collector');
    
    const cashBoxRequests = [];
    collectors.forEach(collector => {
      const requestId = `req-${today}-${collector.id}`;
      const request = {
        id: requestId,
        collectorId: collector.id,
        collectorName: collector.fullName,
        requestDate: new Date().toISOString(),
        workDate: today,
        status: 'pending', // Solicitud pendiente para el subadmin
        requestedInitialCash: {
          efectivo: 100, // Dinero inicial solicitado
          digital: {
            yape: 0,
            plin: 0,
            transferencia: 0,
            otros: 0
          }
        },
        notes: 'Solicitud automática generada para pruebas',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      cashBoxRequests.push(request);
    });
    
    // Guardar las solicitudes en localStorage
    localStorage.setItem('tv-cable:cashbox-requests', JSON.stringify(cashBoxRequests));

    console.log(`Database seeded successfully:
      - ${users.length} users
      - ${clients.length} clients
      - ${payments.length + validationPayments.length} payments total
      - ${DefaultPaymentMethods.length} payment methods
      - ${cashBoxRequests.length} pending cashbox requests for subadmin approval
      - ${validationPayments.filter(p => p.status === 'collected').length} payments requiring validation
      - ${validationPayments.filter(p => p.status === 'validated').length} validated payments
      - ${validationPayments.filter(p => p.status === 'rejected').length} rejected payments`);
    
    return true;
  } catch (error) {
    console.error('Error seeding database:', error);
    return false;
  }
};

// Función para reinicializar datos
export const reseedDatabase = () => {
  localStorage.removeItem('tv-cable:seedVersion');
  return seedDatabase();
};

// Función para cargar clientes de simulación directamente del JSON
export const loadSimulationData = async () => {
  try {
    // Limpiar datos existentes
    db.clear();
    
    // Cargar usuarios/cobradores
    const users = generateUsers();
    users.forEach(user => db.create('users', user));
    
    // Importar y cargar datos del JSON
    const simulationData = await import('../../data/simulation-clients.json');
    const data = simulationData.default || simulationData;
    
    // Cargar clientes
    if (data.clients && data.clients.length > 0) {
      data.clients.forEach(client => {
        db.create('clients', {
          ...client,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      });
    }
    
    // Cargar pagos
    if (data.payments && data.payments.length > 0) {
      data.payments.forEach(payment => {
        db.create('payments', payment);
      });
    }
    
    console.log(`✅ Cargados ${data.clients?.length || 0} clientes y ${data.payments?.length || 0} pagos del JSON`);
    
    // Marcar como datos de simulación
    localStorage.setItem('tv-cable:seedVersion', 'simulation-json-v1');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error cargando datos de simulación:', error);
    return false;
  }
};
