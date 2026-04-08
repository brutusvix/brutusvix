import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  message?: string;
}

export default function LoadingOverlay({ message = 'Carregando dados...' }: LoadingOverlayProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Date.now() - start);
    }, 10); // Atualizar a cada 10ms para mostrar milissegundos

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-zinc-900/90 border border-zinc-800/50 rounded-2xl p-8 flex flex-col items-center gap-4 shadow-2xl">
        <Loader2 className="w-12 h-12 text-brand-primary animate-spin" strokeWidth={1.5} />
        <div className="text-center">
          <p className="text-zinc-100 font-bold text-lg">{message}</p>
          <p className="text-zinc-500 text-sm mt-1">
            {elapsed < 1000 
              ? `${elapsed}ms` 
              : `${(elapsed / 1000).toFixed(1)}s`}
          </p>
        </div>
      </div>
    </div>
  );
}
