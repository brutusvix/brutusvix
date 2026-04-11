import React, { useState } from 'react';
import { useData } from '../DataContext';
import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ProductionPayroll() {
  const { production, users, updateProductionStatus, units, addTransaction, transactions } = useData();
  const [selectedUnit, setSelectedUnit] = useState<string | 'ALL'>('ALL');
  const [period, setPeriod] = useState<'today' | 'yesterday' | 'dayBeforeYesterday' | 'week' | 'month' | 'custom'>('today');
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [marmitaDescontos, setMarmitaDescontos] = useState<{ [empId: string]: boolean }>({});

  const filterDate = (dateString: string) => {
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA');
    
    if (period === 'today')  return dateString === todayStr;
    
    if (period === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      return dateString === yesterday.toLocaleDateString('en-CA');
    }
    
    if (period === 'dayBeforeYesterday') {
      const dayBeforeYesterday = new Date(now);
      dayBeforeYesterday.setDate(now.getDate() - 2);
      return dateString === dayBeforeYesterday.toLocaleDateString('en-CA');
    }
    
    if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return dateString >= weekAgo.toLocaleDateString('en-CA') && dateString <= todayStr;
    }
    if (period === 'month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-CA');
      return dateString >= firstDay && dateString <= todayStr;
    }
    return dateString === selectedDate;
  };

  // ── Filtro por unidade usando string UUID ──────────────────────────────────
  const filteredProduction = production.filter(p =>
    (selectedUnit === 'ALL' || p.unidadeId === selectedUnit) &&
    filterDate(p.data)
  );

  const employees = users.filter(u => {
    if (u.role !== 'LAVADOR') return false;
    if (selectedUnit === 'ALL') return true;
    return u.unit_id === selectedUnit ||
      filteredProduction.some(p => p.funcionarioId === u.id);
  });

  const employeeStats = employees.map(emp => {
    const empProduction = filteredProduction.filter(p => p.funcionarioId === emp.id);
    const totalServicos        = empProduction.reduce((acc, p) => acc + p.valorServico, 0);
    const totalExtrasRevenue   = empProduction.reduce((acc, p) => acc + p.extras.reduce((s, e) => s + e.valor, 0), 0);
    const totalExtrasCommission = empProduction.reduce((acc, p) => acc + (p.comissaoExtras || 0), 0);
    const totalGeral           = totalServicos + totalExtrasRevenue;

    const carrosLavados = empProduction.length;
    
    // Nova lógica de cálculo baseada no tipo de lavador
    const lavadorTipo = emp.lavadorTipo || '01';
    const meta = lavadorTipo === '01' ? 12 : 15;
    const valorPorCarro = lavadorTipo === '01' ? 10 : 7;
    const bateuMeta = carrosLavados >= meta;
    
    // Cálculo da diária
    let valorDiaria = 100; // Diária base
    if (bateuMeta) {
      valorDiaria = carrosLavados * valorPorCarro;
    }

    // Comissão (mantém lógica existente, mas sem divisão)
    const comissaoServicos = empProduction.reduce((acc, p) => {
      const dbComm = (p as any).commission_service ?? 0;
      if (dbComm > 0) return acc + dbComm;
      const fixed = emp.comissoesServico?.[p.servico];
      if (fixed !== undefined && fixed > 0) return acc + fixed;
      return acc + (p.valorServico * (emp.comissaoPercentualServico || 0));
    }, 0);
    
    const comissaoTotal = comissaoServicos + totalExtrasCommission;

    const appliesFixedCosts = selectedUnit === 'ALL' || emp.unit_id === selectedUnit;
    const uniqueDaysWorked  = new Set(empProduction.map(p => p.data)).size;
    const daysToApply       = (period === 'today' || period === 'custom') ? 1 : uniqueDaysWorked;
    const worked            = empProduction.length > 0 || valorDiaria > 0;
    const descontos         = appliesFixedCosts && worked
      ? ((emp.valorAlmoco || 0) + (emp.valorPassagem || 0)) * daysToApply
      : 0;

    // Desconto de marmita: só se NÃO bateu meta E checkbox marcado
    const descontoMarmita = (!bateuMeta && marmitaDescontos[emp.id]) ? 15 : 0;

    const valorFinal =
      (emp.tipoPagamento === 'diaria'   ? valorDiaria : 0) +
      (emp.tipoPagamento === 'comissao' ? comissaoTotal : 0) +
      (emp.tipoPagamento === 'misto'    ? valorDiaria + comissaoTotal : 0) -
      descontos -
      descontoMarmita;

    return { 
      ...emp, 
      carrosLavados, 
      totalServicos, 
      totalExtras: totalExtrasRevenue, 
      totalGeral, 
      comissaoTotal, 
      valorDiariaAplicada: valorDiaria, 
      valorFinal, 
      descontos, 
      descontoMarmita,
      meta,
      bateuMeta,
      lavadorTipo
    };
  });

  const totalFaturado          = filteredProduction.reduce((acc, p) => acc + p.valorServico + p.extras.reduce((s, e) => s + e.valor, 0), 0);
  const totalGastoFuncionarios = employeeStats.reduce((acc, e) => acc + e.valorFinal, 0);
  const lucroEstimado          = totalFaturado - totalGastoFuncionarios;

  const handlePagar = (emp: typeof employeeStats[0]) => {
    const unpaid = filteredProduction.filter(p => p.funcionarioId === emp.id && p.status !== 'PAGO');
    unpaid.forEach(p => updateProductionStatus(p.id, 'PAGO'));
    if (emp.valorFinal > 0) {
      addTransaction({
        unit_id:     emp.unit_id || units[0]?.id || '',
        type:        'EXPENSE',
        amount:      emp.valorFinal,
        description: `Pagamento ${emp.name} - ${period === 'custom' ? selectedDate : period}`,
        category:    'SALARIOS',
        date:        new Date().toISOString(),
      });
    }
  };

  const isPago = (emp: typeof employeeStats[0]) =>
    (filteredProduction.filter(p => p.funcionarioId === emp.id).length > 0 &&
     filteredProduction.filter(p => p.funcionarioId === emp.id).every(p => p.status === 'PAGO')) ||
    emp.valorFinal <= 0;

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Relatório de Produção e Pagamento', 14, 15);
    doc.setFontSize(10);
    const periodLabel = period === 'today' ? 'Hoje' : period === 'yesterday' ? 'Ontem' : period === 'dayBeforeYesterday' ? 'Anteontem' : period === 'week' ? 'Semana' : period === 'month' ? 'Mês' : selectedDate;
    doc.text(`Período: ${periodLabel}`, 14, 22);
    doc.text(`Faturamento: R$ ${(totalFaturado ?? 0).toFixed(2)}`, 14, 28);
    doc.text(`Gasto Funcionários: R$ ${(totalGastoFuncionarios ?? 0).toFixed(2)}`, 14, 34);
    doc.text(`Lucro Estimado: R$ ${(lucroEstimado ?? 0).toFixed(2)}`, 14, 40);
    autoTable(doc, {
      startY: 45,
      head: [['Funcionário', 'Carros', 'Total Gerado', 'Comissão', 'Diária', 'Descontos', 'Marmita', 'Total a Pagar']],
      body: employeeStats.map(emp => [
        emp.name, emp.carrosLavados.toString(),
        `R$ ${(emp.totalGeral ?? 0).toFixed(2)}`, `R$ ${(emp.comissaoTotal ?? 0).toFixed(2)}`,
        `R$ ${(emp.tipoPagamento !== 'comissao' ? (emp.valorDiariaAplicada ?? 0) : 0).toFixed(2)}`,
        `R$ ${(emp.descontos ?? 0).toFixed(2)}`,
        marmitaDescontos[emp.id] ? 'R$ 15,00' : 'R$ 0,00',
        `R$ ${(emp.valorFinal ?? 0).toFixed(2)}`,
      ]),
    });
    doc.save('relatorio-producao.pdf');
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Produção e Pagamento</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-1">
            {(['today', 'yesterday', 'dayBeforeYesterday', 'week', 'month', 'custom'] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${period === p ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/50' : 'text-zinc-500 hover:text-zinc-300'}`}>
                {p === 'today' ? 'Hoje' : p === 'yesterday' ? 'Ontem' : p === 'dayBeforeYesterday' ? 'Anteontem' : p === 'week' ? 'Semana' : p === 'month' ? 'Mês' : 'Data'}
              </button>
            ))}
          </div>
          <button onClick={exportPDF} className="bg-zinc-900/50 border border-zinc-800/50 hover:bg-zinc-800 text-zinc-300 p-2 rounded-xl transition-colors">
            <Download size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        {/* ── Seletor de unidade — usa string UUID diretamente ── */}
        <select
          className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-2 text-white focus:outline-none focus:ring-1 focus:ring-zinc-700"
          value={selectedUnit}
          onChange={(e) => setSelectedUnit(e.target.value === 'ALL' ? 'ALL' : e.target.value)}
        >
          <option value="ALL">Todas as Unidades</option>
          {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        {period === 'custom' && (
          <input type="date"
            className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-2 text-white focus:outline-none"
            value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/50">
          <p className="text-zinc-500 text-sm font-medium mb-1">Total Faturado</p>
          <p className="text-3xl font-bold text-brand-primary">R$ {(totalFaturado ?? 0).toFixed(2)}</p>
        </div>
        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/50">
          <p className="text-zinc-500 text-sm font-medium mb-1">Gasto Funcionários</p>
          <p className="text-3xl font-bold text-red-500">R$ {(totalGastoFuncionarios ?? 0).toFixed(2)}</p>
        </div>
        <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800/50">
          <p className="text-zinc-500 text-sm font-medium mb-1">Lucro Estimado</p>
          <p className="text-3xl font-bold text-emerald-500">R$ {(lucroEstimado ?? 0).toFixed(2)}</p>
        </div>
      </div>

      {/* Cards dos Lavadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employeeStats.length === 0 && (
          <div className="col-span-full bg-zinc-900/50 rounded-2xl border border-zinc-800/50 p-8 text-center text-zinc-600">
            Nenhum funcionário encontrado para este filtro.
          </div>
        )}
        {employeeStats.map(emp => (
          <div key={emp.id} className="bg-zinc-900/50 rounded-2xl border border-zinc-800/50 p-6 space-y-4">
            {/* Header do Card */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">{emp.name}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {units.find(u => u.id === emp.unit_id)?.name || 'Sem unidade'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-blue-500/10 text-blue-500">
                    Lavador {emp.lavadorTipo || '01'}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    emp.bateuMeta 
                      ? 'bg-emerald-500/10 text-emerald-500' 
                      : 'bg-orange-500/10 text-orange-500'
                  }`}>
                    {emp.bateuMeta ? '✓ Meta Batida' : `Meta: ${emp.meta} carros`}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-zinc-500 uppercase">Carros</div>
                <div className={`text-2xl font-bold ${emp.bateuMeta ? 'text-emerald-500' : 'text-orange-400'}`}>
                  {emp.carrosLavados}
                </div>
              </div>
            </div>

            {/* Divisor */}
            <div className="border-t border-zinc-800/50"></div>

            {/* Valores */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Total Gerado</span>
                <span className="text-sm font-semibold text-zinc-200">R$ {(emp.totalGeral ?? 0).toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Comissão</span>
                <span className="text-sm font-semibold text-blue-400">R$ {(emp.comissaoTotal ?? 0).toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">
                  Diária {emp.bateuMeta && <span className="text-xs text-emerald-500">(R$ {emp.lavadorTipo === '01' ? '10' : '7'}/carro)</span>}
                </span>
                <span className="text-sm font-semibold text-purple-400">
                  R$ {(emp.tipoPagamento !== 'comissao' ? (emp.valorDiariaAplicada ?? 0) : 0).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Descontos</span>
                <span className="text-sm font-semibold text-red-400">- R$ {(emp.descontos ?? 0).toFixed(2)}</span>
              </div>

              {/* Checkbox Marmita - só aparece se NÃO bateu meta */}
              {!emp.bateuMeta && (
                <div className="flex justify-between items-center bg-zinc-800/30 rounded-lg p-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={marmitaDescontos[emp.id] || false}
                      onChange={(e) => setMarmitaDescontos({
                        ...marmitaDescontos,
                        [emp.id]: e.target.checked
                      })}
                      className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-brand-primary focus:ring-brand-primary/50 focus:ring-2"
                    />
                    <span className="text-sm text-zinc-400">Descontar Marmita</span>
                  </label>
                  <span className="text-sm font-semibold text-orange-400">
                    {marmitaDescontos[emp.id] ? '- R$ 15,00' : 'R$ 0,00'}
                  </span>
                </div>
              )}

              {/* Mensagem se bateu meta */}
              {emp.bateuMeta && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                  <p className="text-xs text-emerald-500 text-center">
                    ✓ Marmita paga pelo dono (meta batida)
                  </p>
                </div>
              )}
            </div>

            {/* Divisor */}
            <div className="border-t border-zinc-800/50"></div>

            {/* Total a Pagar */}
            <div className="flex justify-between items-center">
              <span className="text-base font-bold text-zinc-300">Total a Pagar</span>
              <span className="text-2xl font-bold text-emerald-500">R$ {(emp.valorFinal ?? 0).toFixed(2)}</span>
            </div>

            {/* Botão Pagar */}
            <button
              onClick={() => handlePagar(emp)}
              disabled={isPago(emp)}
              className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${
                isPago(emp)
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 cursor-not-allowed'
                  : 'bg-brand-primary text-zinc-950 hover:bg-brand-primary-hover'
              }`}>
              {isPago(emp) ? '✓ PAGO' : 'Pagar Funcionário'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}