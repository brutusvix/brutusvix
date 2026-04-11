# 🚗 Como Corrigir os 20 Carros de Hoje

## 📋 Problema

Os 20 carros foram lançados ontem à noite mas aparecem com data de ontem. Precisam ser movidos para hoje.

## ✅ Solução Rápida (3 passos)

### Passo 1: Ver quais carros serão movidos

Abra o SQL Editor do Supabase e execute:

```sql
SELECT 
  id,
  COALESCE(plate, vehicle_model, client_name) as identificacao,
  start_time as hora_atual,
  date_local(start_time) as data_atual,
  status,
  total_price
FROM appointments
WHERE date_local(start_time) = '2026-04-10'
ORDER BY start_time DESC;
```

Isso vai mostrar os 20 carros que estão com data de ontem.

### Passo 2: Fazer backup (segurança)

```sql
CREATE TABLE appointments_backup_20260411 AS 
SELECT * FROM appointments 
WHERE date_local(start_time) = '2026-04-10';
```

### Passo 3: Mover os carros para hoje

```sql
UPDATE appointments
SET start_time = start_time + INTERVAL '1 day'
WHERE date_local(start_time) = '2026-04-10';
```

### Passo 4: Verificar se funcionou

```sql
SELECT 
  date_local(start_time) as data,
  COUNT(*) as total_carros,
  SUM(total_price) as faturamento_total
FROM appointments
WHERE date_local(start_time) = today_local()
GROUP BY date_local(start_time);
```

Deve mostrar:
- Data: 2026-04-11
- Total carros: 20
- Faturamento: R$ 1.365,00

## 🎯 Resultado Esperado

**Antes:**
- Ontem (10/04): 20 carros, R$ 1.365,00
- Hoje (11/04): 0 carros, R$ 0,00

**Depois:**
- Ontem (10/04): 0 carros, R$ 0,00
- Hoje (11/04): 20 carros, R$ 1.365,00

## 🔄 Se algo der errado

Restaurar do backup:

```sql
-- Deletar registros incorretos
DELETE FROM appointments WHERE date_local(start_time) = '2026-04-11';

-- Restaurar do backup
INSERT INTO appointments 
SELECT * FROM appointments_backup_20260411;
```

## 📝 Alternativa: Mover apenas alguns carros

Se você quiser mover apenas carros específicos:

1. Copie os IDs dos carros que quer mover do Passo 1
2. Execute:

```sql
UPDATE appointments
SET start_time = start_time + INTERVAL '1 day'
WHERE id IN (
  'id-do-carro-1',
  'id-do-carro-2',
  'id-do-carro-3'
  -- adicione mais IDs aqui
);
```

## ⚠️ Importante

- Este script move TODOS os carros de 10/04 para 11/04
- Faça o backup antes de executar
- Verifique os resultados após executar
- Se tiver dúvidas, peça ajuda antes de executar

---

**Arquivo completo com todos os comandos:** `fix-today-cars.sql`
