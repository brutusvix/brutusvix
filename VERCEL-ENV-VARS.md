# Variáveis de Ambiente para Vercel

## 📋 Configuração Necessária

Acesse o painel da Vercel: https://vercel.com/dashboard
Vá em: **Seu Projeto → Settings → Environment Variables**

---

## ✅ Variáveis OBRIGATÓRIAS

### 1. PlateRecognizer API (NOVA - Reconhecimento de Placas)
```
PLATE_RECOGNIZER_API_KEY=sua_chave_platerecognizer_aqui
```
- **O que é**: API para reconhecimento automático de placas de veículos
- **Onde obter**: https://app.platerecognizer.com/
- **Plano gratuito**: 2.500 reconhecimentos/mês
- **Precisão**: 95-99%

---

### 2. Supabase (Banco de Dados e Autenticação)

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

### 3. JWT Secret (Segurança)
```
JWT_SECRET=seu_jwt_secret_aqui
```
- **O que é**: Chave secreta para assinar tokens JWT
- **Como gerar**: `openssl rand -base64 64`
- **Importante**: NUNCA compartilhe esta chave

---

### 4. URL da Aplicação
```
APP_URL=https://seu-projeto.vercel.app
```
- Substitua pelo URL real do seu projeto na Vercel

---

## ❌ Variáveis REMOVIDAS (Não usar mais)

### Gemini AI (REMOVIDO)
```
❌ GEMINI_API_KEY - NÃO ADICIONAR MAIS
```
- **Por quê**: Gemini estava com problemas de disponibilidade de modelos
- **Substituído por**: PlateRecognizer (mais confiável e preciso)

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

**IMPORTANTE**: Use os valores reais do seu arquivo `.env` local, não os placeholders acima!

---

## 📝 Resumo das Mudanças

### Antes (com Gemini):
- ❌ GEMINI_API_KEY
- ✅ Outras variáveis

### Agora (com PlateRecognizer):
- ✅ PLATE_RECOGNIZER_API_KEY (NOVA)
- ✅ Todas as outras variáveis do Supabase
- ✅ JWT_SECRET
- ✅ APP_URL

**NOTA**: Os valores acima são apenas exemplos. Use os valores reais do seu arquivo `.env` local.

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
