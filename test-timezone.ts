/**
 * ============================================================================
 * TESTE DE TIMEZONE - Verificar funções TypeScript
 * ============================================================================
 * Execute: npx tsx test-timezone.ts
 */

import { 
  nowLocal, 
  nowLocalISO, 
  todayLocal, 
  dateLocal,
  toLocalTime,
  isBusinessHours,
  formatLocalDate,
  getCurrentTimeInfo,
  dayBoundsLocal
} from './src/utils/timezone.js';

console.log('🕐 TESTE DE TIMEZONE - BRUTUS LAVAJATO\n');
console.log('═'.repeat(60));

// 1. Data/Hora Atual
console.log('\n1️⃣  DATA/HORA ATUAL:');
console.log('─'.repeat(60));
const now = nowLocal();
console.log('nowLocal():', now);
console.log('nowLocalISO():', nowLocalISO());
console.log('todayLocal():', todayLocal());
console.log('Hora local:', now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0'));

// 2. Conversão UTC para Local
console.log('\n2️⃣  CONVERSÃO UTC → LOCAL:');
console.log('─'.repeat(60));
const utcTime = '2026-04-11T00:03:00.000Z'; // 00:03 UTC = 21:03 BRT (dia anterior)
console.log('UTC Time:', utcTime);
console.log('Local Time:', toLocalTime(utcTime));
console.log('Local Date:', dateLocal(utcTime));
console.log('Formatted:', formatLocalDate(utcTime, true));

// 3. Horário Comercial
console.log('\n3️⃣  HORÁRIO COMERCIAL:');
console.log('─'.repeat(60));
console.log('Está no horário comercial (6h-22h)?', isBusinessHours());
console.log('Teste 8h:', isBusinessHours(new Date('2026-04-11T11:00:00Z'))); // 8h BRT
console.log('Teste 23h:', isBusinessHours(new Date('2026-04-11T02:00:00Z'))); // 23h BRT

// 4. Limites do Dia
console.log('\n4️⃣  LIMITES DO DIA:');
console.log('─'.repeat(60));
const bounds = dayBoundsLocal();
console.log('Início do dia:', bounds.dayStart);
console.log('Fim do dia:', bounds.dayEnd);

// 5. Informações Completas
console.log('\n5️⃣  INFORMAÇÕES COMPLETAS:');
console.log('─'.repeat(60));
const info = getCurrentTimeInfo();
console.log('Agora:', info.now);
console.log('Hoje:', info.today);
console.log('Hora:', info.hour);
console.log('É manhã?', info.isMorning);
console.log('É tarde?', info.isAfternoon);
console.log('É noite?', info.isEvening);
console.log('É madrugada?', info.isNight);
console.log('Horário comercial?', info.isBusinessHours);
console.log('Formatado:', info.formatted);

// 6. Comparação com UTC
console.log('\n6️⃣  COMPARAÇÃO UTC vs LOCAL:');
console.log('─'.repeat(60));
const utcNow = new Date();
const localNow = nowLocal();
const diff = (utcNow.getTime() - localNow.getTime()) / (1000 * 60 * 60);
console.log('UTC:', utcNow.toISOString());
console.log('Local:', localNow.toISOString());
console.log('Diferença:', Math.abs(diff).toFixed(1), 'horas');

// 7. Teste do Problema Original
console.log('\n7️⃣  TESTE DO PROBLEMA ORIGINAL:');
console.log('─'.repeat(60));
console.log('Cenário: Admin lança carro às 21:03 do dia 10');
const testTime = new Date('2026-04-10T21:03:00'); // 21:03 local
console.log('Hora do lançamento:', testTime);
console.log('Data que deve aparecer:', dateLocal(testTime));
console.log('Formatado:', formatLocalDate(testTime, true));

// Comparar com o método antigo (errado)
const oldMethod = new Date().toISOString().split('T')[0];
const newMethod = todayLocal();
console.log('\n8️⃣  COMPARAÇÃO MÉTODOS:');
console.log('─'.repeat(60));
console.log('Método antigo (UTC):', oldMethod);
console.log('Método novo (Local):', newMethod);
console.log('São iguais?', oldMethod === newMethod ? '✅ Sim' : '❌ Não (CORRETO se for noite)');

console.log('\n' + '═'.repeat(60));
console.log('✅ TESTE CONCLUÍDO!\n');
