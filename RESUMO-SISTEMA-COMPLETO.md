# 🚗 Sistema Brutus Lavajato - Resumo Completo

## 📋 O que é o Sistema?

Sistema completo de gestão para lava-rápidos com funcionalidades de:
- Agendamento de serviços
- Check-in de clientes
- Reconhecimento automático de placas via IA
- Gestão de clientes e veículos
- Controle financeiro
- Sistema de fidelidade
- **Mensagens em massa via WhatsApp**
- Controle de produção e comissões

---

## 🎯 Principais Funcionalidades

### 1. 🚗 Reconhecimento Automático de Placas
**O que faz:**
- Cliente chega no lava-rápido
- Funcionário tira foto da placa
- Sistema detecta automaticamente:
  - Placa do veículo
  - Tipo de veículo (Sedan, SUV, etc)
- Preenche automaticamente no check-in

**Tecnologia:**
- PlateRecognizer API (2.500 detecções/mês grátis)
- Precisão: ~95%

### 2. 📱 Mensagens em Massa via WhatsApp
**O que faz:**
- Enviar mensagens para todos os clientes
- Avisar sobre fechamento por chuva
- Informar promoções
- Notificar sobre unidades abertas
- Personalização com nome do cliente

**Tecnologia:**
- Baileys (biblioteca WhatsApp não oficial)
- Servidor separado no Render
- Controles: pausar, retomar, parar
- Limite configurável: 100-200 msg/dia

### 3. 👥 Gestão de Clientes
**O que faz:**
- Cadastro de clientes
- Histórico de serviços
- Pontos de fidelidade
- Veículos cadastrados
- Total gasto

### 4. 💰 Controle Financeiro
**O que faz:**
- Receitas e despesas
- Comissões de funcionários
- Relatórios por período
- Controle por unidade

### 5. 🏆 Sistema de Fidelidade
**O que faz:**
- A cada 10 lavagens = 1 grátis
- Acúmulo automático de pontos
- Notificação via WhatsApp quando atingir 10 pontos

---

## 🏗️ Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    USUÁRIOS                              │
│  (Navegador Web - Desktop/Mobile)                       │
└────────────────┬────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────┐
│              VERCEL (Frontend)                           │
│  • Interface React                                       │
│  • Dashboard, Check-in, Clientes, etc                   │
│  • URL: https://brutusvix.vercel.app                    │
└────────┬────────────────────────────┬────────────────────┘
         │                            │
         ▼                            ▼
┌──────────────────┐        ┌──────────────────────────┐
│  SUPABASE        │        │  RENDER                  │
│  (Banco de Dados)│        │  (WhatsApp API)          │
│  • PostgreSQL    │        │  • Baileys               │
│  • Auth          │        │  • Socket.io             │
│  • Realtime      │        │  • Fila de mensagens     │
└──────────────────┘        └──────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│              APIs EXTERNAS                                │
│  • PlateRecognizer (detecção de placas)                 │
└──────────────────────────────────────────────────────────┘
```

---

## 🔑 Pontos Cruciais para Funcionamento

### 1. ⚙️ Variáveis de Ambiente

#### **Vercel (Frontend)**
```env
# Supabase
VITE_SUPABASE_URL=https://yfhiqhupuhrhsrzyqjli.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon

# PlateRecognizer
PLATE_RECOGNIZER_API_KEY=458b6823addeef83f7bd27dd39af4a7c2a3161ec

# WhatsApp API (Render)
VITE_WHATSAPP_API_URL=https://brutusvix.onrender.com

# JWT
JWT_SECRET=sua_chave_secreta

