# 📚 Guia Completo do Sistema Brutus Lavajato

## ✅ Funcionalidades Implementadas e Corrigidas

### 🚗 1. Reconhecimento Automático de Placas (Check-in)
- ✅ Detecção automática de placas via PlateRecognizer API
- ✅ Detecção automática do tipo de veículo
- ✅ Campos removidos: Marca, Modelo e Cor (simplificado)
- ✅ Renovação automática de token JWT (sem erro 403)
- ✅ Mensagem de sucesso visual ao detectar placa

**Como usar:**
1. Acesse a seção "Check-in" no menu
2. Tire uma foto da placa do veículo
3. O sistema detecta automaticamente a placa e tipo
4. Preencha manualmente apenas o tipo de veículo (se necessário)
5. Clique em "Próximo Passo"

---

### 📱 2. Sistema de Mensagens em Massa via WhatsApp
- ✅ Conexão via QR Code usando Baileys
- ✅ Interface visual completa dentro do sistema
- ✅ Mensagens pré-prontas (Fechado por chuva, Unidades abertas, Promoção)
- ✅ Mensagem personalizada
- ✅ Variável `{nome}` para personalização
- ✅ Seleção de destinatários (individual ou todos)
- ✅ Configurações ajustáveis:
  - Intervalo entre mensagens: 5-30 segundos (padrão: 10s)
  - Limite diário: 50-300 mensagens (padrão: 100)
  - Horário permitido: configurável (padrão: 8h-22h)
- ✅ Controles: Pausar, Retomar, Parar
- ✅ Progresso em tempo real
- ✅ Contador de enviadas/falhas
- ✅ Apenas para administradores (DONO)

**Como usar:**
1. Acesse a seção "Mensagens" no menu (apenas DONO)
2. Clique em "Conectar WhatsApp"
3. Escaneie o QR Code com seu WhatsApp
4. Aguarde a conexão (status ficará verde)
5. Configure intervalo, limite e horário
6. Escolha uma mensagem pré-pronta ou escreva uma personalizada
7. Selecione os destinatários
8. Clique em "Iniciar Envio"
9. Acompanhe o progresso em tempo real

---

### 👥 3. Cadastro de Clientes
- ✅ Modal de novo cliente funcionando corretamente
- ✅ Salvamento no banco de dados
- ✅ Atualização em tempo real (Realtime do Supabase)
- ✅ Lista de clientes aparece automaticamente nas mensagens

**Como usar:**
1. Acesse a seção "Clientes" no menu
2. Clique em "Novo Cliente"
3. Preencha nome e telefone
4. Clique em "Salvar"
5. Cliente aparece imediatamente na lista
6. Cliente também aparece na lista de destinatários do WhatsApp

---

### 🔐 4. Autenticação e Segurança
- ✅ Renovação automática de token JWT
- ✅ Sem mais erros 403 (token expirado)
- ✅ Rate limiting otimizado (200 req/15min)
- ✅ Validação de permissões (DONO vs LAVADOR)

---

## 🚀 Como Iniciar o Sistema

### Pré-requisitos
- Node.js v17 ou superior (você tem v24 ✅)
- Conta no Supabase configurada
- Chave API do PlateRecognizer

### Passo 1: Instalar Dependências
```bash
npm install
```

### Passo 2: Configurar Variáveis de Ambiente
Copie `.env.example` para `.env` e preencha:

```env
# Supabase
SUPABASE_URL=https://yfhiqhupuhrhsrzyqjli.supabase.co
VITE_SUPABASE_URL=https://yfhiqhupuhrhsrzyqjli.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_KEY=sua_chave_service

# PlateRecognizer
PLATE_RECOGNIZER_API_KEY=458b6823addeef83f7bd27dd39af4a7c2a3161ec

# JWT
JWT_SECRET=sua_chave_secreta_jwt

# App
APP_URL=http://localhost:3000
```

### Passo 3: Iniciar o Servidor
```bash
npm run dev
```

O servidor estará rodando em: **http://localhost:3000**

---

## 📖 Guia de Uso Passo a Passo

### 1️⃣ Login
1. Acesse `http://localhost:3000`
2. Faça login com suas credenciais de DONO
3. Você será redirecionado para o Dashboard

