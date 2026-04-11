import winston from 'winston';
import path from 'path';
import { nowLocalISO } from './timezone.js';

// ─── CONFIGURAÇÃO DO LOGGER ───────────────────────────────────────────────────

const logDir = 'logs';

// Formato customizado para logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Formato para console (desenvolvimento)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// ─── CRIAR LOGGER ─────────────────────────────────────────────────────────────

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { service: 'brutus-lavajato' },
  transports: [
    // Logs de erro em arquivo separado
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    
    // Todos os logs em arquivo combinado
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
  
  // Não sair do processo em caso de erro
  exitOnError: false,
});

// Em desenvolvimento, também logar no console
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// ─── FUNÇÕES AUXILIARES ───────────────────────────────────────────────────────

/**
 * Log de erro com contexto
 */
export function logError(message: string, error: Error, context?: Record<string, any>) {
  logger.error(message, {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    ...context,
  });
}

/**
 * Log de ação do usuário (auditoria)
 */
export function logUserAction(
  userId: string,
  action: string,
  resource: string,
  details?: Record<string, any>
) {
  logger.info('User action', {
    userId,
    action,
    resource,
    timestamp: nowLocalISO(),
    ...details,
  });
}

/**
 * Log de acesso à API
 */
export function logApiAccess(
  method: string,
  path: string,
  statusCode: number,
  userId?: string,
  duration?: number
) {
  logger.info('API access', {
    method,
    path,
    statusCode,
    userId,
    duration,
    timestamp: nowLocalISO(),
  });
}

/**
 * Log de segurança (tentativas de acesso não autorizado, etc.)
 */
export function logSecurityEvent(
  event: string,
  severity: 'low' | 'medium' | 'high' | 'critical',
  details: Record<string, any>
) {
  logger.warn('Security event', {
    event,
    severity,
    timestamp: nowLocalISO(),
    ...details,
  });
}

export default logger;
