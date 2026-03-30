# 🚀 Guia de Configuração - Groq AI + Cache de Veículos

**Data**: 30/03/2026  
**Sistema**: Detecção Automática de Veículos com Cache Inteligente

---

## 📋 O que foi implementado?

### Sistema Híbrido Inteligente:

1. **PlateRecognizer** → Detecta placa (sempre)
2. **Cache no Banco** → Busca dados de clientes recorrentes
3. **Groq Vision AI** → Detecta marca/modelo/cor de clientes novos
4. **Entrada Manual** → Fallback final

**Custo Total: R$ 0,00**  
**Limite: 14.400 análises/dia**

---

## 🔧 Passo 1: Criar Tabela no Supabase

### 1.1 Acessar Supabase
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor** (menu lateral)

### 1.2 Executar SQL
1. Clique em **New Query**
2. Copie TODO o conteúdo do arquivo `supabase-vehicle-cache.sql`
3. Cole no editor
4. Clique em **Run** (ou pressione Ctrl+Enter)

### 1.3 Verificar
Você deve ver a mensagem: **Success. No rows returned**

---

## 🔑 Passo 2: Obter Chave do Groq

### 2.1 Criar Conta (Grátis)
1. Acesse: https://console.groq.com/
2. Clique em **Sign Up** (ou **Get Started**)
3. Cadastre-se com Google ou Email
4. **NÃO precisa de cartão de crédito!**

### 2.2 Gerar API Key
1. Após login, vá em: https://console.groq.com/keys
2. Clique em **Create API Key**
3. Dê um nome: `Brutus Lavajato`
4. Clique em **Submit**
5. **COPIE A CHAVE** (ela aparece apenas uma vez!)
   - Formato: `gsk_...` (começa com gsk_)

---

## ⚙️ Passo 3: Configurar no Projeto

### 3.1 Arquivo .env Local
1. Abra o arquivo `.env` na raiz do projeto
2. Encontre a linha:
   ```
   GROQ_API_KEY=sua_chave_groq_aqui
   ```
3. Substitua por:
   ```
   GROQ_API_KEY=gsk_sua_chave_real_aqui
   ```
4. Salve o arquivo

### 3.2 Vercel (Produção)
1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Clique em **Add New**
5. Preencha:
   - **Name**: `GROQ_API_KEY`
   - **Value**: `gsk_sua_chave_real_aqui`
   - Marque: **Production**, **Preview**, **Development**
6. Clique em **Save**

---

## 🧪 Passo 4: Testar

### 4.1 Testar Localmente
1. Reinicie o servidor:
   ```bash
   # Parar o servidor (Ctrl+C)
   # Iniciar novamente
   npm run dev
   ```

2. Acesse: http://localhost:3000
3. Faça login
4. Vá em **Check-in**
5. Tire uma foto de um veículo

### 4.2 O que deve acontecer:

**Cliente Novo (1ª vez):**
```
1. PlateRecognizer detecta placa: ABC1234 ✅
2. Busca no cache: Não encontrado ❌
3. Groq detecta: Gol, Volkswagen, Branco ✅
4. Salva no cache ✅
5. Preenche formulário automaticamente ✅
```

**Cliente Recorrente (2ª vez em diante):**
```
1. PlateRecognizer detecta placa: ABC1234 ✅
2. Busca no cache: ENCONTRADO! ✅
3. Preenche formulário automaticamente (instantâneo) ✅
4. Não usa Groq (economiza quota) ✅
```

---

## 📊 Verificar Logs

### No Terminal (Desenvolvimento):
Você verá logs como:
```
Plate detected: ABC1234
Searching vehicle cache for plate: ABC1234
Found in cache: { marca: 'Volkswagen', modelo: 'Gol', cor: 'Branco' }
Final result (from cache): { ... }
```

Ou se não estiver no cache:
```
Plate detected: ABC1234
Not found in cache, will try AI detection
Trying Groq Vision for make/model/color...
Groq text response: {"marca":"Volkswagen","modelo":"Gol","cor":"Branco"}
Saving to cache: { ... }
```

---

## ❓ Troubleshooting

### Erro: "Groq API error: 401"
**Causa**: Chave API inválida  
**Solução**: Verifique se copiou a chave corretamente (deve começar com `gsk_`)

### Erro: "relation vehicle_cache does not exist"
**Causa**: Tabela não foi criada no Supabase  
**Solução**: Execute o SQL do Passo 1 novamente

### Groq não detecta nada
**Causa**: Foto muito escura ou veículo não visível  
**Solução**: Tire foto com boa iluminação e veículo completo na imagem

### Placa detectada mas marca/modelo/cor vazios
**Causa**: Normal! Groq pode falhar em alguns casos  
**Solução**: Usuário preenche manualmente (só na 1ª vez)

---

## 📈 Monitorar Uso do Groq

### Ver Quota Restante:
1. Acesse: https://console.groq.com/settings/limits
2. Veja: **Requests Per Day (RPD)**
3. Limite: 14.400/dia

### Dica:
- Com cache, você usa Groq apenas para clientes novos
- Após 1 mês, ~90% será do cache (grátis e instantâneo)

---

## ✅ Checklist Final

- [ ] Tabela `vehicle_cache` criada no Supabase
- [ ] Chave Groq obtida em console.groq.com
- [ ] `GROQ_API_KEY` configurada no `.env` local
- [ ] `GROQ_API_KEY` configurada na Vercel
- [ ] Servidor reiniciado
- [ ] Teste com foto de veículo funcionando
- [ ] Cache salvando dados corretamente

---

## 🎉 Pronto!

Agora você tem:
- ✅ Detecção automática de placas (PlateRecognizer)
- ✅ Cache inteligente (clientes recorrentes)
- ✅ IA gratuita (Groq - 14.400/dia)
- ✅ Custo zero
- ✅ Sistema que melhora com o tempo

**Dúvidas?** Verifique os logs no terminal ou console do navegador.
