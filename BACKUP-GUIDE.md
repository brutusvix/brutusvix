# 💾 GUIA DE BACKUP - BRUTUS LAVAJATO

## 📋 ESTRATÉGIA DE BACKUP

### 1. BACKUP AUTOMÁTICO NO SUPABASE (RECOMENDADO)

#### Passo 1: Habilitar Point-in-Time Recovery (PITR)

1. Acesse: https://supabase.com/dashboard/project/yfhiqhupuhrhsrzyqjli/settings/database
2. Vá para a seção **"Backups"**
3. Clique em **"Enable Point-in-Time Recovery"**
4. Escolha o plano:
   - **Pro Plan**: 7 dias de recuperação
   - **Team Plan**: 14 dias de recuperação
   - **Enterprise**: 30+ dias de recuperação

**Benefícios:**
- ✅ Backup automático a cada minuto
- ✅ Recuperação para qualquer ponto no tempo
- ✅ Sem necessidade de scripts manuais
- ✅ Gerenciado pelo Supabase

#### Passo 2: Configurar Backup Diário Manual (Redundância)

1. Vá para **Settings > Database > Backups**
2. Configure backup diário automático
3. Escolha horário (recomendado: 3h da manhã)
4. Backups são mantidos por 7 dias (plano gratuito) ou mais (planos pagos)

---

### 2. BACKUP LOCAL (REDUNDÂNCIA ADICIONAL)

#### Script de Backup Automático

Crie um arquivo `backup.sh` (Linux/Mac) ou `backup.ps1` (Windows):

**Linux/Mac (backup.sh):**
```bash
#!/bin/bash

# Configurações
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups"
DB_URL="postgresql://postgres:[PASSWORD]@db.yfhiqhupuhrhsrzyqjli.supabase.co:5432/postgres"

# Criar diretório se não existir
mkdir -p $BACKUP_DIR

# Fazer backup
pg_dump $DB_URL > "$BACKUP_DIR/backup_$DATE.sql"

# Comprimir
gzip "$BACKUP_DIR/backup_$DATE.sql"

# Manter apenas últimos 30 backups
ls -t $BACKUP_DIR/backup_*.sql.gz | tail -n +31 | xargs rm -f

echo "✅ Backup concluído: backup_$DATE.sql.gz"
```

**Windows (backup.ps1):**
```powershell
# Configurações
$DATE = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_DIR = "backups"
$DB_URL = "postgresql://postgres:[PASSWORD]@db.yfhiqhupuhrhsrzyqjli.supabase.co:5432/postgres"

# Criar diretório se não existir
New-Item -ItemType Directory -Force -Path $BACKUP_DIR | Out-Null

# Fazer backup
& pg_dump $DB_URL | Out-File -FilePath "$BACKUP_DIR\backup_$DATE.sql"

# Comprimir
Compress-Archive -Path "$BACKUP_DIR\backup_$DATE.sql" -DestinationPath "$BACKUP_DIR\backup_$DATE.zip"
Remove-Item "$BACKUP_DIR\backup_$DATE.sql"

# Manter apenas últimos 30 backups
Get-ChildItem $BACKUP_DIR -Filter "backup_*.zip" | 
  Sort-Object LastWriteTime -Descending | 
  Select-Object -Skip 30 | 
  Remove-Item

Write-Host "✅ Backup concluído: backup_$DATE.zip"
```

#### Agendar Backup Automático

**Linux/Mac (crontab):**
```bash
# Editar crontab
crontab -e

# Adicionar linha (backup diário às 3h)
0 3 * * * /caminho/para/backup.sh
```

**Windows (Task Scheduler):**
1. Abra "Agendador de Tarefas"
2. Criar Tarefa Básica
3. Nome: "Backup Brutus Lavajato"
4. Gatilho: Diariamente às 3h
5. Ação: Iniciar programa
6. Programa: `powershell.exe`
7. Argumentos: `-File C:\caminho\para\backup.ps1`

---

### 3. BACKUP NA NUVEM (MÁXIMA SEGURANÇA)

#### Opção A: Google Drive

```bash
# Instalar rclone
curl https://rclone.org/install.sh | sudo bash

# Configurar Google Drive
rclone config

# Adicionar ao script de backup
rclone copy backups/ gdrive:brutus-backups/
```

