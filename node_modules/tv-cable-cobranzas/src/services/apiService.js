// Servicio centralizado para todas las llamadas a la API

import { API_URLS, REQUEST_CONFIG, handleAPIResponse, buildURL, clearAuthData } from '../config/api.js'

// Clase principal del servicio API
class APIService {

  // Método genérico para hacer requests
  async request(url, options = {}) {
    try {
      const response = await fetch(url, {
        ...REQUEST_CONFIG.WITH_AUTH(),
        ...options,
        headers: {
          ...REQUEST_CONFIG.WITH_AUTH().headers,
          ...options.headers,
        },
      })

      return await handleAPIResponse(response)
    } catch (error) {
      // Si es error 401, limpiar datos de auth y redirigir a login
      if (error.message.includes('401') || error.message.includes('Token')) {
        clearAuthData()
        window.location.href = '/login'
        throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.')
      }

      throw error
    }
  }

  // === AUTHENTICATION ===

  async login(credentials) {
    const response = await fetch(API_URLS.AUTH.LOGIN, {
      method: 'POST',
      ...REQUEST_CONFIG.DEFAULT,
      body: JSON.stringify(credentials),
    })

    return await handleAPIResponse(response)
  }

  async logout() {
    try {
      await fetch(API_URLS.AUTH.LOGOUT, {
        method: 'POST',
        ...REQUEST_CONFIG.WITH_AUTH(),
      })
    } catch (error) {
      // Ignorar errores de logout
      console.warn('Error en logout:', error)
    } finally {
      clearAuthData()
    }
  }

  async validateToken() {
    const response = await fetch(API_URLS.AUTH.VALIDATE, {
      method: 'POST',
      ...REQUEST_CONFIG.WITH_AUTH(),
    })

    return await handleAPIResponse(response)
  }

  // === CLIENTS ===

  async getClients(params = {}) {
    const url = buildURL(API_URLS.CLIENTS, params)
    return await this.request(url)
  }

  async getClient(id) {
    return await this.request(`${API_URLS.CLIENTS}/${id}`)
  }

  async createClient(clientData) {
    return await this.request(API_URLS.CLIENTS, {
      method: 'POST',
      body: JSON.stringify(clientData),
    })
  }

