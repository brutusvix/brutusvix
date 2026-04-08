# Guia de Uso - Script de Seed Data

## 📋 Arquivo: `seed-data-06-04-2026.sql`

Este script popula o banco de dados com dados de exemplo baseados no fluxo real de atendimento do dia 06/04/2026.

## 🎯 O que o Script Faz

### 1. Cria Serviços
- Lavagem Simples L
- Lavagem Completa L+A
- Lavagem Premium L+A+C+R
- Lavagem com Extras

### 2. Cria 15 Clientes
- ROSTOU, JACQUES, JOBSON, FELIPE, VIUSO
- THIAGO, DICHVADO/POSTO S.O.S, GABRIEL
- BOSTOSAUDE, BRUNO PACHETTI, ISAIAS
- MOTO & GENRE, CLIENTE L200, CLIENTE ETIOS, DENIS

### 3. Cria 16 Veículos
- Harley Davidson, Volvo, Gol, Peugeot 208, Creta
- Toro, Estrada, Onix, Kicks, BMW X3
- Peugeot, Moto, L200, Etios, Prisma, Argo

### 4. Cria 16 Agendamentos (06/04/2026)
- Todos com status FINALIZADO
- Horários distribuídos ao longo do dia
- Valores conforme tabela original

### 5. Cria 16 Transações
- Total: R$ 1.990,00
- PIX: 12 transações
- Cartão Crédito: 2 transações
- Dinheiro: 3 transações

## 🚀 Como Executar

### Passo 1: Acessar Supabase
1. Acesse seu projeto no Supabase
2. Vá em "SQL Editor"

### Passo 2: Verificar Unidade
Antes de executar, verifique se você tem uma unidade criada:

```sql
SELECT id, name FROM units WHERE deleted_at IS NULL;
```

Se não tiver, crie uma:

```sql
INSERT INTO units (name, address, phone, is_open, operating_hours)
VALUES (
  'Unidade 01',
  'Endereço da Unidade',
  '(27) 99999-9999',
  true,
  '[
    {"day":"Segunda-feira","open":"08:00","close":"18:00","isOpen":true},
    {"day":"Terça-feira","open":"08:00","close":"18:00","isOpen":true},
    {"day":"Quarta-feira","open":"08:00","close":"18:00","isOpen":true},
    {"day":"Quinta-feira","open":"08:00","close":"18:00","isOpen":true},
    {"day":"Sexta-feira","open":"08:00","close":"18:00","isOpen":true},
    {"day":"Sábado","open":"08:00","close":"14:00","isOpen":true},
    {"day":"Domingo","open":"08:00","close":"12:00","isOpen":false}
  ]'::jsonb
);
```

### Passo 3: Executar o Script
1. Copie todo o conteúdo do arquivo `seed-data-06-04-2026.sql`
2. Cole no SQL Editor do Supabase
3. Clique em "Run" ou pressione Ctrl+Enter

### Passo 4: Verificar Resultados

```sql
-- Verificar clientes criados
SELECT COUNT(*) as total_clientes FROM clients;

-- Verificar agendamentos
SELECT COUNT(*) as total_agendamentos FROM appointments WHERE DATE(start_time) = '2026-04-06';

-- Verificar transações
SELECT 
  payment_method,
  COUNT(*) as quantidade,
  SUM(amount) as total
FROM transactions
WHERE DATE(date) = '2026-04-06'
GROUP BY payment_method;

-- Total do dia
SELECT SUM(amount) as total_dia FROM transactions WHERE DATE(date) = '2026-04-06';
```

## 📊 Dados Inseridos

### Resumo Financeiro
| Forma de Pagamento | Quantidade | Total |
|-------------------|------------|-------|
| PIX | 12 | R$ 1.280,00 |
| Cartão Crédito | 2 | R$ 160,00 |
| Dinheiro | 3 | R$ 640,00 |
| **TOTAL** | **16** | **R$ 1.990,00** |

### Distribuição por Serviço
| Serviço | Quantidade | Valor Médio |
|---------|------------|-------------|
| Lavagem Simples L | 2 | R$ 80,00 |
| Lavagem Completa L+A | 11 | R$ 73,64 |
| Lavagem Premium L+A+C+R | 3 | R$ 106,67 |

### Distribuição por Tipo de Veículo
| Tipo | Quantidade |
|------|------------|
| HATCH | 7 |
| SEDAN | 3 |
| SUV | 3 |
| CAMINHONETE | 2 |
| MOTO | 2 |

## ⚠️ Observações Importantes

### 1. Conflitos
O script usa `ON CONFLICT DO NOTHING` para evitar duplicatas. Se você executar múltiplas vezes, não criará registros duplicados.

### 2. Datas
Todos os agendamentos e transações são criados para a data **06/04/2026**. Se quiser mudar a data, faça um find/replace no arquivo:
- Buscar: `2026-04-06`
- Substituir: `YYYY-MM-DD` (sua data desejada)

### 3. Unidade
O script busca a primeira unidade disponível. Se você tem múltiplas unidades e quer especificar uma, modifique as queries:

```sql
-- De:
SELECT id INTO v_unit_id FROM units WHERE name ILIKE '%unidade%' OR name ILIKE '%01%' LIMIT 1;

-- Para:
SELECT id INTO v_unit_id FROM units WHERE id = 'SEU_UUID_AQUI';
```

### 4. Horários
Os horários estão distribuídos ao longo do dia (08:00 às 19:00). Ajuste conforme necessário.

## 🔄 Limpar Dados de Teste

Se quiser remover os dados inseridos:

```sql
-- CUIDADO! Isso remove TODOS os dados do dia 06/04/2026
DELETE FROM transactions WHERE DATE(date) = '2026-04-06';
DELETE FROM appointments WHERE DATE(start_time) = '2026-04-06';

-- Ou remover clientes específicos (isso remove tudo relacionado)
DELETE FROM clients WHERE name IN (
  'ROSTOU', 'JACQUES', 'JOBSON', 'FELIPE', 'VIUSO',
  'THIAGO', 'DICHVADO / POSTO S.O.S', 'GABRIEL',
  'BOSTOSAUDE', 'BRUNO PACHETTI', 'ISAIAS',
  'MOTO & GENRE', 'CLIENTE L200', 'CLIENTE ETIOS', 'DENIS'
);
```

## 🎨 Personalização

### Adicionar Mais Dias
Para criar dados para outros dias, copie o script e modifique:
1. Data dos agendamentos
2. Data das transações
3. Horários dos atendimentos

### Adicionar Mais Clientes
Copie o bloco de INSERT de clientes e modifique:
- Nome
- Telefone
- Modelo do veículo

### Modificar Valores
Ajuste os valores nas transações conforme sua tabela de preços.

## 📞 Suporte

Se encontrar erros ao executar o script:

1. **Erro de UUID:** Verifique se a unidade existe
2. **Erro de FK:** Verifique se os serviços foram criados
3. **Erro de data:** Ajuste o formato de data para seu timezone

## ✅ Checklist de Execução

- [ ] Unidade criada no banco
- [ ] Script copiado completamente
- [ ] Executado no SQL Editor
- [ ] Verificado total de clientes (15)
- [ ] Verificado total de agendamentos (16)
- [ ] Verificado total de transações (16)
- [ ] Verificado total financeiro (R$ 1.990,00)
- [ ] Cache limpo (sessionStorage.clear() no console do navegador)
- [ ] Página recarregada (F5)

Pronto! Seus dados de exemplo estão no sistema! 🎉
