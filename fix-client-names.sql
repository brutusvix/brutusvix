-- Atualizar todos os agendamentos com o nome do cliente
-- Este script preenche o campo client_name nos agendamentos que não têm

UPDATE appointments
SET client_name = clients.name
FROM clients
WHERE appointments.client_id = clients.id
  AND (appointments.client_name IS NULL OR appointments.client_name = '');

-- Verificar quantos foram atualizados
SELECT COUNT(*) as total_atualizados
FROM appointments
WHERE client_name IS NOT NULL AND client_name != '';
