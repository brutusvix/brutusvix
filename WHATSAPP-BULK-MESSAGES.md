# Sistema de Mensagens em Massa via WhatsApp

## ✅ Implementação Completa

Sistema integrado para envio de mensagens em massa via WhatsApp usando Baileys.

---

## 📋 Funcionalidades

### Interface Visual
- ✅ Página completa dentro do sistema (apenas para DONO)
- ✅ Conexão via QR Code
- ✅ Mensagens pré-prontas (Fechado por chuva, Unidades abertas, Promoção)
- ✅ Mensagem personalizada
- ✅ Seleção de destinatários (individual ou todos)
- ✅ Variável `{nome}` para personalização

### Configurações
- ✅ Intervalo entre mensagens: 5-30 segundos (padrão: 10s)
- ✅ Limite diário: 50-300 mensagens (padrão: 100)
- ✅ Horário permitido: configurável (padrão: 8h-22h)

### Controles
- ✅ Pausar envio
- ✅ Retomar envio
- ✅ Parar envio (limpa fila)
- ✅ Progresso em tempo real
- ✅ Contador de enviadas/falhas

### Segurança
- ✅ Apenas administradores (role: DONO)
- ✅ Validação de horário
- ✅ Limite diário
- ✅ Aviso sobre uso de número secundário

---

## 🗂️ Arquivos Criados/Modificados

### Novos Arquivos
- `whatsapp-service.ts` - Serviço WhatsApp com Baileys
- `src/pages/BulkMessages.tsx` - Interface completa
- `WHATSAPP-BULK-MESSAGES.md` - Esta documentação

### Arquivos Modificados
- `server.ts` - Endpoints da API + Socket.io
- `src/App.tsx` - Rota `/bulk-messages`
- `src/components/Layout.tsx` - Item no menu
- `.gitignore` - Pasta `auth_info_baileys/`
- `package.json` - Dependências instaladas

---

## 📦 Dependências Instaladas

```json
{
  "@whiskeysockets/baileys": "^7.0.0-rc.9",
  "socket.io": "^4.8.3",
  "qrcode-terminal": "^0.12.0",
  "qrcode": "^1.5.4",
  "@types/qrcode": "^1.5.5",
  "pino": "^10.3.1"
}
```

---

## 🔌 Endpoints da API

### POST `/api/whatsapp/connect`
Inicializa conexão com WhatsApp
- Requer: Autenticação + role DONO
- Retorna: `{ success: true, message: "Inicializando conexão..." }`

### GET `/api/whatsapp/status`
Retorna status atual do WhatsApp
- Requer: Autenticação + role DONO
- Retorna:
```json
{
  "connected": true,
  "qrCode": "string ou null",
  "queueSize": 0,
  "sentCount": 0,
  "failedCount": 0,
  "isSending": false,
  "isPaused": false,
  "config": {
    "interval": 10,
    "dailyLimit": 100,
    "startHour": 8,
    "endHour": 22
  }
}
```

### POST `/api/whatsapp/config`
Atualiza configurações
- Requer: Autenticação + role DONO
- Body:
```json
{
  "interval": 10,
  "dailyLimit": 100,
  "startHour": 8,
  "endHour": 22
}
```

### POST `/api/whatsapp/send`
Adiciona mensagens à fila
- Requer: Autenticação + role DONO
- Body:
```json
{
  "recipients": [
    { "phone": "27999999999", "name": "João" }
  ],
  "message": "Olá {nome}! Mensagem aqui..."
}
```

### POST `/api/whatsapp/pause`
Pausa envio de mensagens
- Requer: Autenticação + role DONO

### POST `/api/whatsapp/resume`
Retoma envio de mensagens
- Requer: Autenticação + role DONO

### POST `/api/whatsapp/stop`
Para envio e limpa fila
- Requer: Autenticação + role DONO

---

## 🔄 Eventos Socket.io

O servidor emite eventos em tempo real:

- `whatsapp:qr` - QR Code gerado
- `whatsapp:connected` - WhatsApp conectado
- `whatsapp:disconnected` - WhatsApp desconectado
- `whatsapp:message-sent` - Mensagem enviada com sucesso
- `whatsapp:message-failed` - Falha ao enviar mensagem
- `whatsapp:queue-updated` - Fila atualizada
- `whatsapp:sending-started` - Envio iniciado
- `whatsapp:sending-finished` - Envio finalizado
- `whatsapp:paused` - Envio pausado
- `whatsapp:resumed` - Envio retomado
- `whatsapp:stopped` - Envio parado

---

## 🚀 Como Usar

### 1. Conectar WhatsApp
1. Acesse a seção "Mensagens" no menu (apenas DONO)
2. Clique em "Conectar WhatsApp"
3. Escaneie o QR Code com seu WhatsApp
4. Aguarde a conexão

### 2. Configurar
1. Ajuste o intervalo entre mensagens (recomendado: 10-15s)
2. Defina o limite diário (recomendado: 100-200)
3. Configure o horário permitido
4. Clique em "Salvar Configurações"

### 3. Enviar Mensagens
1. Escolha uma mensagem pré-pronta ou escreva uma personalizada
2. Use `{nome}` para personalizar com o nome do cliente
3. Selecione os destinatários
4. Clique em "Iniciar Envio"

### 4. Controlar Envio
- Use "Pausar" para pausar temporariamente
- Use "Retomar" para continuar
- Use "Parar" para cancelar tudo (limpa fila)

---

## ⚠️ Avisos Importantes

### Risco de Banimento
- WhatsApp pode banir contas que enviam mensagens em massa
- Use SEMPRE um número secundário
- Não use seu número pessoal ou comercial principal

### Limites Recomendados
- Intervalo mínimo: 10 segundos
- Máximo diário: 100-200 mensagens
- Horário: 8h-22h (respeite o descanso dos clientes)

### Boas Práticas
- Envie apenas para clientes que autorizaram
- Evie spam
- Personalize as mensagens com `{nome}`
- Respeite horários comerciais
- Não envie todos os dias

---

## 🔧 Troubleshooting

### QR Code não aparece
- Verifique se o servidor está rodando
- Verifique os logs do console
- Tente reconectar

### Mensagens não estão sendo enviadas
- Verifique se está dentro do horário permitido
- Verifique se não atingiu o limite diário
- Verifique se o WhatsApp está conectado
- Verifique os logs do servidor

### WhatsApp desconecta sozinho
- Normal após períodos de inatividade
- Basta reconectar escaneando o QR Code novamente

### Erro "Limite diário atingido"
- Aguarde até o próximo dia
- Ou ajuste o limite nas configurações (com cuidado)

---

## 📝 Próximos Passos (Opcional)

- [ ] Histórico de mensagens enviadas
- [ ] Agendamento de mensagens
- [ ] Templates salvos pelo usuário
- [ ] Estatísticas de envio
- [ ] Filtros avançados de destinatários
- [ ] Anexar imagens/documentos

---

## 🎯 Status: ✅ PRONTO PARA USO

Sistema totalmente funcional e integrado!
