/**
 * Generador de datos masivos para db.json
 * Basado en el seeder.js del frontend
 */

// Nombres peruanos realistas
const PERU_FIRST_NAMES = [
  'Carlos', 'María', 'José', 'Ana', 'Luis', 'Carmen', 'Miguel', 'Rosa', 'Juan', 'Elena',
  'Pedro', 'Lucía', 'Jorge', 'Patricia', 'Roberto', 'Isabel', 'Fernando', 'Teresa',
  'Manuel', 'Gloria', 'Andrés', 'Silvia', 'Ricardo', 'Mónica', 'Diego', 'Sandra',
  'Alejandro', 'Pilar', 'Francisco', 'Victoria', 'Rafael', 'Beatriz', 'Eduardo', 'Claudia',
  'Sergio', 'Adriana', 'Gustavo', 'Roxana', 'Óscar', 'Vanessa', 'Antonio', 'Liliana',
  'Raúl', 'Karina', 'Víctor', 'Yolanda', 'Hugo', 'Mariana', 'Alberto', 'Daniela'
];

const PERU_LAST_NAMES = [
  'García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez',
  'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Álvarez',
  'Muñoz', 'Romero', 'Alonso', 'Gutierrez', 'Navarro', 'Torres', 'Domínguez', 'Vázquez',
  'Ramos', 'Gil', 'Ramírez', 'Serrano', 'Blanco', 'Suárez', 'Molina', 'Morales',
  'Ortega', 'Delgado', 'Castro', 'Ortiz', 'Rubio', 'Marín', 'Sanz', 'Iglesias',
  'Medina', 'Garrido', 'Cortés', 'Castillo', 'Santos', 'Lozano', 'Guerrero', 'Cano'
];

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

// Utilidades
const randomChoice = (array) => array[Math.floor(Math.random() * array.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomBool = (probability = 0.5) => Math.random() < probability;

const generateDNI = () => String(randomInt(10000000, 99999999));
const generatePhone = () => {
  const operators = ['9', '8', '7'];
  const operator = randomChoice(operators);
  const number = String(randomInt(10000000, 99999999));
  return `+51${operator}${number}`;
};

const generateEmail = (firstName, lastName) => {
  const domains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'];
  const name = `${firstName.toLowerCase()}.${lastName.toLowerCase()}`;
  return `${name}@${randomChoice(domains)}`;
};

const generateAddress = () => {
  const street = randomChoice(STREET_NAMES);
  const number = randomInt(100, 9999);
  const district = randomChoice(LIMA_DISTRICTS);
  return {
    address: `${street} ${number}, ${district}, Lima`,
    neighborhood: district
  };
};

const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

/**
 * Generar N clientes
 */
export function generateClients(count = 200) {
  const clients = [];
  const plans = ['basic', 'standard', 'premium'];

  for (let i = 1; i <= count; i++) {
    const firstName = randomChoice(PERU_FIRST_NAMES);
    const lastName1 = randomChoice(PERU_LAST_NAMES);
    const lastName2 = randomChoice(PERU_LAST_NAMES);
    const fullName = `${firstName} ${lastName1} ${lastName2}`;

    // Fecha de instalación variada
    const installationDate = randomDate(
      new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000), // 2 años atrás
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 días atrás
    );

    // Determinar estado del cliente
    let clientStatus = 'active';
    let statusHistory = [];

    const statusRand = Math.random();
    if (statusRand < 0.70) {
      clientStatus = 'active';
    } else if (statusRand < 0.80) {
      clientStatus = 'debt';
      statusHistory.push({
        fromStatus: 'active',
        toStatus: 'debt',
        date: new Date(Date.now() - randomInt(1, 30) * 24 * 60 * 60 * 1000).toISOString(),
        reason: 'Pago vencido detectado automáticamente',
        changedBy: 'system'
      });
    } else if (statusRand < 0.90) {
      clientStatus = 'suspended';
      statusHistory.push({
        fromStatus: 'active',
        toStatus: 'debt',
        date: new Date(Date.now() - randomInt(20, 45) * 24 * 60 * 60 * 1000).toISOString(),
        reason: 'Pago vencido detectado automáticamente',
        changedBy: 'system'
      });
      statusHistory.push({
        fromStatus: 'debt',
        toStatus: 'suspended',
        date: new Date(Date.now() - randomInt(5, 15) * 24 * 60 * 60 * 1000).toISOString(),
        reason: 'Suspensión por falta de pago prolongado',
        changedBy: 'system'
      });
    } else {
      clientStatus = 'paused';
      statusHistory.push({
        fromStatus: 'active',
        toStatus: 'paused',
        date: new Date(Date.now() - randomInt(1, 25) * 24 * 60 * 60 * 1000).toISOString(),
        reason: randomChoice(['Viaje temporal', 'Problemas económicos', 'Mudanza en proceso']),
        changedBy: 'admin-1'
      });
    }

    // Determinar servicios
    const serviceRand = Math.random();
    let serviceType, services;

    if (serviceRand < 0.4) {
      serviceType = 'internet';
      services = ['internet'];
    } else if (serviceRand < 0.7) {
      serviceType = 'cable';
      services = ['cable'];
    } else {
      serviceType = 'cable';
      services = ['cable', 'internet'];
    }

    clients.push({
      id: `client-${String(i).padStart(3, '0')}`,
      fullName,
      dni: generateDNI(),
      phone: generatePhone(),
      email: randomBool(0.7) ? generateEmail(firstName, lastName1) : null,
      ...generateAddress(),
      servicePlan: randomChoice(plans),
      serviceType,
      services,
      installationDate: installationDate.toISOString().split('T')[0],
      preferredPaymentDay: randomInt(1, 28),
      paymentDueDays: randomInt(3, 7),
      isActive: clientStatus === 'active' || clientStatus === 'debt' || clientStatus === 'paused',
      status: clientStatus,
      statusHistory: statusHistory,
      statusReason: statusHistory.length > 0 ? statusHistory[statusHistory.length - 1].reason : null,
      pauseStartDate: null,
      pauseReason: null,
      isArchived: clientStatus === 'terminated',
      archivedDate: null,
      previousClientId: null,
      clientVersions: [],
      preservedDebts: [],
      lastLogin: clientStatus !== 'terminated' && randomBool(0.8) ?
        randomDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()).toISOString() : null,
      reactivationDate: null
    });
  }

  return clients;
}

