import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientStore } from '../../stores/clientStore';
import { useClientExtendedStore } from '../../stores/clientExtendedStore';
import { useMonthlyDebtStore } from '../../stores/monthlyDebtStore';
import { useNotificationStore } from '../../stores/notificationStore';
import { 
  parseExcelFile, 
  validateImportData, 
  processBatchImport 
} from '../../modules/import/ExcelImporter';
import { 
  Upload, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Download,
  Eye,
  Import,
  Users,
  DollarSign,
  Calendar
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const ImportClients = () => {
  const navigate = useNavigate();
  const { createClient, fetchClient } = useClientStore();
  const { bulkSetExtendedData } = useClientExtendedStore();
  const { bulkAddDebts } = useMonthlyDebtStore();
  const { success, error: showError, warning } = useNotificationStore();
  
  // Estados
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [validation, setValidation] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  
  // Manejar selección de archivo
  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      showError('Por favor seleccione un archivo Excel (.xlsx o .xls)');
      return;
    }
    
    setFile(selectedFile);
    setImportResults(null);
    
    try {
      // Parsear archivo
      const data = await parseExcelFile(selectedFile);
      setParsedData(data);
      
      // Validar datos
      const validationResult = validateImportData(data.rows);
      setValidation(validationResult);
      
      // Seleccionar todas las filas por defecto
      setSelectedRows(data.rows.map((_, index) => index));
      
      if (validationResult.warnings.length > 0) {
        warning(`Se encontraron ${validationResult.warnings.length} advertencias - se puede importar igualmente`);
      } else {
        success('Archivo validado correctamente');
      }
      
      setShowPreview(true);
    } catch (error) {
      showError('Error al procesar el archivo: ' + error.message);
      setParsedData(null);
      setValidation(null);
    }
  };
  
  // Importar datos
  const handleImport = async () => {
    if (!parsedData) {
      showError('No hay datos para importar');
      return;
    }
    
    setImporting(true);
    setImportProgress(0);
    
    try {
      // Filtrar solo las filas seleccionadas
      const rowsToImport = parsedData.rows.filter((_, index) => 
        selectedRows.includes(index)
      );
      
      // Procesar importación
      const results = await processBatchImport(rowsToImport, {
        batchSize: 5,
        onProgress: (progress) => {
          setImportProgress(progress);
        },
        onError: (row, error) => {
          console.error('Error importando fila:', row, error);
        }
      });
      
      // Guardar datos en los stores
      const extendedDataArray = [];
      const allDebts = [];
      const createdClients = [];
      
      for (const item of results.successful) {
        try {
          // Crear cliente
          const newClient = await createClient(item.client);
          createdClients.push(newClient);
          
          // Preparar datos extendidos
          extendedDataArray.push({
            ...item.extended,
            clientId: newClient.id
          });
          
          // Preparar deudas mensuales
          item.monthlyDebts.forEach(debt => {
            allDebts.push({
              ...debt,
              clientId: newClient.id
            });
          });
        } catch (error) {
          results.failed.push({ 
            row: item.client, 
            error: error.message 
          });
        }
      }
      
      // Guardar datos extendidos y deudas en lote
      if (extendedDataArray.length > 0) {
        bulkSetExtendedData(extendedDataArray);
      }
      
      if (allDebts.length > 0) {
        bulkAddDebts(allDebts);
      }
      
      // Guardar resultados
      setImportResults({
        successful: createdClients.length,
        failed: results.failed.length,
        total: rowsToImport.length,
        clients: createdClients,
        errors: results.failed
      });
      
      // Notificar resultado
      if (createdClients.length > 0) {
        success(`Se importaron ${createdClients.length} clientes correctamente`);
      }
      
      if (results.failed.length > 0) {
        warning(`${results.failed.length} registros no se pudieron importar`);
      }
      
    } catch (error) {
      showError('Error durante la importación: ' + error.message);
    } finally {
      setImporting(false);
      setImportProgress(100);
    }
  };
  
  // Descargar plantilla
  const handleDownloadTemplate = () => {
    // Crear plantilla de ejemplo
    const template = [
      ['REGISTRO DE ABONADOS'],
      ['ITEM', 'APELLIDOS', 'NOMBRES', 'DNI', 'CELULAR', 'COSTO MES', 'COSTO DE INST', 'DIRECCIÓN', 'CONDICION', 'REFERENCIA', 'FEC_INST', 'OBSERVACIONES'],
      [1, 'García', 'Juan', '12345678', '987654321', 40, 50, 'BARRIO CENTRO', 'ACTIVO', 'Casa esquina', '2024-01-01', '']
    ];
    
    // Implementar descarga de plantilla
    warning('Función de descarga de plantilla en desarrollo');
  };
  
  // Toggle selección de fila
  const toggleRowSelection = (index) => {
    setSelectedRows(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };
  
  // Seleccionar/deseleccionar todas
  const toggleSelectAll = () => {
    if (selectedRows.length === parsedData?.rows.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(parsedData.rows.map((_, index) => index));
    }
  };
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Importar Clientes desde Excel</h1>
        <p className="text-gray-600 mt-2">
          Carga masiva de clientes desde archivo Excel con datos extendidos y deudas mensuales
        </p>
      </div>
      
      {/* Zona de carga de archivo */}
      {!parsedData && (
        <div className="bg-white rounded-lg shadow p-8">
          <div className="max-w-2xl mx-auto">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <FileSpreadsheet className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Seleccionar archivo Excel
              </h3>
              
              <p className="text-sm text-gray-500 mb-6">
                Formatos soportados: .xlsx, .xls
              </p>
              
              <div className="flex justify-center space-x-4">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <span className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-blue-600">
                    <Upload className="h-5 w-5 mr-2" />
                    Cargar archivo
                  </span>
                </label>
                
                <button
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Descargar plantilla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Resultados de validación */}
      {validation && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Validación del archivo</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Total de filas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {validation.summary.totalRows}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">DNIs únicos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {validation.summary.uniqueDNIs}
                  </p>
                </div>
              </div>
            </div>
            
            <div className={`${validation.errors.length > 0 ? 'bg-red-50' : 'bg-gray-50'} p-4 rounded-lg`}>
              <div className="flex items-center">
                <XCircle className={`h-8 w-8 ${validation.errors.length > 0 ? 'text-red-600' : 'text-gray-400'} mr-3`} />
                <div>
                  <p className="text-sm text-gray-600">Errores</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {validation.summary.errorCount}
                  </p>
                </div>
              </div>
            </div>
            
            <div className={`${validation.warnings.length > 0 ? 'bg-yellow-50' : 'bg-gray-50'} p-4 rounded-lg`}>
              <div className="flex items-center">
                <AlertCircle className={`h-8 w-8 ${validation.warnings.length > 0 ? 'text-yellow-600' : 'text-gray-400'} mr-3`} />
                <div>
                  <p className="text-sm text-gray-600">Advertencias</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {validation.summary.warningCount}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mostrar errores */}
          {validation.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-red-900 mb-2">Errores encontrados:</h4>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {validation.errors.slice(0, 5).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
                {validation.errors.length > 5 && (
                  <li>... y {validation.errors.length - 5} errores más</li>
                )}
              </ul>
            </div>
          )}
          
          {/* Mostrar advertencias */}
          {validation.warnings.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">Advertencias:</h4>
              <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                {validation.warnings.slice(0, 5).map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
                {validation.warnings.length > 5 && (
                  <li>... y {validation.warnings.length - 5} advertencias más</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {/* Vista previa de datos */}
      {showPreview && parsedData && (
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Vista previa de datos ({selectedRows.length} seleccionados)
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={toggleSelectAll}
                  className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                >
                  {selectedRows.length === parsedData.rows.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
                </button>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <Eye className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <input
                        type="checkbox"
                        checked={selectedRows.length === parsedData.rows.length}
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Apellidos
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Nombres
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      DNI
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Celular
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Costo/Mes
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Barrio
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Condición
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Deudas
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {parsedData.rows.slice(0, 10).map((row, index) => (
                    <tr key={index} className={selectedRows.includes(index) ? 'bg-blue-50' : ''}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(index)}
                          onChange={() => toggleRowSelection(index)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {row.APELLIDOS}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {row.NOMBRES}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {row.DNI}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {row.CELULAR}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        S/. {row['COSTO MES']}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {row['DIRECCIÓN']}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          row.CONDICION === 'ACTIVO' ? 'bg-green-100 text-green-800' :
                          row.CONDICION === 'GRATUITO' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {row.CONDICION}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {row.monthlyDebts?.filter(d => !d.isPaid).length || 0} meses
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {parsedData.rows.length > 10 && (
                <div className="px-4 py-3 bg-gray-50 text-center text-sm text-gray-600">
                  Mostrando 10 de {parsedData.rows.length} registros
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Progreso de importación */}
      {importing && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Importando datos...</h3>
          <div className="space-y-4">
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                    En progreso
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-blue-600">
                    {Math.round(importProgress)}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                <div 
                  style={{ width: `${importProgress}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-500"
                />
              </div>
            </div>
            <LoadingSpinner text="Procesando registros..." />
          </div>
        </div>
      )}
      
      {/* Resultados de importación */}
      {importResults && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Resultados de la importación</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Importados</p>
                  <p className="text-2xl font-bold text-green-600">
                    {importResults.successful}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Fallidos</p>
                  <p className="text-2xl font-bold text-red-600">
                    {importResults.failed}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-600">Total procesados</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {importResults.total}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {importResults.errors?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">Errores de importación:</h4>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {importResults.errors.slice(0, 5).map((error, index) => (
                  <li key={index}>
                    {error.row?.APELLIDOS} {error.row?.NOMBRES}: {error.error}
                  </li>
                ))}
                {importResults.errors.length > 5 && (
                  <li>... y {importResults.errors.length - 5} errores más</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {/* Botones de acción */}
      <div className="flex justify-between">
        <button
          onClick={() => navigate('/admin/clients')}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Volver a clientes
        </button>
        
        <div className="space-x-4">
          {parsedData && !importResults && (
            <>
              <button
                onClick={() => {
                  setParsedData(null);
                  setValidation(null);
                  setFile(null);
                  setSelectedRows([]);
                }}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancelar
              </button>
              
              <button
                onClick={handleImport}
                disabled={selectedRows.length === 0 || importing}
                className="px-6 py-3 bg-primary text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Import className="inline h-5 w-5 mr-2" />
                Importar {selectedRows.length} registros
              </button>
            </>
          )}
          
          {importResults && (
            <button
              onClick={() => {
                setParsedData(null);
                setValidation(null);
                setFile(null);
                setImportResults(null);
                setSelectedRows([]);
              }}
              className="px-6 py-3 bg-primary text-white rounded-md hover:bg-blue-600"
            >
              Nueva importación
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportClients;