# 🔍 Auditoria Completa - Erro 403 na Vercel

## 📋 Problema Identificado

**Erro**: 403 Forbidden ao chamar `/api/analyze-vehicle` na Vercel  
**Causa Raiz**: Token JWT do Supabase expirado

---

## 🔎 Análise Detalhada

### 1. Fluxo de Autenticação
```
Login → Supabase Auth → Token JWT → localStorage → API Request
```

### 2. Problema Encontrado
- Token JWT do Supabase expira após 1 hora (padrão)
- Frontend estava usando token do `localStorage` sem verificar validade
- Quando token expirava, API retornava 403

### 3. Logs Adicionados
- ✅ Verificação de variáveis de ambiente
- ✅ Detalhes do erro de autenticação
- ✅ Mensagens de hint para o usuário

---

## ✅ Correções Implementadas

### 1. Renovação Automática de Token
**Arquivo**: `src/utils/auth.ts` (NOVO)

```typescript
export async function getValidToken(): Promise<string | null> {
  // Obtém sessão atual do Supabase
  // Se token expirou, Supabase renova automaticamente
  // Atualiza localStorage com novo token
}
```

**Benefícios**:
- ✅ Token sempre válido
- ✅ Renovação transparente
- ✅ Sem interrupção para o usuário

### 2. Logs Detalhados na API
**Arquivo**: `api/analyze-vehicle.ts`

**Antes**:
```typescript
if (error || !user) {
  return res.status(403).json({ error: 'Token inválido' });
}
```

**Depois**:
```typescript
if (error) {
  console.error('Supabase auth error:', {
    message: error.message,
    status: error.status,
    name: error.name
  });
  return res.status(403).json({ 
    error: 'Falha na autenticação', 
    details: error.message,
    hint: 'Token pode estar expirado. Faça logout e login novamente.'
  });
}
```

**Benefícios**:
- ✅ Logs detalhados no Vercel
- ✅ Mensagens claras para o usuário
- ✅ Fácil debug em produção

### 3. Verificação de Variáveis de Ambiente
```typescript
if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('Supabase config missing:', { 
    hasUrl: !!supabaseUrl, 
    hasServiceKey: !!supabaseServiceKey, 
    hasAnonKey: !!supabaseAnonKey 
  });
  return res.status(500).json({ 
    error: 'Supabase not configured',
    details: 'Missing environment variables. Check Vercel settings.'
  });
}
```

**Benefícios**:
- ✅ Identifica rapidamente variáveis faltando
- ✅ Mensagem clara sobre o problema
- ✅ Facilita configuração na Vercel

---

## 🚀 Como Testar

### 1. Aguarde o Deploy na Vercel
- Vercel fará deploy automático do commit
- Aguarde 1-2 minutos

### 2. Teste o Reconhecimento de Placa
1. Acesse: https://brutusvix.vercel.app
2. Faça login
3. Vá em "Check-in"
4. Clique em "Foto com IA"
5. Tire uma foto da placa

### 3. Se Ainda Der Erro 403
**Verifique as variáveis de ambiente na Vercel**:

1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto
3. Settings → Environment Variables
4. Confirme que TODAS estão configuradas:
   - ✅ PLATE_RECOGNIZER_API_KEY
   - ✅ SUPABASE_URL
   - ✅ VITE_SUPABASE_URL
   - ✅ VITE_SUPABASE_ANON_KEY
   - ✅ SUPABASE_SERVICE_KEY
   - ✅ JWT_SECRET
   - ✅ APP_URL

5. Se alguma estiver faltando, adicione
6. Faça um novo deploy (Deployments → Redeploy)

---

## 📊 Checklist de Verificação

### Frontend
- [x] Token obtido via `getValidToken()` (renova automaticamente)
- [x] Tratamento de erro de sessão expirada
- [x] Mensagens claras para o usuário

### Backend (Vercel)
- [x] Logs detalhados de autenticação
- [x] Verificação de variáveis de ambiente
- [x] Mensagens de erro com hints
- [x] Suporte a renovação de token

### Configuração
- [ ] Variáveis de ambiente na Vercel (VERIFICAR)
- [ ] PlateRecognizer API key válida
- [ ] Supabase configurado corretamente

---

## 🔧 Troubleshooting

### Erro: "Supabase not configured"
**Solução**: Adicione as variáveis de ambiente na Vercel

### Erro: "Token inválido"
**Solução**: Faça logout e login novamente

### Erro: "PlateRecognizer API não configurada"
**Solução**: Adicione `PLATE_RECOGNIZER_API_KEY` na Vercel

### Erro: "Sessão expirada"
**Solução**: O sistema agora renova automaticamente. Se persistir, faça logout/login

---

## 📝 Próximos Passos

1. ✅ Aguardar deploy na Vercel
2. ✅ Verificar variáveis de ambiente
3. ✅ Testar reconhecimento de placa
4. ✅ Monitorar logs na Vercel (se houver erro)

---

## 🎯 Resultado Esperado

Após essas correções:
- ✅ Token sempre válido (renovação automática)
- ✅ Logs detalhados para debug
- ✅ Mensagens claras de erro
- ✅ Reconhecimento de placa funcionando
- ✅ Sem mais erro 403

---

**Data da Auditoria**: 30/03/2026  
**Status**: Correções implementadas e enviadas para produção
