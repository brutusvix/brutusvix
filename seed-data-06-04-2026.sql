-- ============================================================================
-- SCRIPT DE SEED - FLUXO DE ATENDIMENTO 06/04/2026
-- ============================================================================
-- Este script popula o banco com dados de exemplo baseados no fluxo real
-- Data: 06/04/2026 | Unidade: 01
-- ============================================================================

-- IMPORTANTE: Execute este script no SQL Editor do Supabase
-- Certifique-se de ter uma unidade com ID válido antes de executar

-- ============================================================================
-- 1. CRIAR SERVIÇOS (se não existirem)
-- ============================================================================

-- Serviço: Lavagem Simples (L)
INSERT INTO services (name, unit_id, price_hatch, price_sedan, price_suv, price_pickup, duration_minutes, active, category)
SELECT 
  'Lavagem Simples L',
  id,
  60.00,
  70.00,
  80.00,
  90.00,
  30,
  true,
  'LAVAGEM'
FROM units
WHERE name ILIKE '%unidade%' OR name ILIKE '%01%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Serviço: Lavagem Completa L+A (Lavagem + Aspiração)
INSERT INTO services (name, unit_id, price_hatch, price_sedan, price_suv, price_pickup, duration_minutes, active, category)
SELECT 
  'Lavagem Completa L+A',
  id,
  60.00,
  70.00,
  80.00,
  90.00,
  45,
  true,
  'LAVAGEM'
FROM units
WHERE name ILIKE '%unidade%' OR name ILIKE '%01%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Serviço: Lavagem Premium L+A+C+R (Lavagem + Aspiração + Cera + Revitalização)
INSERT INTO services (name, unit_id, price_hatch, price_sedan, price_suv, price_pickup, duration_minutes, active, category)
SELECT 
  'Lavagem Premium L+A+C+R',
  id,
  110.00,
  130.00,
  150.00,
  170.00,
  90,
  true,
  'LAVAGEM'
FROM units
WHERE name ILIKE '%unidade%' OR name ILIKE '%01%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Serviço: Lavagem com Extras L+A+E+FEIRA
INSERT INTO services (name, unit_id, price_hatch, price_sedan, price_suv, price_pickup, duration_minutes, active, category)
SELECT 
  'Lavagem com Extras',
  id,
  80.00,
  90.00,
  100.00,
  110.00,
  60,
  true,
  'LAVAGEM'
FROM units
WHERE name ILIKE '%unidade%' OR name ILIKE '%01%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 2. CRIAR CLIENTES
-- ============================================================================

-- Cliente: ROSTOU (Harley Davidson)
INSERT INTO clients (name, phone, unit_id, points, total_spent)
SELECT 
  'ROSTOU',
  '27999872327',
  id,
  0,
  0
FROM units
WHERE name ILIKE '%unidade%' OR name ILIKE '%01%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Cliente: JACQUES (Volvo)
INSERT INTO clients (name, phone, unit_id, points, total_spent)
SELECT 
  'JACQUES',
  '27999636208',
  id,
  0,
  0
FROM units
WHERE name ILIKE '%unidade%' OR name ILIKE '%01%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Cliente: JOBSON (Gol)
INSERT INTO clients (name, phone, unit_id, points, total_spent)
SELECT 
  'JOBSON',
  '27988825877',
  id,
  0,
  0
FROM units
WHERE name ILIKE '%unidade%' OR name ILIKE '%01%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Cliente: FELIPE (208)
INSERT INTO clients (name, phone, unit_id, points, total_spent)
SELECT 
  'FELIPE',
  '27998075636',
  id,
  0,
  0
FROM units
WHERE name ILIKE '%unidade%' OR name ILIKE '%01%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Cliente: VIUSO (Creta)
INSERT INTO clients (name, phone, unit_id, points, total_spent)
SELECT 
  'VIUSO',
  '27998499906',
  id,
  0,
  0
FROM units
WHERE name ILIKE '%unidade%' OR name ILIKE '%01%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Cliente: THIAGO (Toro)
INSERT INTO clients (name, phone, unit_id, points, total_spent)
SELECT 
  'THIAGO',
  '27999828211',
  id,
  0,
  0
FROM units
WHERE name ILIKE '%unidade%' OR name ILIKE '%01%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Cliente: DICHVADO / POSTO S.O.S (Estrada)
INSERT INTO clients (name, phone, unit_id, points, total_spent)
SELECT 
  'DICHVADO / POSTO S.O.S',
  '27996142668',
  id,
  0,
  0
