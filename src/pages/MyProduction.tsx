import React from 'react';
import { useData } from '../DataContext';
import { useAuth } from '../App';
import { Car, DollarSign, Clock, CheckCircle2 } from 'lucide-react';

export default function MyProduction() {
  const { production } = useData();
  const { user } = useAuth();

  const today = new Date().toLocaleDateString('en-CA');
  const myProduction = production.filter(p => 
    p.funcionarioId === user?.id && 
    (p.data?.startsWith(today) || p.data === today)
  );

  const totalServicos = myProduction.reduce((acc, p) => acc + p.valorServico, 0);
  const totalExtras = myProduction.reduce((acc, p) => acc + p.extras.reduce((sum, e) => sum + e.valor, 0), 0);
  const totalGeral = totalServicos + totalExtras;
  
  const comissaoServicos = myProduction.reduce((acc, p) => {
    if (p.comissaoServico > 0) return acc + p.comissaoServico;
    const fixedCommission = user?.comissoesServico?.[p.servico];
    if (fixedCommission !== undefined && fixedCommission > 0) {
      return acc + fixedCommission;
    }
    return acc + (p.valorServico * (user?.comissaoPercentualServico || 0));
  }, 0);

  const comissaoExtras = myProduction.reduce((acc, p) => acc + (p.comissaoExtras || 0), 0);
  const comissaoTotal = comissaoServicos + comissaoExtras;
  
  const valorEstimado = (user?.tipoPagamento === 'diaria' ? (user.valorDiaria || 0) : 0) + 
                        (user?.tipoPagamento === 'comissao' ? comissaoTotal : 0) +
                        (user?.tipoPagamento === 'misto' ? (user.valorDiaria || 0) + comissaoTotal : 0);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-zinc-100">Minha Produção</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900/50 backdrop-blur-sm p-4 rounded-xl border border-zinc-800/50">
          <p className="text-zinc-500 font-medium">Carros Lavados</p>
          <p className="text-2xl font-bold text-zinc-100">{myProduction.length}</p>
        </div>
        <div className="bg-zinc-900/50 backdrop-blur-sm p-4 rounded-xl border border-zinc-800/50">
          <p className="text-zinc-500 font-medium">Total Gerado</p>
          <p className="text-2xl font-bold text-zinc-100">R$ {(totalGeral ?? 0).toFixed(2)}</p>
        </div>
        <div className="bg-zinc-900/50 backdrop-blur-sm p-4 rounded-xl border border-zinc-800/50">
          <p className="text-zinc-500 font-medium">Estimado a Receber</p>
          <p className="text-2xl font-bold text-emerald-500">R$ {(valorEstimado ?? 0).toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-zinc-900/50 backdrop-blur-sm rounded-xl border border-zinc-800/50 p-4">
        <h2 className="text-lg font-bold text-zinc-100 mb-4">Serviços de Hoje</h2>
        <div className="space-y-2">
          {myProduction.map(p => (
            <div key={p.id} className="flex items-center justify-between p-3 bg-zinc-800/50 border border-zinc-800/50 rounded-lg">
              <div>
                <p className="font-bold text-zinc-100">{p.servico}</p>
                <p className="text-sm text-zinc-400">{p.veiculo} - {p.clienteNome}</p>
              </div>
              <p className="font-bold text-zinc-100">R$ {(p.valorServico ?? 0).toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