# Supabase Service (Backend)
SUPABASE_SERVICE_KEY=sua_chave_service
SUPABASE_URL=https://yfhiqhupuhrhsrzyqjli.supabase.co
```

#### **Render (WhatsApp API)**
```env
# Nenhuma variável necessária!
# O Render define PORT automaticamente
```

### 2. 🗄️ Banco de Dados (Supabase)

**Tabelas principais:**
- `users` - Usuários do sistema (DONO, LAVADOR)
- `clients` - Clientes do lava-rápido
- `vehicles` - Veículos dos clientes
- `appointments` - Agendamentos/Check-ins
- `services` - Serviços oferecidos
- `transactions` - Movimentações financeiras
- `production_records` - Produção dos funcionários
- `units` - Unidades do lava-rápido

**Recursos usados:**
- ✅ PostgreSQL (banco de dados)
- ✅ Auth (autenticação JWT)
- ✅ Realtime (atualizações em tempo real)
- ✅ Row Level Security (segurança)

### 3. 🔐 Autenticação

**Como funciona:**
1. Usuário faz login com email/senha
2. Supabase gera token JWT (válido por 1 hora)
3. Token é renovado automaticamente (função `getValidToken()`)
4. Sem mais erros 403!

**Roles:**
- **DONO**: Acesso total (dashboard, clientes, financeiro, mensagens, etc)
- **LAVADOR**: Acesso limitado (check-in, agenda, minha produção)

### 4. 📸 Reconhecimento de Placas

**Fluxo:**
1. Usuário tira foto da placa
2. Foto é enviada para PlateRecognizer API
3. API retorna:
   - Placa detectada
   - Tipo de veículo
   - Confiança da detecção
4. Sistema preenche automaticamente

**Limites:**
- ✅ 2.500 requisições/mês (grátis)
- ⚠️ Após isso: $0.005 por requisição

**Chave API:**
```
458b6823addeef83f7bd27dd39af4a7c2a3161ec
```

### 5. 📱 WhatsApp (Baileys)

**Arquitetura:**
- **Frontend (Vercel)**: Interface de mensagens
- **Backend (Render)**: Servidor WhatsApp + Baileys

**Como funciona:**
1. Admin clica em "Conectar WhatsApp"
2. Frontend chama: `https://brutusvix.onrender.com/api/whatsapp/connect`
3. Render inicializa Baileys
4. QR Code é gerado
5. Admin escaneia com WhatsApp
6. Conexão estabelecida
7. Mensagens são enviadas via fila

**Limitações do Render Free:**
- ⚠️ Serviço "dorme" após 15 min de inatividade
- ⚠️ Primeira requisição demora ~30s (acordar)
- ⚠️ Reinicia a cada 24h (WhatsApp desconecta)

**Solução:**
- Usar cron-job.org para fazer ping a cada 10 min
- URL: `https://brutusvix.onrender.com/health`

### 6. 🔄 Realtime (Supabase)

**O que faz:**
- Atualiza dados automaticamente sem recarregar página
- Quando um cliente é cadastrado, aparece na lista imediatamente
- Quando um agendamento é criado, aparece na agenda

**Como funciona:**
- Supabase envia eventos via WebSocket
- Frontend escuta eventos e atualiza estado
- Implementado no `DataContext.tsx`

---

## 🚀 Deploy e Hospedagem

### **Frontend (Vercel)**
- **URL**: https://brutusvix.vercel.app
- **Custo**: R$ 0,00/mês (grátis)
- **Deploy**: Automático via GitHub
- **Recursos**: 
  - 100 GB bandwidth/mês
  - Builds ilimitados
  - SSL automático

### **Backend WhatsApp (Render)**
- **URL**: https://brutusvix.onrender.com
- **Custo**: R$ 0,00/mês (grátis)
- **Deploy**: Automático via GitHub
- **Recursos**:
  - 750 horas/mês (suficiente para 1 serviço 24/7)
  - 512 MB RAM
  - SSL automático

### **Banco de Dados (Supabase)**
- **Custo**: R$ 0,00/mês (grátis)
- **Recursos**:
  - 500 MB storage
  - 2 GB bandwidth/mês
  - Realtime ilimitado

### **PlateRecognizer**
- **Custo**: R$ 0,00/mês (grátis até 2.500 req)
- **Após limite**: $0.005/requisição

---

## ⚠️ Pontos de Atenção

### 1. WhatsApp
- ⚠️ **USE NÚMERO SECUNDÁRIO** - Risco de banimento
- ⚠️ **Limite**: 100-200 mensagens/dia
- ⚠️ **Intervalo**: Mínimo 10 segundos entre mensagens
- ⚠️ **Horário**: Respeite 8h-22h
- ⚠️ **Render Free**: Serviço dorme após 15 min

### 2. PlateRecognizer
- 📸 **Fotos claras**: Boa iluminação, placa visível
- 💰 **Limite**: 2.500/mês grátis
- ⚠️ **Após limite**: Cobra por requisição

