import React, { useState } from 'react';
import { Link, Copy, ExternalLink, QrCode, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useData } from '../DataContext';

export default function BookingLinkManager() {
  const { units } = useData();
  const [copied, setCopied] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<string>('all');

  const baseUrl = window.location.origin;
  const bookingUrl = selectedUnit === 'all' 
    ? `${baseUrl}/agendar` 
    : `${baseUrl}/agendar/${selectedUnit}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-zinc-900 p-6 md:p-8 rounded-2xl border border-zinc-800 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary">
            <Link size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Link de Agendamento</h3>
            <p className="text-sm text-zinc-500">Compartilhe este link para receber agendamentos online.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Unidade Específica (Opcional)</label>
            <select
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
            >
              <option value="all">Link Geral (Cliente escolhe a unidade)</option>
              {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Link Público</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl py-3 px-4 text-zinc-400 text-sm truncate">
                {bookingUrl}
              </div>
              <button 
                onClick={handleCopy}
                className="p-3 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-400 hover:text-brand-primary hover:border-brand-primary/50 transition-all"
                title="Copiar Link"
              >
                {copied ? <Check size={18} className="text-brand-primary" /> : <Copy size={18} />}
              </button>
              <button 
                onClick={() => window.open(bookingUrl, '_blank')}
                className="p-3 bg-zinc-800 border border-zinc-700 rounded-xl text-zinc-400 hover:text-white hover:border-zinc-600 transition-all"
                title="Abrir Página"
              >
                <ExternalLink size={18} />
              </button>
            </div>
          </div>

          <div className="bg-brand-primary/5 border border-brand-primary/10 rounded-2xl p-4">
            <p className="text-sm text-brand-primary/80 leading-relaxed">
              💡 <strong>Dica:</strong> Coloque este link na bio do seu Instagram e no botão de "Agendar Agora" do seu WhatsApp Business.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl space-y-4">
          <QRCodeSVG value={bookingUrl} size={160} />
          <div className="text-center">
            <p className="text-xs font-bold text-zinc-900 uppercase tracking-wider flex items-center justify-center gap-2">
              <QrCode size={14} />
              QR Code do Link
            </p>
            <p className="text-[10px] text-zinc-500 mt-1">Imprima e coloque no balcão da sua loja</p>
          </div>
        </div>
      </div>
    </div>
  );
}
