import makeWASocket, { 
  DisconnectReason, 
  useMultiFileAuthState,
  delay,
  fetchLatestBaileysVersion
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import { EventEmitter } from 'events';

class WhatsAppService extends EventEmitter {
  constructor() {
    super();
    this.sock = null;
    this.isConnected = false;
    this.isInitializing = false;
    this.qrCode = null;
    this.messageQueue = [];
    this.isSending = false;
    this.isPaused = false;
    this.sentCount = 0;
    this.failedCount = 0;
    this.config = {
      interval: 10,
      dailyLimit: 100,
      startHour: 8,
      endHour: 22
    };
  }

  async initialize() {
    if (this.isInitializing) {
      console.log('Already initializing, skipping...');
      return;
    }
    
    if (this.isConnected) {
      console.log('Already connected, skipping initialization');
      return;
    }

    this.isInitializing = true;
    try {
      console.log('Initializing WhatsApp service...');
      
      const { version, isLatest } = await fetchLatestBaileysVersion();
      console.log(`Using Baileys version ${version}, isLatest: ${isLatest}`);
      
      const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
      
      this.sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: 'warn' }),
        browser: ['Brutus Lavajato', 'Chrome', '1.0.0'],
        syncFullHistory: false,
        markOnlineOnConnect: false,
        generateHighQualityLinkPreview: false,
        getMessage: async () => undefined,
      });

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        console.log('Connection update:', { 
          connection, 
          hasQR: !!qr, 
          hasError: !!lastDisconnect?.error 
        });
        
        if (qr) {
          console.log('✅ QR Code generated!');
          this.qrCode = qr;
          this.emit('qr', qr);
        }

        if (connection === 'close') {
          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
          
          console.log('Connection closed:', {
            statusCode,
            reason: DisconnectReason[statusCode] || 'Unknown',
            shouldReconnect
          });
          
          this.isConnected = false;
          this.isInitializing = false;
          this.qrCode = null;
          this.emit('disconnected');
          
          if (shouldReconnect) {
            console.log('Reconnecting in 3 seconds...');
            setTimeout(() => this.initialize(), 3000);
          }
        } else if (connection === 'open') {
          console.log('✅ WhatsApp connected successfully!');
          this.isConnected = true;
          this.isInitializing = false;
          this.qrCode = null;
          this.emit('connected');
        } else if (connection === 'connecting') {
          console.log('Connecting to WhatsApp...');
        }
      });
      
      console.log('WhatsApp service initialized, waiting for QR code...');
      this.isInitializing = false;
    } catch (error) {
      console.error('❌ Error initializing WhatsApp:', error);
      this.isInitializing = false;
      throw error;
    }
  }

  getStatus() {
    return {
      connected: this.isConnected,
      qrCode: this.qrCode,
      queueSize: this.messageQueue.length,
      sentCount: this.sentCount,
      failedCount: this.failedCount,
      isSending: this.isSending,
      isPaused: this.isPaused,
      config: this.config
    };
  }

  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.emit('config-updated', this.config);
  }

  async addToQueue(recipients, message) {
    if (!this.isConnected) {
      throw new Error('WhatsApp não está conectado');
    }

    if (this.sentCount >= this.config.dailyLimit) {
      throw new Error(`Limite diário de ${this.config.dailyLimit} mensagens atingido`);
    }

    const currentHour = new Date().getHours();
    if (currentHour < this.config.startHour || currentHour >= this.config.endHour) {
      throw new Error(`Envio permitido apenas entre ${this.config.startHour}h e ${this.config.endHour}h`);
    }

    for (const recipient of recipients) {
      const personalizedMessage = message.replace('{nome}', recipient.name);
      
      this.messageQueue.push({
        phone: recipient.phone,
        message: personalizedMessage,
        clientName: recipient.name
      });
    }

    this.emit('queue-updated', this.getStatus());

    if (!this.isSending) {
      this.startSending();
    }
  }

  async startSending() {
    if (this.isSending || this.messageQueue.length === 0) return;

    this.isSending = true;
    this.emit('sending-started');

    while (this.messageQueue.length > 0 && !this.isPaused) {
      if (this.sentCount >= this.config.dailyLimit) {
        console.log('Limite diário atingido');
        this.emit('daily-limit-reached');
        break;
      }

      const currentHour = new Date().getHours();
      if (currentHour < this.config.startHour || currentHour >= this.config.endHour) {
        console.log('Fora do horário permitido');
        this.emit('outside-hours');
        break;
      }

      const item = this.messageQueue.shift();
      if (!item) break;

      try {
        const cleanPhone = item.phone.replace(/\D/g, '');
        const whatsappNumber = `55${cleanPhone}@s.whatsapp.net`;

        await this.sock.sendMessage(whatsappNumber, { text: item.message });
        
        this.sentCount++;
        console.log(`Mensagem enviada para ${item.clientName} (${item.phone})`);
        
        this.emit('message-sent', {
          phone: item.phone,
          name: item.clientName,
          success: true,
          sentCount: this.sentCount,
          remaining: this.messageQueue.length
        });

      } catch (error) {
        this.failedCount++;
        console.error(`Erro ao enviar para ${item.clientName}:`, error.message);
        
        this.emit('message-failed', {
          phone: item.phone,
          name: item.clientName,
          error: error.message,
          failedCount: this.failedCount
        });
      }

      if (this.messageQueue.length > 0) {
        await delay(this.config.interval * 1000);
      }
    }

    this.isSending = false;
    this.emit('sending-finished', {
      sentCount: this.sentCount,
      failedCount: this.failedCount
    });
  }

  pause() {
    this.isPaused = true;
    this.emit('paused');
  }

  resume() {
    this.isPaused = false;
    this.emit('resumed');
    if (this.messageQueue.length > 0) {
      this.startSending();
    }
  }

  stop() {
    this.messageQueue = [];
    this.isPaused = false;
    this.isSending = false;
    this.emit('stopped');
  }

  resetDailyCount() {
    this.sentCount = 0;
    this.failedCount = 0;
    this.emit('count-reset');
  }

  disconnect() {
    if (this.sock) {
      this.sock.end(undefined);
      this.sock = null;
      this.isConnected = false;
      this.qrCode = null;
    }
  }
}

export const whatsappService = new WhatsAppService();
