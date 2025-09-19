// Servicio de automatización para estados de cliente
import { useClientStore } from '../../stores/clientStore';

class ClientStatusService {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
    this.checkInterval = 24 * 60 * 60 * 1000; // 24 horas en milisegundos
  }

  // Iniciar verificación automática
  start() {
    if (this.isRunning) return;
    
    console.log('🤖 Servicio de automatización de estados iniciado');
    
    // Ejecutar inmediatamente
    this.performAutomaticChecks();
    
    // Programar ejecución cada 24 horas
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
    console.log('🛑 Servicio de automatización de estados detenido');
  }

  // Realizar verificaciones automáticas
  async performAutomaticChecks() {
    try {
      console.log('🔍 Ejecutando verificación automática de estados de clientes...');
      
      const store = useClientStore.getState();
      
      // Verificar clientes en pausa > 30 días
      const terminatedCount = await this.checkPausedClientsForTermination();
      
      if (terminatedCount > 0) {
        console.log(`✅ Se dieron de baja automáticamente ${terminatedCount} clientes por pausa prolongada`);
        
        // Notificar a administradores (opcional)
        this.notifyAdministrators({
          type: 'automatic_termination',
          count: terminatedCount,
          date: new Date().toISOString()
        });
      } else {
        console.log('ℹ️ No hay clientes para dar de baja automáticamente');
      }

    } catch (error) {
      console.error('❌ Error en verificación automática:', error);
    }
  }

  // Verificar y procesar clientes en pausa > 30 días
  async checkPausedClientsForTermination() {
    try {
      const store = useClientStore.getState();
      return await store.checkAutomaticTerminations();
    } catch (error) {
      console.error('Error verificando terminaciones automáticas:', error);
      return 0;
    }
  }

  // Verificar clientes con deudas para marcar como suspendidos
  async checkClientsForSuspension() {
    try {
      const store = useClientStore.getState();
      const clients = store.clients;
      
      // Lógica para determinar qué clientes suspender por deuda
      // (esto se puede integrar con el sistema de pagos)
      
      return 0; // Por implementar
    } catch (error) {
      console.error('Error verificando suspensiones:', error);
      return 0;
    }
  }

  // Notificar a administradores sobre acciones automáticas
  notifyAdministrators(notification) {
    // Aquí se podría integrar con un sistema de notificaciones
    // Por ahora solo registramos en localStorage para que los admins lo vean
    
    try {
      const existingNotifications = JSON.parse(localStorage.getItem('admin-notifications') || '[]');
      const newNotification = {
        id: Date.now().toString(),
        ...notification,
        read: false,
        timestamp: new Date().toISOString()
      };
      
      existingNotifications.unshift(newNotification);
      
      // Mantener solo las últimas 50 notificaciones
      const limitedNotifications = existingNotifications.slice(0, 50);
      
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
      lastCheck: this.lastCheck || null
    };
  }

  // Ejecutar verificación manual (para testing)
  async runManualCheck() {
    console.log('🔧 Ejecutando verificación manual...');
    return await this.performAutomaticChecks();
  }
}

// Instancia singleton del servicio
export const clientStatusService = new ClientStatusService();

// Funciones de utilidad
export const startClientStatusService = () => {
  clientStatusService.start();
};

export const stopClientStatusService = () => {
  clientStatusService.stop();
};

export const getServiceStats = () => {
  return clientStatusService.getStats();
};

export const runManualStatusCheck = () => {
  return clientStatusService.runManualCheck();
};

// Auto-inicio del servicio cuando se carga la aplicación
if (typeof window !== 'undefined') {
  // Solo en el navegador, no en SSR
  setTimeout(() => {
    startClientStatusService();
  }, 5000); // Esperar 5 segundos después de cargar la app
}