FROM units
WHERE name ILIKE '%unidade%' OR name ILIKE '%01%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Cliente: GABRIEL (Onox)
INSERT INTO clients (name, phone, unit_id, points, total_spent)
SELECT 
  'GABRIEL',
  '27999837515',
  id,
  0,
  0
FROM units
WHERE name ILIKE '%unidade%' OR name ILIKE '%01%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Cliente: BOSTOSAUDE (Kicks)
INSERT INTO clients (name, phone, unit_id, points, total_spent)
SELECT 
  'BOSTOSAUDE',
  '27999430098',
  id,
  0,
  0
FROM units
WHERE name ILIKE '%unidade%' OR name ILIKE '%01%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Cliente: BRUNO PACHETTI (X3)
INSERT INTO clients (name, phone, unit_id, points, total_spent)
SELECT 
  'BRUNO PACHETTI',
  '27997518026',
  id,
  0,
  0
FROM units
WHERE name ILIKE '%unidade%' OR name ILIKE '%01%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Cliente: ISAIAS (Peugeot)
INSERT INTO clients (name, phone, unit_id, points, total_spent)
SELECT 
  'ISAIAS',
  '27998241440',
  id,
  0,
  0
FROM units
WHERE name ILIKE '%unidade%' OR name ILIKE '%01%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Cliente: Moto & Genre
INSERT INTO clients (name, phone, unit_id, points, total_spent)
SELECT 
  'MOTO & GENRE',
  '27995121374',
  id,
  0,
  0
FROM units
WHERE name ILIKE '%unidade%' OR name ILIKE '%01%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Cliente: L 200
INSERT INTO clients (name, phone, unit_id, points, total_spent)
SELECT 
  'CLIENTE L200',
  '27995824981',
  id,
  0,
  0
FROM units
WHERE name ILIKE '%unidade%' OR name ILIKE '%01%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Cliente: ETIOS
INSERT INTO clients (name, phone, unit_id, points, total_spent)
SELECT 
  'CLIENTE ETIOS',
  '27996142668',
  id,
  0,
  0
FROM units
WHERE name ILIKE '%unidade%' OR name ILIKE '%01%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Cliente: DENIS (Argo)
INSERT INTO clients (name, phone, unit_id, points, total_spent)
SELECT 
  'DENIS',
  '27992525889',
  id,
  0,
  0
FROM units
WHERE name ILIKE '%unidade%' OR name ILIKE '%01%'
LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. CRIAR VEÍCULOS
-- ============================================================================

-- Veículo: Harley Davidson
INSERT INTO vehicles (client_id, model, plate)
SELECT 
  c.id,
  'Harley Davidson',
  ''
FROM clients c
WHERE c.name = 'ROSTOU'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Veículo: Volvo
INSERT INTO vehicles (client_id, model, plate)
SELECT 
  c.id,
  'Volvo',
  ''
FROM clients c
WHERE c.name = 'JACQUES'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Veículo: Gol
INSERT INTO vehicles (client_id, model, plate)
SELECT 
  c.id,
  'Gol',
  ''
FROM clients c
WHERE c.name = 'JOBSON'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Veículo: 208
INSERT INTO vehicles (client_id, model, plate)
SELECT 
  c.id,
  'Peugeot 208',
  ''
FROM clients c
WHERE c.name = 'FELIPE'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Veículo: Creta
INSERT INTO vehicles (client_id, model, plate)
SELECT 
  c.id,
  'Hyundai Creta',
  ''
FROM clients c
WHERE c.name = 'VIUSO'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Veículo: Toro
INSERT INTO vehicles (client_id, model, plate)
SELECT 
  c.id,
  'Fiat Toro',
  ''
FROM clients c
WHERE c.name = 'THIAGO'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Veículo: Estrada
INSERT INTO vehicles (client_id, model, plate)
SELECT 
  c.id,
  'Estrada',
  ''
FROM clients c
WHERE c.name = 'DICHVADO / POSTO S.O.S'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Veículo: Onox
INSERT INTO vehicles (client_id, model, plate)
SELECT 
  c.id,
  'Chevrolet Onix',
  ''
FROM clients c
WHERE c.name = 'GABRIEL'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Veículo: Kicks
INSERT INTO vehicles (client_id, model, plate)
SELECT 
  c.id,
  'Nissan Kicks',
  ''
