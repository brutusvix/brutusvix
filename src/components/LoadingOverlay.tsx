import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  message?: string;
}

export default function LoadingOverlay({ message = 'Carregando dados...' }: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-zinc-900/90 border border-zinc-800/50 rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
        <Loader2 className="w-12 h-12 text-brand-primary animate-spin" strokeWidth={1.5} />
        <div className="text-center">
          <p className="text-zinc-100 font-bold text-lg">{message}</p>
          <p className="text-zinc-500 text-sm mt-1">Aguarde um momento...</p>
        </div>
      </div>
    </div>
  );
}
