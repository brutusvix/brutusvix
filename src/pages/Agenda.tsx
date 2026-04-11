import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon, Clock, Plus, Search,
  MoreVertical, CheckCircle2, XCircle, AlertCircle, Car,
  ChevronLeft, ChevronRight, Palette, Hash, Wrench, Package, Trash2
} from 'lucide-react';
import { IMaskInput } from 'react-imask';
import { useData } from '../DataContext';
import { useAuth } from '../App';
import { supabase } from '../lib/supabase';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const VEHICLE_LABELS: Record<string, string> = {
  HATCH: 'Hatch', SEDAN: 'Sedan', SUV: 'SUV', CAMINHONETE: 'Caminhonete',
  MOTO_PEQUENA: 'Moto Pequena', MOTO_GRANDE: 'Moto Grande',
};

const DAYS_PT   = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                   'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const MONTHS_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

function calcPrice(service: any, vt: string): number {
  if (!service) return 0;
  switch (vt) {
    case 'HATCH':        return service.prices?.HATCH       ?? service.price_hatch  ?? 0;
    case 'SEDAN':        return service.prices?.SEDAN       ?? service.price_sedan  ?? 0;
    case 'SUV':          return service.prices?.SUV         ?? service.price_suv    ?? 0;
    case 'CAMINHONETE':  return service.prices?.CAMINHONETE ?? service.price_pickup ?? 0;
    case 'MOTO_PEQUENA':
    case 'MOTO_GRANDE':  return service.prices?.HATCH       ?? service.price_hatch  ?? 0;
    default:             return service.prices?.HATCH       ?? service.price_hatch  ?? 0;
  }
}