### 2️⃣ Cadastrar Clientes
1. Vá em "Clientes" no menu lateral
2. Clique em "Novo Cliente"
3. Preencha:
   - Nome: Nome completo do cliente
   - Telefone: (27) 99999-9999
4. Clique em "Salvar"
5. Cliente aparece na lista imediatamente

### 3️⃣ Fazer Check-in com Reconhecimento de Placa
1. Vá em "Check-in" no menu lateral
2. Preencha os dados do cliente (ou selecione existente)
3. Clique em "Tirar Foto da Placa"
4. Tire uma foto clara da placa
5. Aguarde a detecção automática (2-3 segundos)
6. Veja a mensagem: "✅ Placa detectada com sucesso!"
7. Confirme o tipo de veículo detectado
8. Clique em "Próximo Passo"

### 4️⃣ Enviar Mensagens em Massa via WhatsApp

#### Primeira Vez (Conectar WhatsApp)
1. Vá em "Mensagens" no menu lateral
2. Clique em "Conectar WhatsApp"
3. Aguarde 10-15 segundos
4. Um QR Code aparecerá na tela
5. Abra o WhatsApp no celular
6. Vá em: Menu → Dispositivos Conectados → Conectar Dispositivo
7. Escaneie o QR Code
8. Aguarde a mensagem "Conectado" (bolinha verde)

#### Configurar (Recomendado)
1. Ajuste o "Intervalo entre mensagens": 10-15 segundos
2. Defina o "Limite diário": 100-200 mensagens
3. Configure o "Horário permitido": 8h às 22h
4. Clique em "Salvar Configurações"

#### Enviar Mensagens
1. Escolha uma mensagem pré-pronta:
   - 🌧️ Fechado por Chuva
   - ✅ Todas Unidades Abertas
   - 🎉 Promoção Especial
   - ✍️ Mensagem Personalizada

2. Se escolher "Personalizada", escreva sua mensagem
   - Use `{nome}` para personalizar com o nome do cliente
   - Exemplo: "Olá {nome}! Temos uma promoção especial hoje!"

3. Selecione os destinatários:
   - Clique em cada cliente individualmente
   - Ou clique em "Selecionar Todos"

4. Clique em "Iniciar Envio para X cliente(s)"

5. Acompanhe o progresso:
   - Barra de progresso
   - Contador de enviadas/falhas
   - Tempo estimado

6. Controles durante o envio:
   - "Pausar": Para temporariamente
   - "Retomar": Continua de onde parou
   - "Parar": Cancela tudo (limpa fila)

---

## ⚠️ Avisos Importantes

### ⚠️ CRÍTICO: WhatsApp NÃO FUNCIONA NA VERCEL
- ❌ **Vercel não suporta Baileys** - Funções serverless não mantêm WebSocket persistente
- ✅ **Funciona apenas localmente** - Use `npm run dev` no seu computador
- ✅ **Alternativas para produção**:
  - Railway (gratuito com limites)
  - Render (gratuito com limites)
  - VPS (DigitalOcean, AWS EC2)
- 💡 **Solução temporária**: Rode o sistema localmente para usar WhatsApp

### WhatsApp
- ⚠️ **USE UM NÚMERO SECUNDÁRIO** - Nunca use seu número pessoal ou comercial principal
- ⚠️ **Risco de banimento** - Envio em massa pode resultar em banimento da conta
- ⚠️ **Limites recomendados**:
  - Intervalo mínimo: 10 segundos
  - Máximo diário: 100-200 mensagens
  - Horário: 8h-22h (respeite o descanso)
- ⚠️ **Boas práticas**:
  - Envie apenas para clientes que autorizaram
  - Evite spam
  - Personalize as mensagens
  - Não envie todos os dias

### PlateRecognizer
- 📸 **Tire fotos claras** - Placa deve estar visível e legível
- 📸 **Boa iluminação** - Evite fotos escuras ou com reflexo
- 📸 **Distância adequada** - Nem muito perto, nem muito longe
- 💰 **Limite gratuito**: 2.500 requisições/mês

---

## 🔧 Solução de Problemas

