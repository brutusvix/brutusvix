-- ============================================================================
-- CORRIGIR CARROS DE HOJE - BRUTUS LAVAJATO
-- ============================================================================
-- Script para mover os 20 carros que foram lançados ontem à noite
-- mas deveriam aparecer como hoje
-- ============================================================================

-- PASSO 1: Ver quais carros estão com data de ontem
-- ============================================================================
SELECT 
  id,
  COALESCE(plate, vehicle_model, client_name) as identificacao,
  start_time as hora_atual,
  date_local(start_time) as data_atual,
  (start_time + INTERVAL '1 day') as nova_hora,
  date_local(start_time + INTERVAL '1 day') as nova_data,
  status,
  total_price
FROM appointments
WHERE date_local(start_time) = '2026-04-10'  -- Data de ontem
ORDER BY start_time DESC;

-- ============================================================================
-- PASSO 2: FAZER BACKUP (SEGURANÇA)
-- ============================================================================
-- Descomente para criar backup:
/*
CREATE TABLE appointments_backup_20260411 AS 
SELECT * FROM appointments 
WHERE date_local(start_time) = '2026-04-10';
*/

-- ============================================================================
-- PASSO 3: MOVER OS CARROS PARA HOJE
-- ============================================================================
-- Descomente para executar a correção:

/*
UPDATE appointments
SET start_time = start_time + INTERVAL '1 day'
WHERE date_local(start_time) = '2026-04-10';
*/

-- ============================================================================
-- PASSO 4: VERIFICAR SE FUNCIONOU
-- ============================================================================
-- Ver carros de hoje após a correção:
SELECT 
  date_local(start_time) as data,
  COUNT(*) as total_carros,
  SUM(total_price) as faturamento_total,
  STRING_AGG(COALESCE(plate, vehicle_model, client_name), ', ') as veiculos
FROM appointments
WHERE date_local(start_time) = today_local()
GROUP BY date_local(start_time);

-- Ver resumo dos últimos 3 dias:
SELECT 
  date_local(start_time) as data,
  COUNT(*) as total_carros,
  SUM(total_price) as faturamento
FROM appointments
WHERE start_time > NOW() - INTERVAL '3 days'
GROUP BY date_local(start_time)
ORDER BY data DESC;

-- ============================================================================
-- ALTERNATIVA: Mover apenas carros específicos por ID
-- ============================================================================
-- Se você souber os IDs específicos dos 20 carros:

/*
UPDATE appointments
SET start_time = start_time + INTERVAL '1 day'
WHERE id IN (
  'COLE_OS_IDS_AQUI',
  'SEPARADOS_POR_VIRGULA'
);
*/

-- ============================================================================
-- RESTAURAR DO BACKUP (SE ALGO DER ERRADO)
-- ============================================================================
-- Apenas se precisar desfazer:

/*
-- Deletar registros incorretos
DELETE FROM appointments WHERE date_local(start_time) = '2026-04-11';

-- Restaurar do backup
INSERT INTO appointments 
SELECT * FROM appointments_backup_20260411;

-- Remover backup
DROP TABLE appointments_backup_20260411;
*/

-- ============================================================================
-- INSTRUÇÕES DE USO
-- ============================================================================

-- 1. Execute o PASSO 1 para ver os carros que serão movidos
-- 2. Execute o PASSO 2 para fazer backup (recomendado)
-- 3. Descomente e execute o PASSO 3 para mover os carros
-- 4. Execute o PASSO 4 para verificar se funcionou

-- IMPORTANTE: 
-- - Isso vai mover TODOS os carros de 10/04/2026 para 11/04/2026
-- - Se você quiser mover apenas alguns, use a alternativa com IDs
-- - O backup permite desfazer se algo der errado

-- ============================================================================
-- FIM DO SCRIPT
-- ============================================================================
