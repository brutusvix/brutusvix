-- ============================================================================
-- MUDAR UNIDADE DOS APPOINTMENTS
-- ============================================================================

-- PASSO 1: Ver as unidades disponíveis
-- ============================================================================
SELECT id, name FROM units ORDER BY name;

-- PASSO 2: Ver os appointments de hoje e suas unidades
-- ============================================================================
SELECT 
  id,
  COALESCE(plate, vehicle_model, client_name) as identificacao,
  start_time,
  status,
  unit_id,
  (SELECT name FROM units WHERE id = appointments.unit_id) as unidade_atual
FROM appointments
WHERE date_local(start_time) = '2026-04-10'
ORDER BY start_time DESC;

-- ============================================================================
-- PASSO 3: MUDAR UNIDADE
-- ============================================================================

-- Opção A: Mudar TODOS os appointments de hoje para Unidade 2
/*
UPDATE appointments
SET unit_id = (SELECT id FROM units WHERE name ILIKE '%02%' OR name ILIKE '%2%' LIMIT 1)
WHERE date_local(start_time) = '2026-04-10';
*/

-- Opção B: Mudar appointments específicos por ID
/*
UPDATE appointments
SET unit_id = (SELECT id FROM units WHERE name ILIKE '%02%' OR name ILIKE '%2%' LIMIT 1)
WHERE id IN (
  '96f37aa0-8e84-48b0-a08e-cbed2200026b',
  '754912c1-f1de-4f6e-aeed-4fe371229bc0'
  -- adicione mais IDs aqui se necessário
);
*/

-- Opção C: Mudar por horário (exemplo: todos após 21h)
/*
UPDATE appointments
SET unit_id = (SELECT id FROM units WHERE name ILIKE '%02%' OR name ILIKE '%2%' LIMIT 1)
WHERE date_local(start_time) = '2026-04-10'
  AND EXTRACT(HOUR FROM start_time) >= 21;
*/

-- ============================================================================
-- PASSO 4: VERIFICAR MUDANÇA
-- ============================================================================
SELECT 
  COALESCE(plate, vehicle_model, client_name) as identificacao,
  start_time,
  status,
  (SELECT name FROM units WHERE id = appointments.unit_id) as unidade
FROM appointments
WHERE date_local(start_time) = '2026-04-10'
ORDER BY start_time DESC;

-- ============================================================================
-- ATALHO RÁPIDO: Mudar todos de hoje para Unidade 2
-- ============================================================================
-- Descomente as 3 linhas abaixo para executar:

/*
UPDATE appointments
SET unit_id = (SELECT id FROM units WHERE name ILIKE '%02%' OR name ILIKE '%unidade 2%' OR name ILIKE '%un 2%' LIMIT 1)
WHERE date_local(start_time) = '2026-04-10';
*/
