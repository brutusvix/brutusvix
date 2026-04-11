# 🕐 Guia de Correção de Timezone - Brutus Lavajato

## 📋 Problema Identificado

O sistema estava usando `new Date().toISOString()` que retorna datas em UTC (Tempo Universal Coordenado). Quando são 21:03 no Brasil (UTC-3), já são 00:03 do dia seguinte em UTC, causando confusão nos lançamentos.

### Exemplo do Problema:
- Horário no Brasil: 21:03 do dia 10
- Horário em UTC: 00:03 do dia 11
- Sistema mostrava: "11 de abr. de 2026" ❌

## ✅ Solução Implementada

### 1. Script SQL para o Banco de Dados

Execute o arquivo `fix-timezone-database.sql` no SQL Editor do Supabase:

```bash
# Arquivo: fix-timezone-database.sql
```

Este script:
- ✅ Configura o timezone do banco para `America/Sao_Paulo`
- ✅ Cria funções auxiliares: `now_local()`, `today_local()`, `date_local()`
- ✅ Cria views com datas locais: `appointments_local`, `transactions_local`
- ✅ Adiciona índices para melhorar performance
- ✅ Cria função `is_business_hours()` para validar horário comercial

### 2. Utilitário TypeScript

Criado o arquivo `src/utils/timezone.ts` com funções para trabalhar com datas locais:

#### Funções Principais:

```typescript
import { nowLocal, nowLocalISO, todayLocal, dateLocal } from './src/utils/timezone.js';

// Obter data/hora atual no timezone local
const agora = nowLocal(); // Date object

// Obter data/hora em formato ISO para salvar no banco
const agoraISO = nowLocalISO(); // "2026-04-10T21:03:00.000Z" (ajustado)

// Obter apenas a data atual (YYYY-MM-DD)
const hoje = todayLocal(); // "2026-04-10"

// Converter timestamp UTC para data local
const dataLocal = dateLocal("2026-04-11T00:03:00Z"); // "2026-04-10"
```

### 3. Atualizações no Código

#### server.ts
```typescript
// ANTES ❌
const today = new Date().toISOString().split('T')[0];
start_time: new Date().toISOString()

// DEPOIS ✅
const today = todayLocal();
start_time: nowLocalISO()
```

#### logger.ts
```typescript
// ANTES ❌
timestamp: new Date().toISOString()

// DEPOIS ✅
timestamp: nowLocalISO()
```

#### whatsapp-service.ts
```typescript
// ANTES ❌
const currentHour = new Date().getHours();

// DEPOIS ✅
const currentHour = nowLocal().getHours();
```

## 🚀 Como Aplicar a Correção

### Passo 1: Executar Script SQL

1. Acesse o Supabase Dashboard
2. Vá em SQL Editor
3. Copie todo o conteúdo de `fix-timezone-database.sql`
4. Execute o script
5. Verifique se não há erros

### Passo 2: Testar as Funções SQL

Execute no SQL Editor:

```sql
-- Verificar timezone
SHOW timezone;

-- Testar funções
SELECT 
  NOW() as utc_now,
  now_local() as local_now,
  today_local() as local_today,
  is_business_hours() as is_business_hours;

-- Testar conversão
SELECT 
  NOW() as utc_time,
  to_local_time(NOW()) as local_time,
  date_local(NOW()) as local_date;
```

### Passo 3: Reiniciar o Servidor

```bash
# Parar o servidor atual
# Ctrl+C

# Reinstalar dependências (se necessário)
npm install

# Iniciar o servidor
npm run dev
```

### Passo 4: Testar no Frontend

1. Acesse o sistema
2. Tente criar um novo agendamento às 21:03
3. Verifique se a data mostrada é do dia atual (não do dia seguinte)
4. Confirme que "Data do Serviço" mostra a data correta

## 🧪 Testes de Validação

### Teste 1: Verificar Data Atual
```typescript
import { todayLocal, nowLocal } from './src/utils/timezone.js';

console.log('Data atual:', todayLocal()); // Deve mostrar data de hoje
console.log('Hora atual:', nowLocal().getHours()); // Deve mostrar hora local
```

