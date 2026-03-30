# Script para adicionar Node.js ao Firewall do Windows
# Execute como Administrador

Write-Host "Adicionando Node.js ao Firewall do Windows..." -ForegroundColor Yellow

$nodePath = "C:\Program Files\nodejs\node.exe"

# Remover regras antigas se existirem
Remove-NetFirewallRule -DisplayName "Node.js HTTP" -ErrorAction SilentlyContinue
Remove-NetFirewallRule -DisplayName "Node.js HTTPS" -ErrorAction SilentlyContinue

# Adicionar novas regras
New-NetFirewallRule -DisplayName "Node.js HTTP" -Direction Outbound -Program $nodePath -Action Allow -Protocol TCP -RemotePort 80
New-NetFirewallRule -DisplayName "Node.js HTTPS" -Direction Outbound -Program $nodePath -Action Allow -Protocol TCP -RemotePort 443

Write-Host "✅ Regras de firewall adicionadas com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "Agora reinicie o servidor (npm run dev) e teste novamente." -ForegroundColor Cyan
