# 📋 Changelog - Alterações no Banco de Dados

## 28 de Janeiro de 2025

### ❌ Removido: Limite de Agendamentos Simultâneos

**Problema:**
- Sistema limitava a criação de agendamentos a 2 por unidade em períodos sobrepostos
- Erro: "Limite de 2 agendamentos simultâneos por unidade atingido"
- Impedia operação normal do lava-jato em horários de pico

**Solução:**
Removidos do banco de dados Supabase:

1. **Trigger:** `trg_check_concurrent`
   - Evento: INSERT e UPDATE na tabela `appointments`
   - Ação: Validava limite antes de criar/atualizar agendamento

2. **Função:** `fn_check_concurrent_appointments()`
   - Lógica: Contava agendamentos ativos com horários sobrepostos
   - Limite: Máximo 2 agendamentos simultâneos por unidade

**Comandos executados:**
```sql
-- Remover trigger
DROP TRIGGER IF EXISTS trg_check_concurrent ON appointments;

-- Remover função
DROP FUNCTION IF EXISTS fn_check_concurrent_appointments();
```

**Resultado:**
- ✅ Agendamentos ilimitados por unidade
- ✅ Sistema pode operar em alta demanda
- ✅ Sem restrições artificiais de capacidade

**Triggers restantes (importantes):**
- `trg_finalize_appointment` - Finaliza agendamentos e calcula comissões (mantido)

---

## Histórico de Alterações

### Triggers Ativos
| Trigger | Tabela | Evento | Função | Status |
|---------|--------|--------|--------|--------|
| `trg_finalize_appointment` | appointments | UPDATE | `fn_finalize_appointment()` | ✅ Ativo |

### Triggers Removidos
| Trigger | Tabela | Evento | Função | Data Remoção | Motivo |
|---------|--------|--------|--------|--------------|--------|
| `trg_check_concurrent` | appointments | INSERT, UPDATE | `fn_check_concurrent_appointments()` | 28/01/2025 | Limitava operação do sistema |

---

## ⚠️ Notas Importantes

1. **Capacidade Real:** Agora o limite de agendamentos depende apenas da capacidade física da unidade
2. **Gestão Manual:** Administradores devem gerenciar a capacidade através da interface
3. **Performance:** Sem impacto negativo - remoção de validação melhora performance
4. **Rollback:** Se necessário reverter, o código da função está documentado em `REMOVER-LIMITE-AGENDAMENTOS.md`

---

**Última atualização:** 28 de Janeiro de 2025
