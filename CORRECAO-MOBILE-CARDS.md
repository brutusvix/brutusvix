# Correção: Cards Cortados no Mobile

## Problema Identificado

Em páginas com cards contendo múltiplos badges e informações inline, os elementos estavam sendo cortados no mobile porque não quebravam linha.

## Páginas Corrigidas

### 1. Staff (Funcionários) ✅
**Problema**: Badges (LAVADOR, TIPO 01, SINCRONIZADO) e nome da unidade estavam todos na mesma linha, causando overflow e cortando texto no mobile.

**Antes**:
```tsx
<div className="flex items-center gap-2 mt-1">
  <span>LAVADOR</span>
  <span>TIPO 01</span>
  <span>SINCRONIZADO</span>
  <span>•</span>
  <span>Unidade 02 - Mata da Praia</span>
</div>
```

**Depois**:
```tsx
<div className="flex flex-wrap items-center gap-2 mt-2">
  <span>LAVADOR</span>
  <span>TIPO 01</span>
  <span>SINCRONIZADO</span>
</div>
<div className="mt-1 text-zinc-500 text-xs">
  Unidade 02 - Mata da Praia
</div>
```

**Mudanças**:
- Adicionado `flex-wrap` nos badges
- Separado nome da unidade em linha própria
- Adicionado `shrink-0` no ícone do avatar
- Removido separador "•"

### 2. ProductionPayroll (Produção e Pagamento) ✅
**Problema**: Badges (Lavador 01, Meta Batida) podiam quebrar o layout no mobile.

**Antes**:
```tsx
<div className="flex items-center gap-2 mt-1">
  <span>Lavador 01</span>
  <span>✓ Meta Batida</span>
</div>
```

**Depois**:
```tsx
<div className="flex flex-wrap items-center gap-2 mt-2">
  <span>Lavador 01</span>
  <span>✓ Meta Batida</span>
</div>
```

**Mudanças**:
- Adicionado `flex-wrap` nos badges
- Adicionado `flex-1 min-w-0` no container de informações
- Adicionado `shrink-0` no contador de carros
- Adicionado `gap-4` para melhor espaçamento

## Páginas Verificadas (Já Estavam OK)

### ✅ Agenda
- Já tinha `flex-wrap` nos elementos críticos
- Nome do cliente e status em linha com quebra
- Hora e telefone em linha separada com quebra

### ✅ Settings (Unidades)
- Layout bem distribuído
- Botão de status (Aberta/Fechada) separado
- Endereço e telefone em linhas próprias

### ✅ Clients
- Tabela com scroll horizontal controlado (`overflow-x-auto`)
- Veículos com `flex-wrap` e `max-w-[200px]`

### ✅ Loyalty
- Cards de estatísticas simples
- Tabela com scroll horizontal controlado

### ✅ Finance
- Tabela com scroll horizontal controlado
- Badges de tipo (Entrada/Saída) em células próprias

## Padrão de Correção Aplicado

### Problema Comum:
```tsx
// ❌ Elementos inline sem flex-wrap
<div className="flex items-center gap-2">
  <Badge1 />
  <Badge2 />
  <Badge3 />
  <LongText />
</div>
```

### Solução:
```tsx
// ✅ Com flex-wrap e separação de elementos longos
<div className="flex flex-wrap items-center gap-2">
  <Badge1 />
  <Badge2 />
  <Badge3 />
</div>
<div className="mt-1">
  <LongText />
</div>
```

## Classes Tailwind Usadas

- `flex-wrap` - Permite quebra de linha quando necessário
- `flex-1 min-w-0` - Permite que o container encolha e quebre texto
- `shrink-0` - Impede que elementos (ícones, contadores) encolham
- `gap-2` - Espaçamento menor entre badges
- `mt-1` ou `mt-2` - Margem superior para separar linhas
- `truncate` - Corta texto longo com "..."

## Estrutura Recomendada para Cards

```tsx
<div className="card">
  {/* Header */}
  <div className="flex items-start gap-4">
    <Icon className="shrink-0" />
    <div className="flex-1 min-w-0">
      <h3 className="truncate">Nome</h3>
      
      {/* Badges com quebra */}
      <div className="flex flex-wrap items-center gap-2 mt-2">
        <Badge1 />
        <Badge2 />
        <Badge3 />
      </div>
      
      {/* Informações longas em linha separada */}
      <div className="mt-1 text-sm text-zinc-500">
        Informação longa que pode quebrar
      </div>
    </div>
    
    {/* Elemento fixo à direita */}
    <div className="shrink-0">
      Contador ou ação
    </div>
  </div>
  
  {/* Conteúdo do card */}
  <div className="space-y-2">
    ...
  </div>
</div>
```

## Teste de Validação

Para validar as correções, teste em:

1. **iPhone SE (375px)**
   - [ ] Staff: Todos os badges visíveis, unidade em linha separada
   - [ ] ProductionPayroll: Badges quebram linha se necessário

2. **iPhone 12/13 (390px)**
   - [ ] Badges não cortados
   - [ ] Texto não sobrepõe outros elementos

3. **Samsung Galaxy S20 (360px)**
   - [ ] Layout não quebra
   - [ ] Todos os elementos visíveis

## Resultado

✅ Badges agora quebram linha no mobile quando necessário
✅ Informações longas (unidade, endereço) em linhas separadas
✅ Ícones e contadores não encolhem (`shrink-0`)
✅ Layout responsivo sem overflow horizontal
✅ Melhor legibilidade em telas pequenas
