# Correção: Token JWT Expirando

## Problema
Token JWT do Supabase estava expirando após alguns dias, causando erro 401 ao tentar finalizar pagamentos em produção.

## Causa
- Tokens JWT do Supabase têm tempo de expiração configurável (padrão: 1 hora a 7 dias)
- O sistema não estava fazendo refresh automático do token
- Quando o token expirava, o usuário precisava fazer logout/login manual

## Solução Implementada

### 1. Configuração do Cliente Supabase (`src/lib/supabase.ts`)
```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,  // Refresh automático antes de expirar
    persistSession: true,    // Manter sessão no localStorage
    detectSessionInUrl: false
  }
});
```

### 2. Listener de Refresh no DataContext (`src/DataContext.tsx`)
Adicionado listener que:
- Detecta quando o Supabase faz refresh automático do token
- Atualiza o token no localStorage automaticamente
- Mostra logs no console para debug
- Limpa dados ao fazer logout

### 3. Melhor Tratamento de Erros
- API serverless (`api/transactions.ts`) retorna mensagem clara quando token expira
- Frontend (`DataContext.tsx`) detecta erro 401 e redireciona para login se necessário
- Logs detalhados para facilitar debug

## Como Funciona Agora

1. **Login**: Usuário faz login e recebe token JWT
2. **Uso Normal**: Token é usado em todas as requisições
3. **Antes de Expirar**: Supabase automaticamente faz refresh do token (sem interromper o usuário)
4. **Token Atualizado**: Novo token é salvo no localStorage automaticamente
5. **Sem Interrupção**: Usuário continua usando o sistema normalmente

## Configuração Adicional (Opcional)

Se quiser aumentar o tempo de expiração do token no Supabase:

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em: **Settings → Auth → JWT Expiry**
4. Aumente o valor (ex: 604800 segundos = 7 dias)

## Teste

Após fazer deploy:
1. Faça login no sistema
2. Abra o Console do navegador (F12)
3. Você verá logs como:
   - `✅ Login realizado com sucesso`
   - `🔐 Token expira em: [data/hora]`
   - `🔄 Token atualizado automaticamente` (quando fizer refresh)
4. Tente finalizar um pagamento - deve funcionar normalmente

## Arquivos Alterados
- `src/lib/supabase.ts` - Configuração de auto-refresh
- `src/DataContext.tsx` - Listener de refresh de token
- `src/components/Login.tsx` - Logs de expiração
- `api/transactions.ts` - Melhor tratamento de erro 401
