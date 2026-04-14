-- Script para adicionar PICKUP como tipo de veículo válido
-- Execute este script no Supabase SQL Editor

-- 1. Verificar constraint atual da tabela appointments
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'appointments'::regclass
  AND conname LIKE '%vehicle_type%';

-- 2. Se houver constraint CHECK no vehicle_type, precisamos removê-la e recriar com PICKUP
-- Exemplo de como atualizar (ajuste o nome da constraint se necessário):

-- DROP CONSTRAINT IF EXISTS appointments_vehicle_type_check;

-- ALTER TABLE appointments
-- DROP CONSTRAINT IF EXISTS appointments_vehicle_type_check;

-- ALTER TABLE appointments
-- ADD CONSTRAINT appointments_vehicle_type_check 
-- CHECK (vehicle_type IN ('HATCH', 'SEDAN', 'SUV', 'PICKUP', 'CAMINHONETE', 'MOTO', 'MOTO_PEQUENA', 'MOTO_GRANDE'));

-- 3. Verificar se há registros com tipos inválidos
SELECT DISTINCT vehicle_type, COUNT(*) as total
FROM appointments
GROUP BY vehicle_type
ORDER BY total DESC;

-- NOTA: Execute as linhas comentadas acima apenas se a constraint existir e precisar ser atualizada
