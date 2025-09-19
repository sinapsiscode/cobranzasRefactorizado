import React, { useState, useEffect } from 'react';
import { useNotificationStore } from '../../stores/notificationStore';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Mail, 
  Shield, 
  Database,
  Building,
  Globe,
  Save,
  Key,
  User,
  Clock,
  DollarSign,
  FileText,
  Download,
  Upload,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Info,
  Smartphone,
  Monitor,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Palette,
  Calendar,
  CreditCard,
  Lock,
  Unlock,
  RefreshCw,
  Server,
  HardDrive,
  Activity,
  ChevronDown,
  ChevronRight,
  CheckCircle
} from 'lucide-react';

const Settings = () => {
  const { success, error: showError, info } = useNotificationStore();
  const [activeSection, setActiveSection] = useState('company');
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [expandedTemplates, setExpandedTemplates] = useState({
    welcome: false,
    paymentReminder: false,
    overdueNotice: false,
    paymentConfirmation: false,
    serviceDisconnection: false,
    serviceReactivation: false,
    planChange: false
  });
  
  // Estados para cada sección
  const [companySettings, setCompanySettings] = useState({
    name: 'TV Cable Perú S.A.C.',
    ruc: '20123456789',
    address: 'Av. Javier Prado Este 1234, San Isidro, Lima',
    phone: '+51 1 234 5678',
    email: 'info@tvcableperu.com',
    website: 'www.tvcableperu.com',
    logo: null
  });

  const [systemSettings, setSystemSettings] = useState({
    currency: 'PEN',
    dateFormat: 'DD/MM/YYYY',
    timeZone: 'America/Lima',
    language: 'es',
    fiscalYear: 'calendar',
    paymentDueDays: 5,
    lateFeePercentage: 2,
    gracePeriodDays: 3,
    maxLoginAttempts: 3,
    sessionTimeout: 30,
    autoBackup: true,
    backupTime: '02:00',
    maintenanceMode: false
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailEnabled: true,
    whatsappEnabled: true,
    paymentReminders: true,
    reminderDaysBefore: 3,
    overdueNotifications: true,
    overdueDaysAfter: 1,
    newClientWelcome: true,
    paymentConfirmation: true,
    monthlyReports: true,
    reportDay: 1,
    notificationSound: true,
    desktopNotifications: true
  });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    passwordComplexity: 'medium',
    passwordExpiration: 90,
    sessionManagement: true,
    ipRestriction: false,
    allowedIPs: '',
    auditLog: true,
    dataEncryption: true,
    backupEncryption: true,
    sslRequired: true,
    apiRateLimit: 100,
    bruteForceProtection: true
  });

  const [emailTemplates, setEmailTemplates] = useState({
    paymentReminder: {
      subject: 'Recordatorio de Pago - TV Cable',
      body: 'Estimado {cliente_nombre},\n\nLe recordamos que su pago de S/ {monto} vence el {fecha_vencimiento}.\n\nPuede realizar su pago a través de los siguientes medios:\n- Transferencia bancaria\n- Depósito en cuenta\n- Pago en línea\n\nGracias por su preferencia.\n\nTV Cable Perú'
    },
    overdueNotice: {
      subject: 'Aviso de Pago Vencido - TV Cable',
      body: 'Estimado {cliente_nombre},\n\nSu pago de S/ {monto} venció el {fecha_vencimiento}.\n\nPor favor regularice su situación para evitar el corte del servicio.\n\nTV Cable Perú'
    },
    paymentConfirmation: {
      subject: 'Confirmación de Pago - TV Cable',
      body: 'Estimado {cliente_nombre},\n\nHemos recibido su pago de S/ {monto}.\n\nNúmero de operación: {numero_operacion}\nFecha: {fecha_pago}\n\nGracias por su pago puntual.\n\nTV Cable Perú'
    }
  });

  const [backupSettings, setBackupSettings] = useState({
    autoBackup: true,
    backupFrequency: 'daily',
    backupTime: '02:00',
    backupRetention: 30,
    backupLocation: 'local',
    cloudBackup: false,
    cloudProvider: '',
    lastBackup: '2024-08-20 02:00:00',
    backupSize: '125 MB',
    backupHistory: [
      { date: '2024-08-20 02:00:00', size: '125 MB', status: 'success' },
      { date: '2024-08-19 02:00:00', size: '124 MB', status: 'success' },
      { date: '2024-08-18 02:00:00', size: '123 MB', status: 'success' }
    ]
  });

  // Función para guardar cambios
  const handleSave = () => {
    // Aquí se guardarían los cambios en el backend
    success('Configuración guardada exitosamente');
    setUnsavedChanges(false);
  };

  // Función para cancelar cambios
  const handleCancel = () => {
    if (unsavedChanges) {
      if (window.confirm('¿Descartar los cambios no guardados?')) {
        // Recargar configuración original
        setUnsavedChanges(false);
        info('Cambios descartados');
      }
    }
  };

  // Función para alternar expansión de plantillas
  const toggleTemplate = (templateKey) => {
    setExpandedTemplates(prev => ({
      ...prev,
      [templateKey]: !prev[templateKey]
    }));
  };

  // Renderizar sección de empresa
  const renderCompanySection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Información de la Empresa</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la Empresa
            </label>
            <input
              type="text"
              value={companySettings.name}
              onChange={(e) => {
                setCompanySettings({...companySettings, name: e.target.value});
                setUnsavedChanges(true);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              RUC
            </label>
            <input
              type="text"
              value={companySettings.ruc}
              onChange={(e) => {
                setCompanySettings({...companySettings, ruc: e.target.value});
                setUnsavedChanges(true);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección
            </label>
            <input
              type="text"
              value={companySettings.address}
              onChange={(e) => {
                setCompanySettings({...companySettings, address: e.target.value});
                setUnsavedChanges(true);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              value={companySettings.phone}
              onChange={(e) => {
                setCompanySettings({...companySettings, phone: e.target.value});
                setUnsavedChanges(true);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={companySettings.email}
              onChange={(e) => {
                setCompanySettings({...companySettings, email: e.target.value});
                setUnsavedChanges(true);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sitio Web
            </label>
            <input
              type="url"
              value={companySettings.website}
              onChange={(e) => {
                setCompanySettings({...companySettings, website: e.target.value});
                setUnsavedChanges(true);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo de la Empresa
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                <Building className="h-12 w-12 text-gray-400" />
              </div>
              <button className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cambiar Logo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Renderizar sección del sistema
  const renderSystemSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Configuración General</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Moneda
            </label>
            <select
              value={systemSettings.currency}
              onChange={(e) => {
                setSystemSettings({...systemSettings, currency: e.target.value});
                setUnsavedChanges(true);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="PEN">Soles (S/)</option>
              <option value="USD">Dólares ($)</option>
              <option value="EUR">Euros (€)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Formato de Fecha
            </label>
            <select
              value={systemSettings.dateFormat}
              onChange={(e) => {
                setSystemSettings({...systemSettings, dateFormat: e.target.value});
                setUnsavedChanges(true);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zona Horaria
            </label>
            <select
              value={systemSettings.timeZone}
              onChange={(e) => {
                setSystemSettings({...systemSettings, timeZone: e.target.value});
                setUnsavedChanges(true);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="America/Lima">Lima (UTC-5)</option>
              <option value="America/Bogota">Bogotá (UTC-5)</option>
              <option value="America/Mexico_City">Ciudad de México (UTC-6)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Idioma
            </label>
            <select
              value={systemSettings.language}
              onChange={(e) => {
                setSystemSettings({...systemSettings, language: e.target.value});
                setUnsavedChanges(true);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="pt">Português</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Configuración de Pagos</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Días para Vencimiento
            </label>
            <input
              type="number"
              value={systemSettings.paymentDueDays}
              onChange={(e) => {
                setSystemSettings({...systemSettings, paymentDueDays: e.target.value});
                setUnsavedChanges(true);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="text-xs text-gray-500 mt-1">Días después del corte para el vencimiento</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Porcentaje de Mora (%)
            </label>
            <input
              type="number"
              value={systemSettings.lateFeePercentage}
              onChange={(e) => {
                setSystemSettings({...systemSettings, lateFeePercentage: e.target.value});
                setUnsavedChanges(true);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="text-xs text-gray-500 mt-1">Aplicado después del vencimiento</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período de Gracia (días)
            </label>
            <input
              type="number"
              value={systemSettings.gracePeriodDays}
              onChange={(e) => {
                setSystemSettings({...systemSettings, gracePeriodDays: e.target.value});
                setUnsavedChanges(true);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="text-xs text-gray-500 mt-1">Días antes de aplicar mora</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Año Fiscal
            </label>
            <select
              value={systemSettings.fiscalYear}
              onChange={(e) => {
                setSystemSettings({...systemSettings, fiscalYear: e.target.value});
                setUnsavedChanges(true);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="calendar">Año Calendario (Enero - Diciembre)</option>
              <option value="fiscal">Año Fiscal (Abril - Marzo)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Configuración de Sesión</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Intentos Máximos de Login
            </label>
            <input
              type="number"
              value={systemSettings.maxLoginAttempts}
              onChange={(e) => {
                setSystemSettings({...systemSettings, maxLoginAttempts: e.target.value});
                setUnsavedChanges(true);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiempo de Sesión (minutos)
            </label>
            <input
              type="number"
              value={systemSettings.sessionTimeout}
              onChange={(e) => {
                setSystemSettings({...systemSettings, sessionTimeout: e.target.value});
                setUnsavedChanges(true);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={systemSettings.maintenanceMode}
                onChange={(e) => {
                  setSystemSettings({...systemSettings, maintenanceMode: e.target.checked});
                  setUnsavedChanges(true);
                }}
                className="rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                Modo de Mantenimiento
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              Bloquea el acceso a usuarios no administradores
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Renderizar sección de notificaciones
  const renderNotificationSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Canales de Notificación</h3>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-gray-500">Enviar notificaciones por correo electrónico</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notificationSettings.emailEnabled}
              onChange={(e) => {
                setNotificationSettings({...notificationSettings, emailEnabled: e.target.checked});
                setUnsavedChanges(true);
              }}
              className="rounded"
            />
          </label>
          
          <label className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
            <div className="flex items-center space-x-3">
              <Smartphone className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">WhatsApp</p>
                <p className="text-sm text-gray-500">Enviar notificaciones por WhatsApp</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notificationSettings.whatsappEnabled}
              onChange={(e) => {
                setNotificationSettings({...notificationSettings, whatsappEnabled: e.target.checked});
                setUnsavedChanges(true);
              }}
              className="rounded"
            />
          </label>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Tipos de Notificaciones</h3>
        
        <div className="space-y-4">
          <div className="border rounded-lg p-4">
            <label className="flex items-center justify-between mb-2">
              <span className="font-medium">Recordatorios de Pago</span>
              <input
                type="checkbox"
                checked={notificationSettings.paymentReminders}
                onChange={(e) => {
                  setNotificationSettings({...notificationSettings, paymentReminders: e.target.checked});
                  setUnsavedChanges(true);
                }}
                className="rounded"
              />
            </label>
            {notificationSettings.paymentReminders && (
              <div className="mt-2">
                <label className="block text-sm text-gray-600">
                  Enviar recordatorio
                  <input
                    type="number"
                    value={notificationSettings.reminderDaysBefore}
                    onChange={(e) => {
                      setNotificationSettings({...notificationSettings, reminderDaysBefore: e.target.value});
                      setUnsavedChanges(true);
                    }}
                    className="mx-2 w-16 px-2 py-1 border rounded"
                  />
                  días antes del vencimiento
                </label>
              </div>
            )}
          </div>
          
          <div className="border rounded-lg p-4">
            <label className="flex items-center justify-between mb-2">
              <span className="font-medium">Notificaciones de Mora</span>
              <input
                type="checkbox"
                checked={notificationSettings.overdueNotifications}
                onChange={(e) => {
                  setNotificationSettings({...notificationSettings, overdueNotifications: e.target.checked});
                  setUnsavedChanges(true);
                }}
                className="rounded"
              />
            </label>
            {notificationSettings.overdueNotifications && (
              <div className="mt-2">
                <label className="block text-sm text-gray-600">
                  Enviar notificación
                  <input
                    type="number"
                    value={notificationSettings.overdueDaysAfter}
                    onChange={(e) => {
                      setNotificationSettings({...notificationSettings, overdueDaysAfter: e.target.value});
                      setUnsavedChanges(true);
                    }}
                    className="mx-2 w-16 px-2 py-1 border rounded"
                  />
                  días después del vencimiento
                </label>
              </div>
            )}
          </div>
          
          <div className="border rounded-lg p-4">
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium">Bienvenida a Nuevos Clientes</p>
                <p className="text-sm text-gray-500">Enviar mensaje de bienvenida al registrar un cliente</p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.newClientWelcome}
                onChange={(e) => {
                  setNotificationSettings({...notificationSettings, newClientWelcome: e.target.checked});
                  setUnsavedChanges(true);
                }}
                className="rounded"
              />
            </label>
          </div>
          
          <div className="border rounded-lg p-4">
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium">Confirmación de Pago</p>
                <p className="text-sm text-gray-500">Enviar confirmación cuando se registre un pago</p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.paymentConfirmation}
                onChange={(e) => {
                  setNotificationSettings({...notificationSettings, paymentConfirmation: e.target.checked});
                  setUnsavedChanges(true);
                }}
                className="rounded"
              />
            </label>
          </div>
        </div>
      </div>


      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Preferencias de Notificación</h3>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Volume2 className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium">Sonido de Notificación</p>
                <p className="text-sm text-gray-500">Reproducir sonido al recibir notificaciones</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notificationSettings.notificationSound}
              onChange={(e) => {
                setNotificationSettings({...notificationSettings, notificationSound: e.target.checked});
                setUnsavedChanges(true);
              }}
              className="rounded"
            />
          </label>
          
          <label className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Monitor className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium">Notificaciones de Escritorio</p>
                <p className="text-sm text-gray-500">Mostrar notificaciones del navegador</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notificationSettings.desktopNotifications}
              onChange={(e) => {
                setNotificationSettings({...notificationSettings, desktopNotifications: e.target.checked});
                setUnsavedChanges(true);
              }}
              className="rounded"
            />
          </label>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Horario de Envío de Notificaciones
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Hora de inicio</label>
                <input
                  type="time"
                  defaultValue="08:00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Hora de fin</label>
                <input
                  type="time"
                  defaultValue="20:00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Las notificaciones solo se enviarán en este horario</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Días de la Semana para Envío
            </label>
            <div className="flex flex-wrap gap-2">
              {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                <label key={day} className="flex items-center space-x-1">
                  <input type="checkbox" defaultChecked={day !== 'Dom'} className="rounded" />
                  <span className="text-sm">{day}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Renderizar sección de seguridad
  const renderSecuritySection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Autenticación</h3>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium">Autenticación de Dos Factores</p>
                <p className="text-sm text-gray-500">Requiere código adicional al iniciar sesión</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={securitySettings.twoFactorAuth}
              onChange={(e) => {
                setSecuritySettings({...securitySettings, twoFactorAuth: e.target.checked});
                setUnsavedChanges(true);
              }}
              className="rounded"
            />
          </label>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Complejidad de Contraseña
            </label>
            <select
              value={securitySettings.passwordComplexity}
              onChange={(e) => {
                setSecuritySettings({...securitySettings, passwordComplexity: e.target.value});
                setUnsavedChanges(true);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="low">Baja (mínimo 6 caracteres)</option>
              <option value="medium">Media (8 caracteres, mayúsculas y números)</option>
              <option value="high">Alta (10 caracteres, símbolos especiales)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiración de Contraseña (días)
            </label>
            <input
              type="number"
              value={securitySettings.passwordExpiration}
              onChange={(e) => {
                setSecuritySettings({...securitySettings, passwordExpiration: e.target.value});
                setUnsavedChanges(true);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="text-xs text-gray-500 mt-1">0 para desactivar expiración</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Control de Acceso</h3>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <Globe className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium">Restricción por IP</p>
                <p className="text-sm text-gray-500">Limitar acceso a IPs específicas</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={securitySettings.ipRestriction}
              onChange={(e) => {
                setSecuritySettings({...securitySettings, ipRestriction: e.target.checked});
                setUnsavedChanges(true);
              }}
              className="rounded"
            />
          </label>
          
          {securitySettings.ipRestriction && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IPs Permitidas
              </label>
              <textarea
                value={securitySettings.allowedIPs}
                onChange={(e) => {
                  setSecuritySettings({...securitySettings, allowedIPs: e.target.value});
                  setUnsavedChanges(true);
                }}
                rows="3"
                placeholder="192.168.1.1&#10;10.0.0.0/24"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="text-xs text-gray-500 mt-1">Una IP o rango por línea</p>
            </div>
          )}
          
          <label className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <Activity className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium">Registro de Auditoría</p>
                <p className="text-sm text-gray-500">Registrar todas las acciones del sistema</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={securitySettings.auditLog}
              onChange={(e) => {
                setSecuritySettings({...securitySettings, auditLog: e.target.checked});
                setUnsavedChanges(true);
              }}
              className="rounded"
            />
          </label>
          
          <label className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium">Protección contra Fuerza Bruta</p>
                <p className="text-sm text-gray-500">Bloquear tras múltiples intentos fallidos</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={securitySettings.bruteForceProtection}
              onChange={(e) => {
                setSecuritySettings({...securitySettings, bruteForceProtection: e.target.checked});
                setUnsavedChanges(true);
              }}
              className="rounded"
            />
          </label>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Seguridad de Datos</h3>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <Lock className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium">Encriptación de Datos</p>
                <p className="text-sm text-gray-500">Encriptar datos sensibles en la base de datos</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={securitySettings.dataEncryption}
              onChange={(e) => {
                setSecuritySettings({...securitySettings, dataEncryption: e.target.checked});
                setUnsavedChanges(true);
              }}
              className="rounded"
            />
          </label>
          
          <label className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <HardDrive className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium">Encriptación de Respaldos</p>
                <p className="text-sm text-gray-500">Encriptar archivos de respaldo</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={securitySettings.backupEncryption}
              onChange={(e) => {
                setSecuritySettings({...securitySettings, backupEncryption: e.target.checked});
                setUnsavedChanges(true);
              }}
              className="rounded"
            />
          </label>
          
          <label className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">SSL Requerido</p>
                <p className="text-sm text-gray-500">Forzar conexiones seguras HTTPS</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={securitySettings.sslRequired}
              onChange={(e) => {
                setSecuritySettings({...securitySettings, sslRequired: e.target.checked});
                setUnsavedChanges(true);
              }}
              className="rounded"
            />
          </label>
        </div>
      </div>
    </div>
  );

  // Renderizar sección de plantillas de mensajes
  const renderTemplatesSection = () => {
    const templates = [
      {
        key: 'welcome',
        title: 'Mensaje de Bienvenida a Nuevos Clientes',
        defaultBody: 'Estimado {cliente_nombre},\n\n¡Bienvenido a TV Cable Perú!\n\nNos complace tenerlo como nuestro cliente. Su servicio está ahora activo y puede comenzar a disfrutar de nuestra programación.\n\nDetalles de su servicio:\n- Plan: {plan_servicio}\n- Fecha de instalación: {fecha_instalacion}\n- Día de pago: {dia_pago}\n\nPara cualquier consulta, no dude en contactarnos.\n\n¡Gracias por confiar en nosotros!\n\nTV Cable Perú',
        variables: ['{cliente_nombre}', '{plan_servicio}', '{fecha_instalacion}', '{dia_pago}']
      },
      {
        key: 'paymentReminder',
        title: 'Recordatorio de Pago',
        defaultBody: emailTemplates.paymentReminder.body,
        variables: ['{cliente_nombre}', '{monto}', '{fecha_vencimiento}', '{mes_servicio}']
      },
      {
        key: 'overdueNotice',
        title: 'Aviso de Pago Vencido',
        defaultBody: emailTemplates.overdueNotice.body,
        variables: ['{cliente_nombre}', '{monto}', '{fecha_vencimiento}', '{dias_vencido}']
      },
      {
        key: 'paymentConfirmation',
        title: 'Confirmación de Pago',
        defaultBody: emailTemplates.paymentConfirmation.body,
        variables: ['{cliente_nombre}', '{monto}', '{numero_operacion}', '{fecha_pago}']
      },
      {
        key: 'serviceDisconnection',
        title: 'Aviso de Corte de Servicio',
        defaultBody: 'Estimado {cliente_nombre},\n\nLamentamos informarle que su servicio será suspendido debido a pagos pendientes.\n\nDeuda pendiente: S/ {monto_deuda}\nÚltimo pago vencido: {fecha_ultimo_vencimiento}\nDías en mora: {dias_mora}\n\nPara evitar la suspensión del servicio, regularice su situación lo antes posible.\n\nTV Cable Perú',
        variables: ['{cliente_nombre}', '{monto_deuda}', '{fecha_ultimo_vencimiento}', '{dias_mora}']
      },
      {
        key: 'serviceReactivation',
        title: 'Notificación de Reactivación de Servicio',
        defaultBody: 'Estimado {cliente_nombre},\n\n¡Excelentes noticias! Su servicio ha sido reactivado.\n\nHemos recibido su pago de S/ {monto_pago} correspondiente al mes de {mes_pago}.\n\nSu servicio estará disponible en las próximas 2 horas.\n\nGracias por regularizar su situación y por confiar en nosotros.\n\nTV Cable Perú',
        variables: ['{cliente_nombre}', '{monto_pago}', '{mes_pago}', '{fecha_reactivacion}']
      },
      {
        key: 'planChange',
        title: 'Notificación de Cambio de Plan',
        defaultBody: 'Estimado {cliente_nombre},\n\nLe confirmamos que su plan de servicio ha sido actualizado.\n\nCambio realizado:\n- Plan anterior: {plan_anterior}\n- Plan nuevo: {plan_nuevo}\n- Nuevo costo mensual: S/ {nuevo_costo}\n- Fecha efectiva: {fecha_cambio}\n\nEl cambio será reflejado en su próxima facturación.\n\nGracias por confiar en TV Cable Perú.\n\nTV Cable Perú',
        variables: ['{cliente_nombre}', '{plan_anterior}', '{plan_nuevo}', '{nuevo_costo}', '{fecha_cambio}']
      }
    ];

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Plantillas de Mensajes</h3>
            <p className="text-sm text-gray-600 mt-1">Personaliza los mensajes que se envían automáticamente a los clientes</p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {templates.map((template) => {
              const isExpanded = expandedTemplates[template.key];
              const currentValue = template.key === 'welcome' 
                ? emailTemplates.welcome?.body || template.defaultBody
                : template.key === 'serviceDisconnection' 
                  ? emailTemplates.serviceDisconnection?.body || template.defaultBody
                : template.key === 'serviceReactivation'
                  ? emailTemplates.serviceReactivation?.body || template.defaultBody
                : template.key === 'planChange'
                  ? emailTemplates.planChange?.body || template.defaultBody
                : emailTemplates[template.key]?.body || template.defaultBody;

              return (
                <div key={template.key} className="p-6">
                  {/* Header del template */}
                  <button
                    onClick={() => toggleTemplate(template.key)}
                    className="w-full flex items-center justify-between text-left hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors"
                  >
                    <div>
                      <h4 className="text-md font-medium text-gray-900">{template.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {isExpanded ? 'Clic para contraer' : 'Clic para expandir y editar'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!isExpanded && (
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                          {template.variables.length} variables
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Contenido expandible */}
                  {isExpanded && (
                    <div className="mt-4 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contenido del Mensaje
                        </label>
                        <textarea
                          value={currentValue}
                          onChange={(e) => {
                            const newTemplates = { ...emailTemplates };
                            
                            if (template.key === 'welcome') {
                              newTemplates.welcome = { ...newTemplates.welcome, body: e.target.value };
                            } else if (template.key === 'serviceDisconnection') {
                              newTemplates.serviceDisconnection = { body: e.target.value };
                            } else if (template.key === 'serviceReactivation') {
                              newTemplates.serviceReactivation = { body: e.target.value };
                            } else if (template.key === 'planChange') {
                              newTemplates.planChange = { body: e.target.value };
                            } else {
                              newTemplates[template.key] = { ...newTemplates[template.key], body: e.target.value };
                            }
                            
                            setEmailTemplates(newTemplates);
                            setUnsavedChanges(true);
                          }}
                          rows="8"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary font-mono text-sm"
                          placeholder={`Contenido del ${template.title.toLowerCase()}...`}
                        />
                      </div>

                      {/* Variables disponibles */}
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h5 className="text-sm font-medium text-blue-900 mb-2">Variables Disponibles:</h5>
                        <div className="flex flex-wrap gap-2">
                          {template.variables.map((variable, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200 transition-colors"
                              onClick={() => {
                                // Aquí podrías agregar funcionalidad para insertar la variable en el cursor
                                navigator.clipboard.writeText(variable);
                              }}
                              title="Clic para copiar"
                            >
                              {variable}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-blue-700 mt-2">
                          Estas variables se reemplazarán automáticamente con los datos reales del cliente
                        </p>
                      </div>

                      {/* Botones de acción para la plantilla individual */}
                      <div className="flex justify-end space-x-3">
                        <button
                          onClick={() => {
                            const newTemplates = { ...emailTemplates };
                            
                            if (template.key === 'welcome') {
                              newTemplates.welcome = { body: template.defaultBody };
                            } else if (['serviceDisconnection', 'serviceReactivation', 'planChange'].includes(template.key)) {
                              newTemplates[template.key] = { body: template.defaultBody };
                            } else {
                              newTemplates[template.key] = { ...newTemplates[template.key], body: template.defaultBody };
                            }
                            
                            setEmailTemplates(newTemplates);
                            setUnsavedChanges(true);
                          }}
                          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                          Restaurar Original
                        </button>
                        <button
                          className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 border border-blue-300 rounded-md hover:bg-blue-100"
                        >
                          Vista Previa
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Botones generales */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <div>
                <button
                  onClick={() => {
                    setExpandedTemplates({
                      welcome: true,
                      paymentReminder: true,
                      overdueNotice: true,
                      paymentConfirmation: true,
                      serviceDisconnection: true,
                      serviceReactivation: true,
                      planChange: true
                    });
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Expandir Todas
                </button>
                <span className="mx-2 text-gray-300">|</span>
                <button
                  onClick={() => {
                    setExpandedTemplates({
                      welcome: false,
                      paymentReminder: false,
                      overdueNotice: false,
                      paymentConfirmation: false,
                      serviceDisconnection: false,
                      serviceReactivation: false,
                      planChange: false
                    });
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Contraer Todas
                </button>
              </div>

              <div className="flex space-x-3">
                <button 
                  onClick={() => {
                    // Restaurar todas las plantillas por defecto
                    setEmailTemplates({
                      paymentReminder: {
                        subject: 'Recordatorio de Pago - TV Cable',
                        body: 'Estimado {cliente_nombre},\n\nLe recordamos que su pago de S/ {monto} vence el {fecha_vencimiento}.\n\nPuede realizar su pago a través de los siguientes medios:\n- Transferencia bancaria\n- Depósito en cuenta\n- Pago en línea\n\nGracias por su preferencia.\n\nTV Cable Perú'
                      },
                      overdueNotice: {
                        subject: 'Aviso de Pago Vencido - TV Cable',
                        body: 'Estimado {cliente_nombre},\n\nSu pago de S/ {monto} venció el {fecha_vencimiento}.\n\nPor favor regularice su situación para evitar el corte del servicio.\n\nTV Cable Perú'
                      },
                      paymentConfirmation: {
                        subject: 'Confirmación de Pago - TV Cable',
                        body: 'Estimado {cliente_nombre},\n\nHemos recibido su pago de S/ {monto}.\n\nNúmero de operación: {numero_operacion}\nFecha: {fecha_pago}\n\nGracias por su pago puntual.\n\nTV Cable Perú'
                      }
                    });
                    setUnsavedChanges(true);
                  }}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Restaurar Todas las Plantillas
                </button>
                
                <button 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Vista Previa de Todas
                </button>
              </div>
            </div>
          </div>
        </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Configuración de WhatsApp</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de WhatsApp Business
            </label>
            <input
              type="tel"
              placeholder="+51 987 654 321"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="text-xs text-gray-500 mt-1">Número desde el cual se enviarán las notificaciones</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Token de API de WhatsApp
            </label>
            <input
              type="password"
              placeholder="•••••••••••••••••••••••••••••••"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="text-xs text-gray-500 mt-1">Token de autenticación para la API de WhatsApp Business</p>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Usar Plantillas Aprobadas</p>
              <p className="text-sm text-gray-500">Utilizar solo plantillas aprobadas por WhatsApp</p>
            </div>
            <input
              type="checkbox"
              defaultChecked={true}
              className="rounded"
            />
          </div>

          <div>
            <button className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
              <Smartphone className="h-4 w-4 mr-2" />
              Probar Conexión WhatsApp
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Configuración de Email</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Servidor SMTP
              </label>
              <input
                type="text"
                placeholder="smtp.gmail.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Puerto
              </label>
              <input
                type="number"
                placeholder="587"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email de Envío
              </label>
              <input
                type="email"
                placeholder="notificaciones@tvcableperu.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña de Email
              </label>
              <input
                type="password"
                placeholder="•••••••••••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Usar SSL/TLS</p>
              <p className="text-sm text-gray-500">Conexión segura para el envío de emails</p>
            </div>
            <input
              type="checkbox"
              defaultChecked={true}
              className="rounded"
            />
          </div>

          <div>
            <button className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              <Mail className="h-4 w-4 mr-2" />
              Probar Configuración Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

  // Renderizar sección de respaldos
  const renderBackupSection = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Configuración de Respaldos</h3>
        
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-3">
              <RefreshCw className="h-5 w-5 text-gray-400" />
              <div>
                <p className="font-medium">Respaldo Automático</p>
                <p className="text-sm text-gray-500">Realizar respaldos de forma automática</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={backupSettings.autoBackup}
              onChange={(e) => {
                setBackupSettings({...backupSettings, autoBackup: e.target.checked});
                setUnsavedChanges(true);
              }}
              className="rounded"
            />
          </label>
          
          {backupSettings.autoBackup && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frecuencia de Respaldo
                </label>
                <select
                  value={backupSettings.backupFrequency}
                  onChange={(e) => {
                    setBackupSettings({...backupSettings, backupFrequency: e.target.value});
                    setUnsavedChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="hourly">Cada hora</option>
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hora de Respaldo
                </label>
                <input
                  type="time"
                  value={backupSettings.backupTime}
                  onChange={(e) => {
                    setBackupSettings({...backupSettings, backupTime: e.target.value});
                    setUnsavedChanges(true);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Retención de Respaldos (días)
            </label>
            <input
              type="number"
              value={backupSettings.backupRetention}
              onChange={(e) => {
                setBackupSettings({...backupSettings, backupRetention: e.target.value});
                setUnsavedChanges(true);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="text-xs text-gray-500 mt-1">Respaldos más antiguos serán eliminados automáticamente</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ubicación de Respaldo
            </label>
            <select
              value={backupSettings.backupLocation}
              onChange={(e) => {
                setBackupSettings({...backupSettings, backupLocation: e.target.value});
                setUnsavedChanges(true);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="local">Almacenamiento Local</option>
              <option value="network">Red Local</option>
              <option value="cloud">Nube</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Estado de Respaldos</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Último Respaldo</p>
                <p className="text-sm text-green-700">{backupSettings.lastBackup}</p>
              </div>
            </div>
            <span className="text-sm font-medium text-green-900">{backupSettings.backupSize}</span>
          </div>
          
          <div className="flex space-x-4">
            <button className="flex-1 flex items-center justify-center px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-600">
              <Database className="h-4 w-4 mr-2" />
              Respaldar Ahora
            </button>
            <button className="flex-1 flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
              <Upload className="h-4 w-4 mr-2" />
              Restaurar
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Historial de Respaldos</h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tamaño
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
              {backupSettings.backupHistory.map((backup, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {backup.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {backup.size}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Exitoso
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Download className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <Upload className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
          <p className="text-gray-600">Administrar configuraciones del sistema</p>
        </div>
        
        {unsavedChanges && (
          <div className="flex items-center space-x-3">
            <span className="text-sm text-orange-600 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-1" />
              Cambios sin guardar
            </span>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="flex items-center px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-blue-600"
            >
              <Save className="h-4 w-4 mr-2" />
              Guardar Cambios
            </button>
          </div>
        )}
      </div>

      {/* Navegación de secciones */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveSection('company')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeSection === 'company'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Building className="h-4 w-4 mr-2" />
                Empresa
              </div>
            </button>
            
            <button
              onClick={() => setActiveSection('system')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeSection === 'system'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <SettingsIcon className="h-4 w-4 mr-2" />
                Sistema
              </div>
            </button>
            
            <button
              onClick={() => setActiveSection('notifications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeSection === 'notifications'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Bell className="h-4 w-4 mr-2" />
                Notificaciones
              </div>
            </button>

            <button
              onClick={() => setActiveSection('templates')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeSection === 'templates'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Plantillas de mensajes
              </div>
            </button>
            
            <button
              onClick={() => setActiveSection('security')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeSection === 'security'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Seguridad
              </div>
            </button>
            
            <button
              onClick={() => setActiveSection('backup')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeSection === 'backup'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Database className="h-4 w-4 mr-2" />
                Respaldos
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Contenido de la sección activa */}
      <div>
        {activeSection === 'company' && renderCompanySection()}
        {activeSection === 'system' && renderSystemSection()}
        {activeSection === 'notifications' && renderNotificationSection()}
        {activeSection === 'templates' && renderTemplatesSection()}
        {activeSection === 'security' && renderSecuritySection()}
        {activeSection === 'backup' && renderBackupSection()}
      </div>
    </div>
  );
};

export default Settings;