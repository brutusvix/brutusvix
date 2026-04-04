import React, { useState } from 'react';
import { useData } from '../DataContext';
import { DollarSign, TrendingUp, TrendingDown, Users, Download, Plus, Edit2, Trash2 } from 'lucide-react';
import { useAuth } from '../App';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Finance = () => {
  const { transactions, appointments, users, units, services, extras, clients, production, addTransaction, updateTransaction, deleteTransaction } = useData();
  const { user } = useAuth();
  const [selectedUnit, setSelectedUnit] = useState<string>('all');
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('month');
  const [showAddModal, setShowAddModal]       = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null);
  const getLocalDateStr = () => new Date().toLocaleDateString('en-CA');

  const [newTransaction, setNewTransaction] = useState({
    description: '', amount: '', category: 'SERVICO',
    type: 'INCOME' as 'INCOME' | 'EXPENSE', date: getLocalDateStr(),
  });

  const filterDate = (dateString: string) => {
    const now = new Date();
    const d   = new Date(dateString);
    if (period === 'today') return d.toDateString() === now.toDateString();
    if (period === 'week')  { const w = new Date(now); w.setDate(now.getDate() - 7); return d >= w; }
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };

  // ── Filtro por unidade — string UUID ──────────────────────────────────────
  const filteredTransactions = transactions.filter(t => {
    const unitMatch = user?.role === 'LAVADOR'
      ? t.unit_id === user.unit_id
      : selectedUnit === 'all' || t.unit_id === selectedUnit;
    return unitMatch && filterDate(t.date);
  });

  const income   = filteredTransactions.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0);
  const expenses = filteredTransactions.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0);
  const balance  = income - expenses;

  // Enriquece transações de serviço com dados de comissão do production_records
  const combinedEntries = filteredTransactions
    .map(t => {
      let comissao = 0;
      let lavadorNome = '';
      if (t.category === 'SERVICO') {
        // Tenta achar o production_record correspondente pela descrição (placa)
        const plateMatch = t.description.match(/- ([A-Z0-9-]+)( |$|\|)/);
        const plate = plateMatch?.[1] ?? '';
        const pr = production.find(p =>
          p.vehicle_plate === plate &&
          new Date(p.date).toLocaleDateString('en-CA') === new Date(t.date).toLocaleDateString('en-CA')
        );
        if (pr) {
          comissao = (pr.comissaoServico ?? 0) + (pr.comissaoExtras ?? 0);
          const lavador = users.find(u => u.id === pr.funcionarioId);
          lavadorNome = lavador?.name ?? '';
        }
      }
      return { ...t, id: `t-${t.id}`, originalId: t.id, isService: t.category === 'SERVICO', comissao, lavadorNome };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleAddTransaction = () => {
    if (!newTransaction.description || !newTransaction.amount) return;
    if (editingTransaction !== null) {
      updateTransaction(editingTransaction, {
        type: newTransaction.type, amount: parseFloat(newTransaction.amount),
        description: newTransaction.description, category: newTransaction.category as any,
        date: new Date(newTransaction.date).toISOString(),
      });
    } else {
      addTransaction({
        unit_id:     user?.unit_id || units[0]?.id || '',
        type:        newTransaction.type,
        amount:      parseFloat(newTransaction.amount),
        description: newTransaction.description,
        category:    newTransaction.category as any,
        date:        new Date(newTransaction.date).toISOString(),
      });
    }
    setShowAddModal(false);
    setEditingTransaction(null);
    setNewTransaction({ description: '', amount: '', category: 'SERVICO', type: 'INCOME', date: getLocalDateStr() });
  };

  const handleEditClick = (t: any) => {
    setNewTransaction({
      description: t.description, amount: t.amount.toString(),
      category: t.category, type: t.type,
      date: new Date(t.date).toLocaleDateString('en-CA'),
    });
    setEditingTransaction(t.originalId);
    setShowAddModal(true);
  };

  const handleDeleteClick = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta transação?')) deleteTransaction(id);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Relatório Financeiro', 14, 15);
    autoTable(doc, {
      head: [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']],
      body: combinedEntries.map(t => [
        new Date(t.date).toLocaleDateString(), t.description, t.category,
        t.type === 'INCOME' ? 'Entrada' : 'Saída', `R$ ${(t.amount ?? 0).toFixed(2)}`,
      ]),
    });
    doc.save('relatorio-financeiro.pdf');
  };

  const chartData = ['Seg','Ter','Qua','Qui','Sex','Sab','Dom'].map((name, index) => {
    const dayIndex = (index + 1) % 7;
    const dayTx = filteredTransactions.filter(t => new Date(t.date).getDay() === dayIndex);
    return {
      name,
      income:   dayTx.filter(t => t.type === 'INCOME').reduce((acc, t) => acc + t.amount, 0),
      expenses: dayTx.filter(t => t.type === 'EXPENSE').reduce((acc, t) => acc + t.amount, 0),
    };
  });

  // ── Produção dos lavadores — usa production_records (fonte correta) ─────────
  const washerProduction = users
    .filter(u => u.role === 'LAVADOR')
    .filter(u => user?.role === 'LAVADOR'
      ? u.id === user.id
      : selectedUnit === 'all' || u.unit_id === selectedUnit)
    .map(washer => {
      const washerRecords = production.filter(p =>
        p.funcionarioId === washer.id && filterDate(p.data));
      const total = washerRecords.reduce((acc, p) =>
        acc + p.valorServico + p.extras.reduce((s, e) => s + e.valor, 0), 0);
      // Comissão total: commission_service + commission_extras do banco
      const comissao = washerRecords.reduce((acc, p) => {
        const cs = p.comissaoServico ?? 0;
        const ce = p.comissaoExtras ?? 0;
        return acc + cs + ce;
      }, 0);
      return {
        id: washer.id, name: washer.name,
        unit: units.find(u => u.id === washer.unit_id)?.name || '',
        total, comissao, count: washerRecords.length,
      };
    });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Financeiro</h1>
          <p className="text-zinc-400">Controle de entradas, saídas e produtividade</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-xl p-1">
            {(['today','week','month'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${period === p ? 'bg-zinc-800/50 text-zinc-100 border border-zinc-800/50' : 'text-zinc-500 hover:text-zinc-300'}`}>
                {p === 'today' ? 'Hoje' : p === 'week' ? 'Semana' : 'Mês'}
              </button>
            ))}
          </div>
          {user?.role === 'DONO' && (
            <>
              {/* ── Select usa string UUID diretamente ── */}
              <select
                className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-xl py-2 px-4 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
              >
                <option value="all">Todas Unidades</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <button onClick={() => { setEditingTransaction(null); setNewTransaction({ description: '', amount: '', category: 'SERVICO', type: 'INCOME', date: getLocalDateStr() }); setShowAddModal(true); }}
                className="bg-zinc-100 hover:bg-white text-zinc-950 px-4 py-2 rounded-xl flex items-center gap-2 transition-colors font-medium text-sm">
                <Plus size={18} strokeWidth={1.5} /> Lançar
              </button>
              <button onClick={exportPDF} className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 hover:bg-zinc-800 text-zinc-300 p-2 rounded-xl transition-colors">
                <Download size={18} strokeWidth={1.5} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Faturamento Total', value: income,   icon: <TrendingUp size={20} strokeWidth={1.5} />, color: 'emerald', sub: 'Faturamento do período' },
          { label: 'Despesas Totais',   value: expenses, icon: <TrendingDown size={20} strokeWidth={1.5} />, color: 'red',     sub: 'Despesas do período' },
          { label: 'Lucro Líquido',     value: balance,  icon: <DollarSign size={20} strokeWidth={1.5} />,  color: 'blue',    sub: `Margem de ${(income > 0 ? (balance / income) * 100 : 0).toFixed(1)}%` },
        ].map(({ label, value, icon, color, sub }) => (
          <div key={label} className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-zinc-500 text-sm font-medium">{label}</span>
              <div className={`p-2 bg-${color}-500/10 rounded-lg text-${color}-500 border border-${color}-500/20`}>{icon}</div>
            </div>
            <div className="text-3xl font-bold text-zinc-100">R$ {(value ?? 0).toFixed(2)}</div>
            <div className={`text-xs text-${color}-500`}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Gráfico + Resumo de Pagamentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6 space-y-6">
          <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <TrendingUp size={20} strokeWidth={1.5} className="text-emerald-500" /> Desempenho Semanal
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `R${v}`} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
                <Bar dataKey="income"   fill="#10b981" radius={[4,4,0,0]} name="Entradas" />
                <Bar dataKey="expenses" fill="#ef4444" radius={[4,4,0,0]} name="Saídas"   />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card de Resumo de Formas de Pagamento */}
        <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6 space-y-6">
          <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <DollarSign size={20} strokeWidth={1.5} className="text-emerald-500" /> Formas de Pagamento
          </h3>
          <div className="space-y-3">
            {(() => {
              const paymentMethods = {
                DINHEIRO: { label: 'Dinheiro', icon: '💵', value: 0 },
                CARTAO_DEBITO: { label: 'Cartão Débito', icon: '💳', value: 0 },
                CARTAO_CREDITO: { label: 'Cartão Crédito', icon: '💳', value: 0 },
                LINK_PAGAMENTO: { label: 'Link Pagamento', icon: '🔗', value: 0 },
                PIX: { label: 'PIX', icon: '📱', value: 0 }
              };

              // Somar valores por forma de pagamento (apenas INCOME com payment_method)
              filteredTransactions
                .filter(t => t.type === 'INCOME' && t.payment_method)
                .forEach(t => {
                  if (t.payment_method && paymentMethods[t.payment_method]) {
                    paymentMethods[t.payment_method].value += t.amount;
                  }
                });

              const totalPayments = Object.values(paymentMethods).reduce((acc, pm) => acc + pm.value, 0);
              const hasPayments = totalPayments > 0;

              return (
                <>
                  {!hasPayments && (
                    <p className="text-zinc-600 text-sm text-center py-8">
                      Nenhum pagamento registrado neste período
                    </p>
                  )}
                  {hasPayments && (
                    <>
                      {Object.entries(paymentMethods).map(([key, pm]) => (
                        pm.value > 0 && (
                          <div key={key} className="flex items-center justify-between p-3 bg-zinc-800/30 rounded-xl border border-zinc-800/50">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{pm.icon}</span>
                              <span className="text-zinc-300 font-medium text-sm">{pm.label}</span>
                            </div>
                            <span className="text-emerald-500 font-bold">
                              R$ {pm.value.toFixed(2)}
                            </span>
                          </div>
                        )
                      ))}
                      <div className="pt-3 mt-3 border-t border-zinc-800/50">
                        <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">💰</span>
                            <span className="text-emerald-500 font-bold">Total Recebido</span>
                          </div>
                          <span className="text-emerald-500 font-bold text-lg">
                            R$ {totalPayments.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Produção dos Lavadores */}
      <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl p-6 space-y-6">
        <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
          <Users size={20} strokeWidth={1.5} className="text-zinc-400" /> Produção dos Lavadores
        </h3>
        <div className="space-y-4">
          {washerProduction.length === 0 && (
            <p className="text-zinc-600 text-sm text-center py-4">Nenhum dado para este período.</p>
          )}
          {washerProduction.map(w => (
            <div key={w.id} className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-800/50 flex items-center justify-between">
              <div>
                <div className="text-zinc-100 font-medium">{w.name}</div>
                <div className="text-zinc-500 text-xs">{w.unit}</div>
              </div>
              <div className="text-right">
                <div className="text-emerald-500 font-bold">R$ {(w.total ?? 0).toFixed(2)}</div>
                <div className="text-zinc-400 text-xs">{w.count} carro{w.count !== 1 ? 's' : ''} lavado{w.count !== 1 ? 's' : ''}</div>
                <div className="text-brand-primary text-xs font-bold mt-0.5">Comissão: R$ {(w as any).comissao?.toFixed(2) ?? '0.00'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabela de transações */}
      <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-zinc-800/50 flex items-center justify-between">
          <h3 className="text-lg font-bold text-zinc-100">Últimas Transações</h3>
          <button
            onClick={() => {
              const last5 = combinedEntries.slice(0, 5);
              if (last5.length === 0) return;
              if (confirm(`Tem certeza que deseja apagar as últimas ${last5.length} transação(ões)? Esta ação não pode ser desfeita.`)) {
                last5.forEach(t => deleteTransaction(t.originalId));
              }
            }}
            className="text-red-500/70 hover:text-red-500 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Trash2 size={14} strokeWidth={1.5} />
            Apagar Últimas ({combinedEntries.slice(0, 5).length})
          </button>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="bg-zinc-800/50">
                {['Data','Descrição','Categoria','Tipo','Valor','Ações'].map(h => (
                  <th key={h} className={`px-6 py-4 text-zinc-400 font-medium text-sm ${h === 'Valor' || h === 'Ações' ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {combinedEntries.slice(0, 10).map(t => (
                <tr key={t.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-6 py-4 text-zinc-400 text-sm">{new Date(t.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm max-w-[250px]">
                    <p className="text-zinc-100 font-medium truncate">{t.description}</p>
                    {(t as any).comissao > 0 && (
                      <p className="text-brand-primary text-xs font-bold mt-0.5">
                        Comissão {(t as any).lavadorNome ? `(${(t as any).lavadorNome})` : ''}: R$ {((t as any).comissao ?? 0).toFixed(2)}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest bg-zinc-800/50 border border-zinc-800/50 px-2 py-1 rounded">{t.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border ${t.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                      {t.type === 'INCOME' ? 'Entrada' : 'Saída'}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-sm font-bold text-right ${t.type === 'INCOME' ? 'text-emerald-500' : 'text-red-500'}`}>
                    {t.type === 'INCOME' ? '+' : '-'} R$ {(t.amount ?? 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {!t.isService && (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEditClick(t)} className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"><Edit2 size={16} strokeWidth={1.5} /></button>
                        <button onClick={() => handleDeleteClick(t.originalId)} className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 size={16} strokeWidth={1.5} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal lançar transação */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/50 rounded-3xl w-full max-w-md p-6 space-y-6">
            <h2 className="text-xl font-bold text-zinc-100">{editingTransaction ? 'Editar Transação' : 'Nova Transação'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Descrição</label>
                <input type="text" className="w-full bg-zinc-800/50 border border-zinc-800/50 rounded-xl py-2.5 px-4 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                  value={newTransaction.description} onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Valor (R$)</label>
                  <input type="number" className="w-full bg-zinc-800/50 border border-zinc-800/50 rounded-xl py-2.5 px-4 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                    value={newTransaction.amount} onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Tipo</label>
                  <select className="w-full bg-zinc-800/50 border border-zinc-800/50 rounded-xl py-2.5 px-4 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                    value={newTransaction.type} onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value as 'INCOME' | 'EXPENSE' })}>
                    <option value="INCOME">Entrada</option>
                    <option value="EXPENSE">Saída</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAddModal(false)} className="flex-1 bg-zinc-800/50 border border-zinc-800/50 hover:bg-zinc-800 text-zinc-300 py-2.5 rounded-xl font-medium transition-colors text-sm">Cancelar</button>
              <button onClick={handleAddTransaction} className="flex-1 bg-zinc-100 hover:bg-white text-zinc-950 py-2.5 rounded-xl font-medium transition-colors text-sm">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;