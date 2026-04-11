import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Appointment, Client, Extra, OperatingHours, ProductionRecord, Service, Transaction, Unit, User, Vehicle } from './types';
import { supabase } from './lib/supabase';

// ─── Tipos do contexto ────────────────────────────────────────────────────────

interface DataContextType {
  units: Unit[];
  services: Service[];
  extras: Extra[];
  clients: Client[];
  vehicles: Vehicle[];
  users: User[];
  appointments: Appointment[];
  transactions: Transaction[];
  production: ProductionRecord[];
  loading: boolean;
  // Clientes
  addClient: (client: Omit<Client, 'id'>) => Promise<Client>;
  updateClient: (id: string, client: Partial<Client>) => Promise<void>;
  // Veículos
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => Promise<Vehicle>;
  // Serviços
  addService: (service: Omit<Service, 'id'>) => Promise<void>;
  updateService: (id: string, service: Partial<Service>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;
  // Extras
  addExtra: (extra: Omit<Extra, 'id'>) => Promise<void>;
  updateExtra: (id: string, extra: Partial<Extra>) => Promise<void>;
  deleteExtra: (id: string) => Promise<void>;
  // Usuários
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, user: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  // Agendamentos
  addAppointment: (appointment: Omit<Appointment, 'id'>) => Promise<void>;
  updateAppointment: (id: string, appointment: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  // Transações
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  // Unidades
  addUnit: (unit: Omit<Unit, 'id' | 'isOpen' | 'operatingHours'>) => Promise<void>;
  updateUnit: (id: string, unit: Partial<Unit>) => Promise<void>;
  deleteUnit: (id: string) => Promise<void>;
  // Produção
  updateProductionStatus: (id: string, status: 'PAGO') => Promise<void>;
  // Utilitários
  refetch: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// ─── Mapeadores Supabase → Tipos locais ───────────────────────────────────────

function mapUnit(row: any): Unit {
  return {
    id: row.id,
    name: row.name,
    address: row.address || '',
    phone: row.phone || '',
    isOpen: row.is_open,
    operatingHours: row.operating_hours || [],
  };
}

function mapUser(row: any): User {
  return {
    id: row.id,
    auth_id: row.auth_id,
    name: row.name,
    email: row.email,
    phone: row.phone || '',
    role: row.role,
    unit_id: row.unit_id,
    tipoPagamento: row.payment_type,
    valorDiaria: row.daily_wage || 0,
    comissaoPercentualServico: row.base_commission_percent || 0,
    valorAlmoco: row.lunch_value || 0,
    valorPassagem: row.transport_value || 0,
    comissoesServico: row.fixed_service_commissions || {},
  };
}

function mapClient(row: any): Client {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone || '',
    unit_id: row.unit_id,
    points: row.points || 0,
    total_spent: row.total_spent || 0,
  };
}

function mapVehicle(row: any): Vehicle {
  return {
    id: row.id,
    client_id: row.client_id,
    model: row.model || '',
    plate: row.plate,
  };
}

function mapService(row: any): Service {
  return {
    id: row.id,
    name: row.name,
    unit_id: row.unit_id,
    duration_minutes: row.duration_minutes || 30,
    active: row.active,
    category: row.category || 'OUTROS',
    prices: {
      HATCH: row.price_hatch || 0,
      SEDAN: row.price_sedan || 0,
      SUV: row.price_suv || 0,
      CAMINHONETE: row.price_pickup || 0,
    },
  };
}

function mapExtra(row: any): Extra {
  return {
    id: row.id,
    name: row.name,
    price: row.price || 0,
    commissionValue: row.commission_value || 0,
  };
}

function mapAppointment(row: any): Appointment {
  return {
    id: row.id,
    client_id: row.client_id,
    service_id: row.service_id,
    unit_id: row.unit_id,
    washer_id: row.washer_id,
    vehicle_type: row.vehicle_type,
    plate: row.plate || '',
    vehicle_model: row.vehicle_model || '',
    // vehicle_color removido - não existe na tabela
    start_time: row.start_time,
    end_time: row.end_time,
    status: row.status,
    total_price: row.total_price,
    extras: row.selected_extras || [],
    client_name: row.client_name,
    photo_url: row.photo_url,
    ai_data: row.ai_data,
  };
}

function mapTransaction(row: any): Transaction {
  return {
    id: row.id,
    unit_id: row.unit_id,
    type: row.type,
    amount: row.amount,
    category: row.category,
    description: row.description || '',
    date: row.date,
    payment_method: row.payment_method,
  };
}

function mapProduction(row: any): ProductionRecord {
  return {
    id: row.id,
    funcionarioId: row.washer_id,
    funcionarioNome: row.washer_name || '',
    unidadeId: row.unit_id,
    clienteNome: row.client_name || '',
    veiculo: row.vehicle_plate || '',
    servico: row.service_name,
    valorServico: row.service_value || 0,
    extras: Array.isArray(row.extras_data)
      ? row.extras_data.map((e: any) => ({ nome: e.nome, valor: e.valor }))
      : [],
    comissaoExtras: row.commission_extras || 0,
    comissaoServico: row.commission_service || 0,
    data: row.date,
    hora: row.hour || '',
    status: row.status,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [units, setUnits]               = useState<Unit[]>([]);
  const [services, setServices]         = useState<Service[]>([]);
  const [extras, setExtras]             = useState<Extra[]>([]);
  const [clients, setClients]           = useState<Client[]>([]);
  const [vehicles, setVehicles]         = useState<Vehicle[]>([]);
  const [users, setUsers]               = useState<User[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [production, setProduction]     = useState<ProductionRecord[]>([]);
  const [loading, setLoading]           = useState(true);

  // ── Carrega todos os dados do Supabase ──────────────────────────────────────
  const fetchAll = useCallback(async () => {
    const startTime = performance.now();
    
    // Tentar carregar do cache primeiro (instantâneo)
    const cachedData = sessionStorage.getItem('app_cache');
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        const cacheAge = Date.now() - parsed.timestamp;
        
        // Se cache tem menos de 5 minutos, usar imediatamente
        if (cacheAge < 5 * 60 * 1000) {
          console.log('⚡ Carregando do cache (instantâneo)');
          setUnits(parsed.units || []);
          setUsers(parsed.users || []);
          setServices(parsed.services || []);
          setExtras(parsed.extras || []);
          setClients(parsed.clients || []);
          setVehicles(parsed.vehicles || []);
          setAppointments(parsed.appointments || []);
          setTransactions(parsed.transactions || []);
          setProduction(parsed.production || []);
          setLoading(false);
          
          // Atualizar em background
          fetchFreshData(false);
          return;
        }
      } catch (e) {
        console.warn('Cache inválido, carregando do servidor');
      }
    }
    
    // Se não tem cache, carregar normalmente
    await fetchFreshData(true);
    
    const endTime = performance.now();
    console.log(`⚡ Dados carregados em ${(endTime - startTime).toFixed(0)}ms`);
  }, []);

  const fetchFreshData = async (showLoading: boolean) => {
    if (showLoading) setLoading(true);
    
    try {
      // Carregar dados essenciais primeiro (super rápido)
      const essentialStart = performance.now();
      const [
        { data: unitsData },
        { data: usersData },
        { data: servicesData },
        { data: extrasData },
      ] = await Promise.all([
        supabase.from('units').select('id,name,address,phone,is_open,operating_hours').is('deleted_at', null).order('name'),
        supabase.from('users').select('id,auth_id,name,email,phone,role,unit_id,payment_type,daily_wage,base_commission_percent,lunch_value,transport_value,fixed_service_commissions').is('deleted_at', null).order('name'),
        supabase.from('services').select('id,name,unit_id,price_hatch,price_sedan,price_suv,price_pickup,duration_minutes,active,category').is('deleted_at', null).eq('active', true).order('name'),
        supabase.from('extras').select('id,name,price,commission_value').eq('active', true).order('name'),
      ]);

      const mappedUnits = unitsData?.map(mapUnit) || [];
      const mappedUsers = usersData?.map(mapUser) || [];
      const mappedServices = servicesData?.map(mapService) || [];
      const mappedExtras = extrasData?.map(mapExtra) || [];

      setUnits(mappedUnits);
      setUsers(mappedUsers);
      setServices(mappedServices);
      setExtras(mappedExtras);

      const essentialEnd = performance.now();
      console.log(`⚡ Dados essenciais: ${(essentialEnd - essentialStart).toFixed(0)}ms`);

      // Liberar loading para mostrar interface
      if (showLoading) setLoading(false);

      // Carregar dados secundários em background (paralelo máximo)
      const secondaryStart = performance.now();
      const now = new Date();
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      
      const [
        { data: clientsData },
        { data: vehiclesData },
        { data: appointmentsData },
        { data: transactionsData },
        { data: productionData },
      ] = await Promise.all([
        supabase.from('clients').select('id,name,phone,unit_id,points,total_spent').order('name').limit(500),
        supabase.from('vehicles').select('id,client_id,model,plate').order('plate').limit(500),
        supabase.from('appointments').select('id,client_id,service_id,unit_id,washer_id,vehicle_type,plate,vehicle_model,start_time,end_time,status,total_price,selected_extras,client_name,photo_url,ai_data')
          .gte('start_time', ninetyDaysAgo)
          .order('start_time', { ascending: false })
          .limit(1000),
        supabase.from('transactions').select('id,unit_id,type,amount,category,description,date,payment_method')
          .gte('date', ninetyDaysAgo)
          .order('date', { ascending: false })
          .limit(1000),
        supabase.from('production_records').select('id,washer_id,unit_id,appointment_id,service_name,service_value,extras_data,commission_service,commission_extras,client_name,vehicle_plate,date,hour,status,extras_service_names,users(name)')
          .gte('date', ninetyDaysAgo)
          .order('date', { ascending: false })
          .limit(1000),
      ]);

      const mappedClients = clientsData?.map(mapClient) || [];
      const mappedVehicles = vehiclesData?.map(mapVehicle) || [];
      const mappedAppointments = appointmentsData?.map(mapAppointment) || [];
      const mappedTransactions = transactionsData?.map(mapTransaction) || [];
      const mappedProduction = productionData?.map(row => mapProduction({ ...row, washer_name: row.users?.name })) || [];

      setClients(mappedClients);
      setVehicles(mappedVehicles);
      setAppointments(mappedAppointments);
      setTransactions(mappedTransactions);
      setProduction(mappedProduction);

      const secondaryEnd = performance.now();
      console.log(`⚡ Dados secundários: ${(secondaryEnd - secondaryStart).toFixed(0)}ms`);

      // Salvar no cache
      const cacheData = {
        timestamp: Date.now(),
        units: mappedUnits,
        users: mappedUsers,
        services: mappedServices,
        extras: mappedExtras,
        clients: mappedClients,
        vehicles: mappedVehicles,
        appointments: mappedAppointments,
        transactions: mappedTransactions,
        production: mappedProduction,
      };
      
      try {
        sessionStorage.setItem('app_cache', JSON.stringify(cacheData));
        console.log('💾 Cache atualizado');
      } catch (e) {
        console.warn('Cache cheio, limpando...');
        sessionStorage.clear();
      }
      
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Limpar cache ao desmontar (logout)
  useEffect(() => {
    return () => {
      // Não limpar cache ao desmontar, apenas em logout explícito
    };
  }, []);

  // ── Realtime: atualiza dados ao vivo ────────────────────────────────────────
  useEffect(() => {
    const channels = [
      supabase.channel('units-changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'units' }, (p) => setUnits(prev => {
          if (prev.some(u => u.id === p.new.id)) return prev;
          return [...prev, mapUnit(p.new)];
        }))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'units' }, (p) => setUnits(prev => prev.map(u => u.id === p.new.id ? mapUnit(p.new) : u)))
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'units' }, (p) => setUnits(prev => prev.filter(u => u.id !== p.old.id)))
        .subscribe(),

      supabase.channel('services-changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'services' }, (p) => setServices(prev => {
          if (prev.some(s => s.id === p.new.id)) return prev;
          return [...prev, mapService(p.new)];
        }))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'services' }, (p) => setServices(prev => prev.map(s => s.id === p.new.id ? mapService(p.new) : s)))
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'services' }, (p) => setServices(prev => prev.filter(s => s.id !== p.old.id)))
        .subscribe(),

      supabase.channel('extras-changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'extras' }, (p) => setExtras(prev => {
          if (prev.some(e => e.id === p.new.id)) return prev;
          return [...prev, mapExtra(p.new)];
        }))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'extras' }, (p) => setExtras(prev => prev.map(e => e.id === p.new.id ? mapExtra(p.new) : e)))
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'extras' }, (p) => setExtras(prev => prev.filter(e => e.id !== p.old.id)))
        .subscribe(),

      supabase.channel('clients-changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'clients' }, (p) => setClients(prev => {
          if (prev.some(c => c.id === p.new.id)) return prev;
          return [...prev, mapClient(p.new)];
        }))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'clients' }, (p) => setClients(prev => prev.map(c => c.id === p.new.id ? mapClient(p.new) : c)))
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'clients' }, (p) => setClients(prev => prev.filter(c => c.id !== p.old.id)))
        .subscribe(),

      supabase.channel('vehicles-changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'vehicles' }, (p) => setVehicles(prev => {
          if (prev.some(v => v.id === p.new.id)) return prev;
          return [...prev, mapVehicle(p.new)];
        }))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'vehicles' }, (p) => setVehicles(prev => prev.map(v => v.id === p.new.id ? mapVehicle(p.new) : v)))
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'vehicles' }, (p) => setVehicles(prev => prev.filter(v => v.id !== p.old.id)))
        .subscribe(),

      supabase.channel('users-changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'users' }, (p) => setUsers(prev => {
          if (prev.some(u => u.id === p.new.id)) return prev;
          return [...prev, mapUser(p.new)];
        }))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users' }, (p) => setUsers(prev => prev.map(u => u.id === p.new.id ? mapUser(p.new) : u)))
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'users' }, (p) => setUsers(prev => prev.filter(u => u.id !== p.old.id)))
        .subscribe(),

      supabase.channel('appointments-changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'appointments' }, (p) => setAppointments(prev => {
          if (prev.some(a => a.id === p.new.id)) return prev;
          return [mapAppointment(p.new), ...prev];
        }))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'appointments' }, (p) => setAppointments(prev => prev.map(a => a.id === p.new.id ? mapAppointment(p.new) : a)))
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'appointments' }, (p) => setAppointments(prev => prev.filter(a => a.id !== p.old.id)))
        .subscribe(),

      supabase.channel('transactions-changes')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'transactions' }, (p) => setTransactions(prev => {
          if (prev.some(t => t.id === p.new.id)) return prev;
          return [mapTransaction(p.new), ...prev];
        }))
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'transactions' }, (p) => setTransactions(prev => prev.map(t => t.id === p.new.id ? mapTransaction(p.new) : t)))
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'transactions' }, (p) => setTransactions(prev => prev.filter(t => t.id !== p.old.id)))
        .subscribe(),

      supabase.channel('production-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'production_records' }, async () => {
          const { data } = await supabase.from('production_records').select('*, users(name)').order('date', { ascending: false });
          if (data) setProduction(data.map(row => mapProduction({ ...row, washer_name: row.users?.name })));
        })
        .subscribe(),
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // CLIENTES
  // ─────────────────────────────────────────────────────────────────────────────

  const addClient = async (client: Omit<Client, 'id'>): Promise<Client> => {
    // Check if client with this phone already exists
    const { data: existing, error: searchError } = await supabase
      .from('clients')
      .select('*')
      .eq('phone', client.phone)
      .maybeSingle();

    if (searchError) {
      console.error('Erro ao buscar cliente existente:', searchError);
      throw new Error(`Erro ao verificar cliente: ${searchError.message}`);
    }

    if (existing) {
      return mapClient(existing);
    }

    const { data, error } = await supabase
      .from('clients')
      .insert({ name: client.name, phone: client.phone, unit_id: client.unit_id, points: 0, total_spent: 0 })
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar cliente:', error);
      throw new Error(`Erro ao criar cliente: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('Cliente criado mas nenhum dado foi retornado');
    }
    
    const newClient = mapClient(data);
    setClients(prev => {
      if (prev.some(c => c.id === newClient.id)) return prev;
      return [...prev, newClient];
    });
    return newClient;
  };

  const updateClient = async (id: string, fields: Partial<Client>) => {
    const { error } = await supabase.from('clients').update({
      name: fields.name,
      phone: fields.phone,
      points: fields.points,
      total_spent: fields.total_spent,
    }).eq('id', id);
    if (error) throw error;
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...fields } : c));
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // VEÍCULOS
  // ─────────────────────────────────────────────────────────────────────────────

  const addVehicle = async (vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> => {
    // Check if vehicle with this plate already exists
    const { data: existing, error: searchError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('plate', vehicle.plate)
      .maybeSingle();

    if (searchError) {
      console.error('Erro ao buscar veículo existente:', searchError);
      throw new Error(`Erro ao verificar veículo: ${searchError.message}`);
    }

    if (existing) {
      return mapVehicle(existing);
    }

    const { data, error } = await supabase
      .from('vehicles')
      .insert({ client_id: vehicle.client_id, model: vehicle.model, plate: vehicle.plate })
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao criar veículo:', error);
      throw new Error(`Erro ao criar veículo: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('Veículo criado mas nenhum dado foi retornado');
    }
    
    const newVehicle = mapVehicle(data);
    setVehicles(prev => {
      if (prev.some(v => v.id === newVehicle.id)) return prev;
      return [...prev, newVehicle];
    });
    return newVehicle;
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // SERVIÇOS
  // ─────────────────────────────────────────────────────────────────────────────

  const addService = async (service: Omit<Service, 'id'>) => {
    const { data, error } = await supabase.from('services').insert({
      name: service.name,
      unit_id: service.unit_id,
      price_hatch: service.prices.HATCH,
      price_sedan: service.prices.SEDAN,
      price_suv: service.prices.SUV,
      price_pickup: service.prices.CAMINHONETE,
      duration_minutes: service.duration_minutes,
      active: true,
    }).select().single();
    if (error) throw error;
    const newService = mapService(data);
    setServices(prev => {
      if (prev.some(s => s.id === newService.id)) return prev;
      return [...prev, newService];
    });
  };

  const updateService = async (id: string, fields: Partial<Service>) => {
    const updateData: any = {};
    if (fields.name)             updateData.name             = fields.name;
    if (fields.duration_minutes) updateData.duration_minutes = fields.duration_minutes;
    if (fields.active !== undefined) updateData.active       = fields.active;
    if (fields.prices) {
      updateData.price_hatch   = fields.prices.HATCH;
      updateData.price_sedan   = fields.prices.SEDAN;
      updateData.price_suv     = fields.prices.SUV;
      updateData.price_pickup  = fields.prices.CAMINHONETE;
    }
    const { error } = await supabase.from('services').update(updateData).eq('id', id);
    if (error) throw error;
    setServices(prev => prev.map(s => s.id === id ? { ...s, ...fields } : s));
  };

  const deleteService = async (id: string) => {
    // Soft delete
    const { error } = await supabase.from('services').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    setServices(prev => prev.filter(s => s.id !== id));
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // EXTRAS
  // ─────────────────────────────────────────────────────────────────────────────

  const addExtra = async (extra: Omit<Extra, 'id'>) => {
    const { data, error } = await supabase.from('extras').insert({
      name: extra.name,
      price: extra.price,
      commission_value: extra.commissionValue,
      active: true,
    }).select().single();
    if (error) throw error;
    const newExtra = mapExtra(data);
    setExtras(prev => {
      if (prev.some(e => e.id === newExtra.id)) return prev;
      return [...prev, newExtra];
    });
  };

  const updateExtra = async (id: string, fields: Partial<Extra>) => {
    const { error } = await supabase.from('extras').update({
      name: fields.name,
      price: fields.price,
      commission_value: fields.commissionValue,
    }).eq('id', id);
    if (error) throw error;
    setExtras(prev => prev.map(e => e.id === id ? { ...e, ...fields } : e));
  };

  const deleteExtra = async (id: string) => {
    const { error } = await supabase.from('extras').update({ active: false }).eq('id', id);
    if (error) throw error;
    setExtras(prev => prev.filter(e => e.id !== id));
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // USUÁRIOS
  // ─────────────────────────────────────────────────────────────────────────────
  const addUser = async (user: Omit<User, 'id'>) => {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(user)
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Erro ao criar usuário');
    }
    
    const newUser = await response.json();
    setUsers(prev => {
      if (prev.some(u => u.id === newUser.id)) return prev;
      return [...prev, mapUser(newUser)];
    });
  };

  const updateUser = async (id: string, fields: Partial<User>) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/users/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(fields)
    });
    
    if (!response.ok) {
      let errorMessage = 'Erro ao atualizar usuário';
      try {
        const err = await response.json();
        errorMessage = err.error || errorMessage;
        // Se houver informações de debug, mostrar no console
        if (err.debug) {
          console.error('Debug info:', err.debug);
        }
      } catch {
        // Se não for JSON, usar o texto da resposta
        const text = await response.text();
        errorMessage = text || `Erro ${response.status}: ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    const updatedUser = await response.json();
    setUsers(prev => prev.map(u => u.id === id ? mapUser(updatedUser) : u));
  };

  const deleteUser = async (id: string) => {
    const token = localStorage.getItem('token');
    const response = await fetch(`/api/users/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Erro ao excluir usuário');
    }
    
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // AGENDAMENTOS
  // ─────────────────────────────────────────────────────────────────────────────

  const addAppointment = async (appointment: Omit<Appointment, 'id'>) => {
    const { data, error } = await supabase.from('appointments').insert({
      client_id: appointment.client_id || null,
      service_id: appointment.service_id,
      unit_id: appointment.unit_id,
      washer_id: appointment.washer_id || null,
      vehicle_type: appointment.vehicle_type,
      plate: appointment.plate,
      vehicle_model: appointment.vehicle_model,
      // vehicle_color removido - não existe na tabela
      start_time: appointment.start_time,
      end_time: appointment.end_time || null,
      status: appointment.status || 'AGENDADO',
      total_price: appointment.total_price || 0,
      selected_extras: appointment.extras || [],
      client_name: appointment.client_name || null,
      photo_url: appointment.photo_url || null,
      ai_data: appointment.ai_data || null,
    }).select().single();
    
    if (error) {
      console.error('Erro ao criar agendamento:', error);
      throw new Error(`Erro ao criar agendamento: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('Agendamento criado mas nenhum dado foi retornado');
    }
    
    const newAppt = mapAppointment(data);
    setAppointments(prev => {
      if (prev.some(a => a.id === newAppt.id)) return prev;
      return [newAppt, ...prev];
    });
  };

  const updateAppointment = async (id: string, fields: Partial<Appointment>) => {
    const updateData: any = {};
    if (fields.status !== undefined)                       updateData.status                = fields.status;
    if (fields.washer_id !== undefined)                    updateData.washer_id             = fields.washer_id;
    if (fields.end_time !== undefined)                     updateData.end_time              = fields.end_time;
    if (fields.total_price !== undefined)                  updateData.total_price           = fields.total_price;
    if (fields.extras !== undefined)                       updateData.selected_extras       = fields.extras;
    if (fields.photo_url !== undefined)                    updateData.photo_url             = fields.photo_url;
    if (fields.ai_data !== undefined)                      updateData.ai_data               = fields.ai_data;
    if ((fields as any).service_extras_sold !== undefined) updateData.service_extras_sold   = (fields as any).service_extras_sold;

    // Ao finalizar, define end_time se não informado
    if (fields.status === 'FINALIZADO' && !fields.end_time) {
      updateData.end_time = new Date().toISOString();
    }

    const { error } = await supabase.from('appointments').update(updateData).eq('id', id);
    if (error) throw error;
    // O trigger fn_finalize_appointment no Supabase cuida do restante (produção, financeiro, pontos)
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, ...fields } : a));
  };

  const deleteAppointment = async (id: string) => {
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) throw error;
    setAppointments(prev => prev.filter(a => a.id !== id));
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // TRANSAÇÕES
  // ─────────────────────────────────────────────────────────────────────────────

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    const token = localStorage.getItem('token');
    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(transaction)
    });
    
    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Erro ao criar transação');
    }
    
    const data = await response.json();
    const newTransaction = mapTransaction(data);
    setTransactions(prev => {
      if (prev.some(t => t.id === newTransaction.id)) return prev;
      return [newTransaction, ...prev];
    });
  };

  const updateTransaction = async (id: string, fields: Partial<Transaction>) => {
    const { error } = await supabase.from('transactions').update({
      type: fields.type,
      amount: fields.amount,
      description: fields.description,
      category: fields.category,
      date: fields.date,
    }).eq('id', id);
    if (error) throw error;
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...fields } : t));
  };

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw error;
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // UNIDADES
  // ─────────────────────────────────────────────────────────────────────────────

  const defaultOperatingHours: OperatingHours[] = [
    { day: 'Segunda-feira', open: '08:00', close: '18:00', isOpen: true },
    { day: 'Terça-feira',   open: '08:00', close: '18:00', isOpen: true },
    { day: 'Quarta-feira',  open: '08:00', close: '18:00', isOpen: true },
    { day: 'Quinta-feira',  open: '08:00', close: '18:00', isOpen: true },
    { day: 'Sexta-feira',   open: '08:00', close: '18:00', isOpen: true },
    { day: 'Sábado',        open: '08:00', close: '14:00', isOpen: true },
    { day: 'Domingo',       open: '08:00', close: '12:00', isOpen: false },
  ];

  const addUnit = async (unit: Omit<Unit, 'id' | 'isOpen' | 'operatingHours'>) => {
    const { data, error } = await supabase.from('units').insert({
      name: unit.name,
      address: unit.address,
      phone: unit.phone || null,
      is_open: true,
      operating_hours: defaultOperatingHours,
    }).select().single();
    if (error) throw error;
    const newUnit = mapUnit(data);
    setUnits(prev => {
      if (prev.some(u => u.id === newUnit.id)) return prev;
      return [...prev, newUnit];
    });
  };

  const updateUnit = async (id: string, fields: Partial<Unit>) => {
    const updateData: any = {};
    if (fields.name !== undefined)             updateData.name             = fields.name;
    if (fields.address !== undefined)          updateData.address          = fields.address;
    if (fields.phone !== undefined)            updateData.phone            = fields.phone;
    if (fields.isOpen !== undefined)           updateData.is_open          = fields.isOpen;
    if (fields.operatingHours !== undefined)   updateData.operating_hours  = fields.operatingHours;

    const { error } = await supabase.from('units').update(updateData).eq('id', id);
    if (error) throw error;
    setUnits(prev => prev.map(u => u.id === id ? { ...u, ...fields } : u));
  };

  const deleteUnit = async (id: string) => {
    const { error } = await supabase.from('units').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    setUnits(prev => prev.filter(u => u.id !== id));
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // PRODUÇÃO
  // ─────────────────────────────────────────────────────────────────────────────

  const updateProductionStatus = async (id: string, status: 'PAGO') => {
    const { error } = await supabase.from('production_records').update({ status }).eq('id', id);
    if (error) throw error;
    setProduction(prev => prev.map(p => p.id === id ? { ...p, status } : p));
  };

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <DataContext.Provider value={{
      units, services, extras, clients, vehicles, users,
      appointments, transactions, production, loading,
      addClient, updateClient,
      addVehicle,
      addService, updateService, deleteService,
      addExtra, updateExtra, deleteExtra,
      addUser, updateUser, deleteUser,
      addAppointment, updateAppointment, deleteAppointment,
      addTransaction, updateTransaction, deleteTransaction,
      addUnit, updateUnit, deleteUnit,
      updateProductionStatus,
      refetch: fetchAll,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};