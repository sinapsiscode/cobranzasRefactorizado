// Store de configuraciones del sistema
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSettingsStore = create(
  persist(
    (set, get) => ({
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

      // Acciones
      updateEmailConfig: (config) => {
        set({ emailConfig: { ...get().emailConfig, ...config } });
      },

      updateEmailTemplate: (templateKey, template) => {
        set({
          emailTemplates: {
            ...get().emailTemplates,
            [templateKey]: { ...get().emailTemplates[templateKey], ...template },
          },
        });
      },

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
    }),
    {
      name: 'settings-storage',
    }
  )
);
