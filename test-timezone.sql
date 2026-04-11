-- ============================================================================
-- TESTE DE TIMEZONE - Verificar se está tudo funcionando
-- ============================================================================

-- 1. Verificar timezone atual do banco
SHOW timezone;

-- 2. Comparar UTC vs Local
SELECT 
  NOW() as utc_now,
  now_local() as local_now,
  NOW() AT TIME ZONE 'America/Sao_Paulo' as manual_conversion;

-- 3. Verificar data atual
SELECT 
  CURRENT_DATE as postgres_date,
  today_local() as local_today,
  (NOW() AT TIME ZONE 'America/Sao_Paulo')::DATE as manual_today;

-- 4. Testar conversão de timestamp
SELECT 
  '2026-04-11 00:03:00+00'::TIMESTAMPTZ as utc_time,
  date_local('2026-04-11 00:03:00+00'::TIMESTAMPTZ) as local_date,
  to_local_time('2026-04-11 00:03:00+00'::TIMESTAMPTZ) as local_time;

-- 5. Verificar horário comercial
SELECT 
  EXTRACT(HOUR FROM (NOW() AT TIME ZONE 'America/Sao_Paulo')) as current_hour,
  is_business_hours() as is_business_hours,
  is_business_hours(NOW(), 6, 22) as custom_hours;

-- 6. Testar limites do dia
SELECT * FROM day_bounds_local();

-- 7. Verificar appointments existentes (se houver)
SELECT 
  id,
  start_time as utc_time,
  to_local_time(start_time) as local_time,
  date_local(start_time) as local_date,
  status
FROM appointments
ORDER BY start_time DESC
LIMIT 5;

-- ============================================================================
-- RESULTADO ESPERADO:
-- ============================================================================
-- timezone: America/Sao_Paulo
-- local_now: deve mostrar hora atual do Brasil (não UTC)
-- local_today: deve mostrar data atual do Brasil
-- is_business_hours: true se entre 6h e 22h (horário local)
-- ============================================================================
