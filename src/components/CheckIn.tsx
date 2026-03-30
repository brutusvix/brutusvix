import React, { useState, useEffect } from 'react';
import { Camera, User, Phone, Car, ClipboardList, CheckCircle2 } from 'lucide-react';
import { Service, Unit } from '../types';

export default function CheckIn() {
  const [step, setStep] = useState(1);
  const [services, setServices] = useState<Service[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [formData, setFormData] = useState({
    clientName: '',
    phone: '',
    model: '',
    plate: '',
    color: '',
    serviceId: '',
    unitId: ''
  });
  const [loading, setLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('/api/services', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setServices(data));
    fetch('/api/units', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setUnits(data));
    
    if (user.unit_id) {
      setFormData(prev => ({ ...prev, unitId: user.unit_id.toString() }));
    }
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/check-in', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) setStep(4);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 1, label: 'Cliente', icon: User },
    { id: 2, label: 'Veículo', icon: Car },
    { id: 3, label: 'Serviço', icon: ClipboardList },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">Check-in de Veículo</h1>
        <p className="text-zinc-500">Inicie um novo atendimento de forma rápida.</p>
      </div>

      {step < 4 && (
        <div className="flex items-center justify-between relative px-4">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-zinc-200 -z-10" />
          {steps.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-2">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                step >= s.id ? "bg-brand-primary text-zinc-950" : "bg-white border-2 border-zinc-200 text-zinc-400"
              )}>
                <s.icon className="w-5 h-5" />
              </div>
              <span className={cn("text-xs font-bold uppercase tracking-wider", step >= s.id ? "text-brand-primary" : "text-zinc-400")}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-xl shadow-zinc-200/50">
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">Nome do Cliente</label>
              <input 
                type="text" 
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="Ex: João Silva"
                className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">Telefone / WhatsApp</label>
              <input 
                type="tel" 
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(11) 99999-9999"
                className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            <button 
              onClick={() => setStep(2)}
              disabled={!formData.clientName || !formData.phone}
              className="w-full bg-zinc-900 text-white py-4 rounded-xl font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              Próximo Passo
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">Modelo do Veículo</label>
              <input 
                type="text" 
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                placeholder="Ex: Toyota Corolla"
                className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">Placa</label>
              <input 
                type="text" 
                value={formData.plate}
                onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
                placeholder="ABC-1234 ou ABC1D23"
                maxLength={8}
                className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-brand-primary font-mono"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">Cor</label>
              <input 
                type="text" 
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="Ex: Preto"
                className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="flex-1 bg-zinc-100 text-zinc-600 py-4 rounded-xl font-bold hover:bg-zinc-200 transition-colors">Voltar</button>
              <button 
                onClick={() => setStep(3)}
                disabled={!formData.model || !formData.plate}
                className="flex-[2] bg-zinc-900 text-white py-4 rounded-xl font-bold hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                Próximo Passo
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-700">Selecione o Serviço</label>
              <div className="grid grid-cols-1 gap-3">
                {services.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setFormData({ ...formData, serviceId: s.id.toString() })}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left",
                      formData.serviceId === s.id.toString() ? "border-brand-primary bg-brand-primary/5" : "border-zinc-100 hover:border-zinc-200"
                    )}
                  >
                    <div>
                      <p className="font-bold">{s.name}</p>
                      <p className="text-xs text-zinc-500">{s.duration_minutes} min</p>
                    </div>
                    <p className="font-bold text-brand-primary">R$ {s.price.toFixed(2)}</p>
                  </button>
                ))}
              </div>
            </div>
            
            {user.role === 'DONO' && (
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700">Unidade</label>
                <select 
                  value={formData.unitId}
                  onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-50 border-none rounded-xl focus:ring-2 focus:ring-brand-primary"
                >
                  <option value="">Selecione a unidade</option>
                  {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
            )}

            <div className="flex gap-4">
              <button onClick={() => setStep(2)} className="flex-1 bg-zinc-100 text-zinc-600 py-4 rounded-xl font-bold hover:bg-zinc-200 transition-colors">Voltar</button>
              <button 
                onClick={handleSubmit}
                disabled={!formData.serviceId || !formData.unitId || loading}
                className="flex-[2] bg-brand-primary text-zinc-950 py-4 rounded-xl font-bold hover:bg-brand-primary-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? 'Processando...' : 'Finalizar Check-in'}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center py-8 space-y-6">
            <div className="w-20 h-20 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Check-in Realizado!</h2>
              <p className="text-zinc-500 mt-2">O veículo já está na fila de atendimento.</p>
            </div>
            <button 
              onClick={() => {
                setFormData({ clientName: '', phone: '', model: '', plate: '', serviceId: '', unitId: user.unit_id?.toString() || '' });
                setStep(1);
              }}
              className="w-full bg-zinc-900 text-white py-4 rounded-xl font-bold hover:bg-zinc-800 transition-colors"
            >
              Novo Atendimento
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