### Teste 2: Verificar Horário Comercial
```typescript
import { isBusinessHours } from './src/utils/timezone.js';

console.log('Está no horário comercial?', isBusinessHours()); 
// true se entre 6h e 22h (horário local)
```

### Teste 3: Verificar Salvamento no Banco
```sql
-- Verificar appointments criados hoje
SELECT 
  id,
  start_time,
  date_local(start_time) as local_date,
  to_local_time(start_time) as local_time
FROM appointments
WHERE date_local(start_time) = today_local()
ORDER BY start_time DESC
LIMIT 10;
```

## 📊 Funções Disponíveis

### No Banco de Dados (SQL)

| Função | Descrição | Exemplo |
|--------|-----------|---------|
| `now_local()` | Data/hora atual no timezone local | `SELECT now_local();` |
| `today_local()` | Data atual (sem hora) | `SELECT today_local();` |
| `date_local(timestamp)` | Extrai data local de um timestamp | `SELECT date_local(start_time);` |
| `to_local_time(timestamp)` | Converte UTC para local | `SELECT to_local_time(NOW());` |
| `is_business_hours()` | Verifica horário comercial | `SELECT is_business_hours();` |
| `day_bounds_local(date)` | Início e fim do dia | `SELECT * FROM day_bounds_local();` |

### No Código TypeScript

| Função | Descrição | Retorno |
|--------|-----------|---------|
| `nowLocal()` | Data/hora atual local | `Date` |
| `nowLocalISO()` | Data/hora atual em ISO (ajustado) | `string` |
| `todayLocal()` | Data atual (YYYY-MM-DD) | `string` |
| `dateLocal(timestamp)` | Extrai data de timestamp | `string` |
| `toLocalTime(utcDate)` | Converte UTC para local | `Date` |
| `isBusinessHours()` | Verifica horário comercial | `boolean` |
| `formatLocalDate(date)` | Formata data (DD/MM/YYYY) | `string` |
| `getCurrentTimeInfo()` | Info completa do horário | `object` |

## 🔍 Verificação de Sucesso

Após aplicar todas as correções, verifique:

- [ ] Script SQL executado sem erros
- [ ] Servidor reiniciado com sucesso
- [ ] Data atual mostra corretamente no sistema
- [ ] Novos agendamentos salvam com data correta
- [ ] Dashboard mostra estatísticas do dia correto
- [ ] Horário comercial valida corretamente

## 🎯 Resultado Esperado

Agora quando o admin lançar carros às 21:03 do dia 10:
- ✅ Sistema mostra: "10 de abr. de 2026"
- ✅ Permite lançamentos retroativos
- ✅ Data do serviço: "10 de abr. de 2026"
- ✅ Estatísticas do dia corretas

## 📝 Notas Importantes

1. **Dados Antigos**: Registros criados antes da correção ainda estarão em UTC. Para converter:
   ```sql
   UPDATE appointments 
   SET start_time = to_local_time(start_time)
   WHERE date_local(start_time) != DATE(start_time);
   ```

2. **Backup**: Sempre faça backup antes de executar scripts SQL em produção.

3. **Testes**: Teste em ambiente de desenvolvimento primeiro.

4. **Monitoramento**: Monitore os logs após a implementação para garantir que tudo funciona.

## 🆘 Troubleshooting

### Erro: "timezone not found"
```sql
-- Listar timezones disponíveis
SELECT name FROM pg_timezone_names WHERE name LIKE '%Sao_Paulo%';

-- Usar alternativa
SET timezone TO 'America/Fortaleza'; -- Mesmo fuso
```

### Erro: "function does not exist"
- Verifique se o script SQL foi executado completamente
- Execute novamente apenas a parte das funções

### Datas ainda aparecem erradas
- Limpe o cache do navegador
- Reinicie o servidor
- Verifique se os imports estão corretos

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do servidor
2. Teste as funções SQL individualmente
3. Confirme que todos os arquivos foram atualizados
4. Verifique se não há erros de compilação TypeScript

---

**Última atualização**: 11/04/2026
**Versão**: 1.0.0