FROM clients c
WHERE c.name = 'BOSTOSAUDE'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Veículo: X3
INSERT INTO vehicles (client_id, model, plate)
SELECT 
  c.id,
  'BMW X3',
  ''
FROM clients c
WHERE c.name = 'BRUNO PACHETTI'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Veículo: Peugeot
INSERT INTO vehicles (client_id, model, plate)
SELECT 
  c.id,
  'Peugeot',
  ''
FROM clients c
WHERE c.name = 'ISAIAS'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Veículo: Moto
INSERT INTO vehicles (client_id, model, plate)
SELECT 
  c.id,
  'Moto',
  ''
FROM clients c
WHERE c.name = 'MOTO & GENRE'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Veículo: L200
INSERT INTO vehicles (client_id, model, plate)
SELECT 
  c.id,
  'Mitsubishi L200',
  ''
FROM clients c
WHERE c.name = 'CLIENTE L200'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Veículo: Etios
INSERT INTO vehicles (client_id, model, plate)
SELECT 
  c.id,
  'Toyota Etios',
  ''
FROM clients c
WHERE c.name = 'CLIENTE ETIOS'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Veículo: Prisma
INSERT INTO vehicles (client_id, model, plate)
SELECT 
  c.id,
  'Chevrolet Prisma',
  ''
FROM clients c
WHERE c.name = 'DICHVADO / POSTO S.O.S'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Veículo: Argo
INSERT INTO vehicles (client_id, model, plate)
SELECT 
  c.id,
  'Fiat Argo',
  ''
FROM clients c
WHERE c.name = 'DENIS'
LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. CRIAR AGENDAMENTOS E TRANSAÇÕES (06/04/2026)
-- ============================================================================
-- IMPORTANTE: Ajuste os horários conforme necessário
-- ============================================================================

-- 1. ROSTOU - Harley Davidson - L (R$ 80,00) - PIX
DO $$
DECLARE
  v_client_id UUID;
  v_service_id UUID;
  v_unit_id UUID;
  v_appointment_id UUID;
BEGIN
  SELECT id INTO v_unit_id FROM units WHERE name ILIKE '%unidade%' OR name ILIKE '%01%' LIMIT 1;
  SELECT id INTO v_client_id FROM clients WHERE name = 'ROSTOU' LIMIT 1;
  SELECT id INTO v_service_id FROM services WHERE name = 'Lavagem Simples L' LIMIT 1;
  
  INSERT INTO appointments (client_id, service_id, unit_id, vehicle_type, vehicle_model, start_time, end_time, status, total_price)
  VALUES (v_client_id, v_service_id, v_unit_id, 'MOTO_GRANDE', 'Harley Davidson', '2026-04-06 08:00:00', '2026-04-06 08:30:00', 'FINALIZADO', 80.00)
  RETURNING id INTO v_appointment_id;
  
  INSERT INTO transactions (unit_id, type, amount, category, description, date, payment_method)
  VALUES (v_unit_id, 'INCOME', 80.00, 'SERVICO', 'PIX - Lavagem Simples L', '2026-04-06', 'PIX');
END $$;

-- 2. JACQUES - Volvo - L+A (R$ 80,00) - PIX
DO $$
DECLARE
  v_client_id UUID;
  v_service_id UUID;
  v_unit_id UUID;
BEGIN
  SELECT id INTO v_unit_id FROM units WHERE name ILIKE '%unidade%' OR name ILIKE '%01%' LIMIT 1;
  SELECT id INTO v_client_id FROM clients WHERE name = 'JACQUES' LIMIT 1;
  SELECT id INTO v_service_id FROM services WHERE name = 'Lavagem Completa L+A' LIMIT 1;
  
  INSERT INTO appointments (client_id, service_id, unit_id, vehicle_type, vehicle_model, start_time, end_time, status, total_price)
  VALUES (v_client_id, v_service_id, v_unit_id, 'SUV', 'Volvo', '2026-04-06 08:30:00', '2026-04-06 09:15:00', 'FINALIZADO', 80.00);
  
  INSERT INTO transactions (unit_id, type, amount, category, description, date, payment_method)
  VALUES (v_unit_id, 'INCOME', 80.00, 'SERVICO', 'PIX - Lavagem Completa L+A', '2026-04-06', 'PIX');
END $$;

-- 3. JOBSON - Gol - L+A (R$ 100,00) - CARTÃO CRÉDITO
DO $$
DECLARE
  v_client_id UUID;
  v_service_id UUID;
  v_unit_id UUID;
