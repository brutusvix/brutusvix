import React, { useState, useMemo, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  MapPin, Clock, ChevronLeft, CheckCircle2,
  Car, User, Phone, Plus, Minus, Calendar as CalendarIcon,
  Check, MessageCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { IMaskInput } from 'react-imask';
import { clsx } from 'clsx';

const VEHICLE_TYPES_CAR = [
  { value: 'HATCH',       label: 'Hatch',       emoji: '🚗', desc: 'Gol, HB20, Ônix...' },
  { value: 'SEDAN',       label: 'Sedan',       emoji: '🚙', desc: 'Civic, Corolla, Jetta...' },
  { value: 'SUV',         label: 'SUV',          emoji: '🚐', desc: 'Compass, HRV, Creta...' },
  { value: 'CAMINHONETE', label: 'Caminhonete',  emoji: '🛻', desc: 'Hilux, Ranger, S10...' },
] as const;

const VEHICLE_TYPES_MOTO = [
  { value: 'MOTO_PEQUENA', label: 'Moto Pequena', emoji: '🏍️', desc: '160/Titan/Biz/CB250' },
  { value: 'MOTO_GRANDE',  label: 'Moto Grande',  emoji: '🏍️', desc: 'CB500/600/Harley/BMW' },
] as const;

// unified for lookup
const VEHICLE_TYPES = [...VEHICLE_TYPES_CAR, ...VEHICLE_TYPES_MOTO] as const;

const SERVICE_CATEGORIES = [
  { label: 'Lavagens',     keywords: ['Lavagem'],               icon: '💧' },
  { label: 'Higienização', keywords: ['Higienização'],          icon: '✨' },
  { label: 'Polimento',    keywords: ['Polimento'],             icon: '🔆' },
  { label: 'Tratamentos',  keywords: ['Tratamento', 'Limpeza'], icon: '🛠️' },
  { label: 'Pacotes',      keywords: ['Pacote'],                icon: '🎁' },
  { label: 'Motos',        keywords: ['Moto'],                  icon: '🏍️' },
];

function getCategoryForService(name: string) {
  for (const cat of SERVICE_CATEGORIES) {
    if (cat.keywords.some(k => name.includes(k))) return cat;
  }
  return { label: 'Outros', keywords: [], icon: '⭐' };
}

function getServicePrice(service: any, vehicleType: string): number {
  switch (vehicleType) {
    case 'HATCH':       return service.price_hatch  || 0;
    case 'SEDAN':       return service.price_sedan  || 0;
    case 'SUV':         return service.price_suv    || 0;
    case 'CAMINHONETE': return service.price_pickup || 0;
    case 'MOTO_PEQUENA': return service.price_hatch || 0;
    case 'MOTO_GRANDE':  return service.price_hatch || 0;
    default:            return service.price_hatch  || 0;
  }
}

export default function PublicBooking() {
  const { unitId } = useParams();

  const [units, setUnits]               = useState<any[]>([]);
  const [services, setServices]         = useState<any[]>([]);
  const [extras, setExtras]             = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingData, setLoadingData]   = useState(true);

  const getLocalDateStr = () => new Date().toLocaleDateString('en-CA');

  const [step, setStep]                 = useState(unitId ? 2 : 1);
  const [booking, setBooking]           = useState({
    unitId:       unitId || null as string | null,
    vehicleType:  '' as string,
    serviceId:    null as string | null,
    extras:       [] as string[],
    client:       { name: '', phone: '', plate: '', brand: '', model: '', color: '' },
    selectedDate: getLocalDateStr(),
    startTime:    '',
  });
  const [isConfirmed, setIsConfirmed]   = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [submitting, setSubmitting]     = useState(false);

  // Busca dados públicos ao montar
  useEffect(() => {
    async function fetchData() {
      setLoadingData(true);
      const [{ data: u }, { data: e }, { data: a }] = await Promise.all([
        supabase.from('units').select('*').is('deleted_at', null).eq('is_open', true),
        supabase.from('extras').select('*').eq('active', true),
        supabase.from('appointments').select('unit_id, start_time, status').not('status', 'eq', 'CANCELADO'),
      ]);
      if (u) setUnits(u);
      if (e) setExtras(e);
      if (a) setAppointments(a);

      // Se veio unitId pela URL, carrega serviços já
      if (unitId) {
        const { data: s } = await supabase.from('services').select('*')
          .eq('unit_id', unitId).eq('active', true).is('deleted_at', null);
        if (s) setServices(s);
      }
      setLoadingData(false);
    }
    fetchData();
  }, [unitId]);

  function loadServicesForUnit(uid: string) {
    supabase.from('services').select('*')
      .eq('unit_id', uid).eq('active', true).is('deleted_at', null)
      .then(({ data }) => { if (data) setServices(data); });
  }

  const selectedUnit        = useMemo(() => units.find(u => u.id === booking.unitId),       [units, booking.unitId]);
  const selectedService     = useMemo(() => services.find(s => s.id === booking.serviceId), [services, booking.serviceId]);
  const selectedExtrasItems = useMemo(() => extras.filter(e => booking.extras.includes(e.id)), [extras, booking.extras]);

  const servicePrice = useMemo(() =>
    selectedService ? getServicePrice(selectedService, booking.vehicleType) : 0,
    [selectedService, booking.vehicleType]);

  const totalPrice = useMemo(() =>
    servicePrice, // Apenas o preço do serviço, extras serão consultados no lava-jato
    [servicePrice]);

  const groupedServices = useMemo(() => {
    const groups: Record<string, { cat: (typeof SERVICE_CATEGORIES)[0]; items: any[] }> = {};
    for (const s of services) {
      const cat = getCategoryForService(s.name);
      if (!groups[cat.label]) groups[cat.label] = { cat, items: [] };
      groups[cat.label].items.push(s);
    }
    return Object.values(groups);
  }, [services]);

  const availableTimes = useMemo(() => {
    if (!booking.unitId || !selectedService || !booking.selectedDate || !selectedUnit) return [];
    const [year, month, day] = booking.selectedDate.split('-').map(Number);
    const localDate  = new Date(year, month - 1, day);
    const dayOfWeek  = localDate.toLocaleDateString('pt-BR', { weekday: 'long' });
    const capDay     = dayOfWeek.split('-')[0];
    const capDayStr  = capDay.charAt(0).toUpperCase() + capDay.slice(1);
    const hours      = selectedUnit.operating_hours || [];
    const dayConfig  = hours.find((oh: any) => oh.day.startsWith(capDayStr));
    if (!dayConfig || !dayConfig.isOpen) return [];
    const [sH, sM] = dayConfig.open.split(':').map(Number);
    const [eH, eM] = dayConfig.close.split(':').map(Number);
    let cur = new Date(year, month - 1, day, sH, sM, 0, 0);
    const end = new Date(year, month - 1, day, eH, eM, 0, 0);
    const times: string[] = [];
    // REMOVIDO LIMITE: Agora aceita entrada ilimitada de veículos
    while (cur < end) {
      times.push(cur.toISOString());
      cur = new Date(cur.getTime() + 90 * 60 * 1000);
    }
    return times;
  }, [booking.unitId, selectedService, booking.selectedDate, appointments, selectedUnit]);

  const handleConfirm = async () => {
    if (!booking.unitId || !booking.serviceId || !booking.startTime) return;
    setSubmitting(true);
    setBookingError(null);
    // REMOVIDO LIMITE: Agora aceita entrada ilimitada de veículos
    try {
      const { data: existing } = await supabase.from('clients').select('id').eq('phone', booking.client.phone).maybeSingle();
      let clientId: string;
      if (existing) {
        clientId = existing.id;
      } else {
        const { data: nc, error: ce } = await supabase.from('clients')
          .insert({ name: booking.client.name, phone: booking.client.phone, unit_id: booking.unitId, points: 0, total_spent: 0 })
          .select('id').single();
        if (ce || !nc) throw new Error('Erro ao criar cliente');
        clientId = nc.id;
      }
      await supabase.from('vehicles').upsert(
        { client_id: clientId, model: `${booking.client.brand} ${booking.client.model}`, plate: booking.client.plate.toUpperCase() },
        { onConflict: 'plate' }
      );
      const startMs = new Date(booking.startTime).getTime();
      const { error: ae } = await supabase.from('appointments').insert({
        client_id: clientId, service_id: booking.serviceId, unit_id: booking.unitId,
        vehicle_type: booking.vehicleType, plate: booking.client.plate.toUpperCase(),
        vehicle_model: `${booking.client.brand} ${booking.client.model}`,
        // vehicle_color removido - não existe na tabela
        start_time: booking.startTime, end_time: new Date(startMs + 90 * 60 * 1000).toISOString(),
        status: 'AGENDADO', selected_extras: booking.extras, total_price: totalPrice,
        client_name: booking.client.name,
      });
      if (ae) throw new Error(ae.message);
      setIsConfirmed(true);
    } catch (e: any) {
      setBookingError(e.message || 'Erro ao confirmar. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
            <img src="https://i.postimg.cc/fy9c2r4k/Brutus-recortada.png" alt="BRUTUS" className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
          </div>
          <div className="flex gap-1 justify-center">
            {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-brand-primary rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
          </div>
        </div>
      </div>
    );
  }

  if (isConfirmed) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="text-brand-primary w-12 h-12" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-100">Agendado com sucesso!</h1>
            <p className="text-zinc-500 mt-2 text-sm">Nossa equipe já está te esperando.</p>
          </div>
          <div className="bg-zinc-800/50 rounded-2xl p-5 text-left space-y-3 border border-zinc-800">
            <div className="flex items-center gap-3">
              <CalendarIcon className="text-brand-primary w-5 h-5 shrink-0" />
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Data e Horário</p>
                <p className="text-white font-medium">{new Date(booking.startTime).toLocaleDateString('pt-BR')} às {new Date(booking.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="text-brand-primary w-5 h-5 shrink-0" />
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Unidade</p>
                <p className="text-white font-medium">{selectedUnit?.name}</p>
                <p className="text-zinc-500 text-xs">{selectedUnit?.address}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Car className="text-brand-primary w-5 h-5 shrink-0" />
              <div>
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Veículo</p>
                <p className="text-white font-medium">{booking.client.brand} {booking.client.model} • {booking.client.plate.toUpperCase()}</p>
              </div>
            </div>
          </div>
          {selectedUnit?.phone && (
            <button onClick={() => window.open(`https://wa.me/55${selectedUnit.phone.replace(/\D/g,'')}`, '_blank')}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all">
              <MessageCircle size={20} /> Falar no WhatsApp
            </button>
          )}
        </div>
      </div>
    );
  }

  const TOTAL_STEPS = 8;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300">
      <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/50 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="w-14 h-14 bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
            <img src="https://i.postimg.cc/fy9c2r4k/Brutus-recortada.png" alt="BRUTUS" className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
          </div>
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Passo {step} de {TOTAL_STEPS}</span>
        </div>
        <div className="max-w-2xl mx-auto mt-3 h-1 bg-zinc-900 rounded-full overflow-hidden">
          <div className="h-full bg-brand-primary transition-all duration-500" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }} />
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 pb-32 space-y-6">
        {step > 1 && selectedUnit && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary"><MapPin size={18} /></div>
              <div>
                <p className="font-bold text-white text-sm">{selectedUnit.name}</p>
                <p className="text-zinc-500 text-xs">{selectedUnit.address}</p>
              </div>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg bg-brand-primary/20 text-brand-primary">Aberta</span>
          </div>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-bold text-zinc-100">Onde você está?</h2>
              <p className="text-zinc-500 text-sm mt-1">Escolha a unidade mais próxima de você.</p>
            </div>
            {units.length === 0 && <p className="text-zinc-500 text-center py-8">Nenhuma unidade disponível no momento.</p>}
            <div className="grid gap-3">
              {units.map(unit => (
                <button key={unit.id}
                  onClick={() => { setBooking({ ...booking, unitId: unit.id, serviceId: null }); loadServicesForUnit(unit.id); setStep(2); }}
                  className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 p-5 rounded-2xl text-left transition-all relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 bg-brand-primary text-zinc-950 text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase">Aberto</div>
                  <h3 className="text-lg font-bold text-white mb-1 group-hover:text-brand-primary transition-colors">{unit.name}</h3>
                  <div className="flex items-center gap-2 text-sm text-zinc-500 mb-1"><MapPin size={13} />{unit.address}</div>
                  <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <Clock size={13} />
                    {(() => { const oh = (unit.operating_hours||[]).find((h:any)=>h.isOpen); return oh ? `${oh.open} – ${oh.close}` : '08:00 – 18:00'; })()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 - escolha categoria (carro ou moto) */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep(1)} className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 hover:text-zinc-200"><ChevronLeft size={20} /></button>
              <div>
                <h2 className="text-2xl font-bold text-zinc-100">Qual é o seu veículo?</h2>
                <p className="text-zinc-500 text-sm">O preço varia de acordo com o tipo.</p>
              </div>
            </div>

            {/* Carros */}
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">🚗 Carros</p>
              <div className="grid grid-cols-2 gap-3">
                {VEHICLE_TYPES_CAR.map(vt => (
                  <button key={vt.value}
                    onClick={() => { setBooking({ ...booking, vehicleType: vt.value, serviceId: null }); setStep(3); }}
                    className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-5 text-left transition-all group"
                  >
                    <span className="text-3xl mb-3 block">{vt.emoji}</span>
                    <p className="font-bold text-white group-hover:text-brand-primary transition-colors">{vt.label}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">{vt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Motos */}
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-3">🏍️ Motos</p>
              <div className="grid grid-cols-2 gap-3">
                {VEHICLE_TYPES_MOTO.map(vt => (
                  <button key={vt.value}
                    onClick={() => { setBooking({ ...booking, vehicleType: vt.value, serviceId: null }); setStep(3); }}
                    className="bg-zinc-900 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-5 text-left transition-all group"
                  >
                    <span className="text-3xl mb-3 block">{vt.emoji}</span>
                    <p className="font-bold text-white group-hover:text-brand-primary transition-colors">{vt.label}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">{vt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep(2)} className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 hover:text-zinc-200"><ChevronLeft size={20} /></button>
              <div>
                <h2 className="text-2xl font-bold text-zinc-100">Qual serviço?</h2>
                <p className="text-zinc-500 text-sm">Preços para <span className="text-brand-primary font-bold">{VEHICLE_TYPES.find(v=>v.value===booking.vehicleType)?.label}</span></p>
              </div>
            </div>
            {groupedServices.length === 0 && <p className="text-zinc-500 text-center py-8">Carregando serviços...</p>}
            {groupedServices
              .filter(({ cat, items }) => {
                const isMotoType = booking.vehicleType === 'MOTO_PEQUENA' || booking.vehicleType === 'MOTO_GRANDE';
                // Se moto: mostra só categoria motos; se carro: esconde categoria motos
                if (isMotoType) return cat.label === 'Motos';
                return cat.label !== 'Motos';
              })
              .map(({ cat, items }) => (
              <div key={cat.label} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{cat.icon}</span>
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">{cat.label}</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {items.map((s: any) => {
                    const price = getServicePrice(s, booking.vehicleType);
                    const sel   = booking.serviceId === s.id;
                    return (
                      <button key={s.id}
                        onClick={() => { setBooking({ ...booking, serviceId: s.id }); setStep(4); }}
                        className={clsx('border rounded-2xl p-4 text-left transition-all relative',
                          sel ? 'border-brand-primary bg-brand-primary/5' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'
                        )}>
                        {sel && <div className="absolute top-3 right-3 w-5 h-5 bg-brand-primary rounded-full flex items-center justify-center"><Check size={12} className="text-zinc-950" /></div>}
                        <p className="font-bold text-white text-sm pr-6">{s.name}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-zinc-500 text-xs flex items-center gap-1"><Clock size={11}/>{s.duration_minutes} min</span>
                          <span className="text-brand-primary font-black text-base">R$ {price.toFixed(2)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep(3)} className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 hover:text-zinc-200"><ChevronLeft size={20} /></button>
              <div>
                <h2 className="text-2xl font-bold text-zinc-100">Deseja algo a mais?</h2>
                <p className="text-zinc-500 text-sm">Opcionais para um resultado ainda melhor.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {extras.map((e: any) => {
                const isSel = booking.extras.includes(e.id);
                return (
                  <button key={e.id}
                    onClick={() => setBooking({ ...booking, extras: isSel ? booking.extras.filter(id=>id!==e.id) : [...booking.extras, e.id] })}
                    className={clsx('border rounded-2xl p-4 text-left transition-all', isSel ? 'border-brand-primary bg-brand-primary/5' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600')}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-white text-sm">{e.name}</p>
                      <div className={clsx('w-6 h-6 rounded-lg flex items-center justify-center shrink-0', isSel ? 'bg-brand-primary text-zinc-950' : 'bg-zinc-800 text-zinc-500')}>
                        {isSel ? <Minus size={14}/> : <Plus size={14}/>}
                      </div>
                    </div>
                    <p className="text-zinc-500 text-xs mt-2 italic">Consultar com lava-jato</p>
                  </button>
                );
              })}
            </div>
            <button onClick={() => setStep(5)} className="w-full bg-brand-primary text-zinc-950 py-4 rounded-2xl font-bold hover:bg-brand-primary-hover transition-all">
              Continuar {booking.extras.length > 0 ? `(${booking.extras.length} extra${booking.extras.length>1?'s':''})` : 'sem extras'}
            </button>
          </div>
        )}

        {/* STEP 5 */}
        {step === 5 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep(4)} className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 hover:text-zinc-200"><ChevronLeft size={20}/></button>
              <div>
                <h2 className="text-2xl font-bold text-zinc-100">Qual o dia?</h2>
                <p className="text-zinc-500 text-sm">Escolha a data para o serviço.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[0,1,2,3].map(offset => {
                const date=new Date(); date.setDate(date.getDate()+offset);
                const ds=date.toLocaleDateString('en-CA'); const sel=booking.selectedDate===ds;
                return (
                  <button key={ds} onClick={()=>setBooking({...booking,selectedDate:ds})}
                    className={clsx('p-4 rounded-2xl border text-center transition-all', sel?'bg-zinc-100 border-zinc-100 text-zinc-950':'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600')}>
                    <p className="text-xs uppercase font-bold opacity-70">{offset===0?'Hoje':offset===1?'Amanhã':date.toLocaleDateString('pt-BR',{weekday:'short'})}</p>
                    <p className="text-lg font-bold mt-1">{date.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</p>
                  </button>
                );
              })}
            </div>
            <input type="date" min={getLocalDateStr()}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-3 px-5 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-600"
              value={booking.selectedDate} onChange={e=>setBooking({...booking,selectedDate:e.target.value})} />
            <button onClick={()=>setStep(6)} className="w-full bg-brand-primary text-zinc-950 py-4 rounded-2xl font-bold hover:bg-brand-primary-hover transition-all">Ver Horários Disponíveis</button>
          </div>
        )}

        {/* STEP 6 */}
        {step === 6 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <button onClick={()=>setStep(5)} className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 hover:text-zinc-200"><ChevronLeft size={20}/></button>
              <div>
                <h2 className="text-2xl font-bold text-zinc-100">Que horas?</h2>
                <p className="text-zinc-500 text-sm">Horários para {booking.selectedDate.split('-').reverse().join('/')}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {availableTimes.length > 0 ? availableTimes.map(time => {
                const sel=booking.startTime===time;
                return (
                  <button key={time} onClick={()=>setBooking({...booking,startTime:time})}
                    className={clsx('py-4 rounded-2xl border font-bold transition-all text-sm', sel?'bg-zinc-100 border-zinc-100 text-zinc-950':'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-600')}>
                    {new Date(time).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
                  </button>
                );
              }) : (
                <div className="col-span-3 py-12 text-center space-y-2">
                  <p className="text-zinc-500">Nenhum horário disponível.</p>
                  <button onClick={()=>setStep(5)} className="text-brand-primary font-bold text-sm">Tentar outra data</button>
                </div>
              )}
            </div>
            <button disabled={!booking.startTime} onClick={()=>setStep(7)}
              className="w-full bg-brand-primary disabled:opacity-40 text-zinc-950 py-4 rounded-2xl font-bold hover:bg-brand-primary-hover transition-all">
              Preencher Meus Dados
            </button>
          </div>
        )}

        {/* STEP 7 */}
        {step === 7 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <button onClick={()=>setStep(6)} className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 hover:text-zinc-200"><ChevronLeft size={20}/></button>
              <div>
                <h2 className="text-2xl font-bold text-zinc-100">Quem é você?</h2>
                <p className="text-zinc-500 text-sm">Informe seus dados e do veículo.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Seu Nome</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16}/>
                  <input type="text" placeholder="Ex: João Silva"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-11 pr-4 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-600 placeholder:text-zinc-600"
                    value={booking.client.name} onChange={e=>setBooking({...booking,client:{...booking.client,name:e.target.value}})} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">WhatsApp</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={16}/>
                  <IMaskInput mask="(00) 00000-0000" placeholder="(27) 99999-0000"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-11 pr-4 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-600 placeholder:text-zinc-600"
                    value={booking.client.phone} onAccept={(v:string)=>setBooking({...booking,client:{...booking.client,phone:v}})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Placa</label>
                  <IMaskInput 
                    mask={[
                      { mask: 'aaa-0000' },
                      { mask: 'aaa0a00' }
                    ]} 
                    prepare={(str) => str.toUpperCase()}
                    placeholder="ABC-1234 ou ABC1D23"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-4 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-600 uppercase font-mono text-center placeholder:normal-case placeholder:text-zinc-600"
                    value={booking.client.plate}
                    unmask={false}
                    lazy={false}
                    onAccept={(v:string)=>setBooking({...booking,client:{...booking.client,plate:v}})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Cor</label>
                  <input type="text" placeholder="Ex: Preto"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-4 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-600 placeholder:text-zinc-600"
                    value={booking.client.color} onChange={e=>setBooking({...booking,client:{...booking.client,color:e.target.value}})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Marca</label>
                  <input type="text" placeholder="Ex: Honda"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-4 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-600 placeholder:text-zinc-600"
                    value={booking.client.brand} onChange={e=>setBooking({...booking,client:{...booking.client,brand:e.target.value}})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Modelo</label>
                  <input type="text" placeholder="Ex: Civic"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 px-4 text-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-600 placeholder:text-zinc-600"
                    value={booking.client.model} onChange={e=>setBooking({...booking,client:{...booking.client,model:e.target.value}})} />
                </div>
              </div>
            </div>
            <button disabled={!booking.client.name||!booking.client.phone||!booking.client.plate} onClick={()=>setStep(8)}
              className="w-full bg-brand-primary disabled:opacity-40 text-zinc-950 py-4 rounded-2xl font-bold hover:bg-brand-primary-hover transition-all">
              Revisar Agendamento
            </button>
          </div>
        )}

        {/* STEP 8 */}
        {step === 8 && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <button onClick={()=>setStep(7)} className="p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 hover:text-zinc-200"><ChevronLeft size={20}/></button>
              <div>
                <h2 className="text-2xl font-bold text-zinc-100">Tudo certo?</h2>
                <p className="text-zinc-500 text-sm">Confira antes de confirmar.</p>
              </div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden divide-y divide-zinc-800">
              <div className="p-5 space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Serviço</p>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-bold text-white">{selectedService?.name}</p>
                    <p className="text-zinc-500 text-xs">{VEHICLE_TYPES.find(v=>v.value===booking.vehicleType)?.label}</p>
                  </div>
                  <p className="font-black text-white text-lg">R$ {servicePrice.toFixed(2)}</p>
                </div>
                {selectedExtrasItems.length > 0 && (
                  <div className="pt-2 space-y-1.5 border-t border-zinc-800/50">
                    {selectedExtrasItems.map((e:any) => (
                      <div key={e.id} className="flex justify-between text-sm">
                        <span className="text-zinc-400">{e.name}</span>
                        <span className="text-zinc-200 font-medium">+ R$ {(e.price ?? 0).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="p-5 space-y-3 bg-zinc-800/30">
                {[
                  {icon:<CalendarIcon size={16}/>, label:'Data e Horário', value:`${new Date(booking.startTime).toLocaleDateString('pt-BR')} às ${new Date(booking.startTime).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}`},
                  {icon:<MapPin size={16}/>, label:'Unidade', value:selectedUnit?.name||''},
                  {icon:<Car size={16}/>, label:'Veículo', value:`${booking.client.brand} ${booking.client.model} • ${booking.client.color} • ${booking.client.plate.toUpperCase()}`},
                  {icon:<User size={16}/>, label:'Cliente', value:booking.client.name},
                ].map(({icon,label,value})=>(
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-400">{icon}</div>
                    <div>
                      <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">{label}</p>
                      <p className="text-zinc-100 text-sm font-medium">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-5 flex justify-between items-center">
                <span className="text-zinc-400 font-medium">Total</span>
                <span className="text-2xl font-black text-white">R$ {totalPrice.toFixed(2)}</span>
              </div>
            </div>
            {bookingError && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm text-center">{bookingError}</div>}
            <button onClick={handleConfirm} disabled={submitting}
              className="w-full bg-brand-primary disabled:opacity-60 text-zinc-950 py-5 rounded-2xl font-black text-lg hover:bg-brand-primary-hover transition-all shadow-xl shadow-brand-primary/20">
              {submitting ? 'Confirmando...' : 'Confirmar Agendamento ✓'}
            </button>
          </div>
        )}
      </main>

      {step > 2 && step < 8 && (
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-800 p-4 pb-6 z-40">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Total estimado</p>
              <p className="text-xl font-black text-white">R$ {totalPrice.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Serviço</p>
              <p className="text-sm font-medium text-zinc-300 truncate max-w-[160px]">{selectedService?.name || '—'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}