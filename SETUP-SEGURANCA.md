# 🔒 Guia de Configuração de Segurança - BRUTUS LAVAJATO

## ✅ O QUE JÁ FOI FEITO AUTOMATICAMENTE

1. ✅ Dependência `express-rate-limit` instalada
2. ✅ JWT_SECRET gerado e adicionado ao arquivo `.env`
3. ✅ Arquivo `.env` criado com template

---

## 🚨 O QUE VOCÊ PRECISA FAZER AGORA (MANUAL)

### PASSO 1: Rotacionar Credenciais do Supabase (CRÍTICO!)

**Por que?** As credenciais antigas estavam expostas no código. Você PRECISA invalidá-las.

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em: **Settings** → **API**
4. Clique em **Reset** para:
   - `anon` / `public` key
   - `service_role` key
5. **COPIE** as novas chaves geradas
6. **Cole** no arquivo `.env` deste projeto:
   ```
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGc... (nova chave anon)
   SUPABASE_SERVICE_KEY=eyJhbGc... (nova chave service_role)
   ```

---

### PASSO 2: Rotacionar Chave da API Gemini

**Por que?** A chave antiga estava exposta no frontend.

1. Acesse: https://aistudio.google.com/apikey
2. **Revogue** a chave antiga (se existir)
3. Clique em **Create API Key**
4. **Copie** a nova chave
5. **Cole** no arquivo `.env`:
   ```
   GEMINI_API_KEY=AIzaSy... (sua nova chave)
   ```

---

### PASSO 3: Testar Localmente

Depois de preencher TODAS as variáveis no `.env`, rode:

```bash
npm run dev
```

**Teste estas funcionalidades:**
- ✅ Login (deve funcionar normalmente)
- ✅ Upload de foto com IA (agora usa o backend)
- ✅ Faça 6 tentativas de login rápidas (a 6ª deve ser bloqueada por rate limiting)

---

### PASSO 4: Configurar Vercel (Deploy em Produção)

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em: **Settings** → **Environment Variables**
4. Adicione TODAS estas variáveis:

```
VITE_SUPABASE_URL = https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGc... (nova chave anon)
SUPABASE_SERVICE_KEY = eyJhbGc... (nova chave service_role)
JWT_SECRET = pWC5W/oR6R50lbQgMjm2jFmAhFGYrpEhvYOleALNFDm1QLwWi8ETSZfluya+jZzz5xtLcEUtJ0T1mvieLxuDw==
GEMINI_API_KEY = AIzaSy... (sua nova chave)
```

5. Clique em **Save**
6. Faça um novo deploy (ou ele será feito automaticamente)

---

## 🎯 CHECKLIST FINAL

Antes de considerar concluído, verifique:

- [ ] Novas chaves do Supabase geradas e configuradas
- [ ] Chaves antigas do Supabase REVOGADAS
- [ ] Nova chave Gemini gerada e configurada
- [ ] Chave antiga Gemini REVOGADA
- [ ] Arquivo `.env` preenchido completamente
- [ ] Teste local funcionando (npm run dev)
- [ ] Variáveis configuradas no Vercel
- [ ] Deploy em produção funcionando

---

## 🔐 SEGURANÇA IMPLEMENTADA

Seu sistema agora tem:

✅ **Rate Limiting**: Proteção contra brute force e DDoS
✅ **API Gemini no Backend**: Chave não exposta no frontend
✅ **JWT_SECRET forte**: 64 bytes aleatórios
✅ **Sem credenciais hardcoded**: Tudo em variáveis de ambiente
✅ **Validação de ambiente**: Sistema não inicia sem as variáveis necessárias

---

## ⚠️ IMPORTANTE

**NUNCA** commite o arquivo `.env` no Git!

Ele já está no `.gitignore`, mas sempre verifique antes de fazer push.

---

## 📞 Próximos Passos (Opcional - Melhorias Futuras)

Depois que tudo estiver funcionando, considere:

1. **Validação de Input com Zod** (previne SQL injection)
2. **Paginação** (melhora performance)
3. **Logs estruturados** (facilita debugging)
4. **Monitoramento** (Sentry para erros em produção)

---

**Dúvidas?** Qualquer problema, me chame!
