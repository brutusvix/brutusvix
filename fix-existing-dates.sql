-- ============================================================================
-- CORREÇÃO DE DATAS EXISTENTES - BRUTUS LAVAJATO
-- ============================================================================
-- Este script corrige registros que foram salvos com timezone UTC
-- convertendo-os para o timezone local (America/Sao_Paulo)
-- ============================================================================

-- IMPORTANTE: Faça backup antes de executar!
-- Execute no SQL Editor do Supabase Dashboard

-- ── ANÁLISE ANTES DA CORREÇÃO ────────────────────────────────────────────────

-- 1. Ver quantos appointments precisam ser corrigidos
SELECT 
  COUNT(*) as total_appointments,
  COUNT(CASE WHEN date_local(start_time) != (start_time AT TIME ZONE 'UTC')::DATE THEN 1 END) as need_correction
FROM appointments;

-- 2. Ver appointments que estão com data errada (UTC)
SELECT 
  id,
  start_time as utc_time,
  (start_time AT TIME ZONE 'America/Sao_Paulo') as local_time,
  date_local(start_time) as local_date,
  (start_time AT TIME ZONE 'UTC')::DATE as utc_date,
  status,
  vehicle_plate
FROM appointments
WHERE date_local(start_time) != (start_time AT TIME ZONE 'UTC')::DATE
ORDER BY start_time DESC
LIMIT 20;

-- 3. Ver transactions que precisam correção
SELECT 
  COUNT(*) as total_transactions,
  COUNT(CASE WHEN date_local(date) != (date AT TIME ZONE 'UTC')::DATE THEN 1 END) as need_correction
FROM transactions;

-- ── BACKUP (OPCIONAL MAS RECOMENDADO) ────────────────────────────────────────

-- Criar tabela de backup dos appointments
CREATE TABLE IF NOT EXISTS appointments_backup_20260411 AS 
SELECT * FROM appointments;

-- Criar tabela de backup das transactions
CREATE TABLE IF NOT EXISTS transactions_backup_20260411 AS 
SELECT * FROM transactions;

-- ── CORREÇÃO DOS APPOINTMENTS ────────────────────────────────────────────────

-- Corrigir appointments que foram salvos em UTC
-- Isso ajusta o timestamp para refletir o horário local correto
UPDATE appointments
SET 
  start_time = start_time - INTERVAL '3 hours',
  end_time = CASE 
    WHEN end_time IS NOT NULL THEN end_time - INTERVAL '3 hours'
    ELSE NULL
  END,
  updated_at = NOW()
WHERE 
  -- Apenas corrigir registros onde a data local é diferente da data UTC
  date_local(start_time) != (start_time AT TIME ZONE 'UTC')::DATE
  -- E onde o horário está entre 21:00 e 23:59 (que viraria dia seguinte em UTC)
  AND EXTRACT(HOUR FROM (start_time AT TIME ZONE 'America/Sao_Paulo')) >= 21;

-- ── CORREÇÃO DAS TRANSACTIONS ────────────────────────────────────────────────

-- Corrigir transactions que foram salvas em UTC
UPDATE transactions
SET 
  date = date - INTERVAL '3 hours',
  updated_at = NOW()
WHERE 
  date_local(date) != (date AT TIME ZONE 'UTC')::DATE
  AND EXTRACT(HOUR FROM (date AT TIME ZONE 'America/Sao_Paulo')) >= 21;

-- ── VERIFICAÇÃO APÓS CORREÇÃO ────────────────────────────────────────────────

-- 1. Verificar appointments corrigidos
SELECT 
  'Appointments corrigidos' as tipo,
  COUNT(*) as total
FROM appointments
WHERE updated_at > NOW() - INTERVAL '1 minute';

-- 2. Ver alguns exemplos de appointments corrigidos
SELECT 
  id,
  start_time,
  date_local(start_time) as local_date,
  EXTRACT(HOUR FROM (start_time AT TIME ZONE 'America/Sao_Paulo')) as local_hour,
  status,
  vehicle_plate
FROM appointments
WHERE updated_at > NOW() - INTERVAL '1 minute'
ORDER BY start_time DESC
LIMIT 10;

-- 3. Verificar se ainda há registros com problema
SELECT 
  COUNT(*) as ainda_com_problema
FROM appointments
WHERE 
  date_local(start_time) != (start_time AT TIME ZONE 'UTC')::DATE
  AND EXTRACT(HOUR FROM (start_time AT TIME ZONE 'America/Sao_Paulo')) >= 21;

-- ── CORREÇÃO MANUAL (SE NECESSÁRIO) ──────────────────────────────────────────

-- Se você souber de registros específicos que precisam correção manual:
-- 
-- UPDATE appointments
-- SET start_time = '2026-04-10 21:03:00-03'::TIMESTAMPTZ
-- WHERE id = 'ID_DO_REGISTRO';

-- ── LIMPEZA (APÓS CONFIRMAR QUE ESTÁ TUDO OK) ────────────────────────────────

-- Depois de confirmar que tudo está correto, você pode remover os backups:
-- DROP TABLE IF EXISTS appointments_backup_20260411;
-- DROP TABLE IF EXISTS transactions_backup_20260411;

-- ============================================================================
-- RELATÓRIO FINAL
-- ============================================================================

-- Resumo geral
SELECT 
  'Appointments' as tabela,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN date_local(start_time) = today_local() THEN 1 END) as hoje,
  COUNT(CASE WHEN date_local(start_time) = today_local() - 1 THEN 1 END) as ontem,
  MIN(date_local(start_time)) as data_mais_antiga,
  MAX(date_local(start_time)) as data_mais_recente
FROM appointments

UNION ALL

SELECT 
  'Transactions' as tabela,
  COUNT(*) as total_registros,
  COUNT(CASE WHEN date_local(date) = today_local() THEN 1 END) as hoje,
  COUNT(CASE WHEN date_local(date) = today_local() - 1 THEN 1 END) as ontem,
  MIN(date_local(date)) as data_mais_antiga,
  MAX(date_local(date)) as data_mais_recente
FROM transactions;

-- ============================================================================
-- INSTRUÇÕES DE USO
-- ============================================================================

-- 1. Execute a seção "ANÁLISE ANTES DA CORREÇÃO" para ver o que será corrigido
-- 2. Execute a seção "BACKUP" para criar cópias de segurança
-- 3. Execute a seção "CORREÇÃO" para ajustar os timestamps
-- 4. Execute a seção "VERIFICAÇÃO" para confirmar que funcionou
-- 5. Se tudo estiver OK, execute a seção "LIMPEZA" (opcional)

-- NOTA: Este script corrige apenas registros onde o horário local é >= 21h
-- (que são os que viraram dia seguinte em UTC)

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