function getWeekDays(ref: Date): Date[] {
  const mon = new Date(ref);
  mon.setDate(ref.getDate() - ((ref.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate();
}

const STATUS_CFG: Record<string, { color: string; bg: string; border: string; label: string; bar: string }> = {
  AGENDADO:     { color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    label: 'Agendado',     bar: 'bg-blue-500' },
  EM_ANDAMENTO: { color: 'text-orange-400',  bg: 'bg-orange-500/10',  border: 'border-orange-500/30',  label: 'Em Andamento', bar: 'bg-orange-500' },
  FINALIZADO:   { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', label: 'Finalizado',   bar: 'bg-emerald-500' },
  CANCELADO:    { color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30',     label: 'Cancelado',    bar: 'bg-red-500' },
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Agenda() {
  const {
    appointments, clients, services, extras,
    units, users, addAppointment, updateAppointment, deleteAppointment, updateClient, refetch,
    addTransaction,
  } = useData();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm]       = useState('');
  const [selectedUnit, setSelectedUnit]   = useState<string>('all');
  const [weekRef, setWeekRef]             = useState(new Date());
  const [selectedDay, setSelectedDay]     = useState(new Date());
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [paymentAppt, setPaymentAppt]     = useState<any>(null);
  const [extraAppt, setExtraAppt]         = useState<any>(null);
  const [selExtras, setSelExtras]         = useState<string[]>([]);
  const [bookingError, setBookingError]   = useState<string | null>(null);
  const [openMenuId, setOpenMenuId]       = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<any>(null);
  const [showEditDateModal, setShowEditDateModal] = useState(false);
  const [selectedAppointments, setSelectedAppointments] = useState<string[]>([]);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkEditDate, setBulkEditDate] = useState('');
  const [showBulkEditUnitModal, setShowBulkEditUnitModal] = useState(false);
  const [bulkEditUnit, setBulkEditUnit] = useState('');
  const [showBulkEditWasherModal, setShowBulkEditWasherModal] = useState(false);
  const [bulkEditWasher, setBulkEditWasher] = useState('');
  
  // Estados para novo sistema de pagamento
  const [payments, setPayments] = useState<Record<string, number>>({
    DINHEIRO: 0,
    CARTAO_DEBITO: 0,
    CARTAO_CREDITO: 0,
    LINK_PAGAMENTO: 0,
    PIX: 0
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [paymentValue, setPaymentValue] = useState('');
  const [showPixQR, setShowPixQR] = useState(false);

  const weekDays = useMemo(() => getWeekDays(weekRef), [weekRef]);
  const today    = useMemo(() => new Date(), []);

  // ── Realtime ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const ch = supabase
      .channel('agenda-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
        refetch();
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch]);

  // ── Filtros ───────────────────────────────────────────────────────────────
  const allFiltered = useMemo(() => appointments.filter(a => {
    const name  = clients.find(c => c.id === a.client_id)?.name ?? a.client_name ?? '';
    const plate = (a.plate ?? a.vehicle_plate ?? '').toUpperCase();
    const matchSearch = !searchTerm ||
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plate.includes(searchTerm.toUpperCase());
    if (!matchSearch) return false;
    if (user?.role === 'LAVADOR') return a.unit_id === user.unit_id;
    return selectedUnit === 'all' || a.unit_id === selectedUnit;
  }), [appointments, clients, searchTerm, selectedUnit, user]);

  const dayAppts = useMemo(() =>
    allFiltered
      .filter(a => sameDay(new Date(a.start_time), selectedDay))
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()),
  [allFiltered, selectedDay]);

  const countByDay = useMemo(() => {
    const m: Record<string, number> = {};
    weekDays.forEach(d => {
      m[d.toLocaleDateString('en-CA')] =
        allFiltered.filter(a => sameDay(new Date(a.start_time), d)).length;
    });
    return m;
  }, [allFiltered, weekDays]);

  // ── Form novo agendamento ─────────────────────────────────────────────────
  const emptyAppt = {
    client_id: '', service_id: '',
    unit_id: user?.unit_id ?? units[0]?.id ?? '',
    washer_id: '', start_time: '', plate: '',
    vehicle_type: 'HATCH', vehicle_model: '', vehicle_color: '',
    status: 'AGENDADO' as const,
  };
  const [newAppt, setNewAppt] = useState(emptyAppt);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppt.client_id || !newAppt.service_id || !newAppt.start_time) return;
    const ms = new Date(newAppt.start_time).getTime();
    const busy = appointments.filter(a =>
      a.unit_id === newAppt.unit_id &&
      new Date(a.start_time).getTime() === ms &&
      a.status !== 'CANCELADO'
    ).length;
    if (busy >= 2) { setBookingError('Horário com 2 agendamentos.'); return; }
    setBookingError(null);
    
    // Calcular o preço total e pegar o nome do cliente
    const selectedService = services.find(s => s.id === newAppt.service_id);
    const selectedClient = clients.find(c => c.id === newAppt.client_id);
    const totalPrice = calcPrice(selectedService, newAppt.vehicle_type);
    
    addAppointment({
      ...newAppt,
      washer_id: newAppt.washer_id || undefined,
      end_time:  new Date(ms + 90 * 60_000).toISOString(),
      total_price: totalPrice,
      client_name: selectedClient?.name, // Salvar nome como fallback
    });
    setIsModalOpen(false);
    setNewAppt(emptyAppt);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Agenda</h1>
          <p className="text-zinc-500 text-sm">Agendamentos da semana com detalhes completos do veículo.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-zinc-100 text-zinc-950 px-4 py-2 rounded-xl text-sm font-bold hover:bg-white transition-colors flex items-center gap-2 self-start"
          >
            <Plus size={16} /> Novo Agendamento
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input
            type="text"
            placeholder="Buscar por cliente ou placa..."
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2.5 pl-9 pr-4 text-zinc-300 focus:outline-none text-sm"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        {user?.role === 'DONO' && (
          <select
            className="bg-zinc-900/50 border border-zinc-800 rounded-xl py-2.5 px-4 text-zinc-300 text-sm appearance-none"
            value={selectedUnit}
            onChange={e => setSelectedUnit(e.target.value)}
          >
            <option value="all">Todas Unidades</option>
            {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        )}
      </div>

      {/* ── Navegação semanal ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        {/* Cabeçalho da semana */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setWeekRef(d => { const n = new Date(d); n.setDate(d.getDate() - 7); return n; })}
            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="text-center">
            <p className="font-bold text-zinc-100 text-sm">
              {weekDays[0] && `${weekDays[0].getDate()} ${MONTHS_SHORT[weekDays[0].getMonth()]}`}
              {' — '}
              {weekDays[6] && `${weekDays[6].getDate()} ${MONTHS_SHORT[weekDays[6].getMonth()]} ${weekDays[6].getFullYear()}`}
            </p>
            <button
              onClick={() => { setWeekRef(new Date()); setSelectedDay(new Date()); }}
              className="text-xs text-zinc-500 hover:text-brand-primary transition-colors mt-0.5"
            >
              Ir para hoje
            </button>
          </div>

          <button
            onClick={() => setWeekRef(d => { const n = new Date(d); n.setDate(d.getDate() + 7); return n; })}
            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Dias Seg–Dom */}
        <div className="grid grid-cols-7 gap-1">
          {weekDays.map(day => {
            const key     = day.toLocaleDateString('en-CA');
            const count   = countByDay[key] ?? 0;
            const isToday = sameDay(day, today);
            const isSel   = sameDay(day, selectedDay);

            return (
              <button
                key={key}
                onClick={() => setSelectedDay(day)}
                className={`flex flex-col items-center py-2.5 px-1 rounded-xl transition-all ${
                  isSel
                    ? 'bg-brand-primary'
                    : isToday
                      ? 'bg-zinc-800 border border-zinc-700'
                      : 'hover:bg-zinc-800/50'
                }`}
              >
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isSel ? 'text-zinc-950' : 'text-zinc-500'}`}>
                  {DAYS_PT[day.getDay()]}
                </span>
                <span className={`text-lg font-black mt-0.5 leading-none ${isSel ? 'text-zinc-950' : isToday ? 'text-zinc-100' : 'text-zinc-400'}`}>
                  {day.getDate()}
                </span>
                {count > 0 && (
                  <span className={`text-[10px] font-black mt-1 px-1.5 py-0.5 rounded-full leading-none ${
                    isSel ? 'bg-zinc-950/20 text-zinc-950' : 'bg-zinc-700 text-zinc-300'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Título do dia selecionado */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-bold text-zinc-100 text-base">
            {sameDay(selectedDay, today) ? 'Hoje — ' : ''}
            {DAYS_PT[selectedDay.getDay()]}, {selectedDay.getDate()} de {MONTHS_PT[selectedDay.getMonth()]}
          </h2>
          <p className="text-zinc-500 text-sm mt-0.5">
            {dayAppts.length === 0
              ? 'Nenhum agendamento neste dia'
              : `${dayAppts.length} agendamento${dayAppts.length > 1 ? 's' : ''}`}
          </p>
        </div>
        {dayAppts.length > 0 && user?.role === 'DONO' && (
          <div className="flex items-center gap-3">
            {selectedAppointments.length > 0 ? (
              <>
                <button
                  onClick={() => {
                    setBulkEditDate(selectedDay.toISOString().split('T')[0]);
                    setShowBulkEditModal(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <CalendarIcon size={14} />
                  Editar Data
                </button>
                <button
                  onClick={() => {
                    setBulkEditUnit(selectedUnit === 'all' ? units[0]?.id : selectedUnit);
                    setShowBulkEditUnitModal(true);
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  Mudar Unidade
                </button>
                <button
                  onClick={() => {
                    setBulkEditWasher('');
                    setShowBulkEditWasherModal(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  Atribuir Lavador
                </button>
                <span className="text-xs text-zinc-400 font-medium">
                  {selectedAppointments.length} selecionado{selectedAppointments.length > 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => setSelectedAppointments([])}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Limpar
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  if (selectedAppointments.length === dayAppts.length) {
                    setSelectedAppointments([]);
                  } else {
                    setSelectedAppointments(dayAppts.map(a => a.id));
                  }
                }}
                className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors flex items-center gap-1"
              >
                <input 
                  type="checkbox" 
                  checked={selectedAppointments.length === dayAppts.length && dayAppts.length > 0}
                  onChange={() => {}}
                  className="rounded"
                />
                Selecionar todos
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Cards de agendamento ── */}
      <div className="space-y-3">
        {dayAppts.length === 0 && (
          <div className="text-center py-14 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl">
            <CalendarIcon className="w-10 h-10 text-zinc-700 mx-auto mb-3" strokeWidth={1.5} />
            <p className="text-zinc-500 font-medium">Nenhum agendamento neste dia</p>
            <p className="text-zinc-600 text-sm mt-1">Clique em "Novo Agendamento" para adicionar.</p>
          </div>
        )}

        {dayAppts.map(appt => {
          const client    = clients.find(c => c.id === appt.client_id);
          const service   = services.find(s => s.id === appt.service_id);
          const unit      = units.find(u => u.id === appt.unit_id);
          const staff     = users.find(u => u.id === appt.washer_id);
          const extList   = extras.filter(e =>
            (appt.extras ?? appt.selected_extras ?? []).includes(e.id)
          );
          const st        = STATUS_CFG[appt.status] ?? STATUS_CFG.AGENDADO;
          const price     = appt.total_price ?? calcPrice(service, appt.vehicle_type);
          const clientName = client?.name ?? appt.client_name ?? 'Cliente';
          const plate      = (appt.plate ?? appt.vehicle_plate ?? '').toUpperCase();
          const vtype      = VEHICLE_LABELS[appt.vehicle_type] ?? appt.vehicle_type ?? '';
          const model      = appt.vehicle_model ?? '';
          const color      = appt.vehicle_color ?? '';
          const phone      = client?.phone ?? '';
          const isSelected = selectedAppointments.includes(appt.id);

          return (
            <div
              key={appt.id}
              className={`bg-zinc-900 border rounded-2xl overflow-hidden transition-all hover:border-zinc-700 ${
                appt.status === 'CANCELADO' ? 'border-zinc-800/30 opacity-40' : 
                isSelected ? 'border-brand-primary ring-2 ring-brand-primary/20' : 'border-zinc-800'
              }`}
            >
              {/* Barra de status colorida */}
              <div className={`h-1 w-full ${st.bar}`} />

              <div className="p-5 space-y-4">

                {/* Linha 1: checkbox | cliente | preço | menu */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {user?.role === 'DONO' && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          if (isSelected) {
                            setSelectedAppointments(prev => prev.filter(id => id !== appt.id));
                          } else {
                            setSelectedAppointments(prev => [...prev, appt.id]);
                          }
                        }}
                        className="mt-1 w-4 h-4 rounded border-zinc-700 text-brand-primary focus:ring-brand-primary focus:ring-offset-zinc-900"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-zinc-100 text-base">{clientName}</h3>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${st.color} ${st.bg} ${st.border}`}>
                          {st.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-zinc-400 text-sm">
                          <Clock size={13} className="text-zinc-500" />
                          {new Date(appt.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {phone && (
                          <a
                            href={`https://wa.me/55${phone.replace(/\D/g, '')}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-xs text-emerald-500 hover:text-emerald-400 font-medium transition-colors"
                          >
                            💬 {phone}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 shrink-0">
                    <div className="text-right">
                      <p className="text-xl font-black text-zinc-100">R$ {price.toFixed(2)}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{unit?.name ?? '—'}</p>
                    </div>

                    {/* Menu de ações */}
                    <div className="relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === appt.id ? null : appt.id);
                        }}
                        className="p-3 -m-1 hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors mt-0.5"
                      >
                        <MoreVertical size={20} />
                      </button>
                      {openMenuId === appt.id && (
                        <>
                          {/* Backdrop to close menu */}
                          <div 
                            className="fixed inset-0 z-40" 
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div className="absolute right-0 top-full mt-1 w-52 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                            {appt.status === 'AGENDADO' && (
                              <button
                                onClick={() => {
                                  updateAppointment(appt.id, {
                                    status: 'EM_ANDAMENTO',
                                    // Auto-atribui o lavador logado ao iniciar
                                    ...(user?.role === 'LAVADOR' && !appt.washer_id ? { washer_id: user.id } : {})
                                  });
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2 border-b border-zinc-800"
                              >
                                <AlertCircle size={14} className="text-orange-400" /> Iniciar Serviço
                              </button>
                            )}
                            {user?.role === 'DONO' && (
                              <div className="border-b border-zinc-800">
                                <p className="px-4 py-2 text-[10px] font-bold text-zinc-600 uppercase tracking-wider">Mudar Unidade</p>
                                {units.map(u => (
                                  <button
                                    key={u.id}
                                    onClick={() => {
                                      updateAppointment(appt.id, { unit_id: u.id });
                                      setOpenMenuId(null);
                                    }}
                                    className={`w-full text-left px-4 py-2 text-sm hover:bg-zinc-800 flex items-center gap-2 ${
                                      appt.unit_id === u.id ? 'text-brand-primary font-bold' : 'text-zinc-400'
                                    }`}
                                  >
                                    {appt.unit_id === u.id && '✓'} {u.name}
                                  </button>
                                ))}
                              </div>
                            )}
                            {client && (
                              <button
                                onClick={() => {
                                  setEditingClient(client);
                                  setShowEditClientModal(true);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2 border-b border-zinc-800"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                                Editar Cliente
                              </button>
                            )}
                            {user?.role === 'DONO' && (
                              <button
                                onClick={() => {
                                  setEditingAppointment(appt);
                                  setShowEditDateModal(true);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2 border-b border-zinc-800"
                              >
                                <CalendarIcon size={14} className="text-zinc-400" />
                                Editar Data/Hora
                              </button>
                            )}
                            {phone && (
                              <a
                                href={`https://wa.me/55${phone.replace(/\D/g,'')}?text=${encodeURIComponent(`Olá ${clientName}, seu veículo está pronto! 🚗✨`)}`}
                                target="_blank" rel="noopener noreferrer"
                                onClick={() => setOpenMenuId(null)}
                                className="block px-4 py-3 text-sm text-emerald-400 hover:bg-zinc-800 border-b border-zinc-800"
                              >
                                💬 Notificar via WhatsApp
                              </a>
                            )}
                            {(appt.status === 'AGENDADO' || appt.status === 'EM_ANDAMENTO') && (
                              <button
                                onClick={() => {
                                  setPaymentAppt(appt);
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 flex items-center gap-2 border-b border-zinc-800"
                              >
                                <CheckCircle2 size={14} className="text-brand-primary" /> Finalizar + Pagamento
                              </button>
                            )}
                            {appt.status === 'AGENDADO' && (
                              <button
                                onClick={() => {
                                  updateAppointment(appt.id, { status: 'CANCELADO' });
                                  setOpenMenuId(null);
                                }}
                                className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-zinc-800 flex items-center gap-2 border-b border-zinc-800"
                              >
                                <XCircle size={14} /> Cancelar
                              </button>
                            )}
                            {/* Opção de excluir - disponível para todos os status */}
                            <button
                              onClick={() => {
                                if (confirm(`Tem certeza que deseja excluir este agendamento?\n\nCliente: ${clientName}\nPlaca: ${plate}\n\nEsta ação não pode ser desfeita.`)) {
                                  deleteAppointment(appt.id);
                                  setOpenMenuId(null);
                                }
                              }}
                              className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-2"
                            >
                              <Trash2 size={14} /> Excluir Agendamento
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Grid 4 colunas: tipo | placa | modelo | cor */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { icon: <Car size={11} />,     label: 'Tipo',   value: vtype || '—',  mono: false },
                    { icon: <Hash size={11} />,    label: 'Placa',  value: plate || '—',  mono: true  },
                    { icon: <Car size={11} />,     label: 'Modelo', value: model || '—',  mono: false },
                    { icon: <Palette size={11} />, label: 'Cor',    value: color || '—',  mono: false },
                  ].map(({ icon, label, value, mono }) => (
                    <div key={label} className="bg-zinc-800/50 rounded-xl p-3 border border-zinc-800/70">
                      <div className="flex items-center gap-1 text-zinc-500 mb-1">
                        {icon}
                        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
                      </div>
                      <p className={`text-zinc-100 font-bold text-sm truncate ${mono ? 'font-mono tracking-widest' : ''}`}>
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Serviço principal */}
                <div className="flex items-center gap-3 bg-zinc-800/30 rounded-xl px-4 py-3 border border-zinc-800/50">
                  <Wrench size={14} className="text-brand-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Serviço Principal</p>
                    <p className="text-zinc-100 font-bold text-sm mt-0.5 truncate">
                      {service?.name ?? appt.service_name ?? '—'}
                    </p>
                  </div>
                  <span className="text-brand-primary font-black text-sm shrink-0">
                    R$ {calcPrice(service, appt.vehicle_type).toFixed(2)}
                  </span>
                </div>

                {/* Extras */}
                {extList.length > 0 && (
                  <div className="bg-zinc-800/20 rounded-xl px-4 py-3 border border-zinc-800/40">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Package size={12} className="text-zinc-400" />
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                        Extras ({extList.length})
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {extList.map(e => (
                        <span
                          key={e.id}
                          className="text-xs bg-zinc-700/60 border border-zinc-700 text-zinc-300 px-2 py-1 rounded-lg font-medium"
                        >
                          {e.name}
                          <span className="text-zinc-500 ml-1">+R${e.price.toFixed(2)}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lavador */}
                {staff && (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[11px] font-black text-zinc-400">
                      {staff.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-zinc-400 font-medium">{staff.name}</span>
                    <span className="text-xs text-zinc-600">• Lavador</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Modal: Novo Agendamento ─────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-lg font-black text-zinc-100">Novo Agendamento</h2>
              <button onClick={() => { setIsModalOpen(false); setBookingError(null); }} className="text-zinc-500 hover:text-zinc-300">
                <XCircle size={22} />
              </button>
            </div>

            <form onSubmit={handleAdd} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Cliente */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Cliente</label>
                <select required className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-zinc-300 focus:outline-none"
                  value={newAppt.client_id} onChange={e => setNewAppt({...newAppt, client_id: e.target.value})}>
                  <option value="">Selecionar Cliente</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` • ${c.phone}` : ''}</option>)}
                </select>
              </div>

              {/* Placa + Tipo */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Placa</label>
                  <IMaskInput 
                    mask={[
                      { mask: 'aaa-0000' },
                      { mask: 'aaa0a00' }
                    ]} 
                    prepare={(str) => str.toUpperCase()}
                    placeholder="ABC-1234 ou ABC1D23"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-zinc-300 focus:outline-none uppercase font-mono"
                    value={newAppt.plate}
                    unmask={false}
                    lazy={false}
                    onAccept={(v: string) => setNewAppt({...newAppt, plate: v})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Tipo</label>
                  <select className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-zinc-300 focus:outline-none"
                    value={newAppt.vehicle_type} onChange={e => setNewAppt({...newAppt, vehicle_type: e.target.value})}>
                    <option value="HATCH">Hatch</option>
                    <option value="SEDAN">Sedan</option>
                    <option value="SUV">SUV</option>
                    <option value="CAMINHONETE">Caminhonete</option>
                    <option value="MOTO_PEQUENA">Moto Pequena</option>
                    <option value="MOTO_GRANDE">Moto Grande</option>
                  </select>
                </div>
              </div>

              {/* Modelo + Cor */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Modelo</label>
                  <input type="text" placeholder="Ex: Honda Civic"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-zinc-300 focus:outline-none placeholder:text-zinc-600"
                    value={newAppt.vehicle_model} onChange={e => setNewAppt({...newAppt, vehicle_model: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Cor</label>
                  <input type="text" placeholder="Ex: Preto"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-zinc-300 focus:outline-none placeholder:text-zinc-600"
                    value={newAppt.vehicle_color} onChange={e => setNewAppt({...newAppt, vehicle_color: e.target.value})} />
                </div>
              </div>

              {/* Serviço */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Serviço</label>
                <select required className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-zinc-300 focus:outline-none"
                  value={newAppt.service_id} onChange={e => setNewAppt({...newAppt, service_id: e.target.value})}>
                  <option value="">Selecionar Serviço</option>
                  {services
                    .filter(s => !newAppt.unit_id || s.unit_id === newAppt.unit_id)
                    .map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} — R$ {calcPrice(s, newAppt.vehicle_type).toFixed(2)}
                      </option>
                    ))}
                </select>
              </div>

              {/* Data e hora */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Data e Hora</label>
                <input type="datetime-local" required
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-zinc-300 focus:outline-none"
                  value={newAppt.start_time} onChange={e => setNewAppt({...newAppt, start_time: e.target.value})} />
              </div>

              {/* Lavador */}
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Lavador (Opcional)</label>
                <select className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-zinc-300 focus:outline-none"
                  value={newAppt.washer_id} onChange={e => setNewAppt({...newAppt, washer_id: e.target.value})}>
                  <option value="">Selecionar Lavador</option>
                  {users
                    .filter(u => u.role === 'LAVADOR' && (!newAppt.unit_id || u.unit_id === newAppt.unit_id))
                    .map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>

              {/* Unidade (só Dono) */}
              {user?.role === 'DONO' && (
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Unidade</label>
                  <select required className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-zinc-300 focus:outline-none"
                    value={newAppt.unit_id} onChange={e => setNewAppt({...newAppt, unit_id: e.target.value})}>
                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              )}

              {bookingError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm text-center">
                  {bookingError}
                </div>
              )}

              <button type="submit" className="w-full bg-zinc-100 text-zinc-950 py-3 rounded-xl font-black hover:bg-white transition-colors">
                Agendar Serviço
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal: Pagamento ────────────────────────────────────────────────── */}
      {paymentAppt && !showPixQR && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-zinc-100 mb-6">Pagamento</h2>
            
            {/* Valor Total e Restante */}
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-zinc-100 mb-2">
                R$ {paymentAppt.total_price?.toFixed(2) || '0,00'}
              </div>
              <div className="text-lg text-zinc-400">
                Restante: R$ {(
                  (paymentAppt.total_price || 0) - 
                  Object.values(payments).reduce((a, b) => a + b, 0)
                ).toFixed(2)}
              </div>
            </div>

            {/* Formas de Pagamento */}
            <div className="space-y-3 mb-6">
              <p className="text-sm font-medium text-zinc-400 mb-3">Formas de Pagamento:</p>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Dinheiro */}
                <button
                  onClick={() => {
                    setSelectedPaymentMethod('DINHEIRO');
                    setPaymentValue(((paymentAppt.total_price || 0) - Object.values(payments).reduce((a, b) => a + b, 0)).toFixed(2));
                    setShowPaymentModal(true);
                  }}
                  className="bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-left transition-colors"
                >
                  <div className="text-2xl mb-2">💵</div>
                  <div className="text-sm font-medium text-zinc-300">Dinheiro</div>
                  <div className="text-xs text-emerald-500 font-bold mt-1">
                    R$ {payments.DINHEIRO.toFixed(2)}
                  </div>
                </button>

                {/* Cartão Débito */}
                <button
                  onClick={() => {
                    setSelectedPaymentMethod('CARTAO_DEBITO');
                    setPaymentValue(((paymentAppt.total_price || 0) - Object.values(payments).reduce((a, b) => a + b, 0)).toFixed(2));
                    setShowPaymentModal(true);
                  }}
                  className="bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-left transition-colors"
                >
                  <div className="text-2xl mb-2">💳</div>
                  <div className="text-sm font-medium text-zinc-300">Cartão Débito</div>
                  <div className="text-xs text-emerald-500 font-bold mt-1">
                    R$ {payments.CARTAO_DEBITO.toFixed(2)}
                  </div>
                </button>

                {/* Cartão Crédito */}
                <button
                  onClick={() => {
                    setSelectedPaymentMethod('CARTAO_CREDITO');
                    setPaymentValue(((paymentAppt.total_price || 0) - Object.values(payments).reduce((a, b) => a + b, 0)).toFixed(2));
                    setShowPaymentModal(true);
                  }}
                  className="bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-left transition-colors"
                >
                  <div className="text-2xl mb-2">💳</div>
                  <div className="text-sm font-medium text-zinc-300">Cartão Crédito</div>
                  <div className="text-xs text-emerald-500 font-bold mt-1">
                    R$ {payments.CARTAO_CREDITO.toFixed(2)}
                  </div>
                </button>

                {/* Link Pagamento */}
                <button
                  onClick={() => {
                    setShowPixQR(true);
                  }}
                  className="bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-left transition-colors"
                >
                  <div className="text-2xl mb-2">🔗</div>
                  <div className="text-sm font-medium text-zinc-300">Link Pagamento</div>
                  <div className="text-xs text-emerald-500 font-bold mt-1">
                    R$ {payments.LINK_PAGAMENTO.toFixed(2)}
                  </div>
                </button>

                {/* PIX */}
                <button
                  onClick={() => {
                    setShowPixQR(true);
                  }}
                  className="bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-left transition-colors col-span-2"
                >
                  <div className="text-2xl mb-2">📱</div>
                  <div className="text-sm font-medium text-zinc-300">PIX</div>
                  <div className="text-xs text-emerald-500 font-bold mt-1">
                    R$ {payments.PIX.toFixed(2)}
                  </div>
                </button>
              </div>
            </div>

            {/* Botão Finalizar */}
            <button
              disabled={Object.values(payments).reduce((a, b) => a + b, 0) === 0}
              onClick={async () => {
                try {
                  // Criar transações para cada forma de pagamento
                  for (const [method, value] of Object.entries(payments)) {
                    if (value > 0) {
                      await addTransaction({
                        unit_id: paymentAppt.unit_id,
                        type: 'INCOME',
                        amount: value,
                        category: 'SERVICO',
                        description: `${method.replace(/_/g, ' ')} - ${services.find(s => s.id === paymentAppt.service_id)?.name || 'Serviço'}`,
                        date: new Date().toISOString(),
                        payment_method: method
                      });
                    }
                  }
                  
                  // Finalizar agendamento
                  await updateAppointment(paymentAppt.id, { status: 'FINALIZADO' });
                  
                  // Reset
                  setPayments({
                    DINHEIRO: 0,
                    CARTAO_DEBITO: 0,
                    CARTAO_CREDITO: 0,
                    LINK_PAGAMENTO: 0,
                    PIX: 0
                  });
                  setPaymentAppt(null);
                  alert('Pagamento finalizado com sucesso!');
                } catch (error) {
                  console.error('Erro ao finalizar pagamento:', error);
                  alert('Erro ao finalizar pagamento');
                }
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition-colors"
            >
              Finalizar Pagamento
            </button>

            <button
              onClick={() => {
                setPaymentAppt(null);
                setPayments({
                  DINHEIRO: 0,
                  CARTAO_DEBITO: 0,
                  CARTAO_CREDITO: 0,
                  LINK_PAGAMENTO: 0,
                  PIX: 0
                });
              }}
              className="w-full text-zinc-500 py-2 text-sm hover:text-zinc-300 mt-2"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Modal: Adicionar Valor */}
      {showPaymentModal && selectedPaymentMethod && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-2xl p-6">
            <h3 className="text-xl font-bold text-zinc-100 mb-4">
              {selectedPaymentMethod.replace('_', ' ')}
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-zinc-400 mb-1">Valor Total: R$ {paymentAppt.total_price?.toFixed(2)}</p>
                <p className="text-sm text-zinc-400 mb-3">
                  Restante: R$ {(
                    (paymentAppt.total_price || 0) - 
                    Object.values(payments).reduce((a, b) => a + b, 0)
                  ).toFixed(2)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Valor a pagar:</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentValue}
                  onChange={(e) => setPaymentValue(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-zinc-100 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0,00"
                  autoFocus
                />
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
                <p className="text-xs text-yellow-500">
                  ⚠️ Confirme o valor antes de adicionar o pagamento
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedPaymentMethod(null);
                    setPaymentValue('');
                  }}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-3 rounded-xl font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const value = parseFloat(paymentValue) || 0;
                    if (value > 0) {
                      setPayments(prev => ({
                        ...prev,
                        [selectedPaymentMethod]: prev[selectedPaymentMethod as keyof typeof prev] + value
                      }));
                    }
                    setShowPaymentModal(false);
                    setSelectedPaymentMethod(null);
                    setPaymentValue('');
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition-colors"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: QR Code PIX */}
      {showPixQR && paymentAppt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-2xl p-6 text-center space-y-5">
            <h2 className="text-xl font-bold text-zinc-100">QR Code PIX</h2>
            <div className="bg-white p-3 rounded-xl">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                  '00020126360014br.gov.bcb.pix0114+55279962430265204000053039865802BR592562_116_905_RENAN_BENTO_DE6007Vitoria610929032-56962290525FBB500815319177377989446663047C76'
                )}`}
                alt="PIX QR Code"
                className="w-full h-auto"
              />
            </div>
            <p className="text-sm text-zinc-400">Escaneie para pagar via PIX</p>
            
            <div className="space-y-2">
              <a
                href={`https://wa.me/55${(clients.find(c => c.id === paymentAppt.client_id)?.phone ?? '').replace(/\D/g,'')}?text=${encodeURIComponent('PIX Copia e Cola:\n00020126360014br.gov.bcb.pix0114+55279962430265204000053039865802BR592562_116_905_RENAN_BENTO_DE6007Vitoria610929032-56962290525FBB500815319177377989446663047C76')}`}
                target="_blank" rel="noopener noreferrer"
                className="w-full block bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition-colors"
              >
                Enviar PIX via WhatsApp
              </a>
              
              <button
                onClick={() => {
                  setShowPixQR(false);
                  setSelectedPaymentMethod(paymentAppt.total_price > Object.values(payments).reduce((a, b) => a + b, 0) ? 'PIX' : 'LINK_PAGAMENTO');
                  setPaymentValue(((paymentAppt.total_price || 0) - Object.values(payments).reduce((a, b) => a + b, 0)).toFixed(2));
                  setShowPaymentModal(true);
                }}
                className="w-full bg-zinc-100 hover:bg-white text-zinc-950 py-3 rounded-xl font-bold transition-colors"
              >
                Adicionar Valor Recebido
              </button>
              
              <button
                onClick={() => setShowPixQR(false)}
                className="w-full text-zinc-500 py-2 text-sm hover:text-zinc-300"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Cliente */}
      {showEditClientModal && editingClient && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6">
            <h2 className="text-xl font-bold text-zinc-100 mb-4">Editar Cliente</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Nome</label>
                <input 
                  type="text" 
                  value={editingClient.name || ''}
                  onChange={(e) => setEditingClient({ ...editingClient, name: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-primary" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Telefone</label>
                <IMaskInput 
                  mask="(00) 00000-0000" 
                  value={editingClient.phone || ''}
                  onAccept={(value: string) => setEditingClient({ ...editingClient, phone: value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-primary" 
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => {
                    setShowEditClientModal(false);
                    setEditingClient(null);
                  }} 
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-3 rounded-xl font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={async () => {
                    if (!editingClient.name?.trim() || !editingClient.phone?.trim()) {
                      alert('Preencha nome e telefone');
                      return;
                    }
                    try {
                      await updateClient(editingClient.id, {
                        name: editingClient.name.trim(),
                        phone: editingClient.phone
                      });
                      setShowEditClientModal(false);
                      setEditingClient(null);
                      alert('Cliente atualizado com sucesso!');
                    } catch (error: any) {
                      console.error('Erro ao atualizar cliente:', error);
                      alert(error.message || 'Erro ao atualizar cliente');
                    }
                  }} 
                  className="flex-1 bg-brand-primary hover:bg-brand-primary-hover text-zinc-950 py-3 rounded-xl font-bold transition-colors"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Data/Hora */}
      {showEditDateModal && editingAppointment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6">
            <h2 className="text-xl font-bold text-zinc-100 mb-4">Editar Data e Hora</h2>
            <div className="space-y-4">
              <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-800">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Agendamento</p>
                <p className="text-zinc-100 font-bold">
                  {clients.find(c => c.id === editingAppointment.client_id)?.name || editingAppointment.client_name || 'Cliente'}
                </p>
                <p className="text-zinc-400 text-sm mt-1">
                  {editingAppointment.plate || editingAppointment.vehicle_model || 'Veículo'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  Data e Hora do Serviço
                </label>
                <input 
                  type="datetime-local" 
                  value={editingAppointment.start_time ? new Date(editingAppointment.start_time).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEditingAppointment({ ...editingAppointment, start_time: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-primary" 
                />
                <p className="text-xs text-zinc-500 mt-2">
                  💡 Dica: Use isso para corrigir lançamentos com data errada
                </p>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
                <p className="text-xs text-yellow-500">
                  ⚠️ Isso vai alterar a data do agendamento. Use com cuidado!
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => {
                    setShowEditDateModal(false);
                    setEditingAppointment(null);
                  }} 
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-3 rounded-xl font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={async () => {
                    if (!editingAppointment.start_time) {
                      alert('Selecione uma data e hora');
                      return;
                    }
                    try {
                      await updateAppointment(editingAppointment.id, {
                        start_time: new Date(editingAppointment.start_time).toISOString()
                      });
                      setShowEditDateModal(false);
                      setEditingAppointment(null);
                      alert('Data atualizada com sucesso!');
                    } catch (error: any) {
                      console.error('Erro ao atualizar data:', error);
                      alert(error.message || 'Erro ao atualizar data');
                    }
                  }} 
                  className="flex-1 bg-brand-primary hover:bg-brand-primary-hover text-zinc-950 py-3 rounded-xl font-bold transition-colors"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Data em Massa */}
      {showBulkEditModal && selectedAppointments.length > 0 && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6">
            <h2 className="text-xl font-bold text-zinc-100 mb-4">Editar Data em Massa</h2>
            <div className="space-y-4">
              <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-800">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Agendamentos Selecionados</p>
                <p className="text-2xl font-black text-brand-primary">{selectedAppointments.length}</p>
                <p className="text-xs text-zinc-400 mt-1">
                  {selectedAppointments.length === 1 ? 'agendamento será movido' : 'agendamentos serão movidos'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  Nova Data
                </label>
                <input 
                  type="date" 
                  value={bulkEditDate}
                  onChange={(e) => setBulkEditDate(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-zinc-300 focus:outline-none focus:ring-2 focus:ring-brand-primary" 
                />
                <p className="text-xs text-zinc-500 mt-2">
                  💡 Os horários serão mantidos, apenas a data será alterada
                </p>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3">
                <p className="text-xs text-blue-400">
                  ℹ️ Exemplo: Se um carro está às 21:30 de ontem, ficará às 21:30 da nova data
                </p>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
                <p className="text-xs text-yellow-500">
                  ⚠️ Isso vai alterar {selectedAppointments.length} agendamento{selectedAppointments.length > 1 ? 's' : ''}. Use com cuidado!
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => {
                    setShowBulkEditModal(false);
                    setBulkEditDate('');
                  }} 
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-3 rounded-xl font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={async () => {
                    if (!bulkEditDate) {
                      alert('Selecione uma data');
                      return;
                    }
                    try {
                      // Atualizar cada agendamento mantendo o horário
                      for (const apptId of selectedAppointments) {
                        const appt = appointments.find(a => a.id === apptId);
                        if (appt) {
                          const oldDate = new Date(appt.start_time);
                          const newDate = new Date(bulkEditDate);
                          newDate.setHours(oldDate.getHours(), oldDate.getMinutes(), oldDate.getSeconds());
                          
                          await updateAppointment(apptId, {
                            start_time: newDate.toISOString()
                          });
                        }
                      }
                      setShowBulkEditModal(false);
                      setBulkEditDate('');
                      setSelectedAppointments([]);
                      alert(`${selectedAppointments.length} agendamento${selectedAppointments.length > 1 ? 's atualizados' : ' atualizado'} com sucesso!`);
                    } catch (error: any) {
                      console.error('Erro ao atualizar datas:', error);
                      alert(error.message || 'Erro ao atualizar datas');
                    }
                  }} 
                  className="flex-1 bg-brand-primary hover:bg-brand-primary-hover text-zinc-950 py-3 rounded-xl font-bold transition-colors"
                >
                  Mover Todos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Mudar Unidade em Massa */}
      {showBulkEditUnitModal && selectedAppointments.length > 0 && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6">
            <h2 className="text-xl font-bold text-zinc-100 mb-4">Mudar Unidade em Massa</h2>
            <div className="space-y-4">
              <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-800">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Agendamentos Selecionados</p>
                <p className="text-2xl font-black text-purple-500">{selectedAppointments.length}</p>
                <p className="text-xs text-zinc-400 mt-1">
                  {selectedAppointments.length === 1 ? 'agendamento será movido' : 'agendamentos serão movidos'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  Nova Unidade
                </label>
                <select
                  value={bulkEditUnit}
                  onChange={(e) => setBulkEditUnit(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-zinc-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {units.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                <p className="text-xs text-zinc-500 mt-2">
                  💡 Todos os agendamentos selecionados serão movidos para esta unidade
                </p>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3">
                <p className="text-xs text-purple-400">
                  ℹ️ Útil para corrigir lançamentos feitos na unidade errada
                </p>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
                <p className="text-xs text-yellow-500">
                  ⚠️ Isso vai alterar a unidade de {selectedAppointments.length} agendamento{selectedAppointments.length > 1 ? 's' : ''}!
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => {
                    setShowBulkEditUnitModal(false);
                    setBulkEditUnit('');
                  }} 
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-3 rounded-xl font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={async () => {
                    if (!bulkEditUnit) {
                      alert('Selecione uma unidade');
                      return;
                    }
                    try {
                      // Atualizar cada agendamento
                      for (const apptId of selectedAppointments) {
                        await updateAppointment(apptId, {
                          unit_id: bulkEditUnit
                        });
                      }
                      setShowBulkEditUnitModal(false);
                      setBulkEditUnit('');
                      setSelectedAppointments([]);
                      alert(`${selectedAppointments.length} agendamento${selectedAppointments.length > 1 ? 's movidos' : ' movido'} para ${units.find(u => u.id === bulkEditUnit)?.name}!`);
                    } catch (error: any) {
                      console.error('Erro ao atualizar unidades:', error);
                      alert(error.message || 'Erro ao atualizar unidades');
                    }
                  }} 
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold transition-colors"
                >
                  Mover Todos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Atribuir Lavador em Massa */}
      {showBulkEditWasherModal && selectedAppointments.length > 0 && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6">
            <h2 className="text-xl font-bold text-zinc-100 mb-4">Atribuir Lavador em Massa</h2>
            <div className="space-y-4">
              <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-800">
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Agendamentos Selecionados</p>
                <p className="text-2xl font-black text-emerald-500">{selectedAppointments.length}</p>
                <p className="text-xs text-zinc-400 mt-1">
                  {selectedAppointments.length === 1 ? 'agendamento será atribuído' : 'agendamentos serão atribuídos'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  Lavador
                </label>
                <select
                  value={bulkEditWasher}
                  onChange={(e) => setBulkEditWasher(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-zinc-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Nenhum (remover atribuição)</option>
                  {users
                    .filter(u => u.role === 'LAVADOR')
                    .map(u => (
                      <option key={u.id} value={u.id}>
                        {u.name} {u.unit_id && `• ${units.find(un => un.id === u.unit_id)?.name || ''}`}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-zinc-500 mt-2">
                  💡 Atribua um lavador para todos os agendamentos selecionados
                </p>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">
                <p className="text-xs text-emerald-400">
                  ℹ️ Útil para distribuir serviços entre lavadores ou corrigir atribuições
                </p>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
                <p className="text-xs text-yellow-500">
                  ⚠️ Isso vai alterar o lavador de {selectedAppointments.length} agendamento{selectedAppointments.length > 1 ? 's' : ''}!
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => {
                    setShowBulkEditWasherModal(false);
                    setBulkEditWasher('');
                  }} 
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-3 rounded-xl font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={async () => {
                    try {
                      // Atualizar cada agendamento
                      for (const apptId of selectedAppointments) {
                        await updateAppointment(apptId, {
                          washer_id: bulkEditWasher || null
                        });
                      }
                      setShowBulkEditWasherModal(false);
                      setBulkEditWasher('');
                      setSelectedAppointments([]);
                      const washerName = bulkEditWasher 
                        ? users.find(u => u.id === bulkEditWasher)?.name 
                        : 'Nenhum';
                      alert(`${selectedAppointments.length} agendamento${selectedAppointments.length > 1 ? 's atribuídos' : ' atribuído'} para ${washerName}!`);
                    } catch (error: any) {
                      console.error('Erro ao atribuir lavador:', error);
                      alert(error.message || 'Erro ao atribuir lavador');
                    }
                  }} 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition-colors"
                >
                  Atribuir Todos
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Servicos extras vendidos ao finalizar */}
      {extraAppt && (() => {
        // Tenta pegar do lavador atribuido; se nao tiver, usa qualquer lavador da unidade
        const apptWasher =
          users.find(u => u.id === extraAppt.washer_id) ??
          users.find(u => u.role === 'LAVADOR' && u.unit_id === extraAppt.unit_id);
        // Se ainda vazio, usa lista padrao hardcoded
        const defaultComms: Record<string, number> = {
          'Cera': 5, 'Revitalizacao': 5, 'Hig Bancos': 30,
          'Teto': 20, 'Motor': 20, 'Chassi Hatch': 30,
          'Chassi Sedan': 30, 'Chassi SUV': 40, 'Chassi Caminhonete': 50,
          'Pelo de Cachorro': 5,
        };
        const rawComms = apptWasher?.comissoesServico ?? {};
        const fixedComms = Object.keys(rawComms).length > 0 ? rawComms : defaultComms;
        const commEntries = Object.entries(fixedComms).filter(([, val]) => Number(val) > 0);

        return (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-2xl p-6 space-y-5">
              <div>
                <h2 className="text-xl font-black text-zinc-100">Servicos extras vendidos?</h2>
                <p className="text-sm text-zinc-400 mt-1">
                  Selecione os servicos adicionais vendidos neste atendimento.
                </p>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {commEntries.length === 0 && (
                  <p className="text-zinc-500 text-sm text-center py-4">
                    Nenhuma comissao de servico configurada para este lavador.
                  </p>
                )}
                {commEntries.map(([serviceName, commValue]) => {
                  const isSel = selExtras.includes(serviceName);
                  return (
                    <button
                      key={serviceName}
                      onClick={() => setSelExtras(prev =>
                        prev.includes(serviceName)
                          ? prev.filter(id => id !== serviceName)
                          : [...prev, serviceName]
                      )}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isSel
                          ? 'bg-brand-primary/10 border-brand-primary/40'
                          : 'bg-zinc-800/40 border-zinc-700 hover:border-zinc-600'
                      }`}
                    >
                      <div className="text-left">
                        <p className="text-sm font-bold text-zinc-100">{serviceName}</p>
                        <p className="text-xs text-zinc-500">
                          Comissao: <span className="text-brand-primary font-bold">R$ {Number(commValue).toFixed(2)}</span>
                        </p>
                      </div>
                      {isSel && <CheckCircle2 size={16} className="text-brand-primary shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {selExtras.length > 0 && (
                <div className="bg-zinc-800/50 rounded-xl px-4 py-3 border border-zinc-800">
                  <p className="text-zinc-500 text-xs uppercase font-bold tracking-wider mb-1">Total de comissoes extras</p>
                  <p className="text-brand-primary font-black text-lg">
                    R$ {selExtras.reduce((acc, name) => acc + Number(fixedComms[name] ?? 0), 0).toFixed(2)}
                  </p>
                </div>
              )}

              <button
                onClick={() => {
                  updateAppointment(extraAppt.id, {
                    status: 'FINALIZADO',
                    extras: [],                          // extras do catalogo (nao usados aqui)
                    service_extras_sold: selExtras,      // nomes dos servicos extras vendidos
                  } as any);
                  setExtraAppt(null);
                  setSelExtras([]);
                }}
                className="w-full bg-brand-primary text-zinc-950 py-3 rounded-xl font-black hover:bg-brand-primary-hover transition-colors"
              >
                Confirmar e Finalizar
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}