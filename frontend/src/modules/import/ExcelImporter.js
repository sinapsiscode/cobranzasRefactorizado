// Módulo de importación de Excel
import * as XLSX from 'xlsx';
import { formatPeriod } from '../../services/mock/schemas/monthlyDebt';

// Mapeo de columnas del Excel a campos del sistema
const DEFAULT_COLUMN_MAPPING = {
  'ITEM': 'externalId',
  'APELLIDOS': 'apellidos',
  'NOMBRES': 'nombres',
  'DNI': 'dni',
  'CELULAR': 'phone',
  'COSTO MES': 'costoMensual',
  'COSTO DE INST': 'costoInstalacion',
  'DIRECCIÓN': 'neighborhood',
  'CONDICION': 'condicion',
  'REFERENCIA': 'referencia',
  'FEC_INST': 'installationDate',
  'OBSERVACIONES': 'observaciones'
};

// Convertir fecha de Excel a fecha JavaScript
const excelDateToJS = (excelDate) => {
  if (typeof excelDate === 'number') {
    // Excel almacena fechas como días desde 1900-01-01
    const excelEpoch = new Date(1900, 0, 1);
    const msPerDay = 24 * 60 * 60 * 1000;
    return new Date(excelEpoch.getTime() + (excelDate - 2) * msPerDay);
  }
  return new Date(excelDate);
};

// Detectar columnas de meses (números grandes como 45778)
const detectMonthColumns = (headers) => {
  const monthColumns = [];
  
  headers.forEach((header, index) => {
    if (typeof header === 'number' && header > 40000 && header < 50000) {
      const date = excelDateToJS(header);
      monthColumns.push({
        index,
        excelDate: header,
        date,
        period: formatPeriod(date.getFullYear(), date.getMonth() + 1)
      });
    }
  });
  
  return monthColumns;
};

