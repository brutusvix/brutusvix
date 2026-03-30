import { supabase } from '../lib/supabase';

/**
 * Obtém o token válido do Supabase
 * Se o token estiver expirado, tenta renovar automaticamente
 */
export async function getValidToken(): Promise<string | null> {
  try {
    // Tentar obter a sessão atual do Supabase
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    
    if (!session) {
      console.error('No active session');
      return null;
    }
    
    // Atualizar o token no localStorage
    localStorage.setItem('token', session.access_token);
    
    return session.access_token;
  } catch (err) {
    console.error('Error in getValidToken:', err);
    return null;
  }
}

/**
 * Verifica se o usuário está autenticado
 * Redireciona para login se não estiver
 */
export async function ensureAuthenticated(): Promise<boolean> {
  const token = await getValidToken();
  
  if (!token) {
    // Limpar dados e redirecionar para login
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    return false;
  }
  
  return true;
}
