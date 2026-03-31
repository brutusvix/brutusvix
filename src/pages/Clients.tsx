import React, { useState } from 'react';
import { useData } from '../DataContext';
import { Search, Plus, User, Phone, Car, DollarSign, Award, ChevronRight, Filter, MessageCircle } from 'lucide-react';
import { IMaskInput } from 'react-imask';
import { useAuth } from '../App';

const Clients = () => {
  const { clients, vehicles, appointments, services, units, addClient } = useData();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [showOnlyRewards, setShowOnlyRewards] = useState(false);
  
  // Estados para o formulário de novo cliente
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         client.phone.includes(searchTerm);
    const matchesUnit = user?.role === 'LAVADOR' 
      ? client.unit_id === user.unit_id 
      : (selectedUnit === 'all' || client.unit_id === parseInt(selectedUnit));
    const matchesReward = showOnlyRewards ? (client.points || 0) >= 10 : true;
    
    return matchesSearch && matchesUnit && matchesReward;
  });

  const getClientVehicles = (clientId: number) => {
    return vehicles.filter(v => v.client_id === clientId);
  };

  const getClientHistory = (clientId: number) => {
    return appointments
      .filter(a => a.client_id === clientId)
      .map(a => ({
        ...a,
        service: services.find(s => s.id === a.service_id),
        unit: units.find(u => u.id === a.unit_id)
      }))
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());
  };

  const handleWhatsApp = (e: React.MouseEvent, client: any) => {
    e.stopPropagation();
    let phone = client.phone.replace(/\D/g, '');
    if (!phone.startsWith('55')) {
      phone = '55' + phone;
    }
    const message = encodeURIComponent(`Olá ${client.name}! Você atingiu ${client.points} pontos em nosso lava-rápido e ganhou uma lavagem grátis! 🎉`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const handleAddClient = async () => {
    if (!newClientName.trim() || !newClientPhone.trim()) {
      alert('Preencha nome e telefone');
      return;
    }

    try {
      const unitId = user?.role === 'LAVADOR' ? user.unit_id : (selectedUnit === 'all' ? units[0]?.id : parseInt(selectedUnit));
      
      await addClient({
        name: newClientName.trim(),
        phone: newClientPhone,
        unit_id: unitId,
        points: 0,
        total_spent: 0
      });

      // Limpar formulário e fechar modal
      setNewClientName('');
      setNewClientPhone('');
      setShowAddModal(false);
      
      alert('Cliente adicionado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao adicionar cliente:', error);
      alert(error.message || 'Erro ao adicionar cliente');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Clientes</h1>
          <p className="text-zinc-500 text-sm">Gerencie sua base de clientes e histórico</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-zinc-100 hover:bg-white text-zinc-950 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium text-sm"
        >
          <Plus size={18} strokeWidth={1.5} />
          Novo Cliente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            className="w-full bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-xl py-3 pl-10 pr-4 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowOnlyRewards(!showOnlyRewards)}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border transition-colors text-sm font-medium ${
            showOnlyRewards 
              ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' 
              : 'bg-zinc-900/50 backdrop-blur-sm border-zinc-800/50 text-zinc-400 hover:text-zinc-300'
          }`}
        >
          <Award size={18} strokeWidth={1.5} />
          Com Recompensa
        </button>
        {user?.role === 'DONO' && (
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} strokeWidth={1.5} />
            <select
              className="w-full bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-xl py-3 pl-10 pr-4 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-700 appearance-none text-sm"
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
              <tr className="border-b border-zinc-800/50 bg-zinc-800/50/50">
                <th className="px-6 py-4 text-zinc-500 font-medium text-xs uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-zinc-500 font-medium text-xs uppercase tracking-wider">Veículos</th>
                <th className="px-6 py-4 text-zinc-500 font-medium text-xs uppercase tracking-wider">Fidelidade</th>
                <th className="px-6 py-4 text-zinc-500 font-medium text-xs uppercase tracking-wider">Total Gasto</th>
                <th className="px-6 py-4 text-zinc-500 font-medium text-xs uppercase tracking-wider">Unidade</th>
                <th className="px-6 py-4 text-zinc-500 font-medium text-xs uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {filteredClients.map(client => (
                <tr 
                  key={client.id} 
                  className="hover:bg-zinc-800/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedClient(client)}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-800/50 border border-zinc-800/50 flex items-center justify-center text-zinc-400 shrink-0">
                        <User size={18} strokeWidth={1.5} />
                      </div>
                      <div className="truncate">
                        <div className="text-zinc-100 font-medium truncate">{client.name}</div>
                        <div className="text-zinc-500 text-sm">{client.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {getClientVehicles(client.id).map(v => (
                        <span key={v.id} className="bg-zinc-800/50 border border-zinc-800/50 text-zinc-300 text-[10px] px-2 py-0.5 rounded font-mono">
                          {v.plate}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Award size={16} className="text-yellow-500" strokeWidth={1.5} />
                      <span className="text-zinc-300 text-sm">{client.points || 0} pts</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-zinc-100 font-medium text-sm">
                    R$ {(client.total_spent || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-zinc-400 text-sm">
                      {units.find(u => u.id === client.unit_id)?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {(client.points || 0) >= 10 && (
                        <button 
                          onClick={(e) => handleWhatsApp(e, client)}
                          className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-full transition-colors"
                          title="Enviar recompensa via WhatsApp"
                        >
                          <MessageCircle size={16} strokeWidth={1.5} />
                        </button>
                      )}
                      <ChevronRight size={18} className="text-zinc-600" strokeWidth={1.5} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-3xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-zinc-100 mb-4 tracking-tight">Novo Cliente</h2>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Nome" 
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="w-full bg-zinc-800/50 border border-zinc-800/50 rounded-xl py-3 px-4 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-700" 
              />
              <IMaskInput 
                mask="(00) 00000-0000" 
                placeholder="Telefone" 
                value={newClientPhone}
                onAccept={(value) => setNewClientPhone(value)}
                className="w-full bg-zinc-800/50 border border-zinc-800/50 rounded-xl py-3 px-4 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-700" 
              />
              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    setShowAddModal(false);
                    setNewClientName('');
                    setNewClientPhone('');
                  }} 
                  className="flex-1 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-800/50 text-zinc-300 py-2.5 rounded-xl font-medium transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleAddClient} 
                  className="flex-1 bg-zinc-100 hover:bg-white text-zinc-950 py-2.5 rounded-xl font-medium transition-colors text-sm"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Client Details Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-zinc-800/50 flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Detalhes do Cliente</h2>
              <div className="flex items-center gap-3">
                {(selectedClient.points || 0) >= 10 && (
                  <button 
                    onClick={(e) => handleWhatsApp(e, selectedClient)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-xl transition-colors text-sm font-medium"
                  >
                    <MessageCircle size={16} strokeWidth={1.5} />
                    Avisar Recompensa
                  </button>
                )}
                <button onClick={() => setSelectedClient(null)} className="text-zinc-500 hover:text-zinc-300 text-sm font-medium">
                  Fechar
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <div className="bg-zinc-800/50 p-3 md:p-4 rounded-2xl border border-zinc-800/50">
                  <div className="text-zinc-500 text-[10px] md:text-xs uppercase tracking-wider mb-1 font-medium">Total Gasto</div>
                  <div className="text-lg md:text-2xl font-bold text-zinc-100">R$ {selectedClient.total_spent?.toFixed(2)}</div>
                </div>
                <div className="bg-zinc-800/50 p-3 md:p-4 rounded-2xl border border-zinc-800/50">
                  <div className="text-zinc-500 text-[10px] md:text-xs uppercase tracking-wider mb-1 font-medium">Pontos</div>
                  <div className="text-lg md:text-2xl font-bold text-yellow-500">{selectedClient.points} pts</div>
                </div>
                <div className="bg-zinc-800/50 p-3 md:p-4 rounded-2xl border border-zinc-800/50">
                  <div className="text-zinc-500 text-[10px] md:text-xs uppercase tracking-wider mb-1 font-medium">Lavagens</div>
                  <div className="text-lg md:text-2xl font-bold text-zinc-100">{getClientHistory(selectedClient.id).length}</div>
                </div>
                <div className="bg-zinc-800/50 p-3 md:p-4 rounded-2xl border border-zinc-800/50">
                  <div className="text-zinc-500 text-[10px] md:text-xs uppercase tracking-wider mb-1 font-medium">Próxima Grátis</div>
                  <div className="text-lg md:text-2xl font-bold text-blue-500">{10 - (selectedClient.points % 10)}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
                    <Car size={18} className="text-zinc-400" strokeWidth={1.5} />
                    Veículos Cadastrados
                  </h3>
                  <div className="space-y-3">
                    {getClientVehicles(selectedClient.id).map(v => (
                      <div key={v.id} className="bg-zinc-800/50 border border-zinc-800/50 p-4 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="text-zinc-300 font-medium text-sm">{v.model}</div>
                          <div className="text-zinc-500 text-xs font-mono mt-0.5">{v.plate}</div>
                        </div>
                        <ChevronRight size={16} className="text-zinc-600" strokeWidth={1.5} />
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-100 mb-4 flex items-center gap-2">
                    <Award size={18} className="text-zinc-400" strokeWidth={1.5} />
                    Histórico Recente
                  </h3>
                  <div className="space-y-3">
                    {getClientHistory(selectedClient.id).slice(0, 5).map(h => (
                      <div key={h.id} className="bg-zinc-800/50 border border-zinc-800/50 p-4 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="text-zinc-300 font-medium text-sm">{h.service?.name}</div>
                          <div className="text-zinc-500 text-xs mt-0.5">
                            {new Date(h.start_time).toLocaleDateString()} • {h.unit?.name}
                          </div>
                        </div>
                        <div className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded border ${
                          h.status === 'FINALIZADO' ? 'bg-zinc-100/10 text-zinc-100 border-zinc-100/20' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                        }`}>
                          {h.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
