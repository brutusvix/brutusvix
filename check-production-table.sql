-- Verificar tabelas relacionadas a produção/lavagem
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE '%prod%' 
  OR table_name LIKE '%wash%'
  OR table_name LIKE '%service%'
  OR table_name LIKE '%work%'
ORDER BY table_name;