/**
 * Generar pagos para clientes
 */
export function generatePayments(clients) {
  const payments = [];
  const currentDate = new Date();
  const planPrices = { basic: 50, standard: 80, premium: 120 };
  const paymentMethods = ['cash', 'transfer', 'deposit', 'voucher'];

  clients.forEach((client) => {
    const clientInstallDate = new Date(client.installationDate);

    // Generar pagos de los últimos 6 meses
    for (let monthsBack = 6; monthsBack >= 0; monthsBack--) {
      const dueDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - monthsBack,
        client.preferredPaymentDay
      );

      if (dueDate >= clientInstallDate) {
        const month = `${dueDate.getFullYear()}-${String(dueDate.getMonth() + 1).padStart(2, '0')}`;
        let status = 'paid';
        let paymentDate = null;
        let paymentMethod = null;

        if (monthsBack === 0) {
          // Mes actual
          if (randomBool(0.30)) {
            status = dueDate < currentDate ? 'overdue' : 'pending';
          } else {
            paymentMethod = randomChoice(paymentMethods);
            paymentDate = randomDate(dueDate, currentDate).toISOString().split('T')[0];
          }
        } else if (monthsBack === 1) {
          // Mes pasado
          if (randomBool(0.25)) {
            status = 'overdue';
          } else {
            paymentMethod = randomChoice(paymentMethods);
            const maxPayDate = new Date(dueDate.getTime() + 10 * 24 * 60 * 60 * 1000);
            paymentDate = randomDate(dueDate, maxPayDate).toISOString().split('T')[0];
          }
        } else {
          // Meses anteriores
          if (randomBool(0.15)) {
            status = 'overdue';
          } else {
            paymentMethod = randomChoice(paymentMethods);
            const maxPayDate = new Date(dueDate.getTime() + 10 * 24 * 60 * 60 * 1000);
            paymentDate = randomDate(dueDate, maxPayDate).toISOString().split('T')[0];
          }
        }

        payments.push({
          id: `payment-${client.id}-${month}`,
          clientId: client.id,
          serviceType: client.serviceType,
          collectorId: (status === 'paid') ? `collector-${randomInt(1, 3)}` : null,
          amount: planPrices[client.servicePlan],
          billingType: 'normal',
          dueDate: dueDate.toISOString().split('T')[0],
          paymentDate,
          status,
          paymentMethod,
          voucherUrl: paymentMethod === 'voucher' ? `https://via.placeholder.com/400x300?text=Voucher+${client.id}` : null,
          comments: randomBool(0.2) ? 'Pago registrado por cobrador' : null,
          month,
          year: dueDate.getFullYear()
        });
      }
    }
  });

  return payments;
}

export default {
  generateClients,
  generatePayments
};
