// Servicio de automatización para estados de pago
import { usePaymentStore } from '../../stores/paymentStore';

class PaymentStatusService {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.checkInterval = 6 * 60 * 60 * 1000; // 6 horas en milisegundos
    this.lastCheck = null;
  }

  // Iniciar verificación automática
  start() {
    if (this.isRunning) return;

    console.log('🤖 Servicio de automatización de estados de pago iniciado');

    // Ejecutar inmediatamente
    this.performAutomaticChecks();

    // Programar ejecución cada 6 horas
    this.intervalId = setInterval(() => {
      this.performAutomaticChecks();
    }, this.checkInterval);

    this.isRunning = true;
  }

  // Detener verificación automática
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🛑 Servicio de automatización de estados de pago detenido');
  }

  // Verificar si es el último día del mes
  isLastDayOfMonth() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Si mañana es día 1, entonces hoy es el último día del mes
    return tomorrow.getDate() === 1;
  }

  // Obtener el mes actual en formato YYYY-MM
  getCurrentMonth() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  // Realizar verificaciones automáticas
  async performAutomaticChecks() {
    try {
      console.log('🔍 Ejecutando verificación automática de estados de pagos...');
      this.lastCheck = new Date().toISOString();

      const store = usePaymentStore.getState();

      // Verificación diaria: actualizar pagos vencidos
      const overdueCount = await this.updateOverduePayments();

      if (overdueCount > 0) {
        console.log(`⚠️ Se marcaron ${overdueCount} pagos como vencidos`);
        this.notifyAdministrators({
          type: 'overdue_payments',
          count: overdueCount,
          date: new Date().toISOString()
        });
      }

      // Verificación especial: si es el último día del mes
      if (this.isLastDayOfMonth()) {
        console.log('📅 Es el último día del mes. Ejecutando cierre mensual...');
        const closureResult = await this.performMonthEndClosure();

        console.log(`✅ Cierre mensual completado:`, closureResult);

        this.notifyAdministrators({
          type: 'month_end_closure',
          ...closureResult,
          date: new Date().toISOString()
        });
      }

    } catch (error) {
      console.error('❌ Error en verificación automática de pagos:', error);
    }
  }

  // Actualizar pagos vencidos (se ejecuta diariamente)
  async updateOverduePayments() {
    try {
      const store = usePaymentStore.getState();
      const payments = store.payments || [];

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Resetear horas para comparación de fechas

      let updatedCount = 0;

      for (const payment of payments) {
        // Solo actualizar pagos que están pendientes o parciales
        if (payment.status !== 'pending' && payment.status !== 'partial') {
          continue;
        }

        const dueDate = new Date(payment.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        // Si la fecha de vencimiento ya pasó, marcar como vencido
        if (dueDate < today) {
          await store.updatePayment(payment.id, {
            status: 'overdue',
            updatedAt: new Date().toISOString()
          });
          updatedCount++;
          console.log(`📌 Pago ${payment.id} marcado como vencido (cliente: ${payment.clientId})`);
        }
      }

      return updatedCount;
    } catch (error) {
      console.error('Error actualizando pagos vencidos:', error);
      return 0;
    }
  }

  // Cierre de mes: actualizar estados finales
  async performMonthEndClosure() {
    try {
      const store = usePaymentStore.getState();
      const payments = store.payments || [];

      const currentMonth = this.getCurrentMonth();

      let moraCount = 0;
      let canceladoCount = 0;
      let parcialCount = 0;

      for (const payment of payments) {
        // Solo procesar pagos del mes actual
        if (payment.month !== currentMonth) {
          continue;
        }

        // Casos de actualización:
        // 1. Pendientes -> Mora
        if (payment.status === 'pending') {
          await store.updatePayment(payment.id, {
            status: 'overdue',
            comments: (payment.comments || '') + ' [Automático: No pagado al cierre del mes]',
            updatedAt: new Date().toISOString()
          });
          moraCount++;
          console.log(`🔴 Pago ${payment.id} marcado como MORA (pendiente al cierre)`);
        }

        // 2. Parciales -> Mora (deuda pendiente)
        else if (payment.status === 'partial') {
          await store.updatePayment(payment.id, {
            status: 'overdue',
            comments: (payment.comments || '') + ' [Automático: Pago parcial al cierre del mes]',
            updatedAt: new Date().toISOString()
          });
          parcialCount++;
          console.log(`🟠 Pago parcial ${payment.id} marcado como MORA (pago incompleto)`);
        }

        // 3. Pagados completamente -> Ya están como "cancelado" (paid/collected/validated)
        else if (payment.status === 'paid' || payment.status === 'collected' || payment.status === 'validated') {
          canceladoCount++;
          console.log(`🟢 Pago ${payment.id} CANCELADO (pagado completamente)`);
          // No necesita actualización, ya está en estado final correcto
        }
      }

      return {
        month: currentMonth,
        moraCount,
        canceladoCount,
        parcialCount,
        totalProcessed: moraCount + canceladoCount + parcialCount
      };

    } catch (error) {
      console.error('Error en cierre de mes:', error);
      return {
        error: error.message,
        moraCount: 0,
        canceladoCount: 0,
        parcialCount: 0
      };
    }
  }

  // Notificar a administradores sobre acciones automáticas
  notifyAdministrators(notification) {
    try {
      const existingNotifications = JSON.parse(localStorage.getItem('admin-notifications') || '[]');
      const newNotification = {
        id: Date.now().toString(),
        ...notification,
        read: false,
        timestamp: new Date().toISOString()
      };

      existingNotifications.unshift(newNotification);

      // Mantener solo las últimas 100 notificaciones
      const limitedNotifications = existingNotifications.slice(0, 100);

      localStorage.setItem('admin-notifications', JSON.stringify(limitedNotifications));

      console.log('📢 Notificación enviada a administradores:', newNotification);
    } catch (error) {
      console.error('Error enviando notificación:', error);
    }
  }

  // Obtener estadísticas del servicio
  getStats() {
    return {
      isRunning: this.isRunning,
      checkInterval: this.checkInterval,
      lastCheck: this.lastCheck,
      isLastDayOfMonth: this.isLastDayOfMonth(),
      currentMonth: this.getCurrentMonth()
    };
  }

  // Ejecutar verificación manual (para testing)
  async runManualCheck() {
    console.log('🔧 Ejecutando verificación manual de pagos...');
    return await this.performAutomaticChecks();
  }

  // Forzar cierre de mes (para testing)
  async forceMonthEndClosure() {
    console.log('🔧 Forzando cierre de mes manual...');
    return await this.performMonthEndClosure();
  }
}

// Instancia singleton del servicio
export const paymentStatusService = new PaymentStatusService();

// Funciones de utilidad
export const startPaymentStatusService = () => {
  paymentStatusService.start();
};

export const stopPaymentStatusService = () => {
  paymentStatusService.stop();
};

export const getPaymentServiceStats = () => {
  return paymentStatusService.getStats();
};

export const runManualPaymentCheck = () => {
  return paymentStatusService.runManualCheck();
};

export const forceMonthEndClosure = () => {
  return paymentStatusService.forceMonthEndClosure();
};

// Auto-inicio del servicio cuando se carga la aplicación
if (typeof window !== 'undefined') {
  // Solo en el navegador, no en SSR
  setTimeout(() => {
    startPaymentStatusService();
  }, 5000); // Esperar 5 segundos después de cargar la app
}
