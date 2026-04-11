import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'ID do usuário é obrigatório' });
  }

  // Verificar autenticação
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.substring(7);
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Verificar o usuário autenticado
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  // Buscar role do usuário
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('auth_id', user.id)
    .single();

  if (userError || !userData || userData.role !== 'DONO') {
    return res.status(403).json({ error: 'Acesso negado. Apenas DONO pode modificar usuários.' });
  }

  if (req.method === 'PATCH') {
    try {
      const updates = req.body;

      // Atualizar no banco de dados
      const { data, error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({ error: 'Erro ao atualizar usuário', details: updateError.message });
      }

      return res.status(200).json(data);
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      return res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      // Buscar o auth_id do usuário a ser deletado
      const { data: userToDelete, error: fetchError } = await supabase
        .from('users')
        .select('auth_id')
        .eq('id', id)
        .single();

      if (fetchError) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      // Deletar do banco de dados
      const { error: deleteError } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (deleteError) {
        return res.status(500).json({ error: 'Erro ao deletar usuário do banco', details: deleteError.message });
      }

      // Se tiver auth_id, deletar do Supabase Auth
      if (userToDelete.auth_id) {
        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userToDelete.auth_id);
        if (authDeleteError) {
          console.error('Erro ao deletar do Auth:', authDeleteError);
          // Não retorna erro pois o usuário já foi deletado do banco
        }
      }

      return res.status(200).json({ message: 'Usuário deletado com sucesso' });
    } catch (error: any) {
      console.error('Erro ao deletar usuário:', error);
      return res.status(500).json({ error: 'Erro interno do servidor', details: error.message });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
