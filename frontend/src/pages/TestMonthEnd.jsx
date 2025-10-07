import React, { useState, useEffect } from 'react';
import { db } from '../services/mock/db';
import { forceMonthEndClosure, getPaymentServiceStats } from '../services/automation/paymentStatusService';
import { Play, RefreshCw, CheckCircle } from 'lucide-react';

const TestMonthEnd = () => {
  const [beforeStats, setBeforeStats] = useState(null);
  const [afterStats, setAfterStats] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState('');

  useEffect(() => {
    loadInitialStats();
  }, []);

  const getCurrentMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const loadInitialStats = () => {
    const month = getCurrentMonth();
    setCurrentMonth(month);

    const payments = db.getCollection('payments') || [];
    const currentMonthPayments = payments.filter(p => p.month === month);

    const stats = {
      total: currentMonthPayments.length,
      pending: currentMonthPayments.filter(p => p.status === 'pending').length,
      partial: currentMonthPayments.filter(p => p.status === 'partial').length,
      overdue: currentMonthPayments.filter(p => p.status === 'overdue').length,
      collected: currentMonthPayments.filter(p => p.status === 'collected').length,
      validated: currentMonthPayments.filter(p => p.status === 'validated').length,
      paid: currentMonthPayments.filter(p => p.status === 'paid').length
    };

    setBeforeStats(stats);
  };

  const executeMonthEndClosure = async () => {
    setLoading(true);
    try {
      // Ejecutar cierre de mes
      const closureResult = await forceMonthEndClosure();
      setResult(closureResult);

      // Recargar estadísticas después del cierre
      setTimeout(() => {
        const month = getCurrentMonth();
        const payments = db.getCollection('payments') || [];
        const currentMonthPayments = payments.filter(p => p.month === month);

        const stats = {
          total: currentMonthPayments.length,
          pending: currentMonthPayments.filter(p => p.status === 'pending').length,
          partial: currentMonthPayments.filter(p => p.status === 'partial').length,
          overdue: currentMonthPayments.filter(p => p.status === 'overdue').length,
          collected: currentMonthPayments.filter(p => p.status === 'collected').length,
          validated: currentMonthPayments.filter(p => p.status === 'validated').length,
          paid: currentMonthPayments.filter(p => p.status === 'paid').length
        };

        setAfterStats(stats);
        setLoading(false);
      }, 1000);

    } catch (error) {
      console.error('Error ejecutando cierre de mes:', error);
      setLoading(false);
    }
  };

  const reset = () => {
    setAfterStats(null);
    setResult(null);
    loadInitialStats();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🧪 Prueba de Cierre de Mes
          </h1>

          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-900">
              <strong>Mes Actual:</strong> {currentMonth}
            </p>
          </div>

          {/* Estado ANTES */}
          {beforeStats && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">📊 Estado ANTES del Cierre</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-sm text-yellow-700">Pendientes</div>
                  <div className="text-2xl font-bold text-yellow-900">{beforeStats.pending}</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-sm text-orange-700">Parciales</div>
                  <div className="text-2xl font-bold text-orange-900">{beforeStats.partial}</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-sm text-red-700">Mora</div>
                  <div className="text-2xl font-bold text-red-900">{beforeStats.overdue}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-green-700">Pagados</div>
                  <div className="text-2xl font-bold text-green-900">
                    {beforeStats.collected + beforeStats.validated + beforeStats.paid}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botón de ejecución */}
          <div className="mb-6">
            <button
              onClick={executeMonthEndClosure}
              disabled={loading || afterStats !== null}
              className="w-full flex items-center justify-center px-6 py-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                  Ejecutando Cierre de Mes...
                </>
              ) : afterStats ? (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Cierre Completado
                </>
              ) : (
                <>
                  <Play className="h-5 w-5 mr-2" />
                  Ejecutar Cierre de Mes
                </>
              )}
            </button>
          </div>

          {/* Resultado */}
          {result && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-lg font-semibold text-green-900 mb-2">✅ Resultado del Cierre</h3>
              <div className="space-y-2 text-green-800">
                <p>• <strong>Marcados como MORA (pendientes):</strong> {result.moraCount}</p>
                <p>• <strong>Marcados como MORA (parciales):</strong> {result.parcialCount}</p>
                <p>• <strong>Mantenidos como CANCELADO:</strong> {result.canceladoCount}</p>
                <p>• <strong>Total procesados:</strong> {result.totalProcessed}</p>
              </div>
            </div>
          )}

          {/* Estado DESPUÉS */}
          {afterStats && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">📊 Estado DESPUÉS del Cierre</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300">
                  <div className="text-sm text-yellow-700">Pendientes</div>
                  <div className="text-2xl font-bold text-yellow-900">{afterStats.pending}</div>
                  {afterStats.pending !== beforeStats.pending && (
                    <div className="text-xs text-yellow-600 mt-1">
                      {afterStats.pending < beforeStats.pending ? '⬇️' : '⬆️'}
                      {Math.abs(afterStats.pending - beforeStats.pending)}
                    </div>
                  )}
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-300">
                  <div className="text-sm text-orange-700">Parciales</div>
                  <div className="text-2xl font-bold text-orange-900">{afterStats.partial}</div>
                  {afterStats.partial !== beforeStats.partial && (
                    <div className="text-xs text-orange-600 mt-1">
                      {afterStats.partial < beforeStats.partial ? '⬇️' : '⬆️'}
                      {Math.abs(afterStats.partial - beforeStats.partial)}
                    </div>
                  )}
                </div>
                <div className="bg-red-50 p-4 rounded-lg border-2 border-red-300">
                  <div className="text-sm text-red-700">Mora</div>
                  <div className="text-2xl font-bold text-red-900">{afterStats.overdue}</div>
                  {afterStats.overdue !== beforeStats.overdue && (
                    <div className="text-xs text-red-600 mt-1">
                      ⬆️ +{afterStats.overdue - beforeStats.overdue}
                    </div>
                  )}
                </div>
                <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
                  <div className="text-sm text-green-700">Pagados</div>
                  <div className="text-2xl font-bold text-green-900">
                    {afterStats.collected + afterStats.validated + afterStats.paid}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botón reset */}
          {afterStats && (
            <button
              onClick={reset}
              className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="h-5 w-5 inline mr-2" />
              Reiniciar Prueba
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestMonthEnd;
