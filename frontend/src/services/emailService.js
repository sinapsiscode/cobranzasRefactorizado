// Servicio de envío de correos electrónicos
import { useSettingsStore } from '../stores/settingsStore';

/**
 * Simula el envío de un correo electrónico
 * En un entorno de producción, esto debería conectarse a un servidor SMTP o servicio de email
 */
const simulateEmailSend = async (to, subject, body) => {
  // Simular latencia de red
  await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));

  // Simular éxito/fallo aleatorio (95% de éxito)
  if (Math.random() > 0.95) {
    throw new Error('Error de red al enviar email');
  }

  // Log para desarrollo
  console.log('📧 Email enviado (simulado):', {
    to,
    subject,
    body: body.substring(0, 100) + '...',
    timestamp: new Date().toISOString()
  });

  return {
    success: true,
    messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString()
  };
};

/**
 * Envía un correo electrónico a un destinatario
 * @param {string} to - Email del destinatario
 * @param {string} subject - Asunto del correo
 * @param {string} body - Cuerpo del correo
 * @returns {Promise<Object>} Resultado del envío
 */
export const sendEmail = async (to, subject, body) => {
  const { emailConfig } = useSettingsStore.getState();

  // Validar solo datos básicos (en modo simulado no requiere configuración SMTP)
  if (!to || !to.includes('@')) {
    throw new Error('Email del destinatario inválido');
  }

  if (!subject || !body) {
    throw new Error('El asunto y el cuerpo del email son requeridos');
  }

  try {
    // En modo simulado, siempre enviar
    // En producción, aquí iría la lógica real de envío usando SMTP
    const result = await simulateEmailSend(to, subject, body);

    return {
      success: true,
      to,
      subject,
      messageId: result.messageId,
      timestamp: result.timestamp
    };
  } catch (error) {
    console.error('Error enviando email:', error);
    throw error;
  }
};

/**
 * Envía un email usando una plantilla del sistema
 * @param {string} to - Email del destinatario
 * @param {string} templateKey - Clave de la plantilla (ej: 'paymentReminder')
 * @param {Object} variables - Variables para reemplazar en la plantilla
 * @returns {Promise<Object>} Resultado del envío
 */
export const sendTemplatedEmail = async (to, templateKey, variables) => {
  const { renderEmailTemplate } = useSettingsStore.getState();

  // Renderizar plantilla con variables
  const template = renderEmailTemplate(templateKey, variables);

  if (!template) {
    throw new Error(`Plantilla '${templateKey}' no encontrada`);
  }

  if (!template.enabled) {
    throw new Error(`Plantilla '${templateKey}' está deshabilitada`);
  }

  // Enviar email con la plantilla renderizada
  return sendEmail(to, template.subject, template.body);
};

/**
 * Envía recordatorios de pago por email a múltiples clientes
 * @param {Array} clients - Lista de clientes con sus datos de deuda
 * @returns {Promise<Object>} Resumen del envío
 */
export const sendBulkPaymentReminders = async (clients) => {
  const results = {
    sent: [],
    failed: [],
    total: clients.length
  };

  for (const client of clients) {
    try {
      // Validar que el cliente tenga email
      if (!client.email || !client.email.includes('@')) {
        results.failed.push({
          client: client.fullName,
          error: 'Email no válido o no registrado'
        });
        continue;
      }

      // Preparar variables para la plantilla
      const variables = {
        cliente_nombre: client.fullName,
        monto_deuda: client.debtAmount?.toFixed(2) || '0.00',
        meses_adeudados: client.monthsOverdue || 0,
        fecha_antigua: client.oldestDebtDate || 'N/A'
      };

      // Enviar email usando la plantilla de recordatorio
      await sendTemplatedEmail(client.email, 'paymentReminder', variables);

      results.sent.push({
        client: client.fullName,
        email: client.email
      });

      // Pequeña pausa entre emails para evitar sobrecarga
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      results.failed.push({
        client: client.fullName,
        email: client.email,
        error: error.message
      });
    }
  }

  return results;
};

/**
 * Envía un recordatorio de pago a un cliente específico
 * @param {Object} client - Datos del cliente
 * @param {Object} debtInfo - Información de la deuda
 * @returns {Promise<Object>} Resultado del envío
 */
export const sendPaymentReminder = async (client, debtInfo) => {
  if (!client.email || !client.email.includes('@')) {
    throw new Error('El cliente no tiene un email válido registrado');
  }

  const variables = {
    cliente_nombre: client.fullName,
    monto_deuda: debtInfo.balance?.toFixed(2) || '0.00',
    meses_adeudados: debtInfo.overdueMonths || 0,
    fecha_antigua: debtInfo.oldestDebtDate || 'N/A'
  };

  return sendTemplatedEmail(client.email, 'paymentReminder', variables);
};

/**
 * Envía confirmación de pago por email
 * @param {string} to - Email del destinatario
 * @param {Object} paymentData - Datos del pago
 * @returns {Promise<Object>} Resultado del envío
 */
export const sendPaymentConfirmation = async (to, paymentData) => {
  const variables = {
    cliente_nombre: paymentData.clientName,
    monto: paymentData.amount?.toFixed(2) || '0.00',
    numero_operacion: paymentData.operationNumber || 'N/A',
    fecha_pago: paymentData.date || new Date().toLocaleDateString('es-PE')
  };

  return sendTemplatedEmail(to, 'paymentConfirmation', variables);
};

export default {
  sendEmail,
  sendTemplatedEmail,
  sendBulkPaymentReminders,
  sendPaymentReminder,
  sendPaymentConfirmation
};
