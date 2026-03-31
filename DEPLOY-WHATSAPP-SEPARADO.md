# 🚀 Deploy WhatsApp em Servidor Separado

## 📋 Arquitetura

```
┌─────────────────┐         ┌──────────────────┐
│  Vercel         │         │  Render          │
│  (Frontend)     │ ◄─────► │  (WhatsApp API)  │
│  brutusvix.app  │  HTTPS  │  whatsapp.app    │
└─────────────────┘         └──────────────────┘
```

## ✅ Plano Gratuito do Render

### O que você ganha:
- ✅ 750 horas/mês (suficiente para 1 serviço 24/7)
- ✅ 512 MB RAM
- ✅ CPU compartilhada
- ✅ SSL/HTTPS automático
- ✅ Deploy automático via GitHub
- ✅ Logs em tempo real

### Limitações:
- ⚠️ Serviço "dorme" após 15 minutos de inatividade
- ⚠️ Primeiro acesso após dormir demora ~30 segundos
- ⚠️ Reinicia automaticamente a cada 24h

### É suficiente para você?
✅ **SIM!** Perfeito para:
- Envio de mensagens ocasional
- Uso durante horário comercial
- Até 200 mensagens/dia

---

## 🛠️ Passo 1: Criar Servidor WhatsApp Separado

### 1.1 Criar nova pasta no projeto
```bash
mkdir whatsapp-server
cd whatsapp-server
```

### 1.2 Criar `package.json`
```json
{
  "name": "brutus-whatsapp-server",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "@whiskeysockets/baileys": "^7.0.0-rc.9",
    "@hapi/boom": "^10.0.1",
    "express": "^4.21.2",
    "cors": "^2.8.6",
    "dotenv": "^17.2.3",
    "pino": "^10.3.1",
    "socket.io": "^4.8.3"
  }
}
```

