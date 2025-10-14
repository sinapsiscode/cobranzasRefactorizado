// Store de configuraciones del sistema
import { create } from 'zustand';

const API_URL = 'http://localhost:8231/api';

export const useSettingsStore = create((set, get) => ({
  // Estado de configuración de email
  emailConfig: {
    smtpHost: '',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: 'info@tvcableperu.com',
    fromName: 'TV Cable Perú',
    enabled: false,
  },

  // Plantillas de email
  emailTemplates: {
    paymentReminder: {
      subject: 'Recordatorio de Pago - TV Cable',
      body: `Estimado/a {cliente_nombre},

Le recordamos que tiene una deuda pendiente de S/ {monto_deuda} correspondiente a {meses_adeudados} mes(es) de servicio.

Detalles:
- Monto adeudado: S/ {monto_deuda}
- Meses pendientes: {meses_adeudados}
- Deuda más antigua: {fecha_antigua}

Por favor, regularice su pago a la brevedad posible para evitar la suspensión del servicio.

Puede realizar su pago a través de:
- Transferencia bancaria
- Depósito en cuenta
- Pago en línea

Gracias por su comprensión.

Atentamente,
TV Cable Perú
Teléfono: (01) 234-5678
Email: info@tvcableperu.com`,
      enabled: true,
    },
    overdueNotice: {
      subject: 'Aviso de Pago Vencido - TV Cable',
      body: `Estimado/a {cliente_nombre},

Su pago de S/ {monto_deuda} se encuentra vencido.

Por favor regularice su situación para evitar el corte del servicio.

TV Cable Perú`,
      enabled: true,
    },
    paymentConfirmation: {
      subject: 'Confirmación de Pago - TV Cable',
      body: `Estimado/a {cliente_nombre},

Hemos recibido su pago de S/ {monto}.

Número de operación: {numero_operacion}
Fecha: {fecha_pago}

Gracias por su pago puntual.

TV Cable Perú`,
      enabled: true,
    },
  },

  // Loading and error states
  loading: false,
  error: null,

  // Cargar configuraciones desde el servidor
  fetchSettings: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_URL}/settings`);
      if (!response.ok) {
        throw new Error('Error al cargar configuraciones');
      }
      const data = await response.json();

      // Actualizar el estado con los datos del servidor
      set({
        emailConfig: data.emailConfig || get().emailConfig,
        emailTemplates: data.emailTemplates || get().emailTemplates,
        loading: false,
      });
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Error fetching settings:', error);
    }
  },

  // Actualizar configuración de email
  updateEmailConfig: async (config) => {
    set({ loading: true, error: null });
    try {
      const currentState = get();
      const updatedEmailConfig = { ...currentState.emailConfig, ...config };

      const response = await fetch(`${API_URL}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailConfig: updatedEmailConfig,
          emailTemplates: currentState.emailTemplates,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar configuración de email');
      }

      const data = await response.json();
      set({
        emailConfig: data.emailConfig,
        emailTemplates: data.emailTemplates,
        loading: false,
      });
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Error updating email config:', error);
      throw error;
    }
  },

  // Actualizar plantilla de email
  updateEmailTemplate: async (templateKey, template) => {
    set({ loading: true, error: null });
    try {
      const currentState = get();
      const updatedEmailTemplates = {
        ...currentState.emailTemplates,
        [templateKey]: { ...currentState.emailTemplates[templateKey], ...template },
      };

      const response = await fetch(`${API_URL}/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailConfig: currentState.emailConfig,
          emailTemplates: updatedEmailTemplates,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar plantilla de email');
      }

      const data = await response.json();
      set({
        emailConfig: data.emailConfig,
        emailTemplates: data.emailTemplates,
        loading: false,
      });
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Error updating email template:', error);
      throw error;
    }
  },

  // Obtener plantilla de email
  getEmailTemplate: (templateKey) => {
    return get().emailTemplates[templateKey];
  },

  // Reemplazar variables en el template
  renderEmailTemplate: (templateKey, variables) => {
    const template = get().emailTemplates[templateKey];
    if (!template) return null;

    let subject = template.subject;
    let body = template.body;

    // Reemplazar variables
    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`{${key}}`, 'g');
      subject = subject.replace(regex, variables[key]);
      body = body.replace(regex, variables[key]);
    });

    return { subject, body, enabled: template.enabled };
  },

  // Resetear configuración a valores por defecto
  resetEmailConfig: () => {
    set({
      emailConfig: {
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpPassword: '',
        fromEmail: 'info@tvcableperu.com',
        fromName: 'TV Cable Perú',
        enabled: false,
      },
    });
  },

  // Validar configuración de email
  isEmailConfigValid: () => {
    const { emailConfig } = get();
    return (
      emailConfig.enabled &&
      emailConfig.smtpHost &&
      emailConfig.smtpPort &&
      emailConfig.smtpUser &&
      emailConfig.fromEmail
    );
  },
}));