BEGIN
  SELECT id INTO v_unit_id FROM units WHERE name ILIKE '%unidade%' OR name ILIKE '%01%' LIMIT 1;
  SELECT id INTO v_client_id FROM clients WHERE name = 'JOBSON' LIMIT 1;
  SELECT id INTO v_service_id FROM services WHERE name = 'Lavagem Completa L+A' LIMIT 1;
  
  INSERT INTO appointments (client_id, service_id, unit_id, vehicle_type, vehicle_model, start_time, end_time, status, total_price)
  VALUES (v_client_id, v_service_id, v_unit_id, 'HATCH', 'Gol', '2026-04-06 09:15:00', '2026-04-06 10:00:00', 'FINALIZADO', 100.00);
  
  INSERT INTO transactions (unit_id, type, amount, category, description, date, payment_method)
  VALUES (v_unit_id, 'INCOME', 100.00, 'SERVICO', 'CARTAO CREDITO - Lavagem Completa L+A', '2026-04-06', 'CARTAO_CREDITO');
END $$;

-- 4. FELIPE - 208 - L+A (R$ 60,00) - CARTÃO CRÉDITO
DO $$
DECLARE
  v_client_id UUID;
  v_service_id UUID;
  v_unit_id UUID;
BEGIN
  SELECT id INTO v_unit_id FROM units WHERE name ILIKE '%unidade%' OR name ILIKE '%01%' LIMIT 1;
  SELECT id INTO v_client_id FROM clients WHERE name = 'FELIPE' LIMIT 1;
  SELECT id INTO v_service_id FROM services WHERE name = 'Lavagem Completa L+A' LIMIT 1;
  
  INSERT INTO appointments (client_id, service_id, unit_id, vehicle_type, vehicle_model, start_time, end_time, status, total_price)
  VALUES (v_client_id, v_service_id, v_unit_id, 'HATCH', 'Peugeot 208', '2026-04-06 10:00:00', '2026-04-06 10:45:00', 'FINALIZADO', 60.00);
  
  INSERT INTO transactions (unit_id, type, amount, category, description, date, payment_method)
  VALUES (v_unit_id, 'INCOME', 60.00, 'SERVICO', 'CARTAO CREDITO - Lavagem Completa L+A', '2026-04-06', 'CARTAO_CREDITO');
END $$;

-- 5. VIUSO - Creta - L+A (R$ 80,00) - PIX
DO $$
DECLARE
  v_client_id UUID;
  v_service_id UUID;
  v_unit_id UUID;
BEGIN
  SELECT id INTO v_unit_id FROM units WHERE name ILIKE '%unidade%' OR name ILIKE '%01%' LIMIT 1;
  SELECT id INTO v_client_id FROM clients WHERE name = 'VIUSO' LIMIT 1;
  SELECT id INTO v_service_id FROM services WHERE name = 'Lavagem Completa L+A' LIMIT 1;
  
  INSERT INTO appointments (client_id, service_id, unit_id, vehicle_type, vehicle_model, start_time, end_time, status, total_price)
  VALUES (v_client_id, v_service_id, v_unit_id, 'SUV', 'Hyundai Creta', '2026-04-06 10:45:00', '2026-04-06 11:30:00', 'FINALIZADO', 80.00);
  
  INSERT INTO transactions (unit_id, type, amount, category, description, date, payment_method)
  VALUES (v_unit_id, 'INCOME', 80.00, 'SERVICO', 'PIX - Lavagem Completa L+A', '2026-04-06', 'PIX');
END $$;

-- 6. THIAGO - Toro - L+A (R$ 90,00) - PIX
DO $$
DECLARE
  v_client_id UUID;
  v_service_id UUID;
  v_unit_id UUID;
BEGIN
  SELECT id INTO v_unit_id FROM units WHERE name ILIKE '%unidade%' OR name ILIKE '%01%' LIMIT 1;
  SELECT id INTO v_client_id FROM clients WHERE name = 'THIAGO' LIMIT 1;
  SELECT id INTO v_service_id FROM services WHERE name = 'Lavagem Completa L+A' LIMIT 1;
  
  INSERT INTO appointments (client_id, service_id, unit_id, vehicle_type, vehicle_model, start_time, end_time, status, total_price)
  VALUES (v_client_id, v_service_id, v_unit_id, 'CAMINHONETE', 'Fiat Toro', '2026-04-06 11:30:00', '2026-04-06 12:15:00', 'FINALIZADO', 90.00);
  
  INSERT INTO transactions (unit_id, type, amount, category, description, date, payment_method)
  VALUES (v_unit_id, 'INCOME', 90.00, 'SERVICO', 'PIX - Lavagem Completa L+A', '2026-04-06', 'PIX');
