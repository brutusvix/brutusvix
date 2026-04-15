import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Tentar ambos os nomes de variáveis de ambiente
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verificar se as variáveis de ambiente estão configuradas
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Variáveis de ambiente não configuradas:', { 
      hasUrl: !!supabaseUrl, 
      hasKey: !!supabaseServiceKey 
    });
    return res.status(500).json({ 
      error: 'Configuração do servidor incompleta',
      details: 'Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas'
    });
  }

  // Verificar autenticação
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('❌ Token não fornecido');
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.substring(7);
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔐 Verificando token...');
    
    // Verificar o usuário autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      console.error('❌ Erro ao verificar token:', authError.message);
      return res.status(401).json({ 
        error: 'Token inválido ou expirado', 
        details: authError.message,
        hint: 'Faça logout e login novamente para renovar o token'
      });
    }
    
    if (!user) {
      console.error('❌ Usuário não encontrado no token');
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    console.log('✅ Token válido para usuário:', user.email);

    // Buscar dados do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, role, unit_id')
      .eq('auth_id', user.id)
      .single();

    if (userError) {
      console.error('❌ Erro ao buscar usuário:', userError.message);
      return res.status(403).json({ 
        error: 'Usuário não encontrado no sistema',
        details: userError.message
      });
    }
    
    if (!userData) {
      console.error('❌ Dados do usuário não encontrados');
      return res.status(403).json({ error: 'Usuário não encontrado no sistema' });
    }

    console.log('✅ Usuário encontrado:', userData.id, userData.role);

    if (req.method === 'POST') {
      const transaction = req.body;

      console.log('💰 Criando transação:', JSON.stringify(transaction, null, 2));

      // Validar campos obrigatórios
      if (!transaction.unit_id || !transaction.type || !transaction.amount || !transaction.category || !transaction.date) {
        console.error('❌ Campos obrigatórios faltando:', transaction);
        return res.status(400).json({ 
          error: 'Campos obrigatórios faltando',
          required: ['unit_id', 'type', 'amount', 'category', 'date'],
          received: Object.keys(transaction)
        });
      }

      // Inserir transação
      const { data, error: insertError } = await supabase
        .from('transactions')
        .insert({
          unit_id: transaction.unit_id,
          type: transaction.type,
          amount: transaction.amount,
          description: transaction.description || '',
          category: transaction.category,
          date: transaction.date,
          payment_method: transaction.payment_method || null,
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erro ao criar transação:', insertError);
        return res.status(500).json({ 
          error: 'Erro ao criar transação', 
          details: insertError.message,
          code: insertError.code
        });
      }

      console.log('✅ Transação criada com sucesso:', data.id);
      return res.status(201).json(data);
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error: any) {
    console.error('❌ Erro na função serverless:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
