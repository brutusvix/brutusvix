# Variáveis de Ambiente para Vercel

## 📋 Configuração Necessária

Acesse o painel da Vercel: https://vercel.com/dashboard
Vá em: **Seu Projeto → Settings → Environment Variables**

---

## ✅ Variáveis OBRIGATÓRIAS

### 1. PlateRecognizer API (Reconhecimento de Placas)
```
PLATE_RECOGNIZER_API_KEY=sua_chave_platerecognizer_aqui
```
- **O que é**: API para reconhecimento automático de placas de veículos
- **Onde obter**: https://app.platerecognizer.com/
- **Plano gratuito**: 2.500 reconhecimentos/mês
- **Precisão**: 95-99%
- **Detecta**: Placa + Tipo de veículo

---

### 2. Gemini AI (OPCIONAL - Marca, Modelo, Cor)
```
GEMINI_API_KEY=sua_chave_gemini_aqui
```
- **O que é**: API do Google para detectar marca, modelo e cor do veículo
- **Onde obter**: https://aistudio.google.com/apikey
- **Plano gratuito**: 1.500 requisições/dia
- **OPCIONAL**: Se não configurar, usuário preenche manualmente
- **Detecta**: Marca, Modelo, Cor

---

### 3. Supabase (Banco de Dados e Autenticação)

#### URL do Supabase
```
SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
```

#### Chave Pública (Anon Key) - Segura para Frontend
```
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

#### Chave Privada (Service Key) - APENAS Backend
```
SUPABASE_SERVICE_KEY=sua_service_key_aqui
```

---

### 4. JWT Secret (Segurança)
```
JWT_SECRET=seu_jwt_secret_aqui
```
- **O que é**: Chave secreta para assinar tokens JWT
- **Como gerar**: `openssl rand -base64 64`
- **Importante**: NUNCA compartilhe esta chave

---

### 5. URL da Aplicação
```
APP_URL=https://seu-projeto.vercel.app
```
- Substitua pelo URL real do seu projeto na Vercel

---

## ❌ Variáveis REMOVIDAS (Não usar mais)

**Nenhuma** - Todas as variáveis são úteis agora!

- ✅ PLATE_RECOGNIZER_API_KEY - Detecta placa
- ✅ GEMINI_API_KEY - Detecta marca/modelo/cor (OPCIONAL)
- ✅ Outras variáveis do Supabase

---

## 🔧 Como Adicionar na Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Para cada variável:
   - Clique em **Add New**
   - Cole o **Name** (nome da variável)
   - Cole o **Value** (valor da variável - use os valores reais do seu arquivo `.env`)
   - Selecione **Production**, **Preview** e **Development**
   - Clique em **Save**

**IMPORTANTE**: 
- Use os valores reais do seu arquivo `.env` local, não os placeholders acima!
- GEMINI_API_KEY é OPCIONAL - se não adicionar, usuário preenche manualmente

---

## 📝 Resumo das Mudanças

### Solução Híbrida (Melhor dos Dois Mundos)

**PlateRecognizer** (Obrigatório):
- ✅ Detecta placa com 95-99% precisão
- ✅ Detecta tipo de veículo
- ✅ 2.500 chamadas/mês grátis

**Gemini Vision** (Opcional):
- ✅ Detecta marca, modelo e cor
- ✅ 1.500 chamadas/dia grátis
- ✅ Se não configurar, entrada manual

**Resultado**:
- 🎯 Placa sempre detectada automaticamente
- 🎯 Marca/modelo/cor detectados se Gemini configurado
- 🎯 Entrada manual como fallback
- 🎯 100% gratuito!

---

## 🚀 Após Configurar

1. Salve todas as variáveis
2. Faça um novo deploy ou aguarde o deploy automático do GitHub
3. Teste o reconhecimento de placas no Check-in

---

## 🔒 Segurança

- ✅ Todas as chaves estão no `.gitignore`
- ✅ Nunca commite o arquivo `.env`
- ✅ Use `.env.example` como referência
- ✅ PlateRecognizer é mais seguro que Gemini (não expõe dados)

---

## 📞 Suporte

- PlateRecognizer: https://guides.platerecognizer.com/
- Supabase: https://supabase.com/docs
- Vercel: https://vercel.com/docs
