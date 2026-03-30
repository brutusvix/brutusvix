import { z } from 'zod';

// ─── SCHEMAS DE VALIDAÇÃO ────────────────────────────────────────────────────

// Validação de telefone brasileiro
const phoneRegex = /^\(\d{2}\) \d{5}-\d{4}$/;

// Validação de placa (Mercosul e antiga)
const plateRegex = /^[A-Z]{3}[-]?\d{1}[A-Z0-9]{1}\d{2}$/;

// ── USUÁRIOS ──────────────────────────────────────────────────────────────────

export const createUserSchema = z.object({
  name: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  
  email: z.string()
    .email('Email inválido')
    .toLowerCase()
    .trim(),
  
  password: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Senha deve conter letras maiúsculas, minúsculas e números'),
  
  role: z.enum(['DONO', 'LAVADOR'], {
    errorMap: () => ({ message: 'Role deve ser DONO ou LAVADOR' })
  }),
  
  unit_id: z.string().uuid('ID da unidade inválido').optional().nullable(),
  
  phone: z.string()
    .regex(phoneRegex, 'Telefone deve estar no formato (00) 00000-0000')
    .optional()
    .nullable(),
  
  tipoPagamento: z.enum(['diaria', 'comissao', 'misto']).optional(),
  valorDiaria: z.number().min(0).optional(),
  comissaoPercentualServico: z.number().min(0).max(100).optional(),
  valorAlmoco: z.number().min(0).optional(),
  valorPassagem: z.number().min(0).optional(),
  comissoesServico: z.record(z.number()).optional(),
});

export const updateUserSchema = createUserSchema.partial().extend({
  password: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Senha deve conter letras maiúsculas, minúsculas e números')
    .optional(),
});

// ── CLIENTES ──────────────────────────────────────────────────────────────────

export const createClientSchema = z.object({
  name: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  
  phone: z.string()
    .regex(phoneRegex, 'Telefone deve estar no formato (00) 00000-0000')
    .trim(),
  
  unit_id: z.string().uuid('ID da unidade inválido'),
});

// ── VEÍCULOS ──────────────────────────────────────────────────────────────────

export const createVehicleSchema = z.object({
  client_id: z.string().uuid('ID do cliente inválido'),
  
  model: z.string()
    .min(2, 'Modelo deve ter no mínimo 2 caracteres')
    .max(100, 'Modelo deve ter no máximo 100 caracteres')
    .trim(),
  
  plate: z.string()
    .regex(plateRegex, 'Placa inválida. Use formato ABC-1234 ou ABC1D23')
    .transform(val => val.toUpperCase())
    .trim(),
});

// ── SERVIÇOS ──────────────────────────────────────────────────────────────────

export const createServiceSchema = z.object({
  name: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  
  unit_id: z.string().uuid('ID da unidade inválido'),
  
  duration_minutes: z.number()
    .int('Duração deve ser um número inteiro')
    .min(5, 'Duração mínima: 5 minutos')
    .max(480, 'Duração máxima: 8 horas'),
  
  prices: z.object({
    HATCH: z.number().min(0, 'Preço não pode ser negativo'),
    SEDAN: z.number().min(0, 'Preço não pode ser negativo'),
    SUV: z.number().min(0, 'Preço não pode ser negativo'),
    CAMINHONETE: z.number().min(0, 'Preço não pode ser negativo'),
  }),
  
  category: z.enum(['LAVAGEM', 'POLIMENTO', 'CRISTALIZACAO', 'HIGIENIZACAO', 'ESTETICA', 'OUTROS']).optional(),
});

// ── AGENDAMENTOS ──────────────────────────────────────────────────────────────

export const createAppointmentSchema = z.object({
  client_id: z.string().uuid('ID do cliente inválido').optional().nullable(),
  service_id: z.string().uuid('ID do serviço inválido'),
  unit_id: z.string().uuid('ID da unidade inválido'),
  washer_id: z.string().uuid('ID do lavador inválido').optional().nullable(),
  
  vehicle_type: z.enum(['HATCH', 'SEDAN', 'SUV', 'CAMINHONETE', 'MOTO_PEQUENA', 'MOTO_GRANDE']),
  
  plate: z.string()
    .regex(plateRegex, 'Placa inválida')
    .transform(val => val.toUpperCase())
    .trim(),
  
  vehicle_model: z.string()
    .min(2, 'Modelo deve ter no mínimo 2 caracteres')
    .max(100, 'Modelo deve ter no máximo 100 caracteres')
    .trim(),
  
  start_time: z.string().datetime('Data/hora inválida'),
  end_time: z.string().datetime('Data/hora inválida').optional().nullable(),
  
  status: z.enum(['AGENDADO', 'EM_ANDAMENTO', 'FINALIZADO', 'CANCELADO']).optional(),
  
  total_price: z.number().min(0, 'Preço não pode ser negativo').optional(),
  
  extras: z.array(z.string().uuid()).optional(),
  
  client_name: z.string().max(100).optional().nullable(),
  photo_url: z.string().url('URL da foto inválida').optional().nullable(),
  ai_data: z.any().optional().nullable(),
});

// ── TRANSAÇÕES ────────────────────────────────────────────────────────────────

export const createTransactionSchema = z.object({
  unit_id: z.string().uuid('ID da unidade inválido'),
  
  type: z.enum(['INCOME', 'EXPENSE'], {
    errorMap: () => ({ message: 'Tipo deve ser INCOME ou EXPENSE' })
  }),
  
  amount: z.number()
    .min(0.01, 'Valor deve ser maior que zero'),
  
  category: z.string()
    .min(3, 'Categoria deve ter no mínimo 3 caracteres')
    .max(50, 'Categoria deve ter no máximo 50 caracteres')
    .trim(),
  
  description: z.string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .trim()
    .optional(),
  
  date: z.string().datetime('Data/hora inválida').optional(),
});

// ── UNIDADES ──────────────────────────────────────────────────────────────────

export const createUnitSchema = z.object({
  name: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),
  
  address: z.string()
    .min(10, 'Endereço deve ter no mínimo 10 caracteres')
    .max(200, 'Endereço deve ter no máximo 200 caracteres')
    .trim(),
  
  phone: z.string()
    .regex(phoneRegex, 'Telefone deve estar no formato (00) 00000-0000')
    .optional()
    .nullable(),
});

// ── ANÁLISE DE VEÍCULO (IA) ───────────────────────────────────────────────────

export const analyzeVehicleSchema = z.object({
  image: z.string()
    .startsWith('data:image/', 'Imagem deve ser um data URL válido')
    .refine(
      (val) => {
        const base64 = val.split(',')[1];
        if (!base64) return false;
        // Verificar se não é muito grande (max 10MB)
        const sizeInBytes = (base64.length * 3) / 4;
        return sizeInBytes <= 10 * 1024 * 1024;
      },
      'Imagem muito grande. Máximo: 10MB'
    ),
});

// ── TIPOS EXPORTADOS ──────────────────────────────────────────────────────────

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateClientInput = z.infer<typeof createClientSchema>;
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type AnalyzeVehicleInput = z.infer<typeof analyzeVehicleSchema>;
