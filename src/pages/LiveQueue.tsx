import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Car, 
  CheckCircle2, 
  PlayCircle, 
  Timer,
  ChevronRight,
  Monitor,
  Maximize2
} from 'lucide-react';
import { useData } from '../DataContext';
import { useAuth } from '../App';
import { clsx } from 'clsx';

export default function LiveQueue() {
  const { appointments, units } = useData();
  const { user } = useAuth();
  const [selectedUnitId, setSelectedUnitId] = useState<number>(user?.unit_id || units[0]?.id || 1);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const unitAppointments = appointments.filter(a => a.unit_id === selectedUnitId);
  
  const waiting = unitAppointments.filter(a => a.status === 'AGENDADO');
  const inProgress = unitAppointments.filter(a => a.status === 'EM_ANDAMENTO');
  const finished = unitAppointments.filter(a => a.status === 'FINALIZADO').slice(0, 5);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-950">
            <Monitor size={28} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase text-zinc-100">Painel de Atendimento</h1>
            <p className="text-zinc-500 font-bold uppercase text-xs tracking-widest">
              {units.find(u => u.id === selectedUnitId)?.name} • {currentTime.toLocaleTimeString('pt-BR')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user?.role === 'DONO' && (
            <select 
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(Number(e.target.value))}
              className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 text-zinc-100 rounded-xl px-4 py-2 text-sm font-bold focus:ring-1 focus:ring-zinc-700 focus:outline-none"
            >
              {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          )}
          <button className="p-3 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-xl text-zinc-500 hover:text-zinc-100 transition-all">
            <Maximize2 size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Waiting Column */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-zinc-400">
              <Clock size={20} strokeWidth={1.5} />
              <h2 className="font-black uppercase tracking-widest text-sm">Na Fila</h2>
            </div>
            <span className="bg-zinc-900/50 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold border border-zinc-800/50">{waiting.length}</span>
          </div>

          <div className="space-y-4">
            {waiting.map(app => (
              <div key={app.id} className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-3xl p-6 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-zinc-100 font-black text-2xl tracking-tighter uppercase">{app.vehicle_plate}</p>
                    <p className="text-zinc-400 font-bold text-sm">{app.vehicle_model}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-zinc-100 font-black text-xl">{new Date(app.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Agendado</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-zinc-800/50 flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{app.service_name}</span>
                  <div className="flex items-center gap-1 text-zinc-500">
                    <Timer size={14} strokeWidth={1.5} />
                    <span className="text-xs font-bold">Aguardando</span>
                  </div>
                </div>
              </div>
            ))}
            {waiting.length === 0 && (
              <div className="py-20 text-center border-2 border-dashed border-zinc-800/50 rounded-3xl">
                <p className="text-zinc-700 font-bold uppercase tracking-widest text-sm">Fila Vazia</p>
              </div>
            )}
          </div>
        </div>

        {/* In Progress Column */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-blue-500">
              <PlayCircle size={20} strokeWidth={1.5} />
              <h2 className="font-black uppercase tracking-widest text-sm">Em Lavagem</h2>
            </div>
            <span className="bg-blue-500/10 text-blue-500 px-3 py-1 rounded-full text-xs font-bold border border-blue-500/20">{inProgress.length}</span>
          </div>

          <div className="space-y-4">
            {inProgress.map(app => (
              <div key={app.id} className="bg-zinc-900/50 backdrop-blur-sm border-2 border-blue-500/30 rounded-3xl p-6 space-y-4 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800/60">
                  <div className="h-full bg-blue-500 animate-pulse" style={{ width: '65%' }} />
                </div>
                
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-blue-500 font-black text-3xl tracking-tighter uppercase">{app.vehicle_plate}</p>
                    <p className="text-zinc-400 font-bold text-sm">{app.vehicle_model}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                    <Car size={24} strokeWidth={1.5} />
                  </div>
                </div>

                <div className="flex items-center gap-3 py-2">
                  <div className="flex -space-x-2">
                    {[1, 2].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-[#141414] bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300">
                        L{i}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Equipe Alpha</p>
                </div>

                <div className="pt-4 border-t border-zinc-800/50 flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">{app.service_name}</span>
                  <div className="flex items-center gap-1 text-blue-500">
                    <Timer size={14} strokeWidth={1.5} className="animate-spin-slow" />
                    <span className="text-xs font-bold">25 min restantes</span>
                  </div>
                </div>
              </div>
            ))}
            {inProgress.length === 0 && (
              <div className="py-20 text-center border-2 border-dashed border-zinc-800/50 rounded-3xl">
                <p className="text-zinc-700 font-bold uppercase tracking-widest text-sm">Nenhum em andamento</p>
              </div>
            )}
          </div>
        </div>

        {/* Finished Column */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-emerald-500">
              <CheckCircle2 size={20} strokeWidth={1.5} />
              <h2 className="font-black uppercase tracking-widest text-sm">Prontos</h2>
            </div>
            <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20">{finished.length}</span>
          </div>

          <div className="space-y-4">
            {finished.map(app => (
              <div key={app.id} className="bg-zinc-900/50 backdrop-blur-sm/40 border border-zinc-800/50 rounded-3xl p-6 flex items-center justify-between group hover:bg-zinc-900/50 backdrop-blur-sm transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                    <CheckCircle2 size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-zinc-100 font-black text-xl tracking-tighter uppercase">{app.vehicle_plate}</p>
                    <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest">{app.vehicle_model}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-emerald-500 font-black text-sm uppercase">Retirar</p>
                  <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest">Finalizado</p>
                </div>
              </div>
            ))}
            {finished.length === 0 && (
              <div className="py-20 text-center border-2 border-dashed border-zinc-800/50 rounded-3xl">
                <p className="text-zinc-700 font-bold uppercase tracking-widest text-sm">Nenhum pronto</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Footer Info */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800/50 p-4 flex items-center justify-between px-12">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-zinc-100" />
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Aguardando</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Em Lavagem</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Pronto</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-zinc-500">
          <Monitor size={16} strokeWidth={1.5} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Brutus Live Display v1.0</span>
        </div>
      </div>
    </div>
  );
}