### 3. Token JWT
- ✅ **Renovação automática**: Implementada
- ⏰ **Validade**: 1 hora
- 🔄 **Função**: `getValidToken()` renova automaticamente

### 4. Render Free
- 😴 **Sleep**: Após 15 min inativo
- ⏰ **Acordar**: ~30 segundos
- 🔄 **Reinício**: A cada 24h
- 💡 **Solução**: Ping a cada 10 min (cron-job.org)

---

## 📊 Fluxo de Uso Típico

### Manhã (Abertura)
1. Funcionário faz login
2. Sistema verifica WhatsApp conectado
3. Se desconectado, reconecta via QR Code

### Durante o Dia
1. Cliente chega
2. Funcionário faz check-in:
   - Tira foto da placa
   - Sistema detecta automaticamente
   - Confirma tipo de veículo
   - Seleciona serviço
   - Finaliza check-in
3. Cliente aguarda na fila
4. Lavador inicia serviço
5. Lavador finaliza serviço
6. Sistema:
   - Registra produção
   - Calcula comissão
   - Adiciona pontos de fidelidade
   - Registra transação financeira

### Envio de Mensagens (Quando Necessário)
1. Admin acessa "Mensagens"
2. Verifica WhatsApp conectado
3. Escolhe mensagem (ex: "Fechado por chuva")
4. Seleciona destinatários
5. Configura intervalo (10-15s)
6. Inicia envio
7. Monitora progresso
8. Aguarda conclusão

### Fim do Dia
1. Revisar estatísticas
2. Verificar mensagens enviadas
3. Conferir produção dos funcionários

---

## 🔧 Manutenção

### Diária
- ✅ Verificar WhatsApp conectado
- ✅ Monitorar envio de mensagens

### Semanal
- ✅ Revisar logs de erro
- ✅ Verificar uso de créditos PlateRecognizer
- ✅ Conferir relatórios financeiros

### Mensal
- ✅ Backup do banco de dados (Supabase faz automático)
- ✅ Revisar limite de mensagens WhatsApp
- ✅ Verificar uso de recursos (Vercel, Render, Supabase)

---

## 📞 Suporte e Troubleshooting

### WhatsApp não conecta
1. Delete pasta `auth_info_baileys` no Render
2. Faça redeploy
3. Tente conectar novamente

### Placa não detecta
1. Tire foto mais clara
2. Verifique iluminação
3. Certifique-se que placa está visível
4. Verifique créditos PlateRecognizer

### Erro 403 (Token expirado)
- ✅ Já corrigido! Renovação automática
- Se persistir: Logout e login novamente

### Render "dormindo"
- Configure cron-job.org para ping a cada 10 min
- URL: `https://brutusvix.onrender.com/health`

---

## 💰 Custos Totais

### Atual (Tudo Gratuito)
- **Vercel**: R$ 0,00/mês
- **Render**: R$ 0,00/mês
- **Supabase**: R$ 0,00/mês
- **PlateRecognizer**: R$ 0,00/mês (até 2.500 req)
- **TOTAL**: R$ 0,00/mês ✅

### Se Crescer (Opcional)
- **Render Paid**: $7/mês (~R$ 35/mês) - Sem sleep
- **PlateRecognizer**: $0.005/req após 2.500
- **Supabase Pro**: $25/mês (~R$ 125/mês) - Mais recursos

---

## ✅ Checklist de Funcionamento

Para o sistema funcionar 100%, você precisa:

- [ ] Vercel configurada com variáveis de ambiente
- [ ] Render rodando servidor WhatsApp
- [ ] Supabase com banco de dados ativo
- [ ] PlateRecognizer API key válida
- [ ] WhatsApp conectado via QR Code
- [ ] Cron-job.org fazendo ping (opcional, mas recomendado)

---

## 🎉 Sistema Pronto!

Tudo está funcionando:
- ✅ Frontend na Vercel
- ✅ WhatsApp API no Render
- ✅ Banco de dados no Supabase
- ✅ Reconhecimento de placas
- ✅ Mensagens em massa
- ✅ Gestão completa

**Custo total: R$ 0,00/mês** 🎊
