-- ============================================================================
-- CORREÇÃO DE TIMEZONE - BRUTUS LAVAJATO
-- ============================================================================
-- Este script configura o timezone do banco de dados para America/Sao_Paulo
-- e cria funções auxiliares para trabalhar com datas locais
-- Execute no SQL Editor do Supabase Dashboard
-- ============================================================================

-- ── CONFIGURAR TIMEZONE DO BANCO ─────────────────────────────────────────────

-- Definir timezone padrão para America/Sao_Paulo (Brasília)
ALTER DATABASE postgres SET timezone TO 'America/Sao_Paulo';

-- Para a sessão atual
SET timezone TO 'America/Sao_Paulo';

-- ── FUNÇÃO PARA OBTER DATA/HORA ATUAL NO TIMEZONE LOCAL ──────────────────────

CREATE OR REPLACE FUNCTION now_local()
RETURNS TIMESTAMPTZ AS $$
BEGIN
  RETURN NOW() AT TIME ZONE 'America/Sao_Paulo';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ── FUNÇÃO PARA OBTER APENAS A DATA LOCAL (SEM HORA) ─────────────────────────

CREATE OR REPLACE FUNCTION today_local()
RETURNS DATE AS $$
BEGIN
  RETURN (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE;
END;
$$ LANGUAGE plpgsql STABLE;

-- ── FUNÇÃO PARA CONVERTER UTC PARA TIMEZONE LOCAL ────────────────────────────

CREATE OR REPLACE FUNCTION to_local_time(utc_time TIMESTAMPTZ)
RETURNS TIMESTAMPTZ AS $$
BEGIN
  RETURN utc_time AT TIME ZONE 'America/Sao_Paulo';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ── FUNÇÃO PARA OBTER DATA LOCAL DE UM TIMESTAMP ─────────────────────────────

CREATE OR REPLACE FUNCTION date_local(timestamp_value TIMESTAMPTZ)
RETURNS DATE AS $$
BEGIN
  RETURN (timestamp_value AT TIME ZONE 'America/Sao_Paulo')::DATE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ── ATUALIZAR DEFAULTS DAS TABELAS EXISTENTES ────────────────────────────────

-- Atualizar tabela de auditoria para usar timezone local
ALTER TABLE IF EXISTS audit_logs 
  ALTER COLUMN created_at SET DEFAULT (NOW() AT TIME ZONE 'America/Sao_Paulo');

-- ── VIEWS AUXILIARES PARA CONSULTAS COM DATA LOCAL ───────────────────────────

-- View para appointments com data local
CREATE OR REPLACE VIEW appointments_local AS
SELECT 
  *,
  date_local(start_time) as local_date,
  (start_time AT TIME ZONE 'America/Sao_Paulo') as local_start_time,
  (end_time AT TIME ZONE 'America/Sao_Paulo') as local_end_time
FROM appointments;

-- View para transactions com data local
CREATE OR REPLACE VIEW transactions_local AS
SELECT 
  *,
  date_local(date) as local_date,
  (date AT TIME ZONE 'America/Sao_Paulo') as local_datetime
FROM transactions;

-- ── ÍNDICES PARA MELHORAR PERFORMANCE DE CONSULTAS POR DATA LOCAL ────────────

-- Índice para consultas de appointments por data local
CREATE INDEX IF NOT EXISTS idx_appointments_local_date 
  ON appointments (date_local(start_time));

-- Índice para consultas de transactions por data local
CREATE INDEX IF NOT EXISTS idx_transactions_local_date 
  ON transactions (date_local(date));

-- ── FUNÇÃO PARA VERIFICAR SE ESTÁ NO HORÁRIO DE TRABALHO ─────────────────────

CREATE OR REPLACE FUNCTION is_business_hours(
  check_time TIMESTAMPTZ DEFAULT NOW(),
  start_hour INT DEFAULT 6,
  end_hour INT DEFAULT 22
)
RETURNS BOOLEAN AS $$
DECLARE
  local_hour INT;
BEGIN
  -- Obter hora local
  local_hour := EXTRACT(HOUR FROM (check_time AT TIME ZONE 'America/Sao_Paulo'));
  
  -- Verificar se está dentro do horário
  RETURN local_hour >= start_hour AND local_hour < end_hour;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ── FUNÇÃO PARA OBTER INÍCIO E FIM DO DIA LOCAL ──────────────────────────────

CREATE OR REPLACE FUNCTION day_bounds_local(day_date DATE DEFAULT NULL)
RETURNS TABLE(day_start TIMESTAMPTZ, day_end TIMESTAMPTZ) AS $$
DECLARE
  target_date DATE;
BEGIN
  -- Se não passar data, usar hoje
  target_date := COALESCE(day_date, today_local());
  
  -- Retornar início e fim do dia no timezone local
  RETURN QUERY
  SELECT 
    (target_date || ' 00:00:00')::TIMESTAMP AT TIME ZONE 'America/Sao_Paulo' as day_start,
    (target_date || ' 23:59:59.999999')::TIMESTAMP AT TIME ZONE 'America/Sao_Paulo' as day_end;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- TESTES E VERIFICAÇÕES
-- ============================================================================

-- Verificar timezone atual
SHOW timezone;

-- Testar funções
SELECT 
  NOW() as utc_now,
  now_local() as local_now,
  today_local() as local_today,
  is_business_hours() as is_business_hours;

-- Testar conversão de data
SELECT 
  NOW() as utc_time,
  to_local_time(NOW()) as local_time,
  date_local(NOW()) as local_date;

-- Testar limites do dia
SELECT * FROM day_bounds_local();

-- ============================================================================
-- FIM DO SCRIPT DE CORREÇÃO DE TIMEZONE
-- ============================================================================

-- INSTRUÇÕES:
-- 1. Copie todo este script
-- 2. Vá para Supabase Dashboard > SQL Editor
-- 3. Cole e execute o script
-- 4. Verifique se não há erros
-- 5. Teste as funções com as queries de teste acima

-- IMPORTANTE:
-- Após executar este script, atualize o código do servidor para usar
-- as novas funções de timezone local ao invés de new Date().toISOString()
