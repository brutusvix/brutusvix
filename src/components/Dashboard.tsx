import React, { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Car, 
  Clock, 
  DollarSign,
  BarChart3,
  Filter,
  CheckCircle2,
  Hourglass,
  PlayCircle,
  Calendar
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { useData } from '../DataContext';
import { useAuth } from '../App';
import BookingLinkManager from './BookingLinkManager';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Dashboard() {
  const { appointments, transactions, units } = useData();
  const { user } = useAuth();
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month'>('day');

  const filteredAppointments = appointments.filter(a => {
    if (user?.role === 'LAVADOR') return a.unit_id === user.unit_id;
    return selectedUnit === 'all' || a.unit_id === selectedUnit;
  });

  const filteredTransactions = transactions.filter(t => {
    if (user?.role === 'LAVADOR') return t.unit_id === user.unit_id;
    return selectedUnit === 'all' || t.unit_id === selectedUnit;
  });

  const today = new Date().toLocaleDateString('en-CA');
  
  const getStartDate = () => {
    const d = new Date();
    if (timeFilter === 'week') {
      d.setDate(d.getDate() - 7);
    } else if (timeFilter === 'month') {
      d.setDate(d.getDate() - 30);
    }
    return d.toLocaleDateString('en-CA');
  };

  const startDate = getStartDate();

  const isDateInRange = (dateStr: string) => {
    if (timeFilter === 'day') return dateStr.startsWith(today);
    return dateStr >= startDate && dateStr <= today;
  };

  const appointmentsPeriod = filteredAppointments.filter(a => isDateInRange(a.start_time.split('T')[0]));
  const vehiclesPeriod = appointmentsPeriod.length;
  
  const incomePeriod = filteredTransactions
    .filter(t => t.type === 'INCOME' && isDateInRange(t.date.split('T')[0]))
    .reduce((acc, t) => acc + t.amount, 0);
    
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'INCOME')
    .reduce((acc, t) => acc + t.amount, 0);

  const emAndamento = appointmentsPeriod.filter(a => a.status === 'EM_ANDAMENTO').length;
  const aguardando = appointmentsPeriod.filter(a => a.status === 'AGENDADO').length;
  const finalizado = appointmentsPeriod.filter(a => a.status === 'FINALIZADO').length;

  // Calculate income data for charts based on selected period
  const daysCount = timeFilter === 'month' ? 30 : 7;
  const chartDays = Array.from({ length: daysCount }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (daysCount - 1 - i));
    return d.toLocaleDateString('en-CA');
  });

  const incomeChartData = chartDays.map(date => {
    const dayIncome = filteredTransactions
      .filter(t => t.type === 'INCOME' && t.date.startsWith(date))
      .reduce((acc, t) => acc + t.amount, 0);
    
    const dateObj = new Date(date + 'T12:00:00Z');
    let dayName = '';
    
    if (timeFilter === 'month') {
      dayName = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    } else {
      dayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' });
      dayName = dayName.charAt(0).toUpperCase() + dayName.slice(1).replace('.', '');
    }
    
    return {
      name: dayName,
      valor: dayIncome
    };
  });

  // Calculate services per unit data based on period
  const servicesByUnitData = units.map(u => {
    if (selectedUnit !== 'all' && selectedUnit !== u.id) {
      return { name: u.name, valor: 0 };
    }
    const count = appointmentsPeriod.filter(a => a.unit_id === u.id).length;
    return { name: u.name, valor: count };
  }).filter(item => selectedUnit === 'all' || item.valor > 0);

  const finishedAppointments = appointmentsPeriod.filter(a => a.status === 'FINALIZADO' && a.end_time);
  const avgTime = finishedAppointments.length > 0
    ? Math.round(finishedAppointments.reduce((acc, a) => {
        const start = new Date(a.start_time).getTime();
        const end = new Date(a.end_time!).getTime();
        return acc + (end - start);
      }, 0) / finishedAppointments.length / 60000)
    : 0;

  const periodLabel = timeFilter === 'day' ? 'Hoje' : timeFilter === 'week' ? '7 Dias' : '30 Dias';

  const donoCards = [
    { label: `Veículos (${periodLabel})`, value: vehiclesPeriod, icon: Car },
    { label: `Faturamento (${periodLabel})`, value: `R$ ${incomePeriod.toFixed(2)}`, icon: DollarSign },
    { label: 'Faturamento Total', value: `R$ ${totalIncome.toFixed(2)}`, icon: TrendingUp },
    { label: 'Tempo Médio', value: avgTime > 0 ? `${avgTime} min` : '--', icon: Clock },
  ];

  const lavadorCards = [
    { label: `Faturamento (${periodLabel})`, value: `R$ ${incomePeriod.toFixed(2)}`, icon: DollarSign },
    { label: 'Tempo Médio', value: avgTime > 0 ? `${avgTime} min` : '--', icon: Clock },
    { label: `Veículos (${periodLabel})`, value: vehiclesPeriod, icon: Car },
    { label: 'Em Andamento', value: emAndamento, icon: PlayCircle },
    { label: 'Aguardando', value: aguardando, icon: Hourglass },
    { label: 'Finalizados', value: finalizado, icon: CheckCircle2 },
  ];

  const cards = user?.role === 'LAVADOR' ? lavadorCards : donoCards;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Dashboard</h1>
          <p className="text-sm text-zinc-500 mt-1">Visão geral do seu negócio em tempo real.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
            <select
              className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-lg py-2 pl-9 pr-8 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-700 appearance-none transition-colors hover:bg-zinc-800/50"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as 'day' | 'week' | 'month')}
            >
              <option value="day">Hoje</option>
              <option value="week">Últimos 7 dias</option>
              <option value="month">Últimos 30 dias</option>
            </select>
          </div>
          
          {user?.role === 'DONO' && (
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
              <select
                className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-lg py-2 pl-9 pr-8 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-700 appearance-none transition-colors hover:bg-zinc-800/50"
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
              >
                <option value="all">Todas Unidades</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          )}
          {user?.role === 'DONO' && (
            <button className="bg-zinc-100 text-zinc-950 px-4 py-2 rounded-lg text-sm font-medium hover:bg-white transition-colors flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Relatório
            </button>
          )}
        </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 ${user?.role === 'LAVADOR' ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-4`}>
        {cards.map((card, i) => (
          <div key={i} className="bg-zinc-900/50 backdrop-blur-sm p-5 rounded-2xl border border-zinc-800/50 flex flex-col justify-between h-[120px] relative overflow-hidden group hover:border-zinc-700/60 transition-colors">
            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-zinc-400">{card.label}</span>
              <card.icon className="w-4 h-4 text-zinc-600" strokeWidth={1.5} />
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <h3 className="text-3xl font-semibold text-zinc-100 tracking-tight">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {user?.role !== 'LAVADOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-zinc-900/50 backdrop-blur-sm p-6 rounded-2xl border border-zinc-800/50 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-medium text-zinc-400">Evolução do Faturamento</h3>
            </div>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={incomeChartData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ffffff" stopOpacity={0.05}/>
                      <stop offset="95%" stopColor="#ffffff" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" opacity={0.4} />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#52525b', fontSize: 11}} 
                    dy={10} 
                    minTickGap={timeFilter === 'month' ? 20 : 5}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#52525b', fontSize: 11}} 
                    tickFormatter={(value) => `R$ ${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Faturamento']}
                  />
                  <Area type="monotone" dataKey="valor" stroke="#e4e4e7" strokeWidth={2} fillOpacity={1} fill="url(#colorValor)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-zinc-900/50 backdrop-blur-sm p-6 rounded-2xl border border-zinc-800/50 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-medium text-zinc-400">Serviços por Unidade ({periodLabel})</h3>
            </div>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={servicesByUnitData} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" opacity={0.4} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#52525b', fontSize: 11}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#52525b', fontSize: 11}} />
                  <Tooltip 
                    cursor={{fill: '#18181b'}}
                    contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value: number) => [value, 'Serviços']}
                  />
                  <Bar dataKey="valor" fill="#3f3f46" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
