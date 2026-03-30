import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Lock, Mail, Loader2 } from 'lucide-react';
import { useAuth } from '../App';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Autentica no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        setError('E-mail ou senha inválidos.');
        return;
      }

      // 2. Busca perfil do usuário na tabela users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, email, role, unit_id, payment_type, daily_wage, base_commission_percent, lunch_value, transport_value, fixed_service_commissions')
        .eq('auth_id', authData.user.id)
        .single();

      if (userError || !userData) {
        setError('Usuário não encontrado no sistema. Contate o administrador.');
        await supabase.auth.signOut();
        return;
      }

      // 3. Monta objeto User compatível com o app
      const appUser = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role as 'DONO' | 'LAVADOR',
        unit_id: userData.unit_id,
        tipoPagamento: userData.payment_type as 'diaria' | 'comissao' | 'misto',
        valorDiaria: userData.daily_wage,
        comissaoPercentualServico: userData.base_commission_percent,
        valorAlmoco: userData.lunch_value,
        valorPassagem: userData.transport_value,
        comissoesServico: userData.fixed_service_commissions || {},
      };

      // 4. Usa o access_token do Supabase como token do app
      login(authData.session.access_token, appUser);
      navigate('/');

    } catch (err) {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-zinc-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md space-y-8 relative">
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-zinc-900 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-brand-primary/20 rotate-3 overflow-hidden border border-zinc-800">
            <img 
              src="https://i.postimg.cc/fy9c2r4k/Brutus-recortada.png" 
              alt="BRUTUS" 
              className="w-full h-full object-contain p-2"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter">BRUTUS</h1>
            <p className="text-zinc-400 mt-2 font-medium">ESTÉTICA AUTOMOTIVA BRUTA</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="bg-zinc-900/50 backdrop-blur-xl p-8 rounded-3xl border border-zinc-800 shadow-2xl space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400 ml-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full pl-12 pr-4 py-4 bg-zinc-800/50 border border-zinc-700 rounded-2xl text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400 ml-1">Senha</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-zinc-800/50 border border-zinc-700 rounded-2xl text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-brand-primary text-zinc-950 py-4 rounded-2xl font-bold hover:bg-brand-primary-hover transition-all shadow-lg shadow-brand-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar no Sistema'}
          </button>

          <div className="text-center">
            <p className="text-xs text-zinc-500">
              Esqueceu sua senha?{' '}
              <button type="button" className="text-brand-primary hover:underline">
                Recuperar acesso
              </button>
            </p>
          </div>
        </form>

        <p className="text-center text-zinc-600 text-xs">
          &copy; 2026 BRUTUS LAVAJATO. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}