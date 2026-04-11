-- Remover views não utilizadas que estão causando alertas de segurança
-- Estas views não são usadas pelo sistema e podem ser removidas com segurança

DROP VIEW IF EXISTS public.appointments_local;
DROP VIEW IF EXISTS public.transactions_local;

-- Verificar se foram removidas
SELECT 
  schemaname, 
  viewname 
FROM pg_views 
WHERE schemaname = 'public' 
  AND viewname IN ('appointments_local', 'transactions_local');

-- Se o resultado estiver vazio, as views foram removidas com sucesso