#### Opção B: AWS S3

```bash
# Instalar AWS CLI
pip install awscli

# Configurar credenciais
aws configure

# Adicionar ao script de backup
aws s3 sync backups/ s3://brutus-backups/
```

#### Opção C: Dropbox

```bash
# Usar Dropbox Uploader
curl "https://raw.githubusercontent.com/andreafabrizi/Dropbox-Uploader/master/dropbox_uploader.sh" -o dropbox_uploader.sh
chmod +x dropbox_uploader.sh
./dropbox_uploader.sh

# Adicionar ao script de backup
./dropbox_uploader.sh upload backups/ /brutus-backups/
```

---

### 4. TESTAR RESTAURAÇÃO (IMPORTANTE!)

#### Teste Mensal de Restauração

```bash
# 1. Baixar backup mais recente
LATEST_BACKUP=$(ls -t backups/backup_*.sql.gz | head -1)

# 2. Descomprimir
gunzip -c $LATEST_BACKUP > test_restore.sql

# 3. Criar banco de teste
createdb brutus_test

# 4. Restaurar
psql brutus_test < test_restore.sql

# 5. Verificar dados
psql brutus_test -c "SELECT COUNT(*) FROM users;"
psql brutus_test -c "SELECT COUNT(*) FROM clients;"
psql brutus_test -c "SELECT COUNT(*) FROM appointments;"

# 6. Limpar
dropdb brutus_test
rm test_restore.sql
```

---

### 5. CHECKLIST DE BACKUP

#### Diário
- [ ] Verificar se backup automático do Supabase rodou
- [ ] Verificar se backup local foi criado

#### Semanal
- [ ] Verificar tamanho dos backups (crescimento anormal?)
- [ ] Verificar espaço em disco disponível
- [ ] Fazer upload para nuvem (se configurado)

#### Mensal
- [ ] Testar restauração de um backup
- [ ] Verificar integridade dos dados restaurados
- [ ] Limpar backups muito antigos (>90 dias)
- [ ] Revisar estratégia de backup

---

### 6. PLANO DE RECUPERAÇÃO DE DESASTRES

#### Cenário 1: Perda de Dados Recente (< 24h)

1. Usar PITR do Supabase
2. Escolher timestamp antes do problema
3. Restaurar em segundos

#### Cenário 2: Corrupção de Dados

1. Identificar última versão boa
2. Restaurar backup local ou da nuvem
3. Aplicar mudanças recentes manualmente

#### Cenário 3: Perda Total do Supabase

1. Criar novo projeto Supabase
2. Restaurar backup mais recente
3. Atualizar variáveis de ambiente (.env)
4. Testar todas as funcionalidades

---

### 7. INFORMAÇÕES IMPORTANTES

#### Senha do Banco de Dados

Para fazer backup local, você precisa da senha do banco:

1. Acesse: https://supabase.com/dashboard/project/yfhiqhupuhrhsrzyqjli/settings/database
2. Vá para **"Connection string"**
3. Copie a senha (ou resete se necessário)
4. Substitua `[PASSWORD]` nos scripts acima

#### Tamanho Estimado dos Backups

- Banco vazio: ~5 MB
- Com 100 clientes: ~10 MB
- Com 1000 agendamentos: ~50 MB
- Com 1 ano de dados: ~200-500 MB

#### Retenção Recomendada

- **Backups diários**: 30 dias
- **Backups semanais**: 3 meses
- **Backups mensais**: 1 ano
- **Backups anuais**: Permanente

---

### 8. CONTATOS DE EMERGÊNCIA

- **Supabase Support**: https://supabase.com/support
- **Documentação**: https://supabase.com/docs/guides/platform/backups
- **Status**: https://status.supabase.com/

---

## ✅ PRÓXIMOS PASSOS

1. [ ] Habilitar PITR no Supabase (mais importante)
2. [ ] Configurar backup diário automático
3. [ ] Criar script de backup local
4. [ ] Agendar backup automático
5. [ ] Configurar upload para nuvem (opcional)
6. [ ] Fazer primeiro teste de restauração
7. [ ] Documentar procedimentos para equipe

---

**Última atualização:** 30 de Março de 2026
