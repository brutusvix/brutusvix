# Stack Tecnológica - BRUTUS Lavajato

## 🎯 Resumo Executivo
Sistema completo de gestão de lavajato com múltiplas unidades, reconhecimento de placas por IA, WhatsApp integrado e PWA para mobile.

---

## 🏗️ Arquitetura

### Frontend
- **Framework**: React 19.0.0
- **Linguagem**: TypeScript 5.8.2
- **Build Tool**: Vite 6.2.0
- **Roteamento**: React Router DOM 7.13.1
- **Estilização**: Tailwind CSS 4.1.14
- **Animações**: Motion 12.23.24
- **Ícones**: Lucide React 0.546.0

### Backend
- **Runtime**: Node.js com Express 4.21.2
- **Servidor Local**: tsx 4.21.0 (desenvolvimento)
- **Serverless**: Vercel Functions (@vercel/node 3.0.0)
- **Autenticação**: JWT (jsonwebtoken 9.0.3)
- **Segurança**: Helmet 8.1.0, CORS 2.8.6, Rate Limiting 7.5.1

### Banco de Dados
- **Principal**: Supabase (PostgreSQL)
- **Cliente**: @supabase/supabase-js 2.99.2
- **Features**: 
  - Autenticação integrada
  - Realtime subscriptions
  - Row Level Security (RLS)
  - Auto-refresh de tokens JWT

---

## 🤖 Inteligência Artificial

### 1. Reconhecimento de Placas
- **Serviço**: PlateRecognizer API
- **Precisão**: 95-99%
- **Plano**: Gratuito (2.500 reconhecimentos/mês)
- **Uso**: Detectar placa do veículo automaticamente via foto
- **Endpoint**: `api/analyze-vehicle.ts`

### 2. Análise de Veículos (Desativada)
- **IA Original**: Google Gemini (gemini-1.5-flash)
- **IA Alternativa**: Groq AI (llama-3.2-90b-vision-preview)
- **Status**: Código presente mas não utilizado atualmente
- **Motivo**: PlateRecognizer já fornece informações suficientes

---

## 📱 Recursos Mobile

### PWA (Progressive Web App)
- **Manifest**: `/public/manifest.json`
- **Ícones**: 
  - Apple Touch Icon (180x180)
  - Web App Icons (192x192, 512x512)
  - Favicon (96x96)
- **Features**:
  - Instalável na tela inicial do iPhone/Android
  - Funciona offline (cache)
  - Notificações push (preparado)

---

## 💬 Integração WhatsApp

### Biblioteca
- **Nome**: @whiskeysockets/baileys 7.0.0-rc.9
- **Tipo**: Multi-device (não precisa manter celular conectado)
- **Autenticação**: QR Code
- **Armazenamento**: Pasta `auth_info_baileys/`
- **Features**:
  - Envio de mensagens automáticas
  - Notificações de agendamentos
  - Confirmações de serviços

---

## 📊 Relatórios e Exportação

### Geração de PDFs
- **Biblioteca**: jsPDF 4.2.1
- **Tabelas**: jspdf-autotable 5.0.7
- **Uso**: 
  - Relatórios de produção
  - Folhas de pagamento
  - Comprovantes de serviços

### Gráficos
- **Biblioteca**: Recharts 3.8.0
- **Uso**: Dashboard com métricas de desempenho

---

## 🔐 Segurança

### Autenticação
- **Método**: JWT (JSON Web Tokens)
- **Provider**: Supabase Auth
- **Refresh**: Automático (antes de expirar)
- **Persistência**: localStorage + sessionStorage

### Proteções
- **Rate Limiting**: 100 requisições/hora por IP
- **CORS**: Configurado para domínios específicos
- **Helmet**: Headers de segurança HTTP
- **RLS**: Row Level Security no Supabase

---

## 🚀 Deploy e Hospedagem

### Plataforma
- **Hosting**: Vercel
- **Tipo**: Serverless Functions
- **CI/CD**: Deploy automático via Git push
- **Domínio**: brutusvix.vercel.app

### Variáveis de Ambiente (Vercel)
```
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_KEY=sua_service_role_key
PLATE_RECOGNIZER_API_KEY=sua_plate_key
JWT_SECRET=seu_jwt_secret
ALLOWED_ORIGINS=https://brutusvix.vercel.app
```

---

## 📦 Funcionalidades Principais

### Gestão
- ✅ Múltiplas unidades
- ✅ Agendamentos com calendário
- ✅ Check-in rápido
- ✅ Controle de funcionários
- ✅ Sistema de metas e comissões
- ✅ Gestão financeira (receitas/despesas)

### Automação
- ✅ Reconhecimento de placas por IA
- ✅ Notificações via WhatsApp
- ✅ Cálculo automático de pagamentos
- ✅ Relatórios em PDF
- ✅ Cache inteligente (carregamento instantâneo)

### Mobile
- ✅ PWA instalável
- ✅ Layout responsivo
- ✅ Funciona offline
- ✅ Ícone personalizado na tela inicial

---

## 🔄 Atualizações Recentes

### Abril 2026
1. ✅ Auto-refresh de token JWT (sem expiração)
2. ✅ Persistência de filtro de unidade
3. ✅ Sistema de metas por tipo de lavador
4. ✅ Tipo PICKUP para veículos
5. ✅ PWA com ícones personalizados
6. ✅ Correções de layout mobile

---

## 📝 Observações

### Custos
- **Supabase**: Plano gratuito (500MB storage, 2GB bandwidth)
- **Vercel**: Plano gratuito (100GB bandwidth)
- **PlateRecognizer**: Plano gratuito (2.500/mês)
- **Total**: R$ 0,00/mês 🎉

### Performance
- **Carregamento inicial**: ~500ms (com cache)
- **Carregamento sem cache**: ~2s
- **Realtime**: Atualizações instantâneas via WebSocket

### Escalabilidade
- **Usuários simultâneos**: Ilimitado (Vercel serverless)
- **Banco de dados**: PostgreSQL escalável (Supabase)
- **Rate limiting**: Configurável por endpoint