END $$;

-- 7. DICHVADO - Estrada - L+A (R$ 60,00) - PIX
DO $$
DECLARE
  v_client_id UUID;
  v_service_id UUID;
  v_unit_id UUID;
BEGIN
  SELECT id INTO v_unit_id FROM units WHERE name ILIKE '%unidade%' OR name ILIKE '%01%' LIMIT 1;
  SELECT id INTO v_client_id FROM clients WHERE name = 'DICHVADO / POSTO S.O.S' LIMIT 1;
  SELECT id INTO v_service_id FROM services WHERE name = 'Lavagem Completa L+A' LIMIT 1;
  
  INSERT INTO appointments (client_id, service_id, unit_id, vehicle_type, vehicle_model, start_time, end_time, status, total_price)
  VALUES (v_client_id, v_service_id, v_unit_id, 'HATCH', 'Estrada', '2026-04-06 13:00:00', '2026-04-06 13:45:00', 'FINALIZADO', 60.00);
  
  INSERT INTO transactions (unit_id, type, amount, category, description, date, payment_method)
  VALUES (v_unit_id, 'INCOME', 60.00, 'SERVICO', 'PIX - Lavagem Completa L+A', '2026-04-06', 'PIX');
END $$;

-- 8. GABRIEL - Onox - L+A (R$ 60,00) - PIX
DO $$
DECLARE
  v_client_id UUID;
  v_service_id UUID;
  v_unit_id UUID;
BEGIN
  SELECT id INTO v_unit_id FROM units WHERE name ILIKE '%unidade%' OR name ILIKE '%01%' LIMIT 1;
  SELECT id INTO v_client_id FROM clients WHERE name = 'GABRIEL' LIMIT 1;
  SELECT id INTO v_service_id FROM services WHERE name = 'Lavagem Completa L+A' LIMIT 1;
  
  INSERT INTO appointments (client_id, service_id, unit_id, vehicle_type, vehicle_model, start_time, end_time, status, total_price)
  VALUES (v_client_id, v_service_id, v_unit_id, 'HATCH', 'Chevrolet Onix', '2026-04-06 13:45:00', '2026-04-06 14:30:00', 'FINALIZADO', 60.00);
  
  INSERT INTO transactions (unit_id, type, amount, category, description, date, payment_method)
  VALUES (v_unit_id, 'INCOME', 60.00, 'SERVICO', 'PIX - Lavagem Completa L+A', '2026-04-06', 'PIX');
END $$;

-- 9. BOSTOSAUDE - Kicks - L+A+R (R$ 80,00) - PIX
DO $$
DECLARE
  v_client_id UUID;
  v_service_id UUID;
  v_unit_id UUID;
BEGIN
  SELECT id INTO v_unit_id FROM units WHERE name ILIKE '%unidade%' OR name ILIKE '%01%' LIMIT 1;
  SELECT id INTO v_client_id FROM clients WHERE name = 'BOSTOSAUDE' LIMIT 1;
  SELECT id INTO v_service_id FROM services WHERE name = 'Lavagem Premium L+A+C+R' LIMIT 1;
  
  INSERT INTO appointments (client_id, service_id, unit_id, vehicle_type, vehicle_model, start_time, end_time, status, total_price)
  VALUES (v_client_id, v_service_id, v_unit_id, 'HATCH', 'Nissan Kicks', '2026-04-06 14:30:00', '2026-04-06 16:00:00', 'FINALIZADO', 80.00);
  
  INSERT INTO transactions (unit_id, type, amount, category, description, date, payment_method)
  VALUES (v_unit_id, 'INCOME', 80.00, 'SERVICO', 'PIX - Lavagem Premium L+A+C+R', '2026-04-06', 'PIX');
END $$;

-- 10. BRUNO PACHETTI - X3 - L+A+C+R (R$ 110,00) - PIX
DO $$
DECLARE
  v_client_id UUID;
  v_service_id UUID;
  v_unit_id UUID;
