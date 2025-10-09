// Script de prueba para cierre de mes
import { db } from './src/services/mock/db.js';

console.log('=================================');
console.log('🧪 PRUEBA DE CIERRE DE MES');
console.log('=================================\n');

// Obtener mes actual
const getCurrentMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const currentMonth = getCurrentMonth();
console.log(`📅 Mes actual: ${currentMonth}\n`);

// Obtener todos los pagos
const payments = db.getCollection('payments') || [];
console.log(`📊 Total de pagos en BD: ${payments.length}\n`);

// Filtrar pagos del mes actual
const currentMonthPayments = payments.filter(p => p.month === currentMonth);
console.log(`📋 Pagos del mes actual (${currentMonth}): ${currentMonthPayments.length}\n`);

// Mostrar estado ANTES del cierre
console.log('📊 ESTADO ANTES DEL CIERRE:');
console.log('----------------------------');

const beforeStats = {
  pending: currentMonthPayments.filter(p => p.status === 'pending').length,
  partial: currentMonthPayments.filter(p => p.status === 'partial').length,
  overdue: currentMonthPayments.filter(p => p.status === 'overdue').length,
  paid: currentMonthPayments.filter(p => p.status === 'paid').length,
  collected: currentMonthPayments.filter(p => p.status === 'collected').length,
  validated: currentMonthPayments.filter(p => p.status === 'validated').length
};

console.log(`  • Pendientes: ${beforeStats.pending}`);
console.log(`  • Parciales: ${beforeStats.partial}`);
console.log(`  • Mora: ${beforeStats.overdue}`);
console.log(`  • Cobrados: ${beforeStats.collected}`);
console.log(`  • Validados: ${beforeStats.validated}`);
console.log(`  • Pagados: ${beforeStats.paid}`);
console.log();

// EJECUTAR CIERRE DE MES
console.log('⚙️ EJECUTANDO CIERRE DE MES...');
console.log('----------------------------\n');

let moraCount = 0;
let canceladoCount = 0;
let parcialCount = 0;

for (const payment of currentMonthPayments) {
  if (payment.status === 'pending') {
    db.update('payments', payment.id, {
      status: 'overdue',
      comments: (payment.comments || '') + ' [Automático: No pagado al cierre del mes]',
      updatedAt: new Date().toISOString()
    });
    moraCount++;
    console.log(`🔴 Pago ${payment.id.substring(0, 8)}... → MORA (era pendiente)`);
  }
  else if (payment.status === 'partial') {
    db.update('payments', payment.id, {
      status: 'overdue',
      comments: (payment.comments || '') + ' [Automático: Pago parcial al cierre del mes]',
      updatedAt: new Date().toISOString()
    });
    parcialCount++;
    console.log(`🟠 Pago ${payment.id.substring(0, 8)}... → MORA (era parcial)`);
  }
  else if (payment.status === 'paid' || payment.status === 'collected' || payment.status === 'validated') {
    canceladoCount++;
    console.log(`🟢 Pago ${payment.id.substring(0, 8)}... → CANCELADO (ya pagado)`);
  }
}

console.log();
console.log('✅ CIERRE DE MES COMPLETADO');
console.log('----------------------------');
console.log(`  • Marcados como MORA (pendientes): ${moraCount}`);
console.log(`  • Marcados como MORA (parciales): ${parcialCount}`);
console.log(`  • Mantenidos como CANCELADO: ${canceladoCount}`);
console.log(`  • Total procesados: ${moraCount + parcialCount + canceladoCount}`);
console.log();

// Mostrar estado DESPUÉS del cierre
const updatedPayments = db.getCollection('payments').filter(p => p.month === currentMonth);
const afterStats = {
  pending: updatedPayments.filter(p => p.status === 'pending').length,
  partial: updatedPayments.filter(p => p.status === 'partial').length,
  overdue: updatedPayments.filter(p => p.status === 'overdue').length,
  paid: updatedPayments.filter(p => p.status === 'paid').length,
  collected: updatedPayments.filter(p => p.status === 'collected').length,
  validated: updatedPayments.filter(p => p.status === 'validated').length
};

console.log('📊 ESTADO DESPUÉS DEL CIERRE:');
console.log('----------------------------');
console.log(`  • Pendientes: ${afterStats.pending}`);
console.log(`  • Parciales: ${afterStats.partial}`);
console.log(`  • Mora: ${afterStats.overdue} ⬆️ (+${afterStats.overdue - beforeStats.overdue})`);
console.log(`  • Cobrados: ${afterStats.collected}`);
console.log(`  • Validados: ${afterStats.validated}`);
console.log(`  • Pagados: ${afterStats.paid}`);
console.log();

console.log('=================================');
console.log('✅ PRUEBA COMPLETADA');
console.log('=================================');
