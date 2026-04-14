-- Script para corrigir agendamentos sem client_name preenchido
-- Execute este script no Supabase SQL Editor

-- 1. Verificar quantos agendamentos estão sem client_name
SELECT 
    COUNT(*) as total_sem_nome,
    COUNT(DISTINCT client_id) as clientes_unicos
FROM appointments
WHERE client_name IS NULL 
  AND client_id IS NOT NULL;

-- 2. Atualizar agendamentos preenchendo client_name a partir da tabela clients
UPDATE appointments a
SET client_name = c.name
FROM clients c
WHERE a.client_id = c.id
  AND a.client_name IS NULL;

-- 3. Verificar resultado
SELECT 
    COUNT(*) as total_agendamentos,
    COUNT(CASE WHEN client_name IS NOT NULL THEN 1 END) as com_nome,
    COUNT(CASE WHEN client_name IS NULL THEN 1 END) as sem_nome
FROM appointments;

-- 4. Ver exemplos de agendamentos atualizados
SELECT 
    id,
    client_id,
    client_name,
    start_time,
    status
FROM appointments
WHERE client_id IS NOT NULL
ORDER BY start_time DESC
LIMIT 10;