BEGIN
  SELECT id INTO v_unit_id FROM units WHERE name ILIKE '%unidade%' OR name ILIKE '%01%' LIMIT 1;
  SELECT id INTO v_client_id FROM clients WHERE name = 'BRUNO PACHETTI' LIMIT 1;
  SELECT id INTO v_service_id FROM services WHERE name = 'Lavagem Premium L+A+C+R' LIMIT 1;
  
  INSERT INTO appointments (client_id, service_id, unit_id, vehicle_type, vehicle_model, start_time, end_time, status, total_price)
  VALUES (v_client_id, v_service_id, v_unit_id, 'SUV', 'BMW X3', '2026-04-06 16:00:00', '2026-04-06 17:30:00', 'FINALIZADO', 110.00);
  
  INSERT INTO transactions (unit_id, type, amount, category, description, date, payment_method)
  VALUES (v_unit_id, 'INCOME', 110.00, 'SERVICO', 'PIX - Lavagem Premium L+A+C+R', '2026-04-06', 'PIX');
END $$;

-- 11. ISAIAS - Peugeot - L+A+C+R (R$ 130,00) - PIX
DO $$
DECLARE
  v_client_id UUID;
  v_service_id UUID;
  v_unit_id UUID;
BEGIN
  SELECT id INTO v_unit_id FROM units WHERE name ILIKE '%unidade%' OR name ILIKE '%01%' LIMIT 1;
  SELECT id INTO v_client_id FROM clients WHERE name = 'ISAIAS' LIMIT 1;
  SELECT id INTO v_service_id FROM services WHERE name = 'Lavagem Premium L+A+C+R' LIMIT 1;
  
  INSERT INTO appointments (client_id, service_id, unit_id, vehicle_type, vehicle_model, start_time, end_time, status, total_price)
  VALUES (v_client_id, v_service_id, v_unit_id, 'SEDAN', 'Peugeot', '2026-04-06 17:30:00', '2026-04-06 19:00:00', 'FINALIZADO', 130.00);
  
  INSERT INTO transactions (unit_id, type, amount, category, description, date, payment_method)
  VALUES (v_unit_id, 'INCOME', 130.00, 'SERVICO', 'PIX - Lavagem Premium L+A+C+R', '2026-04-06', 'PIX');
END $$;

-- 12. MOTO & GENRE - Moto - (R$ 80,00) - FPG (Forma de Pagamento Genérica)
DO $$
DECLARE
  v_client_id UUID;
  v_service_id UUID;
  v_unit_id UUID;
BEGIN
  SELECT id INTO v_unit_id FROM units WHERE name ILIKE '%unidade%' OR name ILIKE '%01%' LIMIT 1;
  SELECT id INTO v_client_id FROM clients WHERE name = 'MOTO & GENRE' LIMIT 1;
  SELECT id INTO v_service_id FROM services WHERE name = 'Lavagem Simples L' LIMIT 1;
  
  INSERT INTO appointments (client_id, service_id, unit_id, vehicle_type, vehicle_model, start_time, end_time, status, total_price)
  VALUES (v_client_id, v_service_id, v_unit_id, 'MOTO_PEQUENA', 'Moto', '2026-04-06 08:00:00', '2026-04-06 08:30:00', 'FINALIZADO', 80.00);
  
  INSERT INTO transactions (unit_id, type, amount, category, description, date, payment_method)
  VALUES (v_unit_id, 'INCOME', 80.00, 'SERVICO', 'DINHEIRO - Lavagem Simples L', '2026-04-06', 'DINHEIRO');
END $$;

-- 13. L200 - (R$ 500,00) - FPG
DO $$
DECLARE
  v_client_id UUID;
  v_service_id UUID;
  v_unit_id UUID;
BEGIN
  SELECT id INTO v_unit_id FROM units WHERE name ILIKE '%unidade%' OR name ILIKE '%01%' LIMIT 1;
  SELECT id INTO v_client_id FROM clients WHERE name = 'CLIENTE L200' LIMIT 1;
  SELECT id INTO v_service_id FROM services WHERE name = 'Lavagem Completa L+A' LIMIT 1;
  
  INSERT INTO appointments (client_id, service_id, unit_id, vehicle_type, vehicle_model, start_time, end_time, status, total_price)
  VALUES (v_client_id, v_service_id, v_unit_id, 'CAMINHONETE', 'Mitsubishi L200', '2026-04-06 09:00:00', '2026-04-06 09:45:00', 'FINALIZADO', 500.00);
  
  INSERT INTO transactions (unit_id, type, amount, category, description, date, payment_method)
  VALUES (v_unit_id, 'INCOME', 500.00, 'SERVICO', 'DINHEIRO - Lavagem Completa L+A', '2026-04-06', 'DINHEIRO');
