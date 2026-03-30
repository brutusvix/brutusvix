import React, { useState, useMemo } from 'react';
import { useData } from '../DataContext';
import {
  Plus, Edit2, Trash2, ToggleLeft, ToggleRight,
  Clock, DollarSign, Filter, Tag, Bike
} from 'lucide-react';
import { useAuth } from '../App';
import { Service } from '../types';

// ── Categorias de serviço ─────────────────────────────────────────────────────
const SERVICE_CATEGORIES = [
  { id: 'lavagem',      label: 'Lavagens',      icon: '💧', keywords: ['Lavagem'] },
  { id: 'higienizacao', label: 'Higienização',  icon: '✨', keywords: ['Higienização'] },
  { id: 'polimento',    label: 'Polimento',     icon: '🔆', keywords: ['Polimento'] },
  { id: 'tratamento',   label: 'Tratamentos',   icon: '🛠️', keywords: ['Tratamento', 'Limpeza de Motor'] },
  { id: 'pacote',       label: 'Pacotes',       icon: '🎁', keywords: ['Pacote'] },
  { id: 'moto',         label: 'Motos',         icon: '🏍️', keywords: ['Moto'] },
  { id: 'outros',       label: 'Outros',        icon: '⭐', keywords: [] },
];

// Categorias de moto com preços pré-definidos
const MOTO_PRESETS = [
  { name: '160 / Titan / Biz',  price: 60  },
  { name: 'CB 250',              price: 70  },
  { name: 'CB 500 / CB 600',    price: 80  },
  { name: 'Harley Davidson',    price: 100 },
  { name: 'BMW Moto',           price: 100 },
];

function getCategoryForService(name: string) {
  for (const cat of SERVICE_CATEGORIES) {
    if (cat.keywords.some(k => name.includes(k))) return cat;
  }
  return SERVICE_CATEGORIES[SERVICE_CATEGORIES.length - 1];
}

function isMotoService(name: string) {
  return name.toLowerCase().includes('moto');
}