### 1.3 Criar `server.js`
```javascript
import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { whatsappService } from './whatsapp-service.js';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

// CORS - Permitir Vercel
app.use(cors({
  origin: [
    'https://brutusvix.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ],
  credentials: true
}));

app.use(express.json());

// Socket.io com CORS
const io = new Server(httpServer, {
  cors: {
    origin: [
      'https://brutusvix.vercel.app',
      'http://localhost:3000',
      'http://localhost:5173'
    ],
    credentials: true
  }
});

// Eventos do WhatsApp
io.on('connection', (socket) => {
  console.log('Client connected');
  socket.on('disconnect', () => console.log('Client disconnected'));
});

whatsappService.on('qr', (qr) => io.emit('whatsapp:qr', qr));
whatsappService.on('connected', () => io.emit('whatsapp:connected'));
whatsappService.on('disconnected', () => io.emit('whatsapp:disconnected'));
whatsappService.on('message-sent', (data) => io.emit('whatsapp:message-sent', data));
whatsappService.on('message-failed', (data) => io.emit('whatsapp:message-failed', data));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Conectar WhatsApp
app.post('/api/whatsapp/connect', async (req, res) => {
  try {
    await whatsappService.initialize();
    res.json({ success: true, message: 'Inicializando conexão...' });
  } catch (error) {
    console.error('Error connecting WhatsApp:', error);
    res.status(500).json({ error: error.message });
  }
});

// Status do WhatsApp
app.get('/api/whatsapp/status', (req, res) => {
  try {
    const status = whatsappService.getStatus();
    res.json(status);
  } catch (error) {
    console.error('Error getting WhatsApp status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Atualizar configurações
app.post('/api/whatsapp/config', (req, res) => {
  try {
    const { interval, dailyLimit, startHour, endHour } = req.body;
    whatsappService.updateConfig({ interval, dailyLimit, startHour, endHour });
    res.json({ success: true, message: 'Configurações atualizadas' });
  } catch (error) {
    console.error('Error updating WhatsApp config:', error);
    res.status(500).json({ error: error.message });
  }
});

// Adicionar mensagens à fila
app.post('/api/whatsapp/send', async (req, res) => {
  try {
    const { recipients, message } = req.body;
    
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Lista de destinatários inválida' });
    }

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({ error: 'Mensagem inválida' });
    }

    await whatsappService.addToQueue(recipients, message);
    res.json({ success: true, message: 'Mensagens adicionadas à fila' });
  } catch (error) {
    console.error('Error adding to queue:', error);
    res.status(400).json({ error: error.message });
  }
});

// Pausar envio
app.post('/api/whatsapp/pause', (req, res) => {
  try {
    whatsappService.pause();
    res.json({ success: true, message: 'Envio pausado' });
  } catch (error) {
    console.error('Error pausing WhatsApp:', error);
    res.status(500).json({ error: error.message });
  }
});

// Retomar envio
app.post('/api/whatsapp/resume', (req, res) => {
  try {
    whatsappService.resume();
    res.json({ success: true, message: 'Envio retomado' });
  } catch (error) {
    console.error('Error resuming WhatsApp:', error);
    res.status(500).json({ error: error.message });
  }
});

// Parar envio
app.post('/api/whatsapp/stop', (req, res) => {
  try {
    whatsappService.stop();
    res.json({ success: true, message: 'Envio parado' });
  } catch (error) {
    console.error('Error stopping WhatsApp:', error);
    res.status(500).json({ error: error.message });
  }
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ WhatsApp Server running on port ${PORT}`);
});
```

### 1.4 Copiar `whatsapp-service.ts` para `whatsapp-service.js`
Copie o arquivo `whatsapp-service.ts` da raiz do projeto para `whatsapp-server/whatsapp-service.js` e remova os tipos TypeScript.

### 1.5 Criar `.env`
```env
PORT=3001
```

### 1.6 Criar `.gitignore`
```
node_modules/
auth_info_baileys/
.env
```

---

## 🚀 Passo 2: Deploy no Render

### 2.1 Criar conta no Render
1. Acesse: https://render.com
2. Faça login com GitHub
3. Autorize o Render a acessar seus repositórios

### 2.2 Criar novo Web Service
1. Clique em "New +" → "Web Service"
2. Conecte seu repositório GitHub
3. Configure:
   - **Name**: `brutus-whatsapp`
   - **Region**: Oregon (US West) - mais próximo
   - **Branch**: `main`
   - **Root Directory**: `whatsapp-server`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### 2.3 Variáveis de Ambiente
Adicione no Render:
- `PORT`: 3001 (ou deixe vazio, Render define automaticamente)

### 2.4 Deploy
1. Clique em "Create Web Service"
2. Aguarde o deploy (2-3 minutos)
3. Anote a URL: `https://brutus-whatsapp.onrender.com`

---

## 🔧 Passo 3: Configurar Frontend (Vercel)

### 3.1 Criar variável de ambiente na Vercel
1. Acesse: https://vercel.com/seu-usuario/brutusvix
2. Settings → Environment Variables
3. Adicione:
   - **Name**: `VITE_WHATSAPP_API_URL`
   - **Value**: `https://brutus-whatsapp.onrender.com`
   - **Environment**: Production, Preview, Development

### 3.2 Atualizar `src/pages/BulkMessages.tsx`
Substitua todas as URLs `/api/whatsapp/` por:

```typescript
const WHATSAPP_API = import.meta.env.VITE_WHATSAPP_API_URL || 'http://localhost:3001';

// Exemplo:
const response = await fetch(`${WHATSAPP_API}/api/whatsapp/status`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### 3.3 Atualizar todas as requisições
Procure por:
- `/api/whatsapp/connect` → `${WHATSAPP_API}/api/whatsapp/connect`
- `/api/whatsapp/status` → `${WHATSAPP_API}/api/whatsapp/status`
- `/api/whatsapp/config` → `${WHATSAPP_API}/api/whatsapp/config`
- `/api/whatsapp/send` → `${WHATSAPP_API}/api/whatsapp/send`
- `/api/whatsapp/pause` → `${WHATSAPP_API}/api/whatsapp/pause`
- `/api/whatsapp/resume` → `${WHATSAPP_API}/api/whatsapp/resume`
- `/api/whatsapp/stop` → `${WHATSAPP_API}/api/whatsapp/stop`

### 3.4 Fazer commit e push
```bash
git add .
git commit -m "feat: WhatsApp API em servidor separado (Render)"
git push origin main
```

A Vercel vai fazer deploy automaticamente.

---

## 🧪 Passo 4: Testar

### 4.1 Testar servidor WhatsApp
```bash
curl https://brutus-whatsapp.onrender.com/health
```

Deve retornar:
```json
{"status":"ok","timestamp":"2026-03-31T..."}
```

### 4.2 Testar no frontend
1. Acesse: https://brutusvix.vercel.app
2. Faça login
3. Vá em "Mensagens"
4. Clique em "Conectar WhatsApp"
5. QR Code deve aparecer

---

## ⚠️ Limitações do Plano Gratuito

### Serviço "dorme" após 15 minutos
**Problema**: Primeira requisição demora ~30 segundos

**Solução**: Criar um "keep-alive" (ping a cada 10 minutos)

#### Opção 1: Usar cron-job.org (Gratuito)
1. Acesse: https://cron-job.org
2. Crie conta gratuita
3. Adicione job:
   - **URL**: `https://brutus-whatsapp.onrender.com/health`
   - **Interval**: Every 10 minutes
   - **Method**: GET

