import React, { useState } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { ChevronDown, Home, Users, FileText, Settings, DollarSign, TrendingUp } from 'lucide-react';

const Analytics = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Datos para el gráfico de barras
  const barData = [
    { mes: 'Enero', valor: 4000 },
    { mes: 'Febrero', valor: 3000 },
    { mes: 'Marzo', valor: 5000 },
    { mes: 'Abril', valor: 2780 },
    { mes: 'Mayo', valor: 1890 },
    { mes: 'Junio', valor: 2390 },
  ];

  // Datos para el gráfico de pastel
  const pieData = [
    { name: 'Grupo A', value: 400 },
    { name: 'Grupo B', value: 300 },
    { name: 'Grupo C', value: 300 },
    { name: 'Grupo D', value: 200 },
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // Opciones del sidebar
  const menuItems = [
    { icon: Home, label: 'Dashboard', active: false },
    { icon: Users, label: 'Clientes', active: false },
    { icon: FileText, label: 'Reportes', active: false },
    { icon: DollarSign, label: 'Finanzas', active: false },
    { icon: TrendingUp, label: 'Analytics', active: true },
    { icon: Settings, label: 'Configuración', active: false },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 h-16 px-6 flex items-center justify-between">
        {/* Logo y Título */}
        <div className="flex items-center space-x-4">
          <img
            src="/logo.png"
            alt="Logo"
            className="h-10 w-auto object-contain"
          />
          <div className="h-8 w-px bg-gray-300"></div>
          <h1 className="text-xl font-semibold text-gray-800">
            Página Web con Sidebar y Gráficos
          </h1>
        </div>

        {/* Dropdown Perfil */}
        <div className="relative">
          <button className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">A</span>
            </div>
            <span className="text-sm font-medium text-gray-700">dropdown(perfil)</span>
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white shadow-lg border-r border-gray-200 transition-all duration-300`}>
          <div className="p-4">
            <h2 className={`font-semibold text-gray-700 mb-4 ${sidebarOpen ? 'block' : 'hidden'}`}>
              SIDEBAR
            </h2>
            <p className={`text-xs text-gray-500 mb-6 ${sidebarOpen ? 'block' : 'hidden'}`}>
              (Menú lateral con enlaces, opciones)
            </p>

            <nav className="space-y-2">
              {menuItems.map((item, index) => (
                <a
                  key={index}
                  href="#"
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    item.active
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {sidebarOpen && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Área de Contenido */}
        <main className="flex-1 p-6">
          {/* Header del contenido */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-700">HEADER</h2>
            <p className="text-sm text-gray-500">(Título, menú superior opcional)</p>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Barras */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-700">GRÁFICO 1</h3>
                <p className="text-sm text-gray-500">(ej. barra)</p>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="valor" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico de Pastel */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-700">GRÁFICO 2</h3>
                <p className="text-sm text-gray-500">(ej. pastel)</p>
              </div>

              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </main>
      </div>

      {/* Footer (Opcional) */}
      <footer className="bg-white border-t border-gray-200 py-4 px-6">
        <p className="text-center text-sm text-gray-500">
          (Opcional: Footer aquí)
        </p>
      </footer>
    </div>
  );
};

export default Analytics;