  async updateClient(id, updates) {
    return await this.request(`${API_URLS.CLIENTS}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  async deleteClient(id) {
    return await this.request(`${API_URLS.CLIENTS}/${id}`, {
      method: 'DELETE',
    })
  }

  // === PAYMENTS ===

  async getPayments(params = {}) {
    const url = buildURL(API_URLS.PAYMENTS, params)
    return await this.request(url)
  }

  async getPayment(id) {
    return await this.request(`${API_URLS.PAYMENTS}/${id}`)
  }

  async createPayment(paymentData) {
    return await this.request(API_URLS.PAYMENTS, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    })
  }

  async updatePayment(id, updates) {
    return await this.request(`${API_URLS.PAYMENTS}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  async deletePayment(id) {
    return await this.request(`${API_URLS.PAYMENTS}/${id}`, {
      method: 'DELETE',
    })
  }

  // === USERS ===

  async getUsers(params = {}) {
    const url = buildURL(API_URLS.USERS, params)
    return await this.request(url)
  }

  async getUser(id) {
    return await this.request(`${API_URLS.USERS}/${id}`)
  }

  async createUser(userData) {
    return await this.request(API_URLS.USERS, {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async updateUser(id, updates) {
    return await this.request(`${API_URLS.USERS}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  async deleteUser(id) {
    return await this.request(`${API_URLS.USERS}/${id}`, {
      method: 'DELETE',
    })
  }

  // === SERVICES ===

  async getServices() {
    return await this.request(API_URLS.SERVICES)
  }

  async getService(id) {
    return await this.request(`${API_URLS.SERVICES}/${id}`)
  }

  async createService(serviceData) {
    return await this.request(API_URLS.SERVICES, {
      method: 'POST',
      body: JSON.stringify(serviceData),
    })
  }

  async updateService(id, updates) {
    return await this.request(`${API_URLS.SERVICES}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  async deleteService(id) {
    return await this.request(`${API_URLS.SERVICES}/${id}`, {
      method: 'DELETE',
    })
  }

  // === CASHBOXES ===

  async getCashboxes(params = {}) {
    const url = buildURL(API_URLS.CASHBOXES, params)
    return await this.request(url)
  }

  async getCashbox(id) {
    return await this.request(`${API_URLS.CASHBOXES}/${id}`)
  }

  async createCashbox(cashboxData) {
    return await this.request(API_URLS.CASHBOXES, {
      method: 'POST',
      body: JSON.stringify(cashboxData),
    })
  }

  async updateCashbox(id, updates) {
    return await this.request(`${API_URLS.CASHBOXES}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  async deleteCashbox(id) {
    return await this.request(`${API_URLS.CASHBOXES}/${id}`, {
      method: 'DELETE',
    })
  }

  // === NOTIFICATIONS ===

  async getNotifications(params = {}) {
    const url = buildURL(API_URLS.NOTIFICATIONS, params)
    return await this.request(url)
  }

  async createNotification(notificationData) {
    return await this.request(API_URLS.NOTIFICATIONS, {
      method: 'POST',
      body: JSON.stringify(notificationData),
    })
  }

  async markNotificationAsRead(id) {
    return await this.request(`${API_URLS.NOTIFICATIONS}/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ isRead: true }),
    })
  }

  async deleteNotification(id) {
    return await this.request(`${API_URLS.NOTIFICATIONS}/${id}`, {
      method: 'DELETE',
    })
  }

  // === VOUCHERS ===

  async getVouchers(params = {}) {
    const url = buildURL(API_URLS.VOUCHERS, params)
    return await this.request(url)
  }

  async createVoucher(voucherData) {
    return await this.request(API_URLS.VOUCHERS, {
      method: 'POST',
      body: JSON.stringify(voucherData),
    })
  }

  // === MONTHLY DEBTS ===

  async getMonthlyDebts(params = {}) {
    const url = buildURL(API_URLS.MONTHLY_DEBTS, params)
    return await this.request(url)
  }

  async createMonthlyDebt(debtData) {
    return await this.request(API_URLS.MONTHLY_DEBTS, {
      method: 'POST',
      body: JSON.stringify(debtData),
    })
  }

  async updateMonthlyDebt(id, updates) {
    return await this.request(`${API_URLS.MONTHLY_DEBTS}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  }

  // === NEIGHBORHOODS ===

  async getNeighborhoods() {
    return await this.request(API_URLS.NEIGHBORHOODS)
  }

  // === DASHBOARD ===

  async getDashboardStats() {
    return await this.request(API_URLS.DASHBOARD_STATS)
  }

  // === HEALTH CHECK ===

  async checkHealth() {
    const response = await fetch(API_URLS.HEALTH, REQUEST_CONFIG.DEFAULT)
    return await handleAPIResponse(response)
  }

  // === UTILITY METHODS ===

  // Método para subir archivos
  async uploadFile(endpoint, file, additionalData = {}) {
    const formData = new FormData()
    formData.append('file', file)

    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value)
    })

    return await this.request(endpoint, {
      method: 'POST',
      body: formData,
      headers: {
        // No incluir Content-Type, dejamos que el browser lo maneje para FormData
        ...REQUEST_CONFIG.MULTIPART().headers,
        'Content-Type': undefined,
      },
    })
  }

  // Método para búsqueda genérica
  async search(resource, query, params = {}) {
    const searchParams = {
      q: query,
      ...params,
    }

    const url = buildURL(API_URLS[resource.toUpperCase()], searchParams)
    return await this.request(url)
  }

  // Método para obtener estadísticas de cualquier recurso
  async getResourceStats(resource) {
    return await this.request(`${API_URLS[resource.toUpperCase()]}/stats`)
  }
}

// Instancia singleton del servicio
const apiService = new APIService()

export default apiService

// También exportar métodos individuales para compatibilidad
export const {
  login,
  logout,
  validateToken,
  getClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
  getPayments,
  getPayment,
  createPayment,
  updatePayment,
  deletePayment,
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getServices,
  getCashboxes,
  getNotifications,
  getVouchers,
  getMonthlyDebts,
  getNeighborhoods,
  getDashboardStats,
  checkHealth,
} = apiService