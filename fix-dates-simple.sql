-- ============================================================================
-- CORREÇÃO RÁPIDA DE DATAS - BRUTUS LAVAJATO
-- ============================================================================
-- Script simplificado para corrigir veículos com data errada
-- ============================================================================

-- PASSO 1: Ver quais registros estão com problema
-- ============================================================================
SELECT 
  id,
  COALESCE(plate, vehicle_model) as veiculo,
  start_time as hora_salva_utc,
  (start_time AT TIME ZONE 'America/Sao_Paulo') as hora_local_correta,
  date_local(start_time) as data_que_deveria_ser,
  status
FROM appointments
WHERE 
  -- Registros criados nas últimas 24 horas
  start_time > NOW() - INTERVAL '24 hours'
  -- E que estão com data errada (horário >= 21h virou dia seguinte)
  AND EXTRACT(HOUR FROM (start_time AT TIME ZONE 'America/Sao_Paulo')) >= 21
ORDER BY start_time DESC;

-- ============================================================================
-- PASSO 2: CORRIGIR OS REGISTROS
-- ============================================================================
-- Descomente as linhas abaixo para executar a correção:

/*
-- Fazer backup primeiro
CREATE TABLE appointments_backup AS SELECT * FROM appointments;

-- Corrigir appointments das últimas 24h que estão com data errada
UPDATE appointments
SET start_time = start_time - INTERVAL '3 hours'
WHERE 
  start_time > NOW() - INTERVAL '24 hours'
  AND EXTRACT(HOUR FROM (start_time AT TIME ZONE 'America/Sao_Paulo')) >= 21;

-- Ver resultado
SELECT 
  id,
  COALESCE(plate, vehicle_model) as veiculo,
  start_time,
  date_local(start_time) as data_correta,
  status
FROM appointments
WHERE start_time > NOW() - INTERVAL '24 hours'
ORDER BY start_time DESC;
*/

-- ============================================================================
-- ALTERNATIVA: Corrigir registro específico por ID
-- ============================================================================
-- Se você souber o ID do registro que precisa corrigir:

/*
UPDATE appointments
SET start_time = start_time - INTERVAL '3 hours'
WHERE id = 'COLE_O_ID_AQUI';
*/

-- ============================================================================
-- VERIFICAR SE ESTÁ TUDO OK
-- ============================================================================
SELECT 
  date_local(start_time) as data,
  COUNT(*) as total_veiculos,
  STRING_AGG(COALESCE(plate, vehicle_model), ', ') as veiculos
FROM appointments
WHERE start_time > NOW() - INTERVAL '48 hours'
GROUP BY date_local(start_time)
ORDER BY data DESC;
