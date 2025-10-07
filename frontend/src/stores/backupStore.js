import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { exportBackupToExcel } from '../utils/excelExport';

export const useBackupStore = create(
  persist(
    (set, get) => ({
      // Estado
      backups: [],
      loading: false,
      error: null,
      lastBackupDate: null,

      // Acciones
      generateBackup: async () => {
        set({ loading: true, error: null });

        try {
          // Obtener todos los datos del localStorage
          const clientsData = JSON.parse(localStorage.getItem('tv-cable-clients') || '{"clients": []}');
          const paymentsData = JSON.parse(localStorage.getItem('tv-cable-payments') || '{"payments": []}');

          const clients = clientsData.clients || [];
          const payments = paymentsData.payments || [];

          // Calcular estado de pagos para cada cliente
          const clientsWithPaymentStatus = clients.map(client => {
            const clientPayments = payments.filter(p => p.clientId === client.id);

            // Pagos completados
            const paidPayments = clientPayments.filter(p =>
              p.status === 'paid' || p.status === 'collected' || p.status === 'validated'
            );

            // Pagos pendientes
            const pendingPayments = clientPayments.filter(p =>
              p.status === 'pending' || p.status === 'overdue' || p.status === 'partial'
            );

            // Calcular deuda total
            const totalDebt = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

            // Calcular total pagado
            const totalPaid = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

            return {
              id: client.id,
              fullName: client.fullName,
              dni: client.dni,
              phone: client.phone,
              email: client.email,
              servicePlan: client.servicePlan,
              serviceType: client.serviceType,
              neighborhood: client.neighborhood,
              status: client.status,
              installationDate: client.installationDate,
              paymentStatus: {
                hasPaid: paidPayments.length > 0,
                hasDebt: pendingPayments.length > 0,
                totalPaid: totalPaid,
                totalDebt: totalDebt,
                paidPaymentsCount: paidPayments.length,
                pendingPaymentsCount: pendingPayments.length,
                lastPaymentDate: paidPayments.length > 0
                  ? paidPayments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))[0].paymentDate
                  : null
              }
            };
          });

          // Separar clientes por estado de pago
          const clientsWithDebt = clientsWithPaymentStatus.filter(c => c.paymentStatus.hasDebt);
          const clientsPaid = clientsWithPaymentStatus.filter(c => c.paymentStatus.hasPaid && !c.paymentStatus.hasDebt);

          const backupData = {
            timestamp: new Date().toISOString(),
            version: '2.0',
            data: {
              // Auth data (sin contraseñas)
              users: JSON.parse(localStorage.getItem('tv-cable-auth') || '{}'),

              // Clients data (original)
              clients: clientsData,

              // Payments data
              payments: paymentsData,

              // CashBoxes data
              cashBoxes: JSON.parse(localStorage.getItem('tv-cable-cashboxes') || '{"cashBoxes": []}'),

              // Services data
              services: JSON.parse(localStorage.getItem('tv-cable-services') || '{"services": []}'),

              // Vouchers data
              vouchers: JSON.parse(localStorage.getItem('tv-cable-vouchers') || '{"vouchers": []}'),

              // Notifications data
              notifications: JSON.parse(localStorage.getItem('tv-cable-notifications') || '{"notifications": []}'),

              // UI settings
              uiSettings: JSON.parse(localStorage.getItem('tv-cable-ui') || '{}')
            },
            // Reporte de clientes con estado de pago
            paymentReport: {
              clientsWithPaymentStatus: clientsWithPaymentStatus,
              summary: {
                total: clientsWithPaymentStatus.length,
                withDebt: clientsWithDebt.length,
                paid: clientsPaid.length,
                totalDebtAmount: clientsWithDebt.reduce((sum, c) => sum + c.paymentStatus.totalDebt, 0),
                totalPaidAmount: clientsPaid.reduce((sum, c) => sum + c.paymentStatus.totalPaid, 0)
              },
              clientsWithDebt: clientsWithDebt.map(c => ({
                fullName: c.fullName,
                dni: c.dni,
                phone: c.phone,
                totalDebt: c.paymentStatus.totalDebt,
                pendingPaymentsCount: c.paymentStatus.pendingPaymentsCount,
                servicePlan: c.servicePlan,
                neighborhood: c.neighborhood
              })),
              clientsPaid: clientsPaid.map(c => ({
                fullName: c.fullName,
                dni: c.dni,
                phone: c.phone,
                totalPaid: c.paymentStatus.totalPaid,
                paidPaymentsCount: c.paymentStatus.paidPaymentsCount,
                lastPaymentDate: c.paymentStatus.lastPaymentDate,
                servicePlan: c.servicePlan,
                neighborhood: c.neighborhood
              }))
            },
            metadata: {
              totalClients: clients.length,
              totalPayments: payments.length,
              totalServices: JSON.parse(localStorage.getItem('tv-cable-services') || '{"services": []}').services?.length || 0,
              totalCashBoxes: JSON.parse(localStorage.getItem('tv-cable-cashboxes') || '{"cashBoxes": []}').cashBoxes?.length || 0,
              clientsWithDebt: clientsWithDebt.length,
              clientsPaid: clientsPaid.length,
              totalDebtAmount: clientsWithDebt.reduce((sum, c) => sum + c.paymentStatus.totalDebt, 0),
              totalPaidAmount: clientsPaid.reduce((sum, c) => sum + c.paymentStatus.totalPaid, 0),
              backupSize: 0 // Se calculará después
            }
          };

          // Calcular tamaño del backup
          const backupString = JSON.stringify(backupData);
          const backupSizeKB = Math.round((new Blob([backupString]).size) / 1024);
          backupData.metadata.backupSize = backupSizeKB;

          // Crear el backup con un ID único
          const backup = {
            id: `backup-${Date.now()}`,
            name: `Backup-${new Date().toLocaleDateString('es-PE')}-${new Date().toLocaleTimeString('es-PE', { hour12: false }).replace(/:/g, '')}`,
            date: new Date().toISOString(),
            size: backupSizeKB,
            data: backupData,
            type: 'full', // full | partial
            status: 'completed'
          };

          // Agregar a la lista de backups
          set(state => ({
            backups: [backup, ...state.backups],
            lastBackupDate: backup.date,
            loading: false,
            error: null
          }));

          return backup;
        } catch (error) {
          set({ 
            loading: false, 
            error: error.message || 'Error al generar backup' 
          });
          throw error;
        }
      },

      downloadBackup: (backupId) => {
        try {
          const { backups } = get();
          const backup = backups.find(b => b.id === backupId);

          if (!backup) {
            throw new Error('Backup no encontrado');
          }

          // Exportar a Excel usando la función de utilidad
          exportBackupToExcel(backup.data);

          return true;
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      restoreBackup: async (backupData) => {
        set({ loading: true, error: null });
        
        try {
          // Validar estructura del backup
          if (!backupData || !backupData.data || !backupData.version) {
            throw new Error('Formato de backup inválido');
          }

          // Confirmar restauración (esto debería manejarse en el componente UI)
          const confirmRestore = window.confirm(
            '⚠️ ADVERTENCIA: Esta acción reemplazará todos los datos actuales con los del backup. ¿Está seguro de continuar?'
          );
          
          if (!confirmRestore) {
            set({ loading: false });
            return false;
          }

          // Hacer backup de seguridad antes de restaurar
          const currentBackup = await get().generateBackup();
          
          // Restaurar datos en localStorage
          const { data } = backupData;
          
          if (data.clients) {
            localStorage.setItem('tv-cable-clients', JSON.stringify(data.clients));
          }
          
          if (data.payments) {
            localStorage.setItem('tv-cable-payments', JSON.stringify(data.payments));
          }
          
          if (data.cashBoxes) {
            localStorage.setItem('tv-cable-cashboxes', JSON.stringify(data.cashBoxes));
          }
          
          if (data.services) {
            localStorage.setItem('tv-cable-services', JSON.stringify(data.services));
          }
          
          if (data.vouchers) {
            localStorage.setItem('tv-cable-vouchers', JSON.stringify(data.vouchers));
          }
          
          if (data.notifications) {
            localStorage.setItem('tv-cable-notifications', JSON.stringify(data.notifications));
          }

          if (data.uiSettings) {
            localStorage.setItem('tv-cable-ui', JSON.stringify(data.uiSettings));
          }

          set({ 
            loading: false, 
            error: null 
          });

          // Recargar página para aplicar cambios
          window.location.reload();
          
          return true;
        } catch (error) {
          set({ 
            loading: false, 
            error: error.message || 'Error al restaurar backup' 
          });
          throw error;
        }
      },

      uploadBackup: async (file) => {
        set({ loading: true, error: null });
        
        try {
          if (!file) {
            throw new Error('No se seleccionó ningún archivo');
          }

          if (file.type !== 'application/json') {
            throw new Error('El archivo debe ser de tipo JSON');
          }

          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
              try {
                const backupData = JSON.parse(e.target.result);
                const restored = await get().restoreBackup(backupData);
                resolve(restored);
              } catch (parseError) {
                set({ 
                  loading: false, 
                  error: 'Error al leer el archivo de backup' 
                });
                reject(parseError);
              }
            };
            
            reader.onerror = () => {
              set({ 
                loading: false, 
                error: 'Error al leer el archivo' 
              });
              reject(new Error('Error al leer el archivo'));
            };
            
            reader.readAsText(file);
          });
        } catch (error) {
          set({ 
            loading: false, 
            error: error.message 
          });
          throw error;
        }
      },

      deleteBackup: (backupId) => {
        try {
          set(state => ({
            backups: state.backups.filter(backup => backup.id !== backupId)
          }));
          return true;
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      },

      // Estadísticas
      getBackupStats: () => {
        const { backups } = get();

        const latestBackup = backups.length > 0 ? backups[0] : null;

        const stats = {
          total: backups.length,
          totalSize: backups.reduce((sum, backup) => sum + backup.size, 0),
          lastBackup: backups.length > 0 ? backups[0].date : null,
          oldestBackup: backups.length > 0 ? backups[backups.length - 1].date : null,
          // Datos del último backup
          latestBackupInfo: latestBackup ? {
            totalClients: latestBackup.data?.metadata?.totalClients || 0,
            clientsWithDebt: latestBackup.data?.metadata?.clientsWithDebt || 0,
            clientsPaid: latestBackup.data?.metadata?.clientsPaid || 0,
            totalDebtAmount: latestBackup.data?.metadata?.totalDebtAmount || 0,
            totalPaidAmount: latestBackup.data?.metadata?.totalPaidAmount || 0
          } : null
        };

        return stats;
      },

      // Backup automático
      scheduleAutoBackup: () => {
        // Esta funcionalidad podría implementarse con un worker o interval
        // Por ahora solo es un placeholder
        console.log('Auto backup scheduled');
      },

      // Validar integridad de backup
      validateBackup: (backupData) => {
        try {
          const requiredFields = ['timestamp', 'version', 'data'];
          const hasRequiredFields = requiredFields.every(field => 
            backupData.hasOwnProperty(field)
          );
          
          if (!hasRequiredFields) {
            return {
              valid: false,
              errors: ['Faltan campos requeridos en el backup']
            };
          }

          const errors = [];
          
          // Validar timestamp
          if (!Date.parse(backupData.timestamp)) {
            errors.push('Timestamp inválido');
          }
          
          // Validar versión
          if (!backupData.version || typeof backupData.version !== 'string') {
            errors.push('Versión inválida');
          }
          
          // Validar datos
          if (!backupData.data || typeof backupData.data !== 'object') {
            errors.push('Datos de backup inválidos');
          }

          return {
            valid: errors.length === 0,
            errors: errors
          };
        } catch (error) {
          return {
            valid: false,
            errors: ['Error al validar backup: ' + error.message]
          };
        }
      }
    }),
    {
      name: 'tv-cable-backups',
      partialize: (state) => ({
        backups: state.backups,
        lastBackupDate: state.lastBackupDate
      })
    }
  )
);