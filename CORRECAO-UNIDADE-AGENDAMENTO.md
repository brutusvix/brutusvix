# Correção: Problema de Unidade em Agendamentos

## Problema Identificado

1. **Check-in Rápido**: Quando o dono selecionava Unidade 2 ou 3, o agendamento era criado sempre na Unidade 1
2. **Edição em Massa na Agenda**: Quando o dono atualizava a unidade de vários agendamentos, ao recarregar a página voltava para Unidade 1

## Causa Raiz

### 1. Check-in não respeitava o filtro de unidade selecionado
**Arquivo**: `src/pages/CheckIn.tsx` (linha 249)

**Antes**:
```typescript
unit_id: user?.unit_id || (units[0]?.id as any) || '',
```

**Problema**: Sempre usava a unidade do usuário logado ou a primeira unidade, ignorando o filtro `selectedUnitFilter`

**Depois**:
```typescript
unit_id: selectedUnitFilter !== 'all' ? selectedUnitFilter : (user?.unit_id || (units[0]?.id as any) || ''),
```

**Solução**: Agora prioriza a unidade selecionada no filtro, depois a unidade do usuário, e por último a primeira unidade

### 2. updateAppointment não salvava unit_id no banco
**Arquivo**: `src/DataContext.tsx` (função updateAppointment)

**Antes**:
```typescript
const updateData: any = {};
if (fields.status !== undefined)       updateData.status = fields.status;
if (fields.washer_id !== undefined)    updateData.washer_id = fields.washer_id;
if (fields.end_time !== undefined)     updateData.end_time = fields.end_time;
// ... outros campos, mas SEM unit_id
```

**Problema**: Quando a agenda chamava `updateAppointment(appt.id, { unit_id: u.id })`, o campo `unit_id` era ignorado e não era salvo no banco de dados

**Depois**:
```typescript
const updateData: any = {};
if (fields.status !== undefined)       updateData.status = fields.status;
if (fields.washer_id !== undefined)    updateData.washer_id = fields.washer_id;
if (fields.unit_id !== undefined)      updateData.unit_id = fields.unit_id;  // ✅ ADICIONADO
if (fields.start_time !== undefined)   updateData.start_time = fields.start_time;  // ✅ ADICIONADO (para edição de data)
if (fields.end_time !== undefined)     updateData.end_time = fields.end_time;
// ... outros campos
```

**Solução**: Agora `unit_id` e `start_time` são incluídos no `updateData` e salvos corretamente no Supabase

## Arquivos Modificados

1. `src/pages/CheckIn.tsx` - Corrigido para usar `selectedUnitFilter` ao criar agendamento
2. `src/DataContext.tsx` - Adicionado `unit_id` e `start_time` na função `updateAppointment`

## Teste de Validação

### Cenário 1: Check-in com unidade específica
1. Login como DONO
2. Selecionar "Unidade 2" no filtro
3. Fazer check-in de um veículo
4. Verificar na agenda que o agendamento está na Unidade 2

### Cenário 2: Edição em massa de unidade
1. Login como DONO
2. Selecionar múltiplos agendamentos na agenda
3. Usar "Editar em Massa" para mudar para Unidade 3
4. Recarregar a página (F5)
5. Verificar que os agendamentos continuam na Unidade 3

## Status
✅ Corrigido e testado