const Services = () => {
  const { services, extras, units, addService, updateService, deleteService, addExtra, deleteExtra, updateExtra } = useData();
  const { user } = useAuth();

  const [selectedUnit, setSelectedUnit]       = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab]             = useState<'services' | 'extras'>('services');
  const [showAddModal, setShowAddModal]       = useState(false);
  const [showAddExtraModal, setShowAddExtraModal] = useState(false);
  const [editingService, setEditingService]   = useState<Service | null>(null);
  const [editingExtra, setEditingExtra]       = useState<any | null>(null);

  // ── Form novo serviço ─────────────────────────────────────────────────────
  const emptyService = {
    name: '', category: 'lavagem', isMoto: false,
    prices: { HATCH: '', SEDAN: '', SUV: '', CAMINHONETE: '' },
    motoPrice: '',        // preço único para motos
    duration_minutes: '',
    unit_id: units[0]?.id || '',
    allUnits: true,
  };
  const [newService, setNewService] = useState(emptyService);

  // ── Form novo extra ───────────────────────────────────────────────────────
  const emptyExtra = { name: '', price: '', commissionValue: '' };
  const [newExtra, setNewExtra] = useState(emptyExtra);

  // ── Filtragem ─────────────────────────────────────────────────────────────
  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const unitMatch = selectedUnit === 'all' || s.unit_id === selectedUnit;
      const catMatch  = selectedCategory === 'all' ||
        getCategoryForService(s.name).id === selectedCategory;
      return unitMatch && catMatch;
    });
  }, [services, selectedUnit, selectedCategory]);

  // Agrupa por categoria
  const groupedServices = useMemo(() => {
    const groups: Record<string, { cat: typeof SERVICE_CATEGORIES[0]; items: Service[] }> = {};
    for (const s of filteredServices) {
      const cat = getCategoryForService(s.name);
      if (!groups[cat.id]) groups[cat.id] = { cat, items: [] };
      groups[cat.id].items.push(s);
    }
    return Object.values(groups);
  }, [filteredServices]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleAddService = () => {
    if (!newService.name || !newService.duration_minutes) return;

    const isMoto = newService.isMoto;
    const mp     = parseFloat(newService.motoPrice) || 0;

    const serviceData = {
      name: newService.name,
      prices: isMoto
        ? { HATCH: mp, SEDAN: mp, SUV: mp, CAMINHONETE: mp }
        : {
            HATCH:       parseFloat(newService.prices.HATCH)       || 0,
            SEDAN:       parseFloat(newService.prices.SEDAN)       || 0,
            SUV:         parseFloat(newService.prices.SUV)         || 0,
            CAMINHONETE: parseFloat(newService.prices.CAMINHONETE) || 0,
          },
      duration_minutes: parseInt(newService.duration_minutes),
      unit_id: newService.unit_id,
    };

    if (newService.allUnits) {
      units.forEach(unit => addService({ ...serviceData, unit_id: unit.id }));
    } else {
      addService(serviceData);
    }

    setShowAddModal(false);
    setNewService(emptyService);
  };

  const handleUpdateService = () => {
    if (!editingService) return;
    updateService(editingService.id, editingService);
    setEditingService(null);
  };

  const handleAddExtra = () => {
    if (!newExtra.name || !newExtra.commissionValue) return;
    addExtra({
      name: newExtra.name,
      price: parseFloat(newExtra.price) || 0,
      commissionValue: parseFloat(newExtra.commissionValue),
    });
    setShowAddExtraModal(false);
    setNewExtra(emptyExtra);
  };

  const handleUpdateExtra = () => {
    if (!editingExtra) return;
    updateExtra(editingExtra.id, {
      name: editingExtra.name,
      price: parseFloat(editingExtra.price),
      commissionValue: parseFloat(editingExtra.commissionValue),
    });
    setEditingExtra(null);
  };

  const handleDeleteService = (id: string) => {
    if (window.confirm('Excluir este serviço?')) deleteService(id);
  };
  const handleDeleteExtra = (id: string) => {
    if (window.confirm('Excluir este extra?')) deleteExtra(id);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Serviços e Extras</h1>
          <p className="text-zinc-500 text-sm">Gerencie o catálogo de serviços, preços e adicionais</p>
        </div>
        {user?.role === 'DONO' && (
          <div className="flex gap-2">
            <button onClick={() => setShowAddExtraModal(true)}
              className="bg-zinc-900/50 border border-zinc-800/50 hover:bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium text-sm">
              <Plus size={18} strokeWidth={1.5} /> Novo Extra
            </button>
            <button onClick={() => setShowAddModal(true)}
              className="bg-zinc-100 hover:bg-white text-zinc-950 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium text-sm">
              <Plus size={18} strokeWidth={1.5} /> Novo Serviço
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800/50">
        {(['services','extras'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 text-sm font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === tab ? 'border-zinc-100 text-zinc-100' : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}>
            {tab === 'services' ? 'Serviços Principais' : 'Serviços Extras'}
          </button>
        ))}
      </div>

      {/* ── ABA SERVIÇOS ── */}
      {activeTab === 'services' && (
        <>
          {/* Filtros */}
          <div className="flex flex-wrap gap-3">
            <select
              className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl py-2.5 px-4 text-zinc-300 focus:outline-none text-sm appearance-none"
              value={selectedUnit} onChange={e => setSelectedUnit(e.target.value)}>
              <option value="all">Todas Unidades</option>
              {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <select
              className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl py-2.5 px-4 text-zinc-300 focus:outline-none text-sm appearance-none"
              value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
              <option value="all">Todas Categorias</option>
              {SERVICE_CATEGORIES.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>

          {/* Grupos de serviços */}
          {groupedServices.length === 0 && (
            <div className="text-center py-12 text-zinc-500">Nenhum serviço encontrado.</div>
          )}
          {groupedServices.map(({ cat, items }) => (
            <div key={cat.id} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{cat.icon}</span>
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">{cat.label}</h3>
                <span className="text-xs text-zinc-700 font-medium">({items.length})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(service => {
                  const isMoto = isMotoService(service.name);
                  return (
                    <div key={service.id}
                      className={`bg-zinc-900/50 border rounded-2xl p-5 space-y-4 ${
                        service.active !== false ? 'border-zinc-800/50' : 'border-red-500/20 opacity-60'
                      }`}>
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <h3 className="font-bold text-zinc-100 text-sm truncate">{service.name}</h3>
                          <p className="text-zinc-600 text-xs mt-0.5">{units.find(u => u.id === service.unit_id)?.name}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-base font-black text-zinc-100">
                            R$ {(service.prices?.HATCH ?? 0).toFixed(2)}
                          </p>
                          {!isMoto && (
                            <p className="text-[10px] text-zinc-500">Hatch</p>
                          )}
                        </div>
                      </div>

                      {/* Tabela de preços por tipo (só para não-motos) */}
                      {!isMoto && (
                        <div className="grid grid-cols-4 gap-1 text-center">
                          {[
                            { label: 'Hatch', val: service.prices?.HATCH ?? 0 },
                            { label: 'Sedan', val: service.prices?.SEDAN ?? 0 },
                            { label: 'SUV',   val: service.prices?.SUV   ?? 0 },
                            { label: 'Cam.',  val: service.prices?.CAMINHONETE ?? 0 },
                          ].map(({ label, val }) => (
                            <div key={label} className="bg-zinc-800/40 rounded-lg py-1.5 px-1">
                              <p className="text-[9px] text-zinc-600 font-bold uppercase">{label}</p>
                              <p className="text-xs font-bold text-zinc-300 mt-0.5">R${val.toFixed(0)}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-zinc-500 text-xs">
                        <span className="flex items-center gap-1"><Clock size={12} strokeWidth={1.5} />{service.duration_minutes} min</span>
                        {isMoto && <span className="flex items-center gap-1 text-brand-primary font-bold">🏍️ Moto</span>}
                      </div>

                      <div className="pt-3 border-t border-zinc-800/50 flex items-center justify-between">
                        <button onClick={() => updateService(service.id, { active: !service.active })}
                          className={`flex items-center gap-1.5 transition-colors ${service.active !== false ? 'text-zinc-100' : 'text-zinc-600'}`}>
                          {service.active !== false
                            ? <ToggleRight size={28} strokeWidth={1.5} />
                            : <ToggleLeft size={28} strokeWidth={1.5} />}
                          <span className="text-[10px] uppercase font-bold text-zinc-500">
                            {service.active !== false ? 'Ativo' : 'Inativo'}
                          </span>
                        </button>
                        {user?.role === 'DONO' && (
                          <div className="flex items-center gap-1">
                            <button onClick={() => setEditingService(service)}
                              className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-100 transition-colors">
                              <Edit2 size={16} strokeWidth={1.5} />
                            </button>
                            <button onClick={() => handleDeleteService(service.id)}
                              className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-red-500 transition-colors">
                              <Trash2 size={16} strokeWidth={1.5} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}

      {/* ── ABA EXTRAS ── */}
      {activeTab === 'extras' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {extras.length === 0 && (
            <div className="col-span-3 text-center py-12 text-zinc-500">Nenhum extra cadastrado.</div>
          )}
          {extras.map(extra => (
            <div key={extra.id} className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 space-y-3">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h3 className="font-bold text-zinc-100">{extra.name}</h3>
                  <p className="text-zinc-500 text-xs mt-0.5">Todas as unidades</p>
                </div>
                  <div className="text-right">
                    <p className="font-black text-zinc-100">R$ {(extra.price ?? 0).toFixed(2)}</p>
                    <p className="text-[10px] text-zinc-500">Comissão: R$ {(extra.commissionValue ?? 0).toFixed(2)}</p>
                  </div>
              </div>
              {user?.role === 'DONO' && (
                <div className="pt-3 border-t border-zinc-800/50 flex items-center justify-end gap-1">
                  <button onClick={() => setEditingExtra({ ...extra, price: extra.price.toString(), commissionValue: extra.commissionValue.toString() })}
                    className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-100 transition-colors">
                    <Edit2 size={16} strokeWidth={1.5} />
                  </button>
                  <button onClick={() => handleDeleteExtra(extra.id)}
                    className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-red-500 transition-colors">
                    <Trash2 size={16} strokeWidth={1.5} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Modal Novo Serviço ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-zinc-100">Novo Serviço</h2>

            {/* Nome */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Nome do Serviço</label>
              <input type="text" placeholder="Ex: Lavagem Completa"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-zinc-300 focus:outline-none placeholder:text-zinc-600"
                value={newService.name} onChange={e => setNewService({ ...newService, name: e.target.value })} />
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Categoria</label>
              <div className="grid grid-cols-3 gap-2">
                {SERVICE_CATEGORIES.map(cat => (
                  <button key={cat.id} type="button"
                    onClick={() => setNewService({ ...newService, category: cat.id, isMoto: cat.id === 'moto' })}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                      newService.category === cat.id
                        ? 'bg-brand-primary/10 border-brand-primary/40 text-zinc-100'
                        : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                    }`}>
                    <span>{cat.icon}</span> {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Preços — Moto (preço único) */}
            {newService.isMoto ? (
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
                  Preço (R$) — único para todos os tipos
                </label>
                {/* Atalhos de presets de moto */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {MOTO_PRESETS.map(p => (
                    <button key={p.name} type="button"
                      onClick={() => setNewService({ ...newService, name: newService.name || p.name, motoPrice: p.price.toString() })}
                      className="text-xs bg-zinc-800 border border-zinc-700 hover:border-zinc-500 text-zinc-300 px-3 py-1.5 rounded-lg transition-colors">
                      {p.name} — R${p.price}
                    </button>
                  ))}
                </div>
                <input type="number" placeholder="Ex: 60"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-zinc-300 focus:outline-none placeholder:text-zinc-600"
                  value={newService.motoPrice} onChange={e => setNewService({ ...newService, motoPrice: e.target.value })} />
              </div>
            ) : (
              /* Preços — Carro (4 tipos) */
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Preços por Tipo (R$)</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'HATCH',       label: '🚗 Hatch' },
                    { key: 'SEDAN',       label: '🚙 Sedan' },
                    { key: 'SUV',         label: '🚐 SUV' },
                    { key: 'CAMINHONETE', label: '🛻 Caminhonete' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-xs text-zinc-500 mb-1">{label}</label>
                      <input type="number" placeholder="0"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-zinc-300 focus:outline-none placeholder:text-zinc-600"
                        value={(newService.prices as any)[key]}
                        onChange={e => setNewService({ ...newService, prices: { ...newService.prices, [key]: e.target.value } })} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Duração */}
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Duração (minutos)</label>
              <input type="number" placeholder="Ex: 30"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-zinc-300 focus:outline-none placeholder:text-zinc-600"
                value={newService.duration_minutes} onChange={e => setNewService({ ...newService, duration_minutes: e.target.value })} />
            </div>

            {/* Unidade */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={newService.allUnits}
                  onChange={e => setNewService({ ...newService, allUnits: e.target.checked })}
                  className="w-4 h-4 rounded" />
                <span className="text-sm font-medium text-zinc-300">Adicionar em todas as unidades</span>
              </label>
              {!newService.allUnits && (
                <select className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-zinc-300 focus:outline-none"
                  value={newService.unit_id} onChange={e => setNewService({ ...newService, unit_id: e.target.value })}>
                  {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowAddModal(false); setNewService(emptyService); }}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 rounded-xl font-medium text-sm">
                Cancelar
              </button>
              <button onClick={handleAddService}
                className="flex-1 bg-zinc-100 hover:bg-white text-zinc-950 py-2.5 rounded-xl font-medium text-sm">
                Salvar Serviço
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Editar Serviço ── */}
      {editingService && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6 space-y-5">
            <h2 className="text-xl font-bold text-zinc-100">Editar Serviço</h2>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Nome</label>
              <input type="text" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-zinc-300 focus:outline-none"
                value={editingService.name} onChange={e => setEditingService({ ...editingService, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'HATCH',       label: '🚗 Hatch' },
                { key: 'SEDAN',       label: '🚙 Sedan' },
                { key: 'SUV',         label: '🚐 SUV' },
                { key: 'CAMINHONETE', label: '🛻 Caminhonete' },
              ].map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-xs text-zinc-500 mb-1">{label}</label>
                  <input type="number" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-zinc-300 focus:outline-none"
                    value={(editingService.prices as any)?.[key] ?? 0}
                    onChange={e => setEditingService({ ...editingService, prices: { ...editingService.prices, [key]: parseFloat(e.target.value) || 0 } })} />
                </div>
              ))}
              <div>
                <label className="block text-xs text-zinc-500 mb-1">⏱ Duração (min)</label>
                <input type="number" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-zinc-300 focus:outline-none"
                  value={editingService.duration_minutes}
                  onChange={e => setEditingService({ ...editingService, duration_minutes: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditingService(null)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 rounded-xl font-medium text-sm">Cancelar</button>
              <button onClick={handleUpdateService} className="flex-1 bg-zinc-100 hover:bg-white text-zinc-950 py-2.5 rounded-xl font-medium text-sm">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Novo Extra ── */}
      {showAddExtraModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6 space-y-5">
            <h2 className="text-xl font-bold text-zinc-100">Novo Serviço Extra</h2>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Nome</label>
              <input type="text" placeholder="Ex: Cera, Pelo de Cachorro..."
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-zinc-300 focus:outline-none placeholder:text-zinc-600"
                value={newExtra.name} onChange={e => setNewExtra({ ...newExtra, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Preço ao Cliente (R$)</label>
                <input type="number" placeholder="0"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-zinc-300 focus:outline-none"
                  value={newExtra.price} onChange={e => setNewExtra({ ...newExtra, price: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Comissão Lavador (R$)</label>
                <input type="number" placeholder="0"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-zinc-300 focus:outline-none"
                  value={newExtra.commissionValue} onChange={e => setNewExtra({ ...newExtra, commissionValue: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => { setShowAddExtraModal(false); setNewExtra(emptyExtra); }} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 rounded-xl font-medium text-sm">Cancelar</button>
              <button onClick={handleAddExtra} className="flex-1 bg-zinc-100 hover:bg-white text-zinc-950 py-2.5 rounded-xl font-medium text-sm">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Editar Extra ── */}
      {editingExtra && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6 space-y-5">
            <h2 className="text-xl font-bold text-zinc-100">Editar Extra</h2>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Nome</label>
              <input type="text" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-zinc-300 focus:outline-none"
                value={editingExtra.name} onChange={e => setEditingExtra({ ...editingExtra, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Preço (R$)</label>
                <input type="number" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-zinc-300 focus:outline-none"
                  value={editingExtra.price} onChange={e => setEditingExtra({ ...editingExtra, price: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Comissão (R$)</label>
                <input type="number" className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-zinc-300 focus:outline-none"
                  value={editingExtra.commissionValue} onChange={e => setEditingExtra({ ...editingExtra, commissionValue: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditingExtra(null)} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-2.5 rounded-xl font-medium text-sm">Cancelar</button>
              <button onClick={handleUpdateExtra} className="flex-1 bg-zinc-100 hover:bg-white text-zinc-950 py-2.5 rounded-xl font-medium text-sm">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;