### QR Code não aparece
**Problema**: Clico em "Conectar WhatsApp" mas o QR Code não aparece

**Solução**:
1. Verifique se o servidor está rodando
2. Aguarde 15-20 segundos (pode demorar)
3. Se não aparecer, delete a pasta `auth_info_baileys`:
   ```bash
   rm -rf auth_info_baileys
   ```
4. Reinicie o servidor:
   ```bash
   npm run dev
   ```
5. Tente conectar novamente

### Erro 403 (Token Expirado)
**Problema**: Erro 403 ao fazer requisições

**Solução**:
- ✅ Já corrigido! O sistema renova automaticamente o token
- Se persistir, faça logout e login novamente

### Erro 429 (Rate Limit)
**Problema**: "Muitas requisições. Aguarde 15 minutos"

**Solução**:
- Aguarde 15 minutos
- O limite é de 200 requisições por 15 minutos
- Evite recarregar a página repetidamente

### Cliente não aparece na lista
**Problema**: Cadastrei um cliente mas não aparece

**Solução**:
1. Aguarde 2-3 segundos (Realtime pode demorar)
2. Recarregue a página (F5)
3. Verifique se salvou corretamente (deve aparecer mensagem de sucesso)

### Placa não detectada
**Problema**: "Não foi possível detectar a placa automaticamente"

**Solução**:
1. Tire uma foto melhor (mais clara, mais próxima)
2. Certifique-se que a placa está visível
3. Verifique se tem créditos na API do PlateRecognizer
4. Preencha manualmente se necessário

### WhatsApp desconecta sozinho
**Problema**: WhatsApp desconecta após um tempo

**Solução**:
- Normal após períodos de inatividade
- Basta reconectar escaneando o QR Code novamente
- Não precisa reconfigurar nada

---

## 📊 Estatísticas e Monitoramento

### Logs do Servidor
O servidor gera logs detalhados em:
- `logs/combined.log` - Todos os logs
- `logs/error.log` - Apenas erros

### Console do Navegador
Abra o console (F12) para ver:
- Status das requisições
- Erros de JavaScript
- Logs de debug

### Logs do WhatsApp
No terminal do servidor você verá:
- "✅ QR Code generated!" - QR Code criado
- "✅ WhatsApp connected successfully!" - Conectado
- "Connection closed" - Desconectado
- "Mensagem enviada para..." - Cada mensagem enviada

---

## 🎯 Checklist de Uso Diário

### Manhã (Abertura)
- [ ] Fazer login no sistema
- [ ] Verificar se WhatsApp está conectado
- [ ] Se desconectado, reconectar via QR Code

### Durante o Dia
- [ ] Fazer check-in dos clientes com foto da placa
- [ ] Verificar detecção automática funcionando
- [ ] Cadastrar novos clientes quando necessário

### Envio de Mensagens (Quando Necessário)
- [ ] Verificar WhatsApp conectado
- [ ] Escolher mensagem apropriada
- [ ] Selecionar destinatários
- [ ] Configurar intervalo (10-15s recomendado)
- [ ] Iniciar envio
- [ ] Monitorar progresso
- [ ] Verificar contador de enviadas/falhas

### Fim do Dia
- [ ] Revisar estatísticas de mensagens enviadas
- [ ] Verificar se há falhas no envio
- [ ] Fazer logout (opcional)

---

## 📞 Suporte

### Problemas Técnicos
1. Verifique os logs do servidor
2. Verifique o console do navegador (F12)
3. Reinicie o servidor se necessário
4. Delete `auth_info_baileys` se WhatsApp não conectar

### Dúvidas sobre Funcionalidades
- Consulte este guia
- Verifique a documentação em `WHATSAPP-BULK-MESSAGES.md`
- Verifique `SISTEMA-FINAL.md` para visão geral

---

## 🎉 Sistema Pronto para Uso!

Todas as funcionalidades estão implementadas e testadas:
- ✅ Reconhecimento automático de placas
- ✅ Mensagens em massa via WhatsApp
- ✅ Cadastro de clientes funcionando
- ✅ Autenticação sem erros
- ✅ Interface completa e intuitiva

**Aproveite o sistema e boas vendas! 🚗💦**
