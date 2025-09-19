import React from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, RefreshCw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Aquí podrías enviar el error a un servicio de logging
    // logErrorToService(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-6">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            {/* Icono de error */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 bg-red-100 rounded-full mb-6">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>

            {/* Mensaje principal */}
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              ¡Algo salió mal!
            </h1>
            
            <p className="text-gray-600 mb-6">
              Se ha producido un error inesperado en la aplicación. 
              Por favor, intenta recargar la página o volver al inicio.
            </p>

            {/* Botones de acción */}
            <div className="space-y-3">
              <button
                onClick={this.handleReload}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Recargar página
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              >
                Ir al inicio
              </button>
            </div>

            {/* Detalles del error (solo en desarrollo) */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Ver detalles técnicos
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs text-gray-700 overflow-auto max-h-32">
                  <strong>Error:</strong>
                  <pre className="whitespace-pre-wrap">
                    {this.state.error && this.state.error.toString()}
                  </pre>
                  <br />
                  <strong>Stack trace:</strong>
                  <pre className="whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired
};

export default ErrorBoundary;