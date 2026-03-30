// ─── Tipos principais — IDs são string (UUID do Supabase) ─────────────────────

export interface User {
  id: string;
  auth_id?: string;
  name: string;
  email: string;
  role: 'DONO' | 'LAVADOR';
  unit_id?: string;
  tipoPagamento?: 'diaria' | 'comissao' | 'misto';
  valorDiaria?: number;
  comissaoPercentualServico?: number;
  descontarAlmoco?: boolean;
  descontarPassagem?: boolean;
  valorAlmoco?: number;
  valorPassagem?: number;
  phone?: string;
  comissoesServico?: { [key: string]: number };
}

export interface ProductionRecord {
  id: string;
  funcionarioId: string;
  funcionarioNome: string;
  unidadeId: string;
  clienteNome: string;
  veiculo: string;
  servico: string;
  valorServico: number;
  extras: { nome: string; valor: number }[];
  comissaoExtras: number;
  comissaoServico: number;
  data: string;
  hora: string;
  status: 'PENDENTE' | 'PAGO';
}

export interface OperatingHours {
  day: string;
  open: string;
  close: string;
  isOpen: boolean;
}

export interface Unit {
  id: string;
  name: string;
  address: string;
  phone: string;
  isOpen: boolean;
  operatingHours: OperatingHours[];
}

export type ServiceCategory = 
  | 'LAVAGEM'
  | 'POLIMENTO'
  | 'CRISTALIZACAO'
  | 'HIGIENIZACAO'
  | 'ESTETICA'
  | 'OUTROS';

export interface Service {
  id: string;
  name: string;
  prices: { HATCH: number; SEDAN: number; SUV: number; CAMINHONETE: number };
  duration_minutes: number;
  unit_id: string;
  category?: ServiceCategory;
  active?: boolean;
}

export interface Extra {
  id: string;
  name: string;
  price: number;
  commissionValue: number;
}

export interface Appointment {
  id: string;
  client_id: string;
  vehicle_id?: string;
  service_id: string;
  unit_id: string;
  washer_id?: string;
  start_time: string;
  end_time?: string;
  status: 'AGENDADO' | 'EM_ANDAMENTO' | 'FINALIZADO' | 'CANCELADO';
  extras?: string[];
  total_price?: number;
  vehicle_type: 'HATCH' | 'SEDAN' | 'SUV' | 'CAMINHONETE' | 'MOTO' | 'MOTO_PEQUENA' | 'MOTO_GRANDE';
  client_name?: string;
  vehicle_model?: string;
  vehicle_color?: string;
  vehicle_plate?: string;
  plate?: string;
  service_name?: string;
  unit_name?: string;
  photo_url?: string;
  ai_data?: {
    tipo: string;
    marca: string;
    modelo: string;
    cor: string;
    nivel_sujeira: string;
  };
}

export type TransactionCategory =
  | 'PRODUTOS'
  | 'ALUGUEL'
  | 'SALARIOS'
  | 'MARKETING'
  | 'UTILIDADES'
  | 'OUTROS'
  | 'SERVICO';

export interface Transaction {
  id: string;
  unit_id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string;
  category: TransactionCategory;
  date: string;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  unit_id: string;
  total_spent?: number;
  points?: number;
}

export interface Vehicle {
  id: string;
  client_id: string;
  model: string;
  plate: string;
}

export interface DashboardStats {
  vehiclesToday: number;
  incomeToday: number;
  totalIncome: number;
}