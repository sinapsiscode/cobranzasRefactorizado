import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useNotificationStore } from '../stores/notificationStore';
import { Eye, EyeOff, LogIn, Wifi, WifiOff } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Login = () => {
  const navigate = useNavigate();
  const { login, loading } = useAuthStore();
  const { error: showError, success } = useNotificationStore();
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Usuarios de demostración
  const demoUsers = [
    { username: 'subadmin', password: 'super123', role: 'SubAdministrador' },
    { username: 'admin', password: 'admin123', role: 'Administrador' },
    { username: 'cobrador1', password: 'cobrador123', role: 'Cobrador' },
    { username: 'cliente1', password: '123456', role: 'Cliente' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      showError('Por favor, complete todos los campos');
      return;
    }

    try {
      const { user } = await login(formData);
      
      success(`Bienvenido ${user.fullName}`);
      
      // Redirigir según rol
      const routes = {
        subadmin: '/subadmin/dashboard',
        admin: '/admin/dashboard',
        collector: '/collector/dashboard',
        client: '/client/dashboard'
      };
      
      navigate(routes[user.role] || '/');
    } catch (error) {
      showError(error.error || 'Error al iniciar sesión');
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const fillDemoCredentials = (username, password) => {
    setFormData({ username, password });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-6 sm:py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm sm:max-w-md space-y-6 sm:space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <img
            src="/logo.png"
            alt="Wasi Fibra TV Logo"
            className="mx-auto h-16 w-auto object-contain sm:h-20"
          />
          <h2 className="mt-4 text-2xl font-bold text-gray-900 sm:mt-6 sm:text-3xl">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sistema de Gestión
          </p>
        </div>

        {/* Formulario */}
        <form className="bg-white p-6 rounded-xl shadow-lg space-y-4 sm:p-8 sm:space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 sm:space-y-5">
            
            {/* Usuario */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Usuario
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="mt-1 block w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary text-base sm:text-sm"
                placeholder="Ingrese su usuario"
                value={formData.username}
                onChange={handleInputChange}
                disabled={loading}
              />
            </div>

            {/* Contraseña */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="block w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary text-base sm:text-sm"
                  placeholder="Ingrese su contraseña"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Recordarme */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Recordarme
                </label>
              </div>

              <div className="text-sm">
                <button
                  type="button"
                  className="font-medium text-primary hover:text-blue-600"
                  onClick={() => showError('Funcionalidad no disponible en el demo')}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>
          </div>

          {/* Botón de envío */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors sm:text-sm"
            >
              {loading ? (
                <LoadingSpinner size="small" color="white" />
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Iniciar Sesión
                </>
              )}
            </button>
          </div>
        </form>

        {/* Acceso rápido por roles */}
        <div className="bg-white p-4 rounded-xl shadow-lg sm:p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-3 text-center sm:text-lg sm:mb-4">
            Acceso Rápido Demo
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
            {demoUsers.map((user, index) => (
              <button
                key={index}
                onClick={() => fillDemoCredentials(user.username, user.password)}
                disabled={loading}
                className={`
                  flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-200 sm:p-4
                  ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md hover:scale-105'}
                  ${user.role === 'SubAdministrador' ? 'border-red-200 hover:border-red-400 hover:bg-red-50' : ''}
                  ${user.role === 'Administrador' ? 'border-blue-200 hover:border-blue-400 hover:bg-blue-50' : ''}
                  ${user.role === 'Cobrador' ? 'border-green-200 hover:border-green-400 hover:bg-green-50' : ''}
                  ${user.role === 'Cliente' ? 'border-purple-200 hover:border-purple-400 hover:bg-purple-50' : ''}
                `}
              >
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center mb-2 sm:w-12 sm:h-12 sm:mb-3
                  ${user.role === 'SubAdministrador' ? 'bg-red-100 text-red-600' : ''}
                  ${user.role === 'Administrador' ? 'bg-blue-100 text-blue-600' : ''}
                  ${user.role === 'Cobrador' ? 'bg-green-100 text-green-600' : ''}
                  ${user.role === 'Cliente' ? 'bg-purple-100 text-purple-600' : ''}
                `}>
                  {user.role === 'SubAdministrador' && '👑'}
                  {user.role === 'Administrador' && '👨‍💼'}
                  {user.role === 'Cobrador' && '🏃‍♂️'}
                  {user.role === 'Cliente' && '👤'}
                </div>
                <span className="font-semibold text-gray-900 mb-1 text-xs sm:text-sm">{user.role}</span>
                <span className="text-xs text-gray-500">{user.username}</span>
              </button>
            ))}
          </div>
          
          {/* Información de credenciales */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 text-center">
              Haz clic en cualquier rol para llenar automáticamente las credenciales
            </p>
          </div>
        </div>

        {/* Estado de conexión */}
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
          <Wifi className="h-4 w-4 text-green-500" />
          <span>Modo Demo - Datos simulados</span>
        </div>
      </div>
    </div>
  );
};

export default Login;