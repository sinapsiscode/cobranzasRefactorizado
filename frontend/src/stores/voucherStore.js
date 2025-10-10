// Store de vouchers - subida, validación, gestión
import { create } from 'zustand';

const API_URL = '/api';

export const useVoucherStore = create((set, get) => ({
  // Estado
  vouchers: [],
  currentVoucher: null,
  loading: false,
  error: null,
  uploadProgress: 0,

  // Subir voucher con validación de N° operación
  uploadVoucher: async (voucherData) => {
    set({ loading: true, error: null, uploadProgress: 0 });

    try {
      const { clientId, operationNumber, file, amount, paymentDate, paymentPeriod, paymentMethod, comments } = voucherData;

      // Validar N° operación único
      const existingVoucher = await get().checkOperationNumber(operationNumber);
      if (existingVoucher) {
        throw new Error(`El número de operación ${operationNumber} ya está registrado`);
      }

      // Validar archivo
      if (file.size > 5 * 1024 * 1024) { // 5MB
        throw new Error('El archivo no puede exceder 5MB');
      }

      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Solo se permiten archivos JPG, PNG o PDF');
      }

      // Simular progreso de subida
      set({ uploadProgress: 30 });

      // Convertir archivo a base64
      const fileData = await get().fileToBase64(file);

      set({ uploadProgress: 70 });

      // Crear voucher
      const newVoucher = {
        clientId,
        operationNumber,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileData,
        uploadDate: new Date().toISOString(),
        status: 'pending', // pending, approved, rejected
        reviewedBy: null,
        reviewDate: null,
        amount: parseFloat(amount) || 0,
        paymentDate: paymentDate || new Date().toISOString().split('T')[0],
        paymentPeriod: paymentPeriod || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
        paymentMethod: paymentMethod || 'yape',
        comments: comments || ''
      };

      // Enviar al backend
      const response = await fetch(`${API_URL}/vouchers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newVoucher)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al subir el voucher');
      }

      const savedVoucher = await response.json();

      // Actualizar estado local
      set(state => ({
        vouchers: [...state.vouchers, savedVoucher],
        loading: false,
        uploadProgress: 100,
        error: null
      }));

      return savedVoucher;
    } catch (error) {
      set({
        loading: false,
        error: error.message,
        uploadProgress: 0
      });
      throw error;
    }
  },

  // Verificar si número de operación ya existe
  checkOperationNumber: async (operationNumber) => {
    try {
      const response = await fetch(`${API_URL}/vouchers/check-operation/${operationNumber}`);

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.exists ? data.voucher : null;
    } catch (error) {
      console.error('Error checking operation number:', error);
      return null;
    }
  },

  // Convertir archivo a base64
  fileToBase64: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  },

  // Cargar vouchers del cliente actual
  fetchClientVouchers: async (clientId) => {
    set({ loading: true, error: null });

    try {
      const response = await fetch(`${API_URL}/vouchers?clientId=${clientId}`);

      if (!response.ok) {
        throw new Error('Error al cargar los vouchers del cliente');
      }

      const clientVouchers = await response.json();

      set({
        vouchers: clientVouchers,
        loading: false
      });

      return clientVouchers;
    } catch (error) {
      set({
        loading: false,
        error: error.message
      });
      throw error;
    }
  },

  // Cargar todos los vouchers (para admin/cobrador)
  fetchAllVouchers: async (status = null) => {
    set({ loading: true, error: null });

    try {
      const url = status
        ? `${API_URL}/vouchers?status=${status}`
        : `${API_URL}/vouchers`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Error al cargar los vouchers');
      }

      const allVouchers = await response.json();

      set({
        vouchers: allVouchers,
        loading: false
      });

      return allVouchers;
    } catch (error) {
      set({
        loading: false,
        error: error.message
      });
      throw error;
    }
  },

  // Revisar voucher (aprobar/rechazar) - para admin/cobrador
  reviewVoucher: async (voucherId, status, reviewedBy, comments = '') => {
    set({ loading: true, error: null });

    try {
      const response = await fetch(`${API_URL}/vouchers/${voucherId}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          reviewedBy,
          reviewComments: comments
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al revisar el voucher');
      }

      const updatedVoucher = await response.json();

      // Actualizar estado local
      set(state => ({
        vouchers: state.vouchers.map(v =>
          v.id === voucherId ? updatedVoucher : v
        ),
        loading: false
      }));

      return updatedVoucher;
    } catch (error) {
      set({
        loading: false,
        error: error.message
      });
      throw error;
    }
  },

  // Eliminar voucher
  deleteVoucher: async (voucherId) => {
    try {
      const response = await fetch(`${API_URL}/vouchers/${voucherId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al eliminar el voucher');
      }

      // Actualizar estado local
      set(state => ({
        vouchers: state.vouchers.filter(v => v.id !== voucherId)
      }));

      return true;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // Validar formato de número de operación
  validateOperationNumber: (operationNumber) => {
    // Validar que sea numérico y tenga longitud adecuada
    const cleanNumber = operationNumber.toString().replace(/\D/g, '');

    if (cleanNumber.length < 6) {
      return { valid: false, message: 'El número de operación debe tener al menos 6 dígitos' };
    }

    if (cleanNumber.length > 20) {
      return { valid: false, message: 'El número de operación no puede tener más de 20 dígitos' };
    }

    return { valid: true, message: '' };
  },

  // Obtener estadísticas de vouchers
  getVoucherStats: () => {
    const { vouchers } = get();

    return {
      total: vouchers.length,
      pending: vouchers.filter(v => v.status === 'pending').length,
      approved: vouchers.filter(v => v.status === 'approved').length,
      rejected: vouchers.filter(v => v.status === 'rejected').length
    };
  },

  // Utilidades
  clearError: () => set({ error: null }),

  clearProgress: () => set({ uploadProgress: 0 }),

  isLoading: () => get().loading,

  // Obtener vouchers por estado
  getVouchersByStatus: (status) => {
    const { vouchers } = get();
    return vouchers.filter(v => v.status === status);
  }
}));