END $$;

-- 14. ETIOS - (R$ 70,00) - PIX
DO $$
DECLARE
  v_client_id UUID;
  v_service_id UUID;
  v_unit_id UUID;
BEGIN
  SELECT id INTO v_unit_id FROM units WHERE name ILIKE '%unidade%' OR name ILIKE '%01%' LIMIT 1;
  SELECT id INTO v_client_id FROM clients WHERE name = 'CLIENTE ETIOS' LIMIT 1;
  SELECT id INTO v_service_id FROM services WHERE name = 'Lavagem Completa L+A' LIMIT 1;
  
  INSERT INTO appointments (client_id, service_id, unit_id, vehicle_type, vehicle_model, start_time, end_time, status, total_price)
  VALUES (v_client_id, v_service_id, v_unit_id, 'SEDAN', 'Toyota Etios', '2026-04-06 10:00:00', '2026-04-06 10:45:00', 'FINALIZADO', 70.00);
  
  INSERT INTO transactions (unit_id, type, amount, category, description, date, payment_method)
  VALUES (v_unit_id, 'INCOME', 70.00, 'SERVICO', 'PIX - Lavagem Completa L+A', '2026-04-06', 'PIX');
END $$;

-- 15. PRISMA - DICHVADO - (R$ 70,00) - PIX
DO $$
DECLARE
  v_client_id UUID;
  v_service_id UUID;
  v_unit_id UUID;
BEGIN
  SELECT id INTO v_unit_id FROM units WHERE name ILIKE '%unidade%' OR name ILIKE '%01%' LIMIT 1;
  SELECT id INTO v_client_id FROM clients WHERE name = 'DICHVADO / POSTO S.O.S' LIMIT 1;
  SELECT id INTO v_service_id FROM services WHERE name = 'Lavagem Completa L+A' LIMIT 1;
  
  INSERT INTO appointments (client_id, service_id, unit_id, vehicle_type, vehicle_model, start_time, end_time, status, total_price)
  VALUES (v_client_id, v_service_id, v_unit_id, 'SEDAN', 'Chevrolet Prisma', '2026-04-06 11:00:00', '2026-04-06 11:45:00', 'FINALIZADO', 70.00);
  
  INSERT INTO transactions (unit_id, type, amount, category, description, date, payment_method)
  VALUES (v_unit_id, 'INCOME', 70.00, 'SERVICO', 'PIX - Lavagem Completa L+A', '2026-04-06', 'PIX');
END $$;

-- 16. ARGO - DENIS - L+A
DO $$
DECLARE
  v_client_id UUID;
  v_service_id UUID;
  v_unit_id UUID;
BEGIN
  SELECT id INTO v_unit_id FROM units WHERE name ILIKE '%unidade%' OR name ILIKE '%01%' LIMIT 1;
  SELECT id INTO v_client_id FROM clients WHERE name = 'DENIS' LIMIT 1;
  SELECT id INTO v_service_id FROM services WHERE name = 'Lavagem Completa L+A' LIMIT 1;
  
  INSERT INTO appointments (client_id, service_id, unit_id, vehicle_type, vehicle_model, start_time, end_time, status, total_price)
  VALUES (v_client_id, v_service_id, v_unit_id, 'HATCH', 'Fiat Argo', '2026-04-06 12:00:00', '2026-04-06 12:45:00', 'FINALIZADO', 60.00);
  
  INSERT INTO transactions (unit_id, type, amount, category, description, date, payment_method)
  VALUES (v_unit_id, 'INCOME', 60.00, 'SERVICO', 'DINHEIRO - Lavagem Completa L+A', '2026-04-06', 'DINHEIRO');
END $$;

-- ============================================================================
-- RESUMO DO DIA 06/04/2026
-- ============================================================================
-- Total de atendimentos: 16
-- Total faturado: R$ 1.990,00
-- Formas de pagamento:
--   - PIX: 12 transações
--   - Cartão Crédito: 2 transações
--   - Dinheiro: 3 transações (incluindo FPG)
-- ============================================================================

SELECT 'Script executado com sucesso! Dados do dia 06/04/2026 inseridos.' AS resultado;
