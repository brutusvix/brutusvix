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
