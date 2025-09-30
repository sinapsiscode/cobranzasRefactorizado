import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/globals.css';
import { seedDatabase, reseedDatabase } from './services/mock/seeder.js';
import { startClientStatusService } from './services/automation/clientStatusService.js';

// Forzar re-seed para nuevos sistemas de estados
console.log('🔧 Verificando versión de base de datos...');
const currentVersion = localStorage.getItem('tv-cable:seedVersion');
console.log('Versión actual:', currentVersion);

// Siempre forzar reseed para esta actualización
console.log('🔄 Forzando regeneración de base de datos para sistema de estados...');
reseedDatabase();

// Inicializar servicio de automatización de estados
setTimeout(() => {
  startClientStatusService();
  console.log('✅ Servicio de automatización de estados iniciado');
}, 3000);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);