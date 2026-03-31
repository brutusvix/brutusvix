import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  Pause, 
  Play, 
  StopCircle, 
  Settings, 
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Smartphone,
  AlertCircle
} from 'lucide-react';
import { useData } from '../DataContext';
import QRCode from 'qrcode';
import { getValidToken } from '../utils/auth';

// URL da API do WhatsApp (Render)
const WHATSAPP_API = import.meta.env.VITE_WHATSAPP_API_URL || 'http://localhost:3001';

const MESSAGE_TEMPLATES = [
  {
    id: 'rain',
    icon: '🌧️',
    title: 'Fechado por Chuva',
    message: 'Olá {nome}! Devido à chuva forte, não abriremos hoje. Desculpe o transtorno! 🌧️'
  },
  {
    id: 'open',
    icon: '✅',
    title: 'Todas Unidades Abertas',
    message: 'Bom dia {nome}! Todas as nossas unidades estão abertas e funcionando normalmente hoje! ✅'
  },
  {
    id: 'promo',
    icon: '🎉',
    title: 'Promoção Especial',
    message: 'Oi {nome}! Promoção especial hoje! Lavagem completa com 20% de desconto. Aproveite! 🎉'
  },
  {
    id: 'custom',
    icon: '✍️',
    title: 'Mensagem Personalizada',
    message: ''
  }
];

