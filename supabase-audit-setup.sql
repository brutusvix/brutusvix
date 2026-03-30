-- ============================================================================
-- SISTEMA DE AUDITORIA - BRUTUS LAVAJATO
-- ============================================================================
-- Este script cria tabelas e triggers para auditoria automática de ações
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================================

-- ── TABELA DE AUDITORIA ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Quem fez a ação
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_role TEXT,
  
  -- O que foi feito
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  table_name TEXT NOT NULL,
  record_id UUID,
  
  -- Dados antes e depois
  old_data JSONB,
  new_data JSONB,
  
  -- Contexto da requisição
  ip_address TEXT,
  user_agent TEXT,
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- ── FUNÇÃO DE AUDITORIA ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID;
  current_user_email TEXT;
  current_user_role TEXT;
BEGIN
  -- Tentar obter informações do usuário atual
  BEGIN
    SELECT id, email, role INTO current_user_id, current_user_email, current_user_role
    FROM users
    WHERE auth_id = auth.uid()
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    current_user_id := NULL;
    current_user_email := NULL;
    current_user_role := NULL;
  END;

  -- Inserir log de auditoria
  INSERT INTO audit_logs (
    user_id,
    user_email,
    user_role,
    action,
    table_name,
    record_id,
    old_data,
    new_data
  ) VALUES (
    current_user_id,
    current_user_email,
    current_user_role,
    TG_OP,
    TG_TABLE_NAME,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    CASE 
      WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)
      ELSE NULL
    END,
    CASE 
      WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)
      ELSE NULL
    END
  );

  -- Retornar o registro apropriado
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── APLICAR TRIGGERS NAS TABELAS CRÍTICAS ────────────────────────────────────

-- Auditoria em USERS (criação, edição, exclusão de usuários)
DROP TRIGGER IF EXISTS audit_users_trigger ON users;
CREATE TRIGGER audit_users_trigger
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Auditoria em CLIENTS (criação, edição de clientes)
DROP TRIGGER IF EXISTS audit_clients_trigger ON clients;
CREATE TRIGGER audit_clients_trigger
  AFTER INSERT OR UPDATE OR DELETE ON clients
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Auditoria em SERVICES (criação, edição, exclusão de serviços)
DROP TRIGGER IF EXISTS audit_services_trigger ON services;
CREATE TRIGGER audit_services_trigger
  AFTER INSERT OR UPDATE OR DELETE ON services
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Auditoria em APPOINTMENTS (agendamentos críticos)
DROP TRIGGER IF EXISTS audit_appointments_trigger ON appointments;
CREATE TRIGGER audit_appointments_trigger
  AFTER INSERT OR UPDATE OR DELETE ON appointments
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Auditoria em TRANSACTIONS (movimentações financeiras)
DROP TRIGGER IF EXISTS audit_transactions_trigger ON transactions;
CREATE TRIGGER audit_transactions_trigger
  AFTER INSERT OR UPDATE OR DELETE ON transactions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Auditoria em UNITS (unidades do lava-jato)
DROP TRIGGER IF EXISTS audit_units_trigger ON units;
CREATE TRIGGER audit_units_trigger
  AFTER INSERT OR UPDATE OR DELETE ON units
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ── RLS (ROW LEVEL SECURITY) PARA AUDIT_LOGS ─────────────────────────────────

-- Habilitar RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Apenas DONO pode ver logs de auditoria
CREATE POLICY "Apenas DONO pode ver audit logs"
  ON audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.auth_id = auth.uid()
      AND users.role = 'DONO'
    )
  );

-- Ninguém pode modificar logs de auditoria manualmente
CREATE POLICY "Ninguém pode modificar audit logs"
  ON audit_logs
  FOR ALL
  USING (false);

-- ── FUNÇÃO PARA LIMPAR LOGS ANTIGOS ──────────────────────────────────────────

CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS void AS $$
BEGIN
  -- Deletar logs com mais de 1 ano
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── VIEW PARA RELATÓRIOS DE AUDITORIA ────────────────────────────────────────

CREATE OR REPLACE VIEW audit_summary AS
SELECT 
  DATE(created_at) as date,
  table_name,
  action,
  user_role,
  COUNT(*) as count
FROM audit_logs
GROUP BY DATE(created_at), table_name, action, user_role
ORDER BY date DESC, count DESC;

-- ============================================================================
-- FIM DO SCRIPT DE AUDITORIA
-- ============================================================================

-- INSTRUÇÕES:
-- 1. Copie todo este script
-- 2. Vá para Supabase Dashboard > SQL Editor
-- 3. Cole e execute o script
-- 4. Verifique se não há erros
-- 5. Teste criando um usuário ou serviço e verifique a tabela audit_logs

-- CONSULTAS ÚTEIS:
-- Ver últimos 10 logs: SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;
-- Ver ações de um usuário: SELECT * FROM audit_logs WHERE user_email = 'email@example.com';
-- Ver mudanças em uma tabela: SELECT * FROM audit_logs WHERE table_name = 'users';
-- Ver resumo: SELECT * FROM audit_summary LIMIT 20;
