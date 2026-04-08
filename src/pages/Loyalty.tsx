import React, { useState } from 'react';
import { useData } from '../DataContext';
import { Award, Search, Star, Gift, History, ChevronRight, Filter } from 'lucide-react';
import { useAuth } from '../App';

const Loyalty = () => {
  const { clients, appointments, services, units } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         client.phone.includes(searchTerm);
    const matchesUnit = user?.role === 'LAVADOR' 
      ? client.unit_id === user.unit_id 
      : (selectedUnit === 'all' || client.unit_id === selectedUnit);
    
    return matchesSearch && matchesUnit;
  }).sort((a, b) => (b.points || 0) - (a.points || 0));

  const getClientLoyaltyHistory = (clientId: number) => {
    return appointments
      .filter(a => a.client_id === clientId && a.status === 'FINALIZADO')
      .map(a => ({
        ...a,
        service: services.find(s => s.id === a.service_id),
      }))
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Fidelidade</h1>
          <p className="text-zinc-400">Acompanhe pontos e recompensas dos clientes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 border border-yellow-500/20">
            <Star size={24} strokeWidth={1.5} />
          </div>
          <div>
            <div className="text-zinc-500 text-sm font-medium">Total de Pontos</div>
            <div className="text-2xl font-bold text-zinc-100">
              {clients.reduce((acc, c) => acc + (c.points || 0), 0)}
            </div>
          </div>
        </div>
        <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
            <Gift size={24} strokeWidth={1.5} />
          </div>
          <div>
            <div className="text-zinc-500 text-sm font-medium">Lavagens Grátis Disponíveis</div>
            <div className="text-2xl font-bold text-zinc-100">
              {clients.reduce((acc, c) => acc + Math.floor((c.points || 0) / 10), 0)}
            </div>
          </div>
        </div>
        <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
            <Award size={24} strokeWidth={1.5} />
          </div>
          <div>
            <div className="text-zinc-500 text-sm font-medium">Clientes Ativos</div>
            <div className="text-2xl font-bold text-zinc-100">{clients.length}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Buscar cliente..."
            className="w-full bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-xl py-3 pl-10 pr-4 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {user?.role === 'DONO' && (
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} strokeWidth={1.5} />
            <select
              className="w-full bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-xl py-3 pl-10 pr-4 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-700 appearance-none"
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
            >
              <option value="all">Todas Unidades</option>
              {units.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[800px] md:min-w-0">
            <thead>
              <tr className="border-b border-zinc-800/50 bg-zinc-800/50">
                <th className="px-6 py-4 text-zinc-400 font-medium text-sm">Cliente</th>
                <th className="px-6 py-4 text-zinc-400 font-medium text-sm">Progresso (10 Lavagens)</th>
                <th className="px-6 py-4 text-zinc-400 font-medium text-sm">Pontos Totais</th>
                <th className="px-6 py-4 text-zinc-400 font-medium text-sm">Recompensas</th>
                <th className="px-6 py-4 text-zinc-400 font-medium text-sm"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredClients.map(client => {
                const progress = (client.points || 0) % 10;
                const rewards = Math.floor((client.points || 0) / 10);
                
                return (
                  <tr key={client.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-zinc-100 font-medium truncate max-w-[150px]">{client.name}</div>
                      <div className="text-zinc-500 text-sm">{client.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-full max-w-xs space-y-2">
                        <div className="flex justify-between text-xs text-zinc-500">
                          <span>{progress}/10 lavagens</span>
                          <span>{progress * 10}%</span>
                        </div>
                        <div className="w-full h-2 bg-zinc-800/50 rounded-full overflow-hidden border border-zinc-800/50">
                          <div 
                            className="h-full bg-zinc-100 transition-all duration-500" 
                            style={{ width: `${progress * 10}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Star size={16} strokeWidth={1.5} className="text-yellow-500" />
                        <span className="text-zinc-100 font-bold">{client.points || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {rewards > 0 ? (
                        <div className="flex items-center gap-1.5 text-emerald-500 font-medium">
                          <Gift size={16} strokeWidth={1.5} />
                          {rewards} grátis
                        </div>
                      ) : (
                        <span className="text-zinc-600">Nenhuma</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-zinc-500 hover:text-zinc-100 transition-colors">
                        <History size={20} strokeWidth={1.5} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Loyalty;