export default function BulkMessages() {
  const { clients } = useData();
  const [connected, setConnected] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [config, setConfig] = useState({
    interval: 10,
    dailyLimit: 100,
    startHour: 8,
    endHour: 22
  });
  const [status, setStatus] = useState({
    isSending: false,
    isPaused: false,
    sentCount: 0,
    failedCount: 0,
    queueSize: 0
  });

  useEffect(() => {
    // Conectar ao Socket.IO para receber atualizações em tempo real
    const connectWebSocket = async () => {
      try {
        const token = await getValidToken();
        if (!token) return;
        
        const response = await fetch(`${WHATSAPP_API}/api/whatsapp/status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.status === 429) {
          console.warn('Rate limit atingido, aguardando...');
          return;
        }
        
        if (!response.ok) {
          console.error('Erro ao buscar status:', response.status);
          return;
        }
        
        const data = await response.json();
        
        console.log('WhatsApp status:', data);
        
        setConnected(data.connected);
        if (data.qrCode) {
          console.log('QR Code received, converting to image...');
          const qrDataUrl = await QRCode.toDataURL(data.qrCode);
          console.log('QR Code converted successfully');
          setQrCode(qrDataUrl);
        } else {
          setQrCode(null);
        }
        setStatus({
          isSending: data.isSending,
          isPaused: data.isPaused,
          sentCount: data.sentCount,
          failedCount: data.failedCount,
          queueSize: data.queueSize
        });
        setConfig(data.config);
      } catch (error) {
        console.error('Erro ao conectar:', error);
      }
    };

    connectWebSocket();
    const interval = setInterval(connectWebSocket, 5000); // Aumentado de 3s para 5s
    
    return () => clearInterval(interval);
  }, []);

  const handleConnect = async () => {
    try {
      const token = await getValidToken();
      if (!token) {
        alert('Sessão expirada. Faça login novamente.');
        return;
      }
      
      await fetch(`${WHATSAPP_API}/api/whatsapp/connect`, { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    } catch (error) {
      console.error('Erro ao conectar:', error);
    }
  };

  const handleUpdateConfig = async () => {
    try {
      const token = await getValidToken();
      if (!token) return;
      
      await fetch(`${WHATSAPP_API}/api/whatsapp/config`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(config)
      });
      alert('Configurações atualizadas!');
    } catch (error) {
      console.error('Erro ao atualizar config:', error);
    }
  };

  const handleSend = async () => {
    if (selectedClients.length === 0) {
      alert('Selecione pelo menos um cliente');
      return;
    }

    const message = selectedTemplate === 'custom' ? customMessage : 
      MESSAGE_TEMPLATES.find(t => t.id === selectedTemplate)?.message || '';

    if (!message.trim()) {
      alert('Digite uma mensagem');
      return;
    }

    try {
      const token = await getValidToken();
      if (!token) return;
      
      const recipients = clients
        .filter(c => selectedClients.includes(c.id))
        .map(c => ({
          phone: c.phone,
          name: c.name
        }));

      await fetch(`${WHATSAPP_API}/api/whatsapp/send`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ recipients, message })
      });

      alert('Envio iniciado!');
    } catch (error: any) {
      alert(error.message || 'Erro ao iniciar envio');
    }
  };

  const handlePause = async () => {
    const token = await getValidToken();
    if (!token) return;
    
    await fetch(`${WHATSAPP_API}/api/whatsapp/pause`, { 
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  };

  const handleResume = async () => {
    const token = await getValidToken();
    if (!token) return;
    
    await fetch(`${WHATSAPP_API}/api/whatsapp/resume`, { 
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  };

  const handleStop = async () => {
    if (confirm('Deseja realmente parar o envio? As mensagens na fila serão perdidas.')) {
      const token = await getValidToken();
      if (!token) return;
      
      await fetch(`${WHATSAPP_API}/api/whatsapp/stop`, { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
    }
  };

  const toggleClient = (clientId: string) => {
    setSelectedClients(prev =>
      prev.includes(clientId)
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const toggleAll = () => {
    if (selectedClients.length === clients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(clients.map(c => c.id));
    }
  };

  const currentMessage = selectedTemplate === 'custom' ? customMessage :
    MESSAGE_TEMPLATES.find(t => t.id === selectedTemplate)?.message || '';

  const progress = status.queueSize > 0 
    ? ((status.sentCount / (status.sentCount + status.queueSize)) * 100).toFixed(0)
    : 0;

  const estimatedTime = status.queueSize * config.interval;
  const estimatedMinutes = Math.ceil(estimatedTime / 60);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100 flex items-center justify-center gap-3">
          <MessageSquare className="text-emerald-500" strokeWidth={1.5} />
          Mensagens em Massa
        </h1>
        <p className="text-zinc-500 mt-2 text-sm">Envie mensagens para todos os clientes via WhatsApp</p>
      </div>

      {/* Status de Conexão */}
      <div className="bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-sm rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Smartphone className="text-zinc-400" size={24} />
            <div>
              <p className="font-bold text-zinc-100">Status do WhatsApp</p>
              <p className="text-sm text-zinc-500">
                {connected ? (
                  <span className="text-emerald-500 flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    Conectado
                  </span>
                ) : (
                  <span className="text-zinc-500 flex items-center gap-2">
                    <span className="w-2 h-2 bg-zinc-500 rounded-full" />
                    Desconectado
                  </span>
                )}
              </p>
            </div>
          </div>
          
          {!connected && (
            <button
              onClick={handleConnect}
              className="bg-emerald-500 text-zinc-950 px-4 py-2 rounded-xl font-bold hover:bg-emerald-400 transition-all"
            >
              Conectar WhatsApp
            </button>
          )}
        </div>

        {qrCode && !connected && (
          <div className="mt-6 text-center">
            <p className="text-zinc-400 mb-4">Escaneie o QR Code com seu WhatsApp:</p>
            <img src={qrCode} alt="QR Code" className="mx-auto w-64 h-64 bg-white p-4 rounded-2xl" />
            <p className="text-xs text-zinc-500 mt-4">
              Abra o WhatsApp → Dispositivos Conectados → Conectar Dispositivo
            </p>
          </div>
        )}
      </div>

      {connected && (
        <>
          {/* Configurações */}
          <div className="bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-sm rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="text-zinc-400" size={24} />
              <h2 className="text-xl font-bold text-zinc-100">Configurações</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">
                  Intervalo entre mensagens: {config.interval}s
                </label>
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={config.interval}
                  onChange={(e) => setConfig({ ...config, interval: parseInt(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-zinc-500">Recomendado: 10-15 segundos</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">
                  Limite diário: {config.dailyLimit} mensagens
                </label>
                <input
                  type="range"
                  min="50"
                  max="300"
                  step="50"
                  value={config.dailyLimit}
                  onChange={(e) => setConfig({ ...config, dailyLimit: parseInt(e.target.value) })}
                  className="w-full"
                />
                <p className="text-xs text-zinc-500">Enviadas hoje: {status.sentCount}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-400">Horário permitido</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={config.startHour}
                    onChange={(e) => setConfig({ ...config, startHour: parseInt(e.target.value) })}
                    className="w-20 bg-zinc-900/50 border border-zinc-800/50 rounded-xl py-2 px-3 text-zinc-100"
                  />
                  <span className="text-zinc-500">até</span>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={config.endHour}
                    onChange={(e) => setConfig({ ...config, endHour: parseInt(e.target.value) })}
                    className="w-20 bg-zinc-900/50 border border-zinc-800/50 rounded-xl py-2 px-3 text-zinc-100"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleUpdateConfig}
              className="mt-4 bg-zinc-800 text-zinc-100 px-4 py-2 rounded-xl font-medium hover:bg-zinc-700 transition-all text-sm"
            >
              Salvar Configurações
            </button>
          </div>

          {/* Mensagem */}
          <div className="bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-sm rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <MessageSquare className="text-zinc-400" size={24} />
              <h2 className="text-xl font-bold text-zinc-100">Mensagem</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {MESSAGE_TEMPLATES.map(template => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    selectedTemplate === template.id
                      ? 'border-emerald-500 bg-emerald-500/10'
                      : 'border-zinc-800/50 hover:border-zinc-700'
                  }`}
                >
                  <div className="text-2xl mb-2">{template.icon}</div>
                  <p className="text-sm font-bold text-zinc-100">{template.title}</p>
                </button>
              ))}
            </div>

            {selectedTemplate === 'custom' ? (
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Digite sua mensagem personalizada..."
                className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 text-zinc-100 min-h-[120px] focus:outline-none focus:ring-1 focus:ring-zinc-700"
              />
            ) : (
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4">
                <p className="text-zinc-300 whitespace-pre-wrap">{currentMessage}</p>
              </div>
            )}

            <p className="text-xs text-zinc-500 mt-2">
              Variáveis disponíveis: <code className="bg-zinc-800 px-2 py-1 rounded">{'{nome}'}</code>
            </p>
          </div>

          {/* Destinatários */}
          <div className="bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-sm rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Users className="text-zinc-400" size={24} />
                <h2 className="text-xl font-bold text-zinc-100">
                  Destinatários ({selectedClients.length}/{clients.length})
                </h2>
              </div>
              <button
                onClick={toggleAll}
                className="text-sm text-emerald-500 hover:text-emerald-400 font-medium"
              >
                {selectedClients.length === clients.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </button>
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2 custom-scrollbar">
              {clients.map(client => (
                <label
                  key={client.id}
                  className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-xl hover:bg-zinc-800/50 cursor-pointer transition-all"
                >
                  <input
                    type="checkbox"
                    checked={selectedClients.includes(client.id)}
                    onChange={() => toggleClient(client.id)}
                    className="w-4 h-4"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-zinc-100">{client.name}</p>
                    <p className="text-sm text-zinc-500">{client.phone}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Progresso */}
          {status.isSending && (
            <div className="bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-sm rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="text-zinc-400" size={24} />
                <h2 className="text-xl font-bold text-zinc-100">Progresso</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-zinc-400">Enviando...</span>
                    <span className="text-zinc-100 font-bold">{progress}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-zinc-900/50 rounded-xl">
                    <CheckCircle2 className="text-emerald-500 mx-auto mb-2" size={24} />
                    <p className="text-2xl font-bold text-zinc-100">{status.sentCount}</p>
                    <p className="text-xs text-zinc-500">Enviadas</p>
                  </div>
                  <div className="text-center p-3 bg-zinc-900/50 rounded-xl">
                    <XCircle className="text-red-500 mx-auto mb-2" size={24} />
                    <p className="text-2xl font-bold text-zinc-100">{status.failedCount}</p>
                    <p className="text-xs text-zinc-500">Falhas</p>
                  </div>
                  <div className="text-center p-3 bg-zinc-900/50 rounded-xl">
                    <Clock className="text-zinc-400 mx-auto mb-2" size={24} />
                    <p className="text-2xl font-bold text-zinc-100">{status.queueSize}</p>
                    <p className="text-xs text-zinc-500">Na fila</p>
                  </div>
                </div>

                <p className="text-center text-sm text-zinc-500">
                  Tempo estimado: ~{estimatedMinutes} minutos
                </p>

                <div className="flex gap-3">
                  {status.isPaused ? (
                    <button
                      onClick={handleResume}
                      className="flex-1 bg-emerald-500 text-zinc-950 py-3 rounded-xl font-bold hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
                    >
                      <Play size={20} /> Retomar
                    </button>
                  ) : (
                    <button
                      onClick={handlePause}
                      className="flex-1 bg-orange-500 text-zinc-950 py-3 rounded-xl font-bold hover:bg-orange-400 transition-all flex items-center justify-center gap-2"
                    >
                      <Pause size={20} /> Pausar
                    </button>
                  )}
                  <button
                    onClick={handleStop}
                    className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-400 transition-all flex items-center justify-center gap-2"
                  >
                    <StopCircle size={20} /> Parar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Botão Enviar */}
          {!status.isSending && (
            <button
              onClick={handleSend}
              disabled={selectedClients.length === 0 || !currentMessage.trim()}
              className="w-full bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
            >
              <Send size={24} strokeWidth={1.5} />
              Iniciar Envio para {selectedClients.length} cliente(s)
            </button>
          )}

          {/* Aviso */}
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="text-orange-500 shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-orange-500">
              <p className="font-bold mb-1">⚠️ Aviso Importante</p>
              <p>Use um número secundário. Envio em massa pode resultar em banimento da conta WhatsApp. Use por sua conta e risco.</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
