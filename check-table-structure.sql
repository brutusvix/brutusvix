-- ============================================================================
-- VERIFICAR ESTRUTURA DA TABELA APPOINTMENTS
-- ============================================================================

-- Ver todas as colunas da tabela appointments
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'appointments'
ORDER BY ordinal_position;

-- Ver alguns registros para entender a estrutura
SELECT * FROM appointments LIMIT 5;

-- Ver registros das últimas 24h
SELECT * FROM appointments 
WHERE start_time > NOW() - INTERVAL '24 hours'
ORDER BY start_time DESC
LIMIT 10;
