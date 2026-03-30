import React, { useState, useRef } from 'react';
import { 
  QrCode, 
  Car, 
  User, 
  Settings, 
  CheckCircle2,
  ArrowRight,
  Search,
  Plus,
  Camera,
  Loader2,
  Edit3,
  RefreshCw,
  Sparkles,
  AlertCircle,
  MapPin,
  Users
} from 'lucide-react';
import { IMaskInput } from 'react-imask';
import { useData } from '../DataContext';
import { useAuth } from '../App';

export default function CheckIn() {
  const { clients, services, extras, addAppointment, addClient, addVehicle, units, users } = useData();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [plate, setPlate] = useState('');
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('TODOS');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<string>('all');
  
  // Preços editáveis
  const [customServicePrice, setCustomServicePrice] = useState<number | null>(null);
  const [customExtraPrices, setCustomExtraPrices] = useState<{ [key: string]: number }>({});
  
  // New Client state
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '' });
  
  // AI Photo Check-in state
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResults, setAiResults] = useState<any>(null);
  const [vehicleInfo, setVehicleInfo] = useState({
    brand: '',
    model: '',
    color: '',
    type: 'HATCH' as 'HATCH' | 'SEDAN' | 'SUV' | 'CAMINHONETE'
  });
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Definir unidade padrão ao carregar
  React.useEffect(() => {
    if (user?.role === 'LAVADOR' && user?.unit_id) {
      setSelectedUnitFilter(user.unit_id);
    }
  }, [user]);

  // Filtrar serviços por unidade do usuário
  const filteredServices = services.filter(s => {
    // Se for LAVADOR, mostrar apenas serviços da sua unidade
    if (user?.role === 'LAVADOR' && user?.unit_id) {
      if (s.unit_id !== user.unit_id) return false;
    }
    // Se for ADMIN e selecionou uma unidade específica
    if (user?.role === 'DONO' && selectedUnitFilter !== 'all') {
      if (s.unit_id !== selectedUnitFilter) return false;
    }
    // Filtrar por categoria
    if (categoryFilter !== 'TODOS' && s.category !== categoryFilter) return false;
    // Mostrar apenas ativos
    return s.active;
  });

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setCapturedPhoto(base64);
        analyzeVehicleWithAI(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeVehicleWithAI = async (base64Image: string) => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Usar Tesseract.js para OCR da placa
      const { createWorker } = await import('tesseract.js');
      
      const worker = await createWorker('por');
      
      // Processar a imagem para extrair texto (placa)
      const { data: { text } } = await worker.recognize(base64Image);
      
      await worker.terminate();
      
      // Extrair placa do texto usando regex
      // Formatos: ABC-1234 ou ABC1D23 (Mercosul)
      const plateRegex = /[A-Z]{3}[-]?[0-9]{1}[A-Z0-9]{1}[0-9]{2}/g;
      const plates = text.match(plateRegex);
      const detectedPlate = plates && plates.length > 0 ? plates[0] : null;
      
      // Preencher apenas a placa, o resto o usuário preenche manualmente
      setAiResults({
        tipo: 'HATCH',
        marca: '',
        modelo: '',
        cor: '',
        nivel_sujeira: 'Médio',
        placa: detectedPlate
      });

      if (detectedPlate) {
        setVehicleInfo(prev => ({
          ...prev,
          plate: detectedPlate
        }));
      } else {
        setError('Não foi possível detectar a placa. Por favor, digite manualmente.');
      }
      
    } catch (err: any) {
      setError(err.message || 'Erro ao analisar imagem');
    } finally {
      setIsAnalyzing(false);
    }
  };
        color: result.cor,
        type: mappedType
      });

      if (result.placa) {
        // Remove any non-alphanumeric characters and convert to uppercase
        const cleanPlate = result.placa.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        setPlate(cleanPlate);
      }
      
      // Suggest service
      let suggested = filteredServices.find(s => s.name.toLowerCase().includes("simples"));
      if (result.tipo === "SUV" || result.tipo === "Caminhonete") {
        suggested = filteredServices.find(s => s.name.toLowerCase().includes("completa")) || suggested;
      }
      if (result.nivel_sujeira === "Pesado") {
        const premium = filteredServices.find(s => s.name.toLowerCase().includes("premium"));
        if (premium) suggested = premium;
      }
      
      if (suggested) setSelectedService(suggested);
    } catch (err: any) {
      console.error("AI Analysis Error:", err);
      setError(`Erro: ${err.message || "Não foi possível analisar a imagem automaticamente."}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCompleteCheckIn = async () => {
    if (!selectedClient && !showNewClientForm) return;
    if (!selectedService || !plate) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // 1. Create client if new
      let client = selectedClient;
      if (showNewClientForm) {
        if (!newClient.name || !newClient.phone) {
          throw new Error('Nome e telefone do cliente são obrigatórios');
        }
        client = await addClient({
          name: newClient.name,
          phone: newClient.phone,
          unit_id: user?.unit_id || (units[0]?.id as any) || ''
        });
      }

      if (!client || !client.id) {
        throw new Error('Erro ao obter dados do cliente. Tente novamente.');
      }

      // 2. Ensure vehicle exists or create it
      if (!vehicleInfo.brand || !vehicleInfo.model) {
        throw new Error('Marca e modelo do veículo são obrigatórios');
      }

      const vehicle = await addVehicle({
        client_id: client.id,
        model: `${vehicleInfo.brand} ${vehicleInfo.model}`.trim(),
        plate: plate.toUpperCase()
      });

      if (!vehicle || !vehicle.id) {
        throw new Error('Erro ao registrar veículo. Tente novamente.');
      }

      // Calcular preços (usar customizado se definido, senão usar o padrão)
      const extrasPrice = selectedExtras.reduce((acc, id) => {
        const extra = extras.find(e => e.id === id);
        const customPrice = customExtraPrices[id];
        return acc + (customPrice !== undefined ? customPrice : (extra?.price || 0));
      }, 0);

      const baseServicePrice = selectedService.prices[vehicleInfo.type] || 0;
      const servicePrice = customServicePrice !== null ? customServicePrice : baseServicePrice;

      // 3. Add appointment
      await addAppointment({
        client_id: client.id,
        vehicle_id: vehicle.id,
        service_id: selectedService.id,
        unit_id: user?.unit_id || (units[0]?.id as any) || '',
        washer_id: user?.id,
        vehicle_type: vehicleInfo.type,
        plate: plate.toUpperCase(),
        vehicle_model: `${vehicleInfo.brand} ${vehicleInfo.model}`.trim(),
        // vehicle_color removido - não existe na tabela
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
        status: 'EM_ANDAMENTO',
        total_price: servicePrice + extrasPrice,
        extras: selectedExtras,
        photo_url: capturedPhoto || undefined,
        ai_data: aiResults || undefined
      });

      // Reset
      setStep(1);
      setSelectedClient(null);
      setSelectedService(null);
      setSelectedExtras([]);
      setShowNewClientForm(false);
      setNewClient({ name: '', phone: '' });
      setPlate('');
      setSearchTerm('');
      setCapturedPhoto(null);
      setAiResults(null);
      setVehicleInfo({ brand: '', model: '', color: '', type: 'HATCH' });
      setCustomServicePrice(null);
      setCustomExtraPrices({});
      setCategoryFilter('TODOS');
      alert('Check-in realizado com sucesso! Serviço iniciado.');
    } catch (error: any) {
      console.error("Erro ao finalizar check-in:", error);
      const errorMessage = error?.message || "Erro ao realizar check-in. Tente novamente.";
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleExtra = (id: string) => {
    setSelectedExtras(prev => {
      if (prev.includes(id)) {
        // Remover extra e seu preço customizado
        const newExtras = prev.filter(e => e !== id);
        const newPrices = { ...customExtraPrices };
        delete newPrices[id];
        setCustomExtraPrices(newPrices);
        return newExtras;
      } else {
        // Adicionar extra
        return [...prev, id];
      }
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-100 flex items-center justify-center gap-3">
          Check-in Rápido <Sparkles className="text-emerald-500" strokeWidth={1.5} />
        </h1>
        <p className="text-zinc-500 mt-2 text-sm">Entrada de veículo em poucos segundos com IA.</p>
      </div>

      {/* Seletor de Unidade (apenas para ADMIN) */}
      {user?.role === 'DONO' && units.length > 1 && (
        <div className="bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-sm rounded-2xl p-4">
          <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
            Filtrar por Unidade
          </label>
          <select
            value={selectedUnitFilter}
            onChange={(e) => setSelectedUnitFilter(e.target.value)}
            className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-xl py-3 px-4 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-700"
          >
            <option value="all">Todas as Unidades</option>
            {units.map(unit => (
              <option key={unit.id} value={unit.id}>
                {unit.name} - {unit.address}
              </option>
            ))}
          </select>
          
          {/* Informações da Unidade Selecionada */}
          {selectedUnitFilter !== 'all' && (() => {
            const selectedUnit = units.find(u => u.id === selectedUnitFilter);
            const unitWashers = users.filter(u => u.unit_id === selectedUnitFilter && u.role === 'LAVADOR');
            
            if (!selectedUnit) return null;
            
            return (
              <div className="mt-4 p-4 bg-zinc-800/30 rounded-xl space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="text-emerald-500 w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Endereço</p>
                    <p className="text-zinc-300 text-sm">{selectedUnit.address}</p>
                    {selectedUnit.phone && (
                      <p className="text-zinc-500 text-xs mt-1">{selectedUnit.phone}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Users className="text-emerald-500 w-5 h-5 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider mb-2">
                      Lavadores ({unitWashers.length})
                    </p>
                    {unitWashers.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {unitWashers.map(washer => (
                          <span key={washer.id} className="px-2 py-1 bg-zinc-900/50 border border-zinc-700 rounded-lg text-xs text-zinc-300">
                            {washer.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-zinc-500 text-xs italic">Nenhum lavador cadastrado nesta unidade</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-4">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              step >= s ? 'bg-zinc-100 text-zinc-950' : 'bg-zinc-900/50 text-zinc-500 border border-zinc-800/50'
            }`}>
              {s}
            </div>
            {s < 3 && <div className={`w-12 h-0.5 ${step > s ? 'bg-zinc-100' : 'bg-zinc-800/60'}`} />}
          </div>
        ))}
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800/50 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-sm">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-zinc-100">
                <Car size={24} strokeWidth={1.5} className="text-zinc-400" />
                <h2 className="text-xl font-bold tracking-tight">Identificar Veículo</h2>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 px-3 py-2 rounded-xl text-xs font-bold hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
                >
                  <Camera size={16} strokeWidth={1.5} /> Foto com IA
                </button>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                capture="environment"
                onChange={handleCapture}
              />
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-500 text-sm">
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            {isAnalyzing ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4 bg-zinc-900/50 rounded-3xl border border-zinc-800/50 border-dashed">
                <div className="relative">
                  <Loader2 className="w-12 h-12 text-zinc-400 animate-spin" strokeWidth={1.5} />
                  <Sparkles className="absolute -top-1 -right-1 text-emerald-500 w-5 h-5 animate-pulse" strokeWidth={1.5} />
                </div>
                <div className="text-center">
                  <p className="text-zinc-100 font-bold">IA Analisando Veículo...</p>
                  <p className="text-zinc-500 text-sm">Identificando marca, modelo e cor</p>
                </div>
              </div>
            ) : (
              <>
                {capturedPhoto && (
                  <div className="relative group">
                    <img 
                      src={capturedPhoto} 
                      alt="Veículo" 
                      className="w-full h-48 object-cover rounded-2xl border border-zinc-800/50"
                    />
                    {aiResults && (
                      <div className="absolute top-3 right-3 bg-emerald-500 text-zinc-950 text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg flex items-center gap-1">
                        <Sparkles size={10} strokeWidth={1.5} /> IA DETECTOU
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-400 ml-1">Placa</label>
                    <IMaskInput
                      mask={[
                        { mask: 'aaa-0000' },
                        { mask: 'aaa0a00' }
                      ]}
                      definitions={{
                        'a': /[A-Za-z]/,
                        '0': /[0-9]/
                      }}
                      dispatch={(appended, dynamicMasked) => {
                        const value = (dynamicMasked.value + appended).replace(/[^A-Za-z0-9]/g, '');
                        // No Brasil, a diferença entre placa comum (ABC-1234) e Mercosul (ABC1D23)
                        // é o 5º caractere (índice 4). Se for letra, é Mercosul.
                        if (value.length >= 5 && /[A-Za-z]/.test(value[4])) {
                          return dynamicMasked.compiledMasks[1];
                        }
                        return dynamicMasked.compiledMasks[0];
                      }}
                      prepare={(str) => str.toUpperCase()}
                      placeholder="ABC-1234 ou ABC1D23"
                      className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-2xl py-3 px-4 text-xl font-mono text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-700 uppercase"
                      value={plate}
                      unmask={false}
                      onAccept={(value) => setPlate(value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-400 ml-1">Marca</label>
                    <input
                      type="text"
                      placeholder="Ex: Honda"
                      className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-2xl py-3 px-4 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                      value={vehicleInfo.brand}
                      onChange={(e) => setVehicleInfo({...vehicleInfo, brand: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-400 ml-1">Modelo</label>
                    <input
                      type="text"
                      placeholder="Ex: Civic"
                      className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-2xl py-3 px-4 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                      value={vehicleInfo.model}
                      onChange={(e) => setVehicleInfo({...vehicleInfo, model: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-400 ml-1">Cor</label>
                    <input
                      type="text"
                      placeholder="Ex: Prata"
                      className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-2xl py-3 px-4 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                      value={vehicleInfo.color}
                      onChange={(e) => setVehicleInfo({...vehicleInfo, color: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-zinc-400 ml-1">Tipo de Veículo</label>
                    <select
                      className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-2xl py-3 px-4 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                      value={vehicleInfo.type}
                      onChange={(e) => setVehicleInfo({...vehicleInfo, type: e.target.value as any})}
                    >
                      <option value="HATCH">Hatch</option>
                      <option value="SEDAN">Sedan</option>
                      <option value="SUV">SUV</option>
                      <option value="CAMINHONETE">Caminhonete</option>
                    </select>
                  </div>
                </div>

                {aiResults && (
                  <div className="p-4 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="text-emerald-500" size={16} strokeWidth={1.5} />
                      <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Análise de Sujeira</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-300 font-medium text-sm">Nível Detectado:</span>
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                        aiResults.nivel_sujeira === 'Pesado' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                        aiResults.nivel_sujeira === 'Médio' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' : 
                        'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      }`}>
                        {aiResults.nivel_sujeira}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  disabled={!plate}
                  onClick={() => setStep(2)}
                  className="w-full bg-zinc-100 disabled:opacity-50 text-zinc-950 py-4 rounded-2xl font-bold text-lg hover:bg-white transition-all flex items-center justify-center gap-2"
                >
                  Próximo Passo <ArrowRight size={20} strokeWidth={1.5} />
                </button>
              </>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-zinc-100">
                <User size={24} strokeWidth={1.5} className="text-zinc-400" />
                <h2 className="text-xl font-bold tracking-tight">Identificar Cliente</h2>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowNewClientForm(!showNewClientForm)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                    showNewClientForm 
                    ? 'bg-zinc-900/50 text-zinc-100 border-zinc-800/50' 
                    : 'bg-zinc-100/10 text-zinc-100 border-zinc-100/20 hover:bg-zinc-100/20'
                  }`}
                >
                  {showNewClientForm ? <Search size={16} strokeWidth={1.5} /> : <Plus size={16} strokeWidth={1.5} />} 
                  {showNewClientForm ? 'Buscar' : 'Novo'}
                </button>
              </div>
            </div>

            {showNewClientForm ? (
              <div className="space-y-4 p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/50 animate-in fade-in zoom-in-95">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Nome Completo</label>
                  <input
                    type="text"
                    placeholder="Ex: João Silva"
                    className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-xl py-3 px-4 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                    value={newClient.name}
                    onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Telefone / WhatsApp</label>
                  <IMaskInput
                    mask="(00) 00000-0000"
                    placeholder="(00) 00000-0000"
                    className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-xl py-3 px-4 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                    value={newClient.phone}
                    onAccept={(value) => setNewClient({...newClient, phone: value})}
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 bg-zinc-900/50 text-zinc-300 border border-zinc-800/50 py-3 rounded-xl font-medium hover:bg-zinc-800/50 transition-all text-sm"
                  >
                    Voltar
                  </button>
                  <button
                    disabled={!newClient.name || !newClient.phone}
                    onClick={() => setStep(3)}
                    className="flex-[2] bg-zinc-100 disabled:opacity-50 text-zinc-950 py-3 rounded-xl font-medium hover:bg-white transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    Continuar com Novo Cliente <ArrowRight size={18} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} strokeWidth={1.5} />
                  <input
                    type="text"
                    placeholder="Nome ou telefone do cliente..."
                    className="w-full bg-zinc-900/50 border border-zinc-800/50 rounded-2xl py-4 pl-12 pr-4 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {filteredClients.map(client => (
                    <button
                      key={client.id}
                      onClick={() => {
                        setSelectedClient(client);
                        setStep(3);
                      }}
                      className="w-full flex items-center justify-between p-4 bg-zinc-900/50 hover:bg-zinc-800/50 border border-zinc-800/50 rounded-xl transition-all group"
                    >
                      <div className="text-left">
                        <p className="font-bold text-zinc-100 group-hover:text-white transition-colors">{client.name}</p>
                        <p className="text-sm text-zinc-500">{client.phone}</p>
                      </div>
                      <ArrowRight className="text-zinc-600 group-hover:text-zinc-300 transition-all group-hover:translate-x-1" size={20} strokeWidth={1.5} />
                    </button>
                  ))}
                  {filteredClients.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-zinc-500">Nenhum cliente encontrado.</p>
                      <button 
                        onClick={() => setShowNewClientForm(true)}
                        className="text-zinc-300 hover:text-white font-medium mt-2 flex items-center gap-2 mx-auto transition-colors text-sm"
                      >
                        <Plus size={18} strokeWidth={1.5} /> Cadastrar Novo
                      </button>
                    </div>
                  )}
                </div>
                <div className="pt-4">
                  <button
                    onClick={() => setStep(1)}
                    className="w-full bg-zinc-900/50 border border-zinc-800/50 text-zinc-300 py-4 rounded-2xl font-medium hover:bg-zinc-800/50 transition-all text-sm"
                  >
                    Voltar
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-zinc-100 mb-2">
                <Settings size={24} strokeWidth={1.5} className="text-zinc-400" />
                <h2 className="text-xl font-bold tracking-tight">Selecionar Serviço</h2>
              </div>
              
              {aiResults && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-500">
                  <Sparkles size={14} strokeWidth={1.5} /> SERVIÇO SUGERIDO PELA IA
                </div>
              )}

              {/* Filtro por Categoria */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {['TODOS', 'LAVAGEM', 'POLIMENTO', 'CRISTALIZACAO', 'HIGIENIZACAO', 'ESTETICA', 'OUTROS'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      categoryFilter === cat
                        ? 'bg-zinc-100 text-zinc-950'
                        : 'bg-zinc-900/50 text-zinc-400 border border-zinc-800/50 hover:border-zinc-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-3">
                {filteredServices.map(service => {
                  const basePrice = service.prices[vehicleInfo.type] ?? 0;
                  const isSelected = selectedService?.id === service.id;
                  const currentPrice = isSelected && customServicePrice !== null ? customServicePrice : basePrice;
                  
                  return (
                    <div key={service.id} className={`rounded-2xl border transition-all ${
                      isSelected 
                      ? 'bg-zinc-100/10 border-zinc-100/20' 
                      : 'bg-zinc-900/50 border-zinc-800/50'
                    }`}>
                      <button
                        onClick={() => {
                          setSelectedService(service);
                          if (customServicePrice === null) {
                            setCustomServicePrice(basePrice);
                          }
                        }}
                        className="w-full flex items-center justify-between p-5"
                      >
                        <div className="text-left">
                          <p className="font-bold text-zinc-100">{service.name}</p>
                          <p className="text-sm text-zinc-500">{service.duration_minutes} min</p>
                          {service.category && (
                            <p className="text-xs text-zinc-600 mt-1">{service.category}</p>
                          )}
                        </div>
                        <p className="font-bold text-zinc-300">R$ {currentPrice.toFixed(2)}</p>
                      </button>
                      
                      {isSelected && (
                        <div className="px-5 pb-5 space-y-2 animate-in fade-in slide-in-from-top-2">
                          <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <span>💡 Preço base: R$ {basePrice.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-sm text-zinc-400 whitespace-nowrap">Preço final:</label>
                            <input
                              type="number"
                              step="0.01"
                              min={basePrice}
                              value={currentPrice}
                              onChange={(e) => setCustomServicePrice(parseFloat(e.target.value) || basePrice)}
                              className="flex-1 bg-zinc-900/50 border border-zinc-800/50 rounded-xl py-2 px-3 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                              placeholder={`Mínimo: R$ ${basePrice.toFixed(2)}`}
                            />
                          </div>
                          <p className="text-xs text-zinc-600">
                            Ajuste o preço se o veículo estiver muito sujo ou precisar de trabalho extra
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
                {filteredServices.length === 0 && (
                  <div className="text-center py-8 text-zinc-500">
                    <p>Nenhum serviço disponível para esta categoria.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 text-zinc-100 mb-2">
                <Plus size={24} strokeWidth={1.5} className="text-zinc-400" />
                <h2 className="text-xl font-bold tracking-tight">Serviços Extras</h2>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {extras.map(extra => {
                  const isSelected = selectedExtras.includes(extra.id);
                  const basePrice = extra.price ?? 0;
                  const currentPrice = customExtraPrices[extra.id] ?? basePrice;
                  
                  return (
                    <div key={extra.id} className={`rounded-xl border transition-all ${
                      isSelected
                      ? 'bg-zinc-100/10 border-zinc-100/20'
                      : 'bg-zinc-900/50 border-zinc-800/50'
                    }`}>
                      <button
                        onClick={() => toggleExtra(extra.id)}
                        className="w-full flex items-center justify-between p-4"
                      >
                        <div className="text-left">
                          <p className="text-sm font-bold text-zinc-100">{extra.name}</p>
                          <p className="text-xs text-zinc-400">R$ {currentPrice.toFixed(2)}</p>
                        </div>
                        {isSelected && <CheckCircle2 size={16} strokeWidth={1.5} className="text-zinc-100" />}
                      </button>
                      
                      {isSelected && (
                        <div className="px-4 pb-4 space-y-2 animate-in fade-in slide-in-from-top-2">
                          <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <span>💡 Preço base: R$ {basePrice.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-xs text-zinc-400 whitespace-nowrap">Preço final:</label>
                            <input
                              type="number"
                              step="0.01"
                              min={basePrice}
                              value={currentPrice}
                              onChange={(e) => setCustomExtraPrices(prev => ({
                                ...prev,
                                [extra.id]: parseFloat(e.target.value) || basePrice
                              }))}
                              className="flex-1 bg-zinc-900/50 border border-zinc-800/50 rounded-lg py-1.5 px-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-700"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/50 flex items-center justify-between">
              <div className="text-zinc-400 text-sm font-medium">Total Estimado:</div>
              <div className="text-2xl font-bold text-zinc-100">
                R$ {(
                  (customServicePrice !== null ? customServicePrice : (selectedService?.prices[vehicleInfo.type] || 0)) + 
                  selectedExtras.reduce((acc, id) => {
                    const extra = extras.find(e => e.id === id);
                    const customPrice = customExtraPrices[id];
                    return acc + (customPrice !== undefined ? customPrice : (extra?.price || 0));
                  }, 0)
                ).toFixed(2)}
              </div>
            </div>

            <div className="pt-4 flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="flex-1 bg-zinc-900/50 border border-zinc-800/50 text-zinc-300 py-4 rounded-2xl font-medium hover:bg-zinc-800/50 transition-all text-sm"
              >
                Voltar
              </button>
              <button
                disabled={!selectedService || isSubmitting}
                onClick={handleCompleteCheckIn}
                className="flex-[2] bg-zinc-100 disabled:opacity-50 text-zinc-950 py-4 rounded-2xl font-bold text-lg hover:bg-white transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} strokeWidth={1.5} />
                    Finalizando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={20} strokeWidth={1.5} /> Finalizar Check-in
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-8 text-zinc-600">
        <div className="flex items-center gap-2">
          <QrCode size={20} strokeWidth={1.5} />
          <span className="text-sm font-medium">Scan QR Code</span>
        </div>
        <div className="flex items-center gap-2">
          <Car size={20} strokeWidth={1.5} />
          <span className="text-sm font-medium">Reconhecimento de Placa</span>
        </div>
      </div>
    </div>
  );
}
