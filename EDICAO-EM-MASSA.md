# 🚀 Edição em Massa - Data e Unidade

## ✨ Funcionalidades

Agora você pode editar em massa:
- 📅 **Data** de múltiplos agendamentos
- 🏢 **Unidade** de múltiplos agendamentos

## 🎯 Como usar

### Passo 1: Selecionar agendamentos
- Marque o checkbox ao lado de cada agendamento
- Ou clique em "Selecionar todos" para marcar todos do dia

### Passo 2: Escolher ação

Quando tem itens selecionados, aparecem 2 botões:

#### 📅 Editar Data (Azul)
- Muda a data de todos os selecionados
- Mantém os horários originais
- Útil para corrigir lançamentos com data errada

#### 🏢 Mudar Unidade (Roxo)
- Muda a unidade de todos os selecionados
- Útil para corrigir lançamentos na unidade errada

## 💡 Exemplos Práticos

### Exemplo 1: Corrigir 20 carros com data errada
**Problema:** 20 carros de ontem precisam ser movidos para hoje

**Solução:**
1. Vá na Agenda → Dia 10/04
2. Clique em "Selecionar todos"
3. Clique em "📅 Editar Data"
4. Escolha 11/04
5. Clique em "Mover Todos"
6. ✅ Pronto em 30 segundos!

### Exemplo 2: Corrigir 30 carros na unidade errada
**Problema:** 30 carros foram lançados na Un 01 mas são da Un 02

**Solução:**
1. Vá na Agenda → Dia de hoje
2. Filtre por "Un 01"
3. Clique em "Selecionar todos"
4. Clique em "🏢 Mudar Unidade"
5. Escolha "Un 02 - Mata da Praia"
6. Clique em "Mover Todos"
7. ✅ Pronto em 30 segundos!

### Exemplo 3: Mover alguns carros específicos
**Problema:** 5 carros específicos precisam mudar de unidade

**Solução:**
1. Marque apenas os 5 carros desejados
2. Clique em "🏢 Mudar Unidade"
3. Escolha a nova unidade
4. Clique em "Mover Todos"
5. ✅ Feito!

## 🎨 Interface

### Quando nada está selecionado:
- Checkboxes ao lado de cada agendamento
- Botão "Selecionar todos" no topo

### Quando tem itens selecionados:
- Agendamentos com borda azul brilhante
- 2 botões aparecem:
  - 📅 **Editar Data** (azul)
  - 🏢 **Mudar Unidade** (roxo)
- Contador: "X selecionados"
- Botão "Limpar seleção"

### Modal de Editar Data:
- Mostra quantidade selecionada
- Seletor de data
- Explica que horários são mantidos
- Exemplo visual

### Modal de Mudar Unidade:
- Mostra quantidade selecionada
- Dropdown com todas as unidades
- Dica de uso
- Confirmação

## ⚠️ Importante

### Editar Data:
- **Horários mantidos**: 21:30 de ontem → 21:30 da nova data
- **Apenas DONO** pode usar
- **Irreversível** (mas pode mover de volta)

### Mudar Unidade:
- **Afeta estatísticas**: Dashboard de cada unidade é recalculado
- **Apenas DONO** pode usar
- **Irreversível** (mas pode mover de volta)

## 📊 Comparação de Velocidade

| Tarefa | Um por um | Em massa |
|--------|-----------|----------|
| Mudar data de 20 carros | ~5 min | ~30 seg |
| Mudar unidade de 30 carros | ~7 min | ~30 seg |
| Mudar 5 carros específicos | ~2 min | ~20 seg |

## 🎉 Casos de Uso Reais

1. **Timezone bug**: Carros lançados ontem à noite → Mover para hoje
2. **Unidade errada**: Admin selecionou unidade errada → Corrigir em massa
3. **Reagendamento**: Cliente pediu para mudar dia → Mover todos
4. **Organização**: Distribuir carros entre unidades → Selecionar e mover

## 🔄 Combinações Possíveis

Você pode fazer as duas operações em sequência:
1. Selecionar carros
2. Mudar unidade
3. Selecionar os mesmos carros novamente
4. Mudar data

Ou vice-versa!

## 🚫 Limitações

- Não pode editar status em massa (por segurança)
- Não pode editar preço em massa (cada serviço é diferente)
- Não pode editar cliente em massa (não faz sentido)

---

**Dica:** Use "Selecionar todos" + botões de ação para máxima velocidade!
**Dica 2:** Os botões têm cores diferentes para não confundir: Azul = Data, Roxo = Unidade
