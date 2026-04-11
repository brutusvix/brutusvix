import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, Store, Clock, Link as LinkIcon,
  Save, CheckCircle2, AlertCircle, Power, ChevronRight,
  MapPin, Phone, Plus, Trash2, Users
} from 'lucide-react';
import { useData } from '../DataContext';
import { useAuth } from '../App';
import BookingLinkManager from '../components/BookingLinkManager';
import { OperatingHours, Unit } from '../types';

export default function Settings() {
  const { units, updateUnit, addUnit, deleteUnit, users, updateUser } = useData();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab]           = useState<'units' | 'hours' | 'links'>('units');
  const [selectedUnitId, setSelectedUnitId] = useState<string>(units[0]?.id || '');
  const [saveStatus, setSaveStatus]         = useState<'idle' | 'saving' | 'success'>('idle');
  const [editingUnit, setEditingUnit]       = useState<Unit | null>(null);
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [newUnit, setNewUnit]               = useState({ name: '', address: '', phone: '' });
  const [unitToDelete, setUnitToDelete]     = useState<string | null>(null);

  const handleAddUnit = (e: React.FormEvent) => {
    e.preventDefault();
    addUnit(newUnit);
    setShowAddUnitModal(false);
    setNewUnit({ name: '', address: '', phone: '' });
  };

  const confirmDeleteUnit = () => {
    if (unitToDelete) {
      deleteUnit(unitToDelete);
      setUnitToDelete(null);
    }
  };

  // Atribuir lavador à unidade
  const handleAssignUser = async (userId: string, unitId: string | undefined) => {
    try {
      await updateUser(userId, { unit_id: unitId });
      alert('Funcionário atribuído com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atribuir funcionário:', error);
      alert(`Erro ao atribuir funcionário: ${error.message}`);
    }
  };

  const handleUpdateUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUnit) return;
    updateUnit(editingUnit.id, editingUnit);
    setEditingUnit(null);
  };

  const selectedUnit = units.find(u => u.id === selectedUnitId);

  const handleToggleUnit = (unitId: string, currentStatus: boolean) => {
    updateUnit(unitId, { isOpen: !currentStatus });
  };

  const handleToggleAllUnits = (status: boolean) => {
    units.forEach(u => updateUnit(u.id, { isOpen: status }));
  };

  const handleUpdateHours = (dayIndex: number, field: keyof OperatingHours, value: any) => {
    if (!selectedUnit) return;
    const newHours = [...selectedUnit.operatingHours];
    newHours[dayIndex] = { ...newHours[dayIndex], [field]: value };
    updateUnit(selectedUnitId, { operatingHours: newHours });
  };

  const handleSave = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1000);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100 flex items-center gap-3">
            <SettingsIcon className="text-zinc-400" strokeWidth={1.5} />
            Ajustes do Sistema
          </h1>
          <p className="text-zinc-500 mt-1 text-sm">Configure o funcionamento das suas unidades e links.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowAddUnitModal(true)}
            className="px-4 py-2 bg-brand-primary text-zinc-950 rounded-xl text-sm font-medium hover:bg-brand-primary-hover transition-all flex items-center gap-2">
            <Plus size={16} strokeWidth={1.5} /> Nova Unidade
          </button>
          <button onClick={() => handleToggleAllUnits(true)}
            className="px-4 py-2 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 text-zinc-300 rounded-xl text-sm font-medium hover:bg-zinc-800/50 transition-all flex items-center gap-2">
            <Power size={16} className="text-emerald-500" strokeWidth={1.5} /> Abrir Todas
          </button>
          <button onClick={() => handleToggleAllUnits(false)}
            className="px-4 py-2 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 text-zinc-300 rounded-xl text-sm font-medium hover:bg-zinc-800/50 transition-all flex items-center gap-2">
            <Power size={16} className="text-red-500" strokeWidth={1.5} /> Fechar Todas
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800/50">
        {(['units', 'hours', 'links'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-6 py-4 text-sm font-bold transition-all border-b-2 ${
              activeTab === tab ? 'border-zinc-100 text-zinc-100' : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}>
            <div className="flex items-center gap-2">
              {tab === 'units'  && <><Store size={18} strokeWidth={1.5} /> Unidades</>}
              {tab === 'hours'  && <><Clock size={18} strokeWidth={1.5} /> Horários</>}
              {tab === 'links'  && <><LinkIcon size={18} strokeWidth={1.5} /> Links & QR Codes</>}
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8">

        {/* ── ABA UNIDADES ── */}
        {activeTab === 'units' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {units.map(unit => {
              // Lavadores desta unidade
              const unitWashers = users.filter(u => u.role === 'LAVADOR' && u.unit_id === unit.id);
              // Lavadores disponíveis (sem unidade ou de outra unidade)
              const availableWashers = users.filter(u => u.role === 'LAVADOR' && u.unit_id !== unit.id);

              return (
                <div key={unit.id} className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-3xl p-6 space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 bg-zinc-800/50 border border-zinc-800/50 rounded-2xl flex items-center justify-center text-zinc-400">
                      <Store size={24} strokeWidth={1.5} />
                    </div>
                    <button
                      onClick={() => handleToggleUnit(unit.id, unit.isOpen)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                        unit.isOpen
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-500 border border-red-500/20'
                      }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${unit.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                      {unit.isOpen ? 'Aberta' : 'Fechada'}
                    </button>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-zinc-100 tracking-tight">{unit.name}</h3>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-zinc-500 text-sm">
                        <MapPin size={14} strokeWidth={1.5} /> {unit.address}
                      </div>
                      {unit.phone && (
                        <div className="flex items-center gap-2 text-zinc-500 text-sm">
                          <Phone size={14} strokeWidth={1.5} /> {unit.phone}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-zinc-800/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setEditingUnit(unit)}
                        className="text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors">
                        Editar
                      </button>
                      <button onClick={() => setUnitToDelete(unit.id)}
                        className="text-sm font-medium text-red-500/70 hover:text-red-500 transition-colors">
                        Excluir
                      </button>
                    </div>
                    <button onClick={() => { setSelectedUnitId(unit.id); setActiveTab('hours'); }}
                      className="text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors flex items-center gap-1">
                      Horários <ChevronRight size={14} strokeWidth={1.5} />
                    </button>
                  </div>

                  {/* ── Funcionários atribuídos ── */}
                  {currentUser?.role === 'DONO' && (
                    <div className="pt-4 border-t border-zinc-800/50">
                      <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">
                        <Users size={14} strokeWidth={1.5} /> Funcionários Atribuídos
                      </div>
                      <div className="space-y-2">
                        {unitWashers.length === 0 && (
                          <p className="text-xs text-zinc-600 italic">Nenhum funcionário atribuído.</p>
                        )}
                        {unitWashers.map(u => (
                          <div key={u.id} className="flex items-center justify-between text-sm text-zinc-300 bg-zinc-800/30 rounded-lg px-3 py-2">
                            <span>{u.name}</span>
                            <button
                              onClick={() => handleAssignUser(u.id, undefined)}
                              className="text-zinc-500 hover:text-red-500 transition-colors"
                              title="Remover da unidade">
                              <Trash2 size={14} strokeWidth={1.5} />
                            </button>
                          </div>
                        ))}

                        {/* Dropdown para atribuir lavador disponível */}
                        {availableWashers.length > 0 && (
                          <select
                            className="w-full bg-zinc-800/30 border border-zinc-700/50 rounded-lg py-2 px-3 text-xs text-zinc-300 hover:bg-zinc-800/50 hover:border-zinc-600 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 appearance-none cursor-pointer transition-all"
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAssignUser(e.target.value, unit.id);
                                e.target.value = '';
                              }
                            }}
                            value="">
                            <option value="">+ Atribuir Funcionário</option>
                            {availableWashers.map(u => (
                              <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── ABA HORÁRIOS ── */}
        {activeTab === 'hours' && (
          <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-800/30">
              <div className="flex items-center gap-4">
                <select
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  className="bg-zinc-800/50 border border-zinc-800/50 text-zinc-300 rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-zinc-700 appearance-none">
                  {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <h2 className="text-lg font-bold text-zinc-100 tracking-tight">Horário de Funcionamento</h2>
              </div>
              <button onClick={handleSave} disabled={saveStatus !== 'idle'}
                className="bg-zinc-100 text-zinc-950 px-6 py-2 rounded-xl font-medium text-sm flex items-center gap-2 hover:bg-white transition-all disabled:opacity-50">
                {saveStatus === 'saving' ? 'Salvando...'
                  : saveStatus === 'success' ? <><CheckCircle2 size={16} strokeWidth={1.5} /> Salvo!</>
                  : <><Save size={16} strokeWidth={1.5} /> Salvar Alterações</>}
              </button>
            </div>
            <div className="p-6 space-y-4">
              {selectedUnit?.operatingHours.map((oh, idx) => (
                <div key={oh.day} className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-2xl border border-zinc-800/50">
                  <div className="flex items-center gap-4 w-1/4">
                    <div className={`w-2 h-2 rounded-full ${oh.isOpen ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
                    <span className="font-medium text-zinc-300 text-sm">{oh.day}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-1 justify-center">
                    <input type="time" value={oh.open} disabled={!oh.isOpen}
                      onChange={(e) => handleUpdateHours(idx, 'open', e.target.value)}
                      className="bg-zinc-900/50 border border-zinc-800/50 text-zinc-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none disabled:opacity-30" />
                    <span className="text-zinc-500 text-xs font-bold uppercase">até</span>
                    <input type="time" value={oh.close} disabled={!oh.isOpen}
                      onChange={(e) => handleUpdateHours(idx, 'close', e.target.value)}
                      className="bg-zinc-900/50 border border-zinc-800/50 text-zinc-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none disabled:opacity-30" />
                  </div>
                  <div className="w-1/4 flex justify-end">
                    <button onClick={() => handleUpdateHours(idx, 'isOpen', !oh.isOpen)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        oh.isOpen
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : 'bg-zinc-900/50 text-zinc-500 border border-zinc-800/50'
                      }`}>
                      {oh.isOpen ? 'Aberto' : 'Fechado'}
                    </button>
                  </div>
                </div>
              ))}
              <div className="mt-8 p-4 bg-zinc-100/5 border border-zinc-100/10 rounded-2xl flex items-start gap-3">
                <AlertCircle className="text-zinc-400 shrink-0" size={18} strokeWidth={1.5} />
                <p className="text-sm text-zinc-400 leading-relaxed">
                  <strong className="text-zinc-300">Atenção:</strong> Os horários configurados aqui refletem na agenda pública de agendamentos.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── ABA LINKS ── */}
        {activeTab === 'links' && (
          <div className="space-y-8">
            <BookingLinkManager />
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-3xl p-8 space-y-6">
              <div className="flex items-center gap-3 text-zinc-400">
                <SettingsIcon size={24} strokeWidth={1.5} />
                <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Configurações de Integração</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Webhook de Notificação</label>
                  <input type="url" placeholder="https://seu-webhook.com/lavajato"
                    className="w-full bg-zinc-800/50 border border-zinc-800/50 rounded-xl py-3 px-4 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-700" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">ID do Google Analytics</label>
                  <input type="text" placeholder="G-XXXXXXXXXX"
                    className="w-full bg-zinc-800/50 border border-zinc-800/50 rounded-xl py-3 px-4 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-700" />
                </div>
              </div>
              <div className="pt-4">
                <button className="bg-zinc-800/50 border border-zinc-800/50 text-zinc-300 px-6 py-3 rounded-xl font-medium text-sm hover:bg-zinc-800 transition-all">
                  Salvar Configurações Avançadas
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Modal Nova Unidade ── */}
        {showAddUnitModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-3xl w-full max-w-md p-6 space-y-6">
              <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Nova Unidade</h2>
              <form onSubmit={handleAddUnit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Nome</label>
                  <input type="text" required
                    className="w-full bg-zinc-800/50 border border-zinc-800/50 rounded-xl py-2.5 px-4 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                    value={newUnit.name} onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Endereço</label>
                  <input type="text" required
                    className="w-full bg-zinc-800/50 border border-zinc-800/50 rounded-xl py-2.5 px-4 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                    value={newUnit.address} onChange={(e) => setNewUnit({ ...newUnit, address: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Telefone</label>
                  <input type="text"
                    className="w-full bg-zinc-800/50 border border-zinc-800/50 rounded-xl py-2.5 px-4 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                    value={newUnit.phone} onChange={(e) => setNewUnit({ ...newUnit, phone: e.target.value })} />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowAddUnitModal(false)}
                    className="flex-1 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-800/50 text-zinc-300 py-2.5 rounded-xl font-medium transition-colors text-sm">
                    Cancelar
                  </button>
                  <button type="submit"
                    className="flex-1 bg-zinc-100 hover:bg-white text-zinc-950 py-2.5 rounded-xl font-medium transition-colors text-sm">
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal Editar Unidade ── */}
        {editingUnit && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-3xl w-full max-w-md p-6 space-y-6">
              <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Editar Unidade</h2>
              <form onSubmit={handleUpdateUnit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Nome</label>
                  <input type="text" required
                    className="w-full bg-zinc-800/50 border border-zinc-800/50 rounded-xl py-2.5 px-4 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                    value={editingUnit.name} onChange={(e) => setEditingUnit({ ...editingUnit, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Endereço</label>
                  <input type="text" required
                    className="w-full bg-zinc-800/50 border border-zinc-800/50 rounded-xl py-2.5 px-4 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                    value={editingUnit.address} onChange={(e) => setEditingUnit({ ...editingUnit, address: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Telefone</label>
                  <input type="text"
                    className="w-full bg-zinc-800/50 border border-zinc-800/50 rounded-xl py-2.5 px-4 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                    value={editingUnit.phone} onChange={(e) => setEditingUnit({ ...editingUnit, phone: e.target.value })} />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setEditingUnit(null)}
                    className="flex-1 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-800/50 text-zinc-300 py-2.5 rounded-xl font-medium transition-colors text-sm">
                    Cancelar
                  </button>
                  <button type="submit"
                    className="flex-1 bg-zinc-100 hover:bg-white text-zinc-950 py-2.5 rounded-xl font-medium transition-colors text-sm">
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal Confirmar Exclusão ── */}
        {unitToDelete && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm p-6 space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-bold text-white">Excluir Unidade?</h2>
                <p className="text-zinc-400 text-sm">Esta ação não pode ser desfeita e todos os dados vinculados serão afetados.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setUnitToDelete(null)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-xl font-medium transition-colors">
                  Cancelar
                </button>
                <button onClick={confirmDeleteUnit}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-medium transition-colors">
                  Excluir
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}