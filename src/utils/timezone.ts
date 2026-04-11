/**
 * ============================================================================
 * UTILITÁRIO DE TIMEZONE - BRUTUS LAVAJATO
 * ============================================================================
 * Funções para trabalhar com datas no timezone de São Paulo (America/Sao_Paulo)
 * Resolve o problema de datas UTC que causavam confusão nos lançamentos
 * ============================================================================
 */

// Timezone padrão do sistema
export const TIMEZONE = 'America/Sao_Paulo';

/**
 * Obtém a data/hora atual no timezone de São Paulo
 * @returns Date object com hora local
 */
export function nowLocal(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: TIMEZONE }));
}

/**
 * Obtém a data/hora atual no formato ISO mas ajustada para o timezone local
 * Útil para salvar no banco de dados
 * @returns String ISO com timezone local
 */
export function nowLocalISO(): string {
  const localDate = nowLocal();
  // Ajustar para o offset do timezone
  const offset = getTimezoneOffset();
  const adjustedDate = new Date(localDate.getTime() - offset);
  return adjustedDate.toISOString();
}

/**
 * Obtém apenas a data atual (YYYY-MM-DD) no timezone local
 * @returns String no formato YYYY-MM-DD
 */
export function todayLocal(): string {
  const localDate = nowLocal();
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converte uma data UTC para o timezone local
 * @param utcDate - Data em UTC (string ISO ou Date)
 * @returns Date object com hora local
 */
export function toLocalTime(utcDate: string | Date): Date {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  return new Date(date.toLocaleString('en-US', { timeZone: TIMEZONE }));
}

/**
 * Obtém apenas a data (YYYY-MM-DD) de um timestamp no timezone local
 * @param timestamp - Timestamp em UTC (string ISO ou Date)
 * @returns String no formato YYYY-MM-DD
 */
export function dateLocal(timestamp: string | Date): string {
  const localDate = toLocalTime(timestamp);
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Verifica se está dentro do horário comercial
 * @param checkTime - Hora para verificar (opcional, padrão: agora)
 * @param startHour - Hora de início (padrão: 6)
 * @param endHour - Hora de fim (padrão: 22)
 * @returns true se está no horário comercial
 */
export function isBusinessHours(
  checkTime: Date = nowLocal(),
  startHour: number = 6,
  endHour: number = 22
): boolean {
  const localTime = toLocalTime(checkTime);
  const hour = localTime.getHours();
  return hour >= startHour && hour < endHour;
}

/**
 * Obtém o início e fim do dia no timezone local
 * @param date - Data para obter limites (opcional, padrão: hoje)
 * @returns Objeto com dayStart e dayEnd
 */
export function dayBoundsLocal(date?: string | Date): { dayStart: Date; dayEnd: Date } {
  const targetDate = date ? toLocalTime(date) : nowLocal();
  
  const dayStart = new Date(targetDate);
  dayStart.setHours(0, 0, 0, 0);
  
  const dayEnd = new Date(targetDate);
  dayEnd.setHours(23, 59, 59, 999);
  
  return { dayStart, dayEnd };
}

/**
 * Formata uma data para exibição no formato brasileiro
 * @param date - Data para formatar
 * @param includeTime - Se deve incluir hora (padrão: false)
 * @returns String formatada (ex: "11/04/2026" ou "11/04/2026 21:03")
 */
export function formatLocalDate(date: string | Date, includeTime: boolean = false): string {
  const localDate = toLocalTime(date);
  
  const day = String(localDate.getDate()).padStart(2, '0');
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const year = localDate.getFullYear();
  
  let formatted = `${day}/${month}/${year}`;
  
  if (includeTime) {
    const hours = String(localDate.getHours()).padStart(2, '0');
    const minutes = String(localDate.getMinutes()).padStart(2, '0');
    formatted += ` ${hours}:${minutes}`;
  }
  
  return formatted;
}

/**
 * Obtém o offset do timezone em milissegundos
 * @returns Offset em milissegundos
 */
function getTimezoneOffset(): number {
  const localDate = nowLocal();
  const utcDate = new Date();
  return utcDate.getTime() - localDate.getTime();
}

/**
 * Cria uma data no timezone local a partir de componentes
 * @param year - Ano
 * @param month - Mês (1-12)
 * @param day - Dia
 * @param hour - Hora (opcional, padrão: 0)
 * @param minute - Minuto (opcional, padrão: 0)
 * @returns Date object no timezone local
 */
export function createLocalDate(
  year: number,
  month: number,
  day: number,
  hour: number = 0,
  minute: number = 0
): Date {
  // Criar string no formato ISO local
  const monthStr = String(month).padStart(2, '0');
  const dayStr = String(day).padStart(2, '0');
  const hourStr = String(hour).padStart(2, '0');
  const minuteStr = String(minute).padStart(2, '0');
  
  const dateStr = `${year}-${monthStr}-${dayStr}T${hourStr}:${minuteStr}:00`;
  
  // Criar data interpretando como timezone local
  return new Date(new Date(dateStr).toLocaleString('en-US', { timeZone: TIMEZONE }));
}

/**
 * Verifica se duas datas são do mesmo dia no timezone local
 * @param date1 - Primeira data
 * @param date2 - Segunda data
 * @returns true se são do mesmo dia
 */
export function isSameLocalDay(date1: string | Date, date2: string | Date): boolean {
  return dateLocal(date1) === dateLocal(date2);
}

/**
 * Adiciona dias a uma data mantendo o timezone local
 * @param date - Data base
 * @param days - Número de dias para adicionar (pode ser negativo)
 * @returns Nova data
 */
export function addDaysLocal(date: string | Date, days: number): Date {
  const localDate = toLocalTime(date);
  localDate.setDate(localDate.getDate() + days);
  return localDate;
}

/**
 * Obtém informações sobre o horário atual
 * @returns Objeto com informações úteis
 */
export function getCurrentTimeInfo() {
  const now = nowLocal();
  const hour = now.getHours();
  
  return {
    now,
    nowISO: nowLocalISO(),
    today: todayLocal(),
    hour,
    isBusinessHours: isBusinessHours(),
    isMorning: hour >= 6 && hour < 12,
    isAfternoon: hour >= 12 && hour < 18,
    isEvening: hour >= 18 && hour < 22,
    isNight: hour >= 22 || hour < 6,
    formatted: formatLocalDate(now, true)
  };
}
