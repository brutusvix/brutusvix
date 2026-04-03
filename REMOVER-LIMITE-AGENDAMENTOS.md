# 🔓 Remover Limite de Agendamentos Simultâneos

## ❌ Problema Atual
O sistema está limitando a criação de agendamentos a **2 por unidade** em um período de 1:30-2h.

**Mensagem de erro:**
```
Erro ao criar agendamento: Limite de 2 agendamentos simultâneos por unidade atingido.
```

## 🔍 Onde está a validação?
A validação está no **banco de dados Supabase**, provavelmente em:
1. **Trigger** na tabela `appointments`
2. **Policy RLS** (Row Level Security)
3. **Função PostgreSQL** que valida antes de inserir

## ✅ Solução: Remover a Validação

### Passo 1: Acessar Supabase Dashboard
1. Acesse: https://supabase.com/dashboard
2. Faça login
3. Selecione seu projeto: **brutusvix**

### Passo 2: Abrir SQL Editor
1. No menu lateral, clique em **SQL Editor**
2. Clique em **New Query**

### Passo 3: Verificar Triggers
Execute este comando para listar todos os triggers na tabela `appointments`:

```sql
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'appointments';
```

**Se encontrar algum trigger relacionado a limite:**
- Anote o nome do trigger
- Execute: `DROP TRIGGER nome_do_trigger ON appointments;`

### Passo 4: Verificar Policies RLS
Execute este comando para listar todas as policies na tabela `appointments`:

```sql
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'appointments';
```

**Se encontrar alguma policy com validação de limite:**
- Anote o nome da policy
- Execute: `DROP POLICY "nome_da_policy" ON appointments;`

### Passo 5: Verificar Funções
Execute este comando para listar funções relacionadas a appointments:

```sql
SELECT 
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_name LIKE '%appointment%'
  OR routine_definition LIKE '%Limite%'
  OR routine_definition LIKE '%simultâneo%';
```

**Se encontrar alguma função com validação de limite:**
- Anote o nome da função
- Execute: `DROP FUNCTION nome_da_funcao();`

### Passo 6: Verificar Constraints
Execute este comando para verificar constraints na tabela:

```sql
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'appointments'::regclass;
```

**Se encontrar alguma constraint relacionada a limite:**
- Execute: `ALTER TABLE appointments DROP CONSTRAINT nome_da_constraint;`

## 🎯 Script Completo para Remover Todas as Validações

Execute este script no SQL Editor do Supabase:

```sql
-- ============================================================================
-- REMOVER LIMITE DE AGENDAMENTOS SIMULTÂNEOS
-- ============================================================================

-- 1. Listar e remover triggers suspeitos
DO $
DECLARE
  trigger_record RECORD;
BEGIN
  FOR trigger_record IN 
    SELECT trigger_name 
    FROM information_schema.triggers 
    WHERE event_object_table = 'appointments'
      AND (
        trigger_name LIKE '%limit%' 
        OR trigger_name LIKE '%concurrent%'
        OR trigger_name LIKE '%simultane%'
      )
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON appointments', trigger_record.trigger_name);
    RAISE NOTICE 'Trigger removido: %', trigger_record.trigger_name;
  END LOOP;
END $;

-- 2. Listar e remover policies suspeitas
DO $
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'appointments'
      AND (
        policyname LIKE '%limit%' 
        OR policyname LIKE '%concurrent%'
        OR policyname LIKE '%simultane%'
        OR qual LIKE '%count%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON appointments', policy_record.policyname);
    RAISE NOTICE 'Policy removida: %', policy_record.policyname;
  END LOOP;
END $;

-- 3. Listar funções relacionadas
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines
WHERE routine_name LIKE '%appointment%'
  AND (
    routine_definition LIKE '%Limite%'
    OR routine_definition LIKE '%simultâneo%'
    OR routine_definition LIKE '%count%'
  );

-- Se encontrar alguma função suspeita, remova manualmente:
-- DROP FUNCTION IF EXISTS nome_da_funcao();

-- 4. Verificar constraints
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'appointments'::regclass
  AND conname LIKE '%limit%';

-- Se encontrar alguma constraint suspeita, remova manualmente:
-- ALTER TABLE appointments DROP CONSTRAINT nome_da_constraint;

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

-- Listar todos os triggers restantes
SELECT trigger_name, event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'appointments';

-- Listar todas as policies restantes
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'appointments';

-- ============================================================================
-- TESTE
-- ============================================================================

-- Após remover as validações, teste criando múltiplos agendamentos
-- no sistema para verificar se o limite foi removido.
```

## 🔍 Alternativa: Buscar Manualmente

Se o script automático não funcionar, procure manualmente:

### 1. Verificar Triggers
```sql
\d+ appointments
```

### 2. Ver código de um trigger específico
```sql
SELECT pg_get_triggerdef(oid)
FROM pg_trigger
WHERE tgname = 'nome_do_trigger';
```

### 3. Ver código de uma função
```sql
SELECT routine_definition
FROM information_schema.routines
WHERE routine_name = 'nome_da_funcao';
```

## ⚠️ Importante

Após remover as validações:
1. **Teste imediatamente** criando 3+ agendamentos seguidos
2. **Verifique** se não há erros no console do navegador
3. **Confirme** que os agendamentos aparecem na lista

## ✅ RESOLVIDO - 28/01/2025

**Validação encontrada:**
- **Trigger:** `trg_check_concurrent` (INSERT e UPDATE)
- **Função:** `fn_check_concurrent_appointments()`
- **Limite:** 2 agendamentos simultâneos por unidade

**Comandos executados:**
```sql
DROP TRIGGER IF EXISTS trg_check_concurrent ON appointments;
DROP FUNCTION IF EXISTS fn_check_concurrent_appointments();
```

**Resultado:** ✅ Limite removido com sucesso!

Ver detalhes completos em: `CHANGELOG-BANCO-DADOS.md`

## 🆘 Se Não Conseguir Encontrar

Se não encontrar a validação com os comandos acima:

1. **Exporte o schema completo:**
```sql
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'appointments';
```

2. **Verifique o código da aplicação** (já verificamos e não tem validação no código)

3. **Entre em contato com suporte do Supabase** se a validação estiver em algum lugar não documentado

---

**Última atualização:** 28 de Janeiro de 2025
