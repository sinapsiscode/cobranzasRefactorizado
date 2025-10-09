// Base de datos simulada con localStorage
const DB_PREFIX = 'tv-cable';
const DB_VERSION = '2.1'; // CLIENT-1 CON 5 MESES PENDING PARA SUBIR MÚLTIPLES VOUCHERS

// Utilidades de almacenamiento
export class MockDB {
  constructor() {
    this.init().catch(error => {
      console.error('Error inicializando base de datos:', error);
    });
  }

  async init() {
    // FORZAR REGENERACIÓN SIEMPRE HASTA QUE CLIENT-1 TENGA 5 MESES PENDING
    console.log('=== FORZANDO REGENERACIÓN DE DATOS ===');
    console.log('=== LIMPIANDO TODO EL LOCALSTORAGE ===');
    this.clearAllData();
    // Limpiar también otras claves
    localStorage.removeItem('tv-cable:seedVersion');
    localStorage.setItem(`${DB_PREFIX}:version`, DB_VERSION);
    await this.initializeCollections();
    console.log('=== DATOS REGENERADOS ===');
  }

  clearAllData() {
    // Limpiar todos los datos relacionados con la DB
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(DB_PREFIX + ':')) {
        localStorage.removeItem(key);
      }
    });
  }

  async initializeCollections() {
    const collections = ['users', 'clients', 'payments', 'notifications', 'paymentMethods'];
    collections.forEach(collection => {
      if (!this.getCollection(collection)) {
        this.setCollection(collection, []);
      }
    });

    // Poblar con datos del seeder si las colecciones están vacías
    const clients = this.getCollection('clients') || [];
    if (clients.length === 0) {
      console.log('=== POBLANDO BASE DE DATOS CON SEEDER ===');
      try {
        const { seedDatabase } = await import('./seeder.js');
        await seedDatabase();
        console.log('=== SEEDER COMPLETADO ===');
      } catch (error) {
        console.error('Error ejecutando seeder:', error);
      }
    }
  }

  // Obtener colección completa
  getCollection(name) {
    try {
      const data = localStorage.getItem(`${DB_PREFIX}:${name}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error reading collection ${name}:`, error);
      return null;
    }
  }

  // Guardar colección completa
  setCollection(name, data) {
    try {
      localStorage.setItem(`${DB_PREFIX}:${name}`, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Error saving collection ${name}:`, error);
      return false;
    }
  }

  // Operaciones CRUD genéricas
  
  // Crear registro
  create(collection, data) {
    const items = this.getCollection(collection) || [];
    const newItem = {
      ...data,
      id: data.id || this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    items.push(newItem);
    this.setCollection(collection, items);
    return newItem;
  }

  // Leer todos los registros
  readAll(collection, filters = {}) {
    const items = this.getCollection(collection) || [];
    return this.applyFilters(items, filters);
  }

  // Leer por ID
  readById(collection, id) {
    const items = this.getCollection(collection) || [];
    return items.find(item => item.id === id) || null;
  }

  // Actualizar registro
  update(collection, id, updates) {
    const items = this.getCollection(collection) || [];
    const index = items.findIndex(item => item.id === id);
    
    if (index === -1) return null;
    
    items[index] = {
      ...items[index],
      ...updates,
      id, // Preservar ID original
      updatedAt: new Date().toISOString()
    };
    
    this.setCollection(collection, items);
    return items[index];
  }

  // Eliminar registro
  delete(collection, id) {
    const items = this.getCollection(collection) || [];
    const filteredItems = items.filter(item => item.id !== id);
    
    if (items.length === filteredItems.length) return false;
    
    this.setCollection(collection, filteredItems);
    return true;
  }

  // Aplicar filtros
  applyFilters(items, filters) {
    return items.filter(item => {
      return Object.entries(filters).every(([key, value]) => {
        if (value === null || value === undefined || value === '') return true;
        
        // Filtro por array de valores
        if (Array.isArray(value)) {
          return value.includes(item[key]);
        }
        
        // Filtro por texto (case insensitive)
        if (typeof value === 'string' && typeof item[key] === 'string') {
          return item[key].toLowerCase().includes(value.toLowerCase());
        }
        
        // Filtro exacto
        return item[key] === value;
      });
    });
  }

  // Buscar por texto en múltiples campos
  search(collection, searchTerm, fields = []) {
    const items = this.getCollection(collection) || [];
    
    if (!searchTerm) return items;
    
    const term = searchTerm.toLowerCase();
    
    return items.filter(item => {
      return fields.some(field => {
        const value = item[field];
        return value && value.toString().toLowerCase().includes(term);
      });
    });
  }

  // Paginación
  paginate(items, page = 1, limit = 25) {
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return {
      items: items.slice(start, end),
      pagination: {
        page,
        limit,
        total: items.length,
        pages: Math.ceil(items.length / limit),
        hasNext: end < items.length,
        hasPrev: page > 1
      }
    };
  }

  // Ordenamiento
  sort(items, sortBy, sortOrder = 'asc') {
    return [...items].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      // Manejar fechas
      if (typeof aVal === 'string' && aVal.match(/^\d{4}-\d{2}-\d{2}/)) {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }
      
      // Manejar números
      if (typeof aVal === 'string' && !isNaN(aVal)) {
        aVal = parseFloat(aVal);
        bVal = parseFloat(bVal);
      }
      
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Generar ID único
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Limpiar base de datos
  clear() {
    Object.keys(localStorage)
      .filter(key => key.startsWith(`${DB_PREFIX}:`))
      .forEach(key => localStorage.removeItem(key));
  }

  // Obtener estadísticas de almacenamiento
  getStats() {
    const collections = ['users', 'clients', 'payments', 'notifications', 'paymentMethods'];
    const stats = {};

    collections.forEach(collection => {
      const items = this.getCollection(collection) || [];
      stats[collection] = items.length;
    });

    return {
      ...stats,
      version: localStorage.getItem(`${DB_PREFIX}:version`),
      totalRecords: Object.values(stats).reduce((sum, count) => sum + count, 0)
    };
  }
}

// Instancia singleton
export const db = new MockDB();