#### Opção 2: Usar UptimeRobot (Gratuito)
1. Acesse: https://uptimerobot.com
2. Crie conta gratuita
3. Adicione monitor:
   - **Monitor Type**: HTTP(s)
   - **URL**: `https://brutus-whatsapp.onrender.com/health`
   - **Monitoring Interval**: 5 minutes

### Reinicia a cada 24h
**Problema**: WhatsApp desconecta

**Solução**: Reconectar automaticamente ao iniciar

Adicione no `server.js`:
```javascript
// Auto-conectar ao iniciar (se já tinha sessão)
setTimeout(async () => {
  try {
    await whatsappService.initialize();
    console.log('Auto-connecting WhatsApp...');
  } catch (error) {
    console.log('No previous session found');
  }
}, 5000);
```

---

## 💰 Custos

### Render Free
- ✅ **Custo**: R$ 0,00/mês
- ✅ **Limite**: 750 horas/mês (suficiente para 1 serviço)
- ✅ **Tráfego**: 100 GB/mês

### Render Paid (se precisar)
- 💵 **Custo**: $7/mês (~R$ 35/mês)
- ✅ **Sem sleep**: Serviço sempre ativo
- ✅ **Mais RAM**: 512 MB → 2 GB
- ✅ **Mais CPU**: Compartilhada → Dedicada

---

## 🎯 Checklist de Deploy

- [ ] Criar pasta `whatsapp-server`
- [ ] Criar `package.json`, `server.js`, `whatsapp-service.js`
- [ ] Fazer commit e push
- [ ] Criar conta no Render
- [ ] Criar Web Service no Render
- [ ] Configurar variáveis de ambiente
- [ ] Aguardar deploy
- [ ] Anotar URL do Render
- [ ] Adicionar `VITE_WHATSAPP_API_URL` na Vercel
- [ ] Atualizar `BulkMessages.tsx` com nova URL
- [ ] Fazer commit e push
- [ ] Testar conexão WhatsApp
- [ ] Configurar keep-alive (cron-job.org)

---

## 🆘 Problemas Comuns

### Erro CORS
**Problema**: "Access-Control-Allow-Origin"

**Solução**: Adicione sua URL da Vercel no CORS do `server.js`:
```javascript
origin: [
  'https://brutusvix.vercel.app',
  'https://seu-dominio-custom.com'
]
```

### Serviço não inicia
**Problema**: Logs mostram erro

**Solução**: Verifique logs no Render:
1. Dashboard → brutus-whatsapp
2. Logs (aba superior)
3. Veja o erro e corrija

### QR Code não aparece
**Problema**: Timeout na primeira requisição

**Solução**: 
1. Aguarde 30-60 segundos (serviço está "acordando")
2. Tente novamente
3. Configure keep-alive para evitar sleep

---

## ✅ Pronto!

Agora você tem:
- ✅ Frontend na Vercel (rápido e gratuito)
- ✅ WhatsApp API no Render (gratuito)
- ✅ Sistema funcionando em produção
- ✅ Custo: R$ 0,00/mês

**Quer que eu crie os arquivos do servidor WhatsApp para você?**
