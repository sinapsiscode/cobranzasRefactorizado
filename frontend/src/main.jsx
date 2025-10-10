import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/globals.css';
import { startClientStatusService } from './services/automation/clientStatusService.js';
import { startPaymentStatusService } from './services/automation/paymentStatusService.js';

// ========================================
// SISTEMA CON JSON SERVER BACKEND
// ========================================
// El sistema usa JSON Server (backend-simulado en puerto 8231)
// Todas las operaciones se realizan a través de fetch API
// ========================================

// Inicializar servicios de automatización de estados
setTimeout(() => {
  startClientStatusService();
  console.log('✅ Servicio de automatización de estados de clientes iniciado');

  startPaymentStatusService();
  console.log('✅ Servicio de automatización de estados de pagos iniciado');
}, 3000);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);