// Parsear archivo Excel
export const parseExcelFile = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        // Obtener la primera hoja
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convertir a array con headers en la fila 1
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          reject(new Error('El archivo Excel está vacío o no tiene el formato esperado'));
          return;
        }
        
        // Identificar headers (segunda fila)
        const headers = jsonData[1];
        const monthColumns = detectMonthColumns(headers);
        
        // Procesar datos (desde la fila 3)
        const rows = [];
        for (let i = 2; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;
          
          const processedRow = {};
          
          // Mapear columnas regulares
          headers.forEach((header, index) => {
            if (header && typeof header === 'string') {
              processedRow[header] = row[index];
            }
          });
          
          // Procesar columnas de meses
          processedRow.monthlyDebts = [];
          monthColumns.forEach(monthCol => {
            const value = row[monthCol.index];
            if (value !== undefined && value !== null) {
              processedRow.monthlyDebts.push({
                period: monthCol.period,
                year: monthCol.date.getFullYear(),
                month: monthCol.date.getMonth() + 1,
                amount: parseFloat(value) || 0,
                isPaid: value === 0
              });
            }
          });
          
          rows.push(processedRow);
        }
        
        resolve({
          headers: headers.filter(h => typeof h === 'string'),
          monthColumns,
          rows,
          totalRows: rows.length
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

// Mapear datos del Excel al formato del sistema (permite campos null)
export const mapExcelToSystem = (excelRow, mapping = DEFAULT_COLUMN_MAPPING) => {
  const client = {
    // Datos básicos (permiten estar vacíos)
    fullName: `${excelRow.APELLIDOS || ''} ${excelRow.NOMBRES || ''}`.trim() || 'Sin nombre',
    dni: excelRow.DNI ? String(excelRow.DNI) : null,
    phone: excelRow.CELULAR ? String(excelRow.CELULAR) : null,
    neighborhood: excelRow['DIRECCIÓN'] || null,
    address: excelRow['DIRECCIÓN'] || null,
    
    // Estado basado en CONDICION (default active si no existe)
    status: excelRow.CONDICION === 'ACTIVO' ? 'active' : 
            excelRow.CONDICION === 'GRATUITO' ? 'active' : 
            'active', // Default active para poder editar después
    
    // Plan por defecto básico si no hay costo
    servicePlan: excelRow['COSTO MES'] && excelRow['COSTO MES'] <= 40 ? 'basic' : 
                 excelRow['COSTO MES'] && excelRow['COSTO MES'] <= 80 ? 'standard' : 
                 excelRow['COSTO MES'] && excelRow['COSTO MES'] > 80 ? 'premium' :
                 'basic', // Default basic
    
    // Fecha de instalación (default hoy si no existe)
    installationDate: excelRow.FEC_INST ? 
      excelDateToJS(excelRow.FEC_INST).toISOString() : 
      new Date().toISOString(),
    
    // Campos adicionales (permiten null)
    email: null,
    serviceType: 'cable', // Default
    isActive: true // Default activo para poder editar
  };
  
  // Datos extendidos (permiten estar vacíos)
  const extended = {
    apellidos: excelRow.APELLIDOS || null,
    nombres: excelRow.NOMBRES || null,
    costoMensual: excelRow['COSTO MES'] ? parseFloat(excelRow['COSTO MES']) : 0,
    costoInstalacion: excelRow['COSTO DE INST'] ? parseFloat(excelRow['COSTO DE INST']) : 0,
    referencia: excelRow.REFERENCIA || null,
    observaciones: excelRow.OBSERVACIONES || null,
    condicionOriginal: excelRow.CONDICION || null,
    tipoTarifa: excelRow.CONDICION === 'GRATUITO' ? 'gratuitous' : 
                excelRow['COSTO MES'] && excelRow['COSTO MES'] <= 40 ? 'legacy' : 
                'standard',
    importedFrom: 'excel',
    importDate: new Date().toISOString()
  };
  
  // Deudas mensuales
  const monthlyDebts = (excelRow.monthlyDebts || []).map(debt => ({
    year: debt.year,
    month: debt.month,
    period: debt.period,
    amountDue: debt.amount,
    amountPaid: debt.isPaid ? debt.amount : 0,
    status: debt.isPaid ? 'paid' : 
            debt.amount > 0 ? 'overdue' : 
            'pending',
    dueDate: new Date(debt.year, debt.month - 1, 10).toISOString()
  }));
  
  return {
    client,
    extended,
    monthlyDebts
  };
};

// Validar datos antes de importar (validaciones mínimas)
export const validateImportData = (rows) => {
  const warnings = [];
  const dniSet = new Set();
  const duplicatedDNIs = new Set();
  
  rows.forEach((row, index) => {
    // Solo advertir sobre DNIs duplicados (no bloquear)
    if (row.DNI) {
      if (dniSet.has(row.DNI)) {
        duplicatedDNIs.add(row.DNI);
        warnings.push(`Fila ${index + 3}: DNI duplicado (${row.DNI}) - se importará pero revísalo después`);
      } else {
        dniSet.add(row.DNI);
      }
    }
    
    // Advertencias informativas (no bloquean)
    if (!row.DNI) {
      warnings.push(`Fila ${index + 3}: DNI faltante - se puede editar después`);
    }
    
    if (!row.APELLIDOS && !row.NOMBRES) {
      warnings.push(`Fila ${index + 3}: Nombre faltante - se puede editar después`);
    }
    
    if (!row.CELULAR) {
      warnings.push(`Fila ${index + 3}: Teléfono faltante - se puede editar después`);
    }
    
    const costo = parseFloat(row['COSTO MES']);
    if (isNaN(costo) || costo < 0) {
      warnings.push(`Fila ${index + 3}: Costo mensual inválido - se usará 0`);
    }
  });
  
  return {
    isValid: true, // Siempre válido, solo advertencias
    errors: [], // Sin errores que bloqueen
    warnings,
    summary: {
      totalRows: rows.length,
      errorCount: 0, // Sin errores
      warningCount: warnings.length,
      uniqueDNIs: dniSet.size,
      duplicatedDNIs: duplicatedDNIs.size
    }
  };
};

// Procesar importación en lotes
export const processBatchImport = async (rows, options = {}) => {
  const { 
    batchSize = 10, 
    onProgress = () => {},
    onError = () => {},
    mapping = DEFAULT_COLUMN_MAPPING 
  } = options;
  
  const results = {
    successful: [],
    failed: [],
    skipped: []
  };
  
  const totalBatches = Math.ceil(rows.length / batchSize);
  
  for (let i = 0; i < totalBatches; i++) {
    const start = i * batchSize;
    const end = Math.min(start + batchSize, rows.length);
    const batch = rows.slice(start, end);
    
    for (const row of batch) {
      try {
        const mapped = mapExcelToSystem(row, mapping);
        results.successful.push(mapped);
      } catch (error) {
        results.failed.push({ row, error: error.message });
        onError(row, error);
      }
    }
    
    // Reportar progreso
    const progress = ((i + 1) / totalBatches) * 100;
    onProgress(progress, results);
  }
  
  return results;
};

export default {
  parseExcelFile,
  mapExcelToSystem,
  validateImportData,
  processBatchImport
};