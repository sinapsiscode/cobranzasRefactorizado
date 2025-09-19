import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const usePaymentReceiptStore = create(
  persist(
    (set, get) => ({
      // Estado
      receipts: [],
      currentReceipt: null,
      loading: false,
      error: null,

      // Acciones
      generateReceipt: async (paymentData, clientData, collectorData, serviceData) => {
        set({ loading: true, error: null });
        
        try {
          const receipt = {
            id: `receipt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            receiptNumber: `REC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
            
            // Información del pago
            payment: {
              id: paymentData.id,
              amount: paymentData.amount,
              paymentDate: paymentData.paymentDate || new Date().toISOString().split('T')[0],
              paymentMethod: paymentData.paymentMethod || 'efectivo',
              period: paymentData.period,
              concept: paymentData.concept || 'Pago de servicio mensual',
              status: paymentData.status
            },
            
            // Información del cliente
            client: {
              id: clientData.id,
              fullName: clientData.fullName,
              dni: clientData.dni,
              phone: clientData.phone,
              address: clientData.address,
              neighborhood: clientData.neighborhood,
              installationDate: clientData.installationDate
            },
            
            // Información del servicio
            service: {
              plan: serviceData?.plan || clientData.servicePlan,
              planName: serviceData?.name || this.getPlanName(clientData.servicePlan),
              price: serviceData?.price || this.getPlanPrice(clientData.servicePlan),
              speed: serviceData?.speed || this.getPlanSpeed(clientData.servicePlan),
              type: serviceData?.type || clientData.serviceType || 'internet',
              features: serviceData?.features || []
            },
            
            // Información del cobrador
            collector: {
              id: collectorData.id,
              fullName: collectorData.fullName,
              dni: collectorData.dni,
              signature: collectorData.signature || null,
              collectionDate: new Date().toISOString()
            },
            
            // Información de la empresa
            company: {
              name: 'TV Cable Cobranzas',
              address: 'Dirección de la empresa',
              phone: '(01) 123-4567',
              email: 'info@tvcable.pe',
              website: 'www.tvcable.pe'
            },
            
            // Metadatos
            createdAt: new Date().toISOString(),
            printed: false,
            sent: false,
            
            // Validez del recibo
            valid: true,
            validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 año
          };
          
          // Agregar a la lista de recibos
          set(state => ({
            receipts: [receipt, ...state.receipts],
            currentReceipt: receipt,
            loading: false,
            error: null
          }));
          
          return receipt;
        } catch (error) {
          set({ 
            loading: false, 
            error: error.message || 'Error al generar recibo' 
          });
          throw error;
        }
      },

      // Obtener recibo por ID de pago
      getReceiptByPaymentId: (paymentId) => {
        const { receipts } = get();
        return receipts.find(receipt => receipt.payment.id === paymentId);
      },

      // Obtener todos los recibos de un cliente
      getReceiptsByClientId: (clientId) => {
        const { receipts } = get();
        return receipts.filter(receipt => receipt.client.id === clientId);
      },

      // Obtener recibos de un cobrador
      getReceiptsByCollectorId: (collectorId) => {
        const { receipts } = get();
        return receipts.filter(receipt => receipt.collector.id === collectorId);
      },

      // Marcar recibo como impreso
      markAsPrinted: (receiptId) => {
        set(state => ({
          receipts: state.receipts.map(receipt =>
            receipt.id === receiptId
              ? { ...receipt, printed: true }
              : receipt
          ),
          currentReceipt: state.currentReceipt?.id === receiptId
            ? { ...state.currentReceipt, printed: true }
            : state.currentReceipt
        }));
      },

      // Marcar recibo como enviado
      markAsSent: (receiptId) => {
        set(state => ({
          receipts: state.receipts.map(receipt =>
            receipt.id === receiptId
              ? { ...receipt, sent: true }
              : receipt
          ),
          currentReceipt: state.currentReceipt?.id === receiptId
            ? { ...state.currentReceipt, sent: true }
            : state.currentReceipt
        }));
      },

      // Establecer recibo actual
      setCurrentReceipt: (receipt) => {
        set({ currentReceipt: receipt });
      },

      // Limpiar recibo actual
      clearCurrentReceipt: () => {
        set({ currentReceipt: null });
      },

      // Limpiar error
      clearError: () => {
        set({ error: null });
      },

      // Funciones helper para obtener información del plan
      getPlanName: (plan) => {
        const plans = {
          basic: 'Plan Básico',
          standard: 'Plan Estándar', 
          premium: 'Plan Premium'
        };
        return plans[plan] || 'Plan Básico';
      },

      getPlanPrice: (plan) => {
        const plans = {
          basic: 80,
          standard: 120,
          premium: 160
        };
        return plans[plan] || 80;
      },

      getPlanSpeed: (plan) => {
        const plans = {
          basic: '50 Mbps',
          standard: '100 Mbps',
          premium: '200 Mbps'
        };
        return plans[plan] || '50 Mbps';
      },

      // Obtener estadísticas de recibos
      getReceiptStats: () => {
        const { receipts } = get();
        
        return {
          total: receipts.length,
          printed: receipts.filter(r => r.printed).length,
          sent: receipts.filter(r => r.sent).length,
          pending: receipts.filter(r => !r.printed && !r.sent).length,
          thisMonth: receipts.filter(r => {
            const receiptDate = new Date(r.createdAt);
            const now = new Date();
            return receiptDate.getMonth() === now.getMonth() && 
                   receiptDate.getFullYear() === now.getFullYear();
          }).length,
          totalAmount: receipts.reduce((sum, r) => sum + r.payment.amount, 0)
        };
      },

      // Formatear número de recibo
      formatReceiptNumber: (receipt) => {
        return receipt.receiptNumber || `REC-${receipt.id.split('-').pop()}`;
      },

      // Validar recibo
      validateReceipt: (receiptId) => {
        const { receipts } = get();
        const receipt = receipts.find(r => r.id === receiptId);
        
        if (!receipt) return { valid: false, reason: 'Recibo no encontrado' };
        
        if (new Date() > new Date(receipt.validUntil)) {
          return { valid: false, reason: 'Recibo expirado' };
        }
        
        if (!receipt.valid) {
          return { valid: false, reason: 'Recibo anulado' };
        }
        
        return { valid: true };
      },

      // Anular recibo
      voidReceipt: (receiptId, reason) => {
        set(state => ({
          receipts: state.receipts.map(receipt =>
            receipt.id === receiptId
              ? { 
                  ...receipt, 
                  valid: false, 
                  voidReason: reason,
                  voidDate: new Date().toISOString()
                }
              : receipt
          )
        }));
      },

      // Buscar recibos
      searchReceipts: (query) => {
        const { receipts } = get();
        const searchTerm = query.toLowerCase();
        
        return receipts.filter(receipt => 
          receipt.receiptNumber.toLowerCase().includes(searchTerm) ||
          receipt.client.fullName.toLowerCase().includes(searchTerm) ||
          receipt.client.dni.includes(searchTerm) ||
          receipt.collector.fullName.toLowerCase().includes(searchTerm)
        );
      }
    }),
    {
      name: 'tv-cable-payment-receipts',
      partialize: (state) => ({
        receipts: state.receipts
      })
    }
  )
);