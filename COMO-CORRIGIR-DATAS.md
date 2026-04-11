# 🔧 Como Corrigir Datas dos Veículos

## 📋 Problema

Veículos lançados às 21:03 do dia 10 aparecem como dia 11 no sistema.

## ✅ Solução Rápida (3 passos)

### Passo 1: Ver quais veículos estão com problema

Abra o SQL Editor do Supabase e execute:

```sql
SELECT 
  id,
  COALESCE(plate, vehicle_model) as veiculo,
  start_time as hora_salva,
  date_local(start_time) as data_correta,
  status
FROM appointments
WHERE 
  start_time > NOW() - INTERVAL '24 hours'
  AND EXTRACT(HOUR FROM (start_time AT TIME ZONE 'America/Sao_Paulo')) >= 21
ORDER BY start_time DESC;
```

Isso vai mostrar todos os veículos das últimas 24h que foram lançados após 21h e estão com data errada.

### Passo 2: Fazer backup (segurança)

```sql
CREATE TABLE appointments_backup AS 
SELECT * FROM appointments 
WHERE start_time > NOW() - INTERVAL '24 hours';
```

### Passo 3: Corrigir as datas

```sql
UPDATE appointments
SET start_time = start_time - INTERVAL '3 hours'
WHERE 
  start_time > NOW() - INTERVAL '24 hours'
  AND EXTRACT(HOUR FROM (start_time AT TIME ZONE 'America/Sao_Paulo')) >= 21;
```

### Passo 4: Verificar se funcionou

```sql
SELECT 
  date_local(start_time) as data,
  COUNT(*) as total_veiculos,
  STRING_AGG(COALESCE(plate, vehicle_model), ', ') as veiculos
FROM appointments
WHERE start_time > NOW() - INTERVAL '48 hours'
GROUP BY date_local(start_time)
ORDER BY data DESC;
```

## 🎯 Resultado Esperado

Antes:
```
Placa: ABC1234
Data: 11/04/2026 ❌
Hora: 00:03
```

Depois:
```
Placa: ABC1234
Data: 10/04/2026 ✅
Hora: 21:03
```

## 📝 Corrigir Registro Específico

Se você souber o ID do veículo:

```sql
-- Ver o registro
SELECT * FROM appointments WHERE id = 'COLE_O_ID_AQUI';

-- Corrigir
UPDATE appointments
SET start_time = start_time - INTERVAL '3 hours'
WHERE id = 'COLE_O_ID_AQUI';
```

## 🔍 Verificar Todos os Registros

Ver todos os veículos de hoje:

```sql
SELECT 
  COALESCE(plate, vehicle_model) as veiculo,
  start_time,
  date_local(start_time) as data_local,
  status
FROM appointments
WHERE date_local(start_time) = today_local()
ORDER BY start_time DESC;
```

## ⚠️ Importante

1. Sempre faça backup antes de corrigir
2. Execute primeiro o SELECT para ver o que será alterado
3. Depois execute o UPDATE
4. Verifique se ficou correto

## 🆘 Se algo der errado

Restaurar do backup:

```sql
-- Ver o backup
SELECT * FROM appointments_backup;

-- Restaurar (se necessário)
DELETE FROM appointments WHERE start_time > NOW() - INTERVAL '24 hours';
INSERT INTO appointments SELECT * FROM appointments_backup;
```

## 📞 Dúvidas?

Use o arquivo `fix-dates-simple.sql` que tem todos os comandos prontos!
