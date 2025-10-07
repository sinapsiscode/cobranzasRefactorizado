import React, { useState, useEffect, useRef } from 'react';
import { 
  Download, 
  Upload, 
  Trash2, 
  Shield, 
  HardDrive,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  RotateCcw
} from 'lucide-react';
import { useBackupStore } from '../../stores/backupStore';
import { useAuthStore } from '../../stores/authStore';

const BackupManagement = () => {
  const { user } = useAuthStore();
  const {
    backups,
    loading,
    error,
    lastBackupDate,
    generateBackup,
    downloadBackup,
    restoreBackup,
    uploadBackup,
    deleteBackup,
    clearError,
    getBackupStats,
    validateBackup
  } = useBackupStore();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const stats = getBackupStats();

  useEffect(() => {
    // Limpiar errores al montar el componente
    if (error) {
      clearError();
    }
  }, []);

  const handleGenerateBackup = async () => {
    try {
      const backup = await generateBackup();
      // Descargar automáticamente el backup en Excel
      if (backup) {
        handleDownloadBackup(backup.id);
      }
    } catch (error) {
      console.error('Error generating backup:', error);
    }
  };

  const handleDownloadBackup = (backupId) => {
    try {
      downloadBackup(backupId);
    } catch (error) {
      console.error('Error downloading backup:', error);
    }
  };

  const handleDeleteBackup = async () => {
    try {
      deleteBackup(selectedBackup.id);
      setShowDeleteModal(false);
      setSelectedBackup(null);
    } catch (error) {
      console.error('Error deleting backup:', error);
    }
  };

  const handleFileUpload = async (file) => {
    try {
      await uploadBackup(file);
    } catch (error) {
      console.error('Error uploading backup:', error);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const formatFileSize = (sizeKB) => {
    if (sizeKB < 1024) {
      return `${sizeKB} KB`;
    }
    return `${(sizeKB / 1024).toFixed(2)} MB`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeSince = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    } else {
      return 'hace menos de 1 hora';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Backups</h1>
        <p className="text-gray-600">Respaldos y restauración del sistema</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Backups</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Database className="h-8 w-8 text-blue-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tamaño Total</p>
              <p className="text-2xl font-bold text-green-600">{formatFileSize(stats.totalSize)}</p>
            </div>
            <HardDrive className="h-8 w-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Último Backup</p>
              <p className="text-sm font-bold text-purple-600">
                {stats.lastBackup ? getTimeSince(stats.lastBackup) : 'Nunca'}
              </p>
            </div>
            <Clock className="h-8 w-8 text-purple-400" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Estado</p>
              <p className="text-sm font-bold text-green-600">
                {loading ? 'Procesando...' : 'Listo'}
              </p>
            </div>
            <Shield className="h-8 w-8 text-green-400" />
          </div>
        </div>
      </div>

      {/* Payment Stats from Latest Backup */}
      {stats.latestBackupInfo && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg shadow border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Clientes (Último Backup)</p>
                <p className="text-2xl font-bold text-blue-900">{stats.latestBackupInfo.totalClients}</p>
              </div>
              <Database className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg shadow border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Clientes con Deuda</p>
                <p className="text-2xl font-bold text-red-900">{stats.latestBackupInfo.clientsWithDebt}</p>
                <p className="text-xs text-red-600">S/ {stats.latestBackupInfo.totalDebtAmount.toFixed(2)}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg shadow border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Clientes al Día</p>
                <p className="text-2xl font-bold text-green-900">{stats.latestBackupInfo.clientsPaid}</p>
                <p className="text-xs text-green-600">S/ {stats.latestBackupInfo.totalPaidAmount.toFixed(2)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex justify-between items-start">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Actions Section */}
      <div className="bg-white p-6 rounded-lg shadow border mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones</h2>
        
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Generate Backup */}
          <button
            onClick={handleGenerateBackup}
            disabled={loading}
            className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Database className="h-4 w-4" />
            <span>{loading ? 'Generando...' : 'Generar Backup'}</span>
          </button>

          {/* Upload Backup */}
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Upload className="h-4 w-4" />
              <span>Subir Backup</span>
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={(e) => {
                if (e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
                e.target.value = '';
              }}
              className="hidden"
            />
          </div>
        </div>

        {/* Drag & Drop Zone */}
        <div 
          className={`mt-4 p-8 border-2 border-dashed rounded-lg text-center transition-colors ${
            dragOver 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className={`mx-auto h-12 w-12 ${dragOver ? 'text-blue-400' : 'text-gray-400'} mb-3`} />
          <p className={`text-sm ${dragOver ? 'text-blue-600' : 'text-gray-600'}`}>
            {dragOver 
              ? 'Suelta el archivo aquí' 
              : 'Arrastra un archivo de backup aquí o haz clic en "Subir Backup"'
            }
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Solo archivos JSON de backup válidos
          </p>
        </div>
      </div>

      {/* Backup List */}
      <div className="bg-white rounded-lg shadow border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Historial de Backups</h2>
        </div>
        
        <div className="overflow-x-auto">
          {backups.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Database className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium">No hay backups disponibles</p>
              <p className="text-sm">Genera tu primer backup haciendo clic en el botón de arriba</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tamaño
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clientes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Con Deuda
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pagado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {backups.map((backup) => (
                  <tr key={backup.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {backup.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {backup.id.split('-').pop()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(backup.date)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {getTimeSince(backup.date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatFileSize(backup.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {backup.data?.metadata?.totalClients || backup.data?.metadata?.totalClients === 0 ? backup.data.metadata.totalClients : 'N/A'}
                      </div>
                      <div className="text-xs text-gray-500">Total</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-red-600">
                        {backup.data?.metadata?.clientsWithDebt || backup.data?.metadata?.clientsWithDebt === 0 ? backup.data.metadata.clientsWithDebt : 'N/A'}
                      </div>
                      {backup.data?.metadata?.totalDebtAmount !== undefined && (
                        <div className="text-xs text-gray-500">
                          S/ {backup.data.metadata.totalDebtAmount.toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-green-600">
                        {backup.data?.metadata?.clientsPaid || backup.data?.metadata?.clientsPaid === 0 ? backup.data.metadata.clientsPaid : 'N/A'}
                      </div>
                      {backup.data?.metadata?.totalPaidAmount !== undefined && (
                        <div className="text-xs text-gray-500">
                          S/ {backup.data.metadata.totalPaidAmount.toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {backup.status === 'completed' ? 'Completado' : backup.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleDownloadBackup(backup.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Descargar Excel"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('¿Está seguro de que desea restaurar este backup? Esta acción reemplazará todos los datos actuales.')) {
                              restoreBackup(backup.data);
                            }
                          }}
                          className="text-green-600 hover:text-green-900"
                          title="Restaurar"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedBackup(backup);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedBackup && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">
                Eliminar Backup
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  ¿Está seguro de que desea eliminar el backup "<strong>{selectedBackup.name}</strong>"?
                  Esta acción no se puede deshacer.
                </p>
              </div>
              <div className="items-center px-4 py-3 flex justify-center space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedBackup(null);
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteBackup}
                  className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md hover:bg-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <Shield className="h-5 w-5 text-blue-400 mt-0.5 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">
              Información sobre Backups
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Los backups incluyen todos los datos del sistema: clientes, pagos, cajas, servicios y configuraciones</li>
                <li>Se recomienda generar backups regularmente, especialmente antes de cambios importantes</li>
                <li>Los backups se almacenan localmente y pueden descargarse para almacenamiento externo</li>
                <li>La restauración reemplazará todos los datos actuales con los del backup seleccionado</li>
                <li>Se crea un backup automático antes de cada restauración como medida de seguridad</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupManagement;