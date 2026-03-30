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
    units, users, addAppointment, updateAppointment, deleteAppointment, refetch,
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
    addAppointment({
      ...newAppt,
      washer_id: newAppt.washer_id || undefined,
      end_time:  new Date(ms + 90 * 60_000).toISOString(),
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
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-zinc-100 text-zinc-950 px-4 py-2 rounded-xl text-sm font-bold hover:bg-white transition-colors flex items-center gap-2 self-start"
        >
          <Plus size={16} /> Novo Agendamento
        </button>
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

          return (
            <div
              key={appt.id}
              className={`bg-zinc-900 border rounded-2xl overflow-hidden transition-all hover:border-zinc-700 ${
                appt.status === 'CANCELADO' ? 'border-zinc-800/30 opacity-40' : 'border-zinc-800'
              }`}
            >
              {/* Barra de status colorida */}
              <div className={`h-1 w-full ${st.bar}`} />

              <div className="p-5 space-y-4">

                {/* Linha 1: cliente | preço | menu */}
                <div className="flex items-start justify-between gap-3">
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
      {paymentAppt && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-2xl p-6 text-center space-y-5">
            <h2 className="text-xl font-black text-zinc-100">Finalizar Pagamento</h2>
            <div className="bg-white p-3 rounded-xl">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                  '00020126360014br.gov.bcb.pix0114+55279962430265204000053039865802BR592562_116_905_RENAN_BENTO_DE6007Vitoria610929032-56962290525FBB500815319177377989446663047C76'
                )}`}
                alt="PIX QR Code"
                className="w-full h-auto"
              />
            </div>
            <p className="text-sm text-zinc-400">Escaneie para pagar via PIX.</p>
            <div className="space-y-2">
              <button
                onClick={() => { setPaymentAppt(null); setExtraAppt(paymentAppt); }}
                className="w-full bg-brand-primary text-zinc-950 py-3 rounded-xl font-black hover:bg-brand-primary-hover transition-colors"
              >
                Confirmar Pagamento PIX ✓
              </button>
              <a
                href={`https://wa.me/55${(clients.find(c => c.id === paymentAppt.client_id)?.phone ?? '').replace(/\D/g,'')}?text=${encodeURIComponent('PIX Copia e Cola:\n00020126360014br.gov.bcb.pix0114+55279962430265204000053039865802BR5925')}`}
                target="_blank" rel="noopener noreferrer"
                className="w-full block bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold transition-colors"
              >
                Enviar PIX via WhatsApp
              </a>
              <a
                href="https://link.maquinadecartao.com.br/brutus"
                target="_blank" rel="noopener noreferrer"
                className="w-full block bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-3 rounded-xl font-bold transition-colors"
              >
                Link Máquina de Cartão
              </a>
              <button onClick={() => setPaymentAppt(null)} className="w-full text-zinc-500 py-2 text-sm hover:text-zinc-300">
                Cancelar
              </button>
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