import React, { useState } from 'react';
import { useData } from '../DataContext';
import { Plus, Edit2, Trash2, User as UserIcon, Mail, Phone } from 'lucide-react';
import { useAuth } from '../App';
import { User } from '../types';

// Serviços com comissões fixas padrão — aparecem sempre no modal de comissões
const DEFAULT_COMMISSIONS: { name: string; defaultValue: number }[] = [
  { name: 'Cera',                   defaultValue: 5  },
  { name: 'Revitalização',          defaultValue: 5  },
  { name: 'Hig Bancos',             defaultValue: 30 },
  { name: 'Teto',                   defaultValue: 20 },
  { name: 'Motor',                  defaultValue: 20 },
  { name: 'Chassi Hatch',           defaultValue: 30 },
  { name: 'Chassi Sedan',           defaultValue: 30 },
  { name: 'Chassi SUV',             defaultValue: 40 },
  { name: 'Chassi Caminhonete',     defaultValue: 50 },
  { name: 'Pelo de Cachorro',       defaultValue: 5  },
];

const Staff = () => {
  const { users, units, addUser, updateUser, deleteUser } = useData();
  const { user: currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen]         = useState(false);
  const [isEditing, setIsEditing]             = useState(false);
  const [currentEditingId, setCurrentEditingId] = useState<string | null>(null);
  const [showCommissionsModal, setShowCommissionsModal] = useState(false);
  const [editingCommissions, setEditingCommissions]     = useState<{ [key: string]: number }>({});
  const [selectedUnit, setSelectedUnit]       = useState<string>('all');

  const initialFormState = {
    name:           '',
    email:          '',
    phone:          '',
    role:           'LAVADOR' as 'DONO' | 'LAVADOR',
    unit_id:        units[0]?.id || '',
    password:       '',
    valorAlmoco:    0,
    valorPassagem:  0,
    tipoPagamento:  'comissao' as 'diaria' | 'comissao' | 'misto',
    valorDiaria:    0,
  };

  const [formData, setFormData] = useState(initialFormState);

  const filteredStaff = users.filter(u => {
    if (selectedUnit === 'all') return true;
    if (u.role === 'DONO') return true;
    return u.unit_id === selectedUnit;
  });

  // Monta o objeto de comissões com os defaults para itens ainda não configurados
  const buildInitialCommissions = (existing: { [key: string]: number }) => {
    const result: { [key: string]: number } = {};
    DEFAULT_COMMISSIONS.forEach(item => {
      const existingValue = existing[item.name];
      // Garantir que sempre seja número
      result[item.name] = typeof existingValue === 'number' 
        ? existingValue 
        : (typeof existingValue === 'string' ? parseFloat(existingValue) : item.defaultValue) || item.defaultValue;
    });
    return result;
  };

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setCurrentEditingId(null);
    setFormData({ ...initialFormState, unit_id: units[0]?.id || '' });
    setEditingCommissions(buildInitialCommissions({}));
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (staff: User) => {
    setIsEditing(true);
    setCurrentEditingId(staff.id);
    setFormData({
      name:          staff.name,
      email:         staff.email,
      phone:         staff.phone || '',
      role:          staff.role,
      unit_id:       staff.unit_id || units[0]?.id || '',
      password:      '',
      valorAlmoco:   staff.valorAlmoco   || 0,
      valorPassagem: staff.valorPassagem || 0,
      tipoPagamento: staff.tipoPagamento || 'comissao',
      valorDiaria:   staff.valorDiaria   || 0,
    });
    setEditingCommissions(buildInitialCommissions(staff.comissoesServico || {}));
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    const { password, ...dataToSave } = formData;

    // Converter comissões para números (apenas se não for DONO)
    const comissoesNumeros = formData.role === 'DONO' ? {} : Object.entries(editingCommissions).reduce((acc, [key, value]) => {
      acc[key] = typeof value === 'string' ? parseFloat(value) || 0 : value;
      return acc;
    }, {} as { [key: string]: number });

    console.log('🔍 Cargo:', formData.role);
    console.log('🔍 Comissões antes de enviar:', comissoesNumeros);
    console.log('🔍 Tipos:', Object.entries(comissoesNumeros).map(([k, v]) => `${k}: ${typeof v}`));

    if (isEditing && currentEditingId) {
      updateUser(currentEditingId, {
        ...dataToSave,
        unit_id:          formData.role === 'DONO' ? undefined : formData.unit_id,
        comissoesServico: comissoesNumeros,
      });
    } else {
      if (!password) return;
      addUser({
        ...formData,
        unit_id:          formData.role === 'DONO' ? undefined : formData.unit_id,
        comissoesServico: comissoesNumeros,
      });
    }

    setIsModalOpen(false);
    setFormData(initialFormState);
    setEditingCommissions({});
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Equipe e Funcionários</h1>
          <p className="text-zinc-400">Gerencie os colaboradores de todas as unidades</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-brand-primary hover:bg-brand-primary-hover text-zinc-950 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} />
          Novo Funcionário
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-full max-w-xs">
          <select
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 appearance-none"
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
          >
            <option value="all">Todas Unidades</option>
            {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map(staff => (
          <div key={staff.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4 relative overflow-hidden group">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-brand-primary">
                <UserIcon size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white truncate">{staff.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    staff.role === 'DONO' ? 'bg-purple-500/10 text-purple-500' : 'bg-blue-500/10 text-blue-500'
                  }`}>
                    {staff.role === 'DONO' ? 'Dono' : 'Lavador'}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    staff.auth_id ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                  }`}>
                    {staff.auth_id ? 'Sincronizado' : 'Sem Auth'}
                  </span>
                  <span className="text-zinc-500 text-xs">•</span>
                  <span className="text-zinc-500 text-xs">
                    {staff.role === 'DONO' ? 'Todas as Unidades' : units.find(u => u.id === staff.unit_id)?.name}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <Mail size={14} className="text-zinc-600" />
                {staff.email}
              </div>
              {staff.phone && (
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Phone size={14} className="text-zinc-600" />
                  {staff.phone}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-2">
              <button
                onClick={() => handleOpenEditModal(staff)}
                className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
              >
                <Edit2 size={18} />
              </button>
              <button
                onClick={() => deleteUser(staff.id)}
                className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Modal principal de funcionário ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6 space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h2 className="text-xl font-bold text-white">
              {isEditing ? 'Editar Funcionário' : 'Novo Funcionário'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Nome Completo</label>
                <input
                  type="text" required
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Email + Telefone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">E-mail</label>
                  <input
                    type="email" required
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Telefone</label>
                  <input
                    type="text"
                    placeholder="(00) 00000-0000"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                    value={formData.phone}
                    onChange={(e) => {
                      let value = e.target.value.replace(/\D/g, '');
                      if (value.length > 11) value = value.slice(0, 11);
                      if (value.length > 6) {
                        value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
                      } else if (value.length > 2) {
                        value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
                      } else if (value.length > 0) {
                        value = `(${value}`;
                      }
                      setFormData({ ...formData, phone: value });
                    }}
                  />
                </div>
              </div>

              {/* Cargo + Unidade */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Cargo</label>
                  <select
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'DONO' | 'LAVADOR' })}
                  >
                    <option value="LAVADOR">Lavador</option>
                    <option value="DONO">Dono / Gerente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Unidade</label>
                  <select
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 disabled:opacity-50"
                    value={formData.role === 'DONO' ? '' : formData.unit_id}
                    onChange={(e) => setFormData({ ...formData, unit_id: e.target.value })}
                    disabled={formData.role === 'DONO'}
                  >
                    {formData.role === 'DONO' && <option value="">Todas as Unidades</option>}
                    {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>

              {/* Senha (só em novo funcionário) */}
              {!isEditing && (
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Senha Temporária</label>
                  <input
                    type="password" required
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                </div>
              )}

              {/* Tipo de Pagamento + Valor Diária */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Tipo de Pagamento</label>
                  <select
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                    value={formData.tipoPagamento}
                    onChange={(e) => setFormData({ ...formData, tipoPagamento: e.target.value as any })}
                  >
                    <option value="comissao">Comissão</option>
                    <option value="diaria">Diária</option>
                    <option value="misto">Misto (Diária + Comissão)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Valor Diária (R$)</label>
                  <input
                    type="number"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50 disabled:opacity-40"
                    value={formData.valorDiaria}
                    onChange={(e) => setFormData({ ...formData, valorDiaria: parseFloat(e.target.value) || 0 })}
                    disabled={formData.tipoPagamento === 'comissao'}
                  />
                </div>
              </div>

              {/* Comissões Fixas + Almoço */}
              <div className="grid grid-cols-2 gap-4">
                {formData.role === 'LAVADOR' && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Comissões Fixas</label>
                    <button
                      type="button"
                      onClick={() => setShowCommissionsModal(true)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-white hover:bg-zinc-700 transition-colors text-sm font-medium"
                    >
                      Configurar
                    </button>
                  </div>
                )}
                <div className={formData.role === 'LAVADOR' ? '' : 'col-span-2'}>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Valor Almoço (R$)</label>
                  <input
                    type="number"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                    value={formData.valorAlmoco}
                    onChange={(e) => setFormData({ ...formData, valorAlmoco: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              {/* Valor Passagem */}
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Valor Passagem (R$)</label>
                <input
                  type="number"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                  value={formData.valorPassagem}
                  onChange={(e) => setFormData({ ...formData, valorPassagem: parseFloat(e.target.value) || 0 })}
                />
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-xl font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-brand-primary hover:bg-brand-primary-hover text-zinc-950 py-2.5 rounded-xl font-medium transition-colors"
                >
                  {isEditing ? 'Salvar Alterações' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal de Comissões Fixas ── */}
      {showCommissionsModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6 space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Comissões Fixas por Serviço</h2>
              <p className="text-zinc-500 text-sm mt-1">Valor fixo em R$ que o lavador recebe por cada serviço executado.</p>
            </div>

            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar">
              {DEFAULT_COMMISSIONS.map(item => (
                <div key={item.name} className="flex items-center justify-between gap-4 bg-zinc-800/50 rounded-xl px-4 py-3">
                  <span className="text-sm text-zinc-200 font-medium flex-1">{item.name}</span>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-bold">R$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.50"
                      className="w-24 bg-zinc-700 border border-zinc-600 rounded-lg py-1.5 pl-8 pr-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
                      value={editingCommissions[item.name] ?? item.defaultValue}
                      onChange={(e) => setEditingCommissions({
                        ...editingCommissions,
                        [item.name]: parseFloat(e.target.value) || 0
                      })}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCommissionsModal(false)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => setShowCommissionsModal(false)}
                className="flex-1 bg-brand-primary hover:bg-brand-primary-hover text-zinc-950 py-2.5 rounded-xl font-medium transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Staff;