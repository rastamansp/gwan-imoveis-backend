# Script de Deploy para Portainer (PowerShell)
# Este script facilita o deploy da aplicação via Portainer no Windows

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("deploy", "rollback", "status", "logs")]
    [string]$Action = "deploy",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("dev", "prod", "default")]
    [string]$Environment = "default"
)

# Cores para output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

# Função para log
function Write-Log {
    param([string]$Message)
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $Message" -ForegroundColor $Blue
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

# Verificar se o arquivo .env existe
if (-not (Test-Path ".env")) {
    Write-Error "Arquivo .env não encontrado!"
    Write-Host "Copie o arquivo env.example para .env e configure as variáveis:"
    Write-Host "Copy-Item env.example .env"
    exit 1
}

# Carregar variáveis do .env
Write-Log "Carregando variáveis de ambiente..."
Get-Content ".env" | ForEach-Object {
    if ($_ -match "^([^#][^=]+)=(.*)$") {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

# Verificar variáveis obrigatórias
$requiredVars = @("JWT_SECRET", "DATABASE_PASSWORD", "REDIS_PASSWORD")
$missingVars = @()

foreach ($var in $requiredVars) {
    if (-not [Environment]::GetEnvironmentVariable($var, "Process")) {
        $missingVars += $var
    }
}

if ($missingVars.Count -gt 0) {
    Write-Error "Variáveis obrigatórias não encontradas: $($missingVars -join ', ')"
    exit 1
}

Write-Success "Variáveis de ambiente carregadas com sucesso!"

# Verificar se a rede gwan existe
Write-Log "Verificando rede Docker 'gwan'..."
$networkExists = docker network ls | Select-String "gwan"

if (-not $networkExists) {
    Write-Warning "Rede 'gwan' não encontrada. Criando..."
    docker network create gwan
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Rede 'gwan' criada com sucesso!"
    } else {
        Write-Error "Erro ao criar rede 'gwan'"
        exit 1
    }
} else {
    Write-Success "Rede 'gwan' encontrada!"
}

# Função para deploy
function Invoke-Deploy {
    param([string]$Environment)
    
    $composeFile = "docker-compose.yml"
    
    switch ($Environment) {
        "dev" {
            $composeFile = "docker-compose.dev.yml"
            Write-Log "Iniciando deploy para DESENVOLVIMENTO..."
        }
        "prod" {
            $composeFile = "docker-compose.prod.yml"
            Write-Log "Iniciando deploy para PRODUÇÃO..."
        }
        default {
            $composeFile = "docker-compose.yml"
            Write-Log "Iniciando deploy para AMBIENTE PADRÃO..."
        }
    }
    
    Write-Log "Usando arquivo: $composeFile"
    
    # Parar containers existentes
    Write-Log "Parando containers existentes..."
    docker-compose -f $composeFile down
    
    # Remover imagens antigas
    Write-Log "Removendo imagens antigas..."
    docker-compose -f $composeFile down --rmi all
    
    # Build e start
    Write-Log "Fazendo build e iniciando containers..."
    docker-compose -f $composeFile up -d --build
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Erro durante o deploy"
        exit 1
    }
    
    # Aguardar containers iniciarem
    Write-Log "Aguardando containers iniciarem..."
    Start-Sleep -Seconds 30
    
    # Verificar saúde dos containers
    Write-Log "Verificando saúde dos containers..."
    docker-compose -f $composeFile ps
    
    # Verificar logs
    Write-Log "Verificando logs..."
    docker-compose -f $composeFile logs --tail=50
    
    Write-Success "Deploy concluído com sucesso!"
}

# Função para rollback
function Invoke-Rollback {
    param([string]$Environment)
    
    $composeFile = "docker-compose.yml"
    
    switch ($Environment) {
        "dev" { $composeFile = "docker-compose.dev.yml" }
        "prod" { $composeFile = "docker-compose.prod.yml" }
    }
    
    Write-Log "Iniciando rollback..."
    
    # Parar containers
    docker-compose -f $composeFile down
    
    # Remover volumes (cuidado!)
    Write-Warning "Removendo volumes... (dados serão perdidos!)"
    docker-compose -f $composeFile down -v
    
    Write-Success "Rollback concluído!"
}

# Função para status
function Get-Status {
    param([string]$Environment)
    
    $composeFile = "docker-compose.yml"
    
    switch ($Environment) {
        "dev" { $composeFile = "docker-compose.dev.yml" }
        "prod" { $composeFile = "docker-compose.prod.yml" }
    }
    
    Write-Log "Status dos containers:"
    docker-compose -f $composeFile ps
    
    Write-Log "Logs recentes:"
    docker-compose -f $composeFile logs --tail=20
}

# Função para logs
function Get-Logs {
    param([string]$Environment)
    
    $composeFile = "docker-compose.yml"
    
    switch ($Environment) {
        "dev" { $composeFile = "docker-compose.dev.yml" }
        "prod" { $composeFile = "docker-compose.prod.yml" }
    }
    
    docker-compose -f $composeFile logs -f
}

# Menu principal
switch ($Action) {
    "deploy" {
        Invoke-Deploy $Environment
    }
    "rollback" {
        Invoke-Rollback $Environment
    }
    "status" {
        Get-Status $Environment
    }
    "logs" {
        Get-Logs $Environment
    }
    default {
        Write-Host "Uso: .\deploy-portainer.ps1 -Action {deploy|rollback|status|logs} -Environment [dev|prod|default]"
        Write-Host ""
        Write-Host "Comandos disponíveis:"
        Write-Host "  deploy [dev|prod|default]  - Fazer deploy da aplicação"
        Write-Host "  rollback [dev|prod|default] - Fazer rollback da aplicação"
        Write-Host "  status [dev|prod|default]   - Verificar status dos containers"
        Write-Host "  logs [dev|prod|default]    - Ver logs dos containers"
        Write-Host ""
        Write-Host "Exemplos:"
        Write-Host "  .\deploy-portainer.ps1 -Action deploy -Environment prod     - Deploy para produção"
        Write-Host "  .\deploy-portainer.ps1 -Action deploy -Environment dev      - Deploy para desenvolvimento"
        Write-Host "  .\deploy-portainer.ps1 -Action status -Environment prod     - Status da produção"
        Write-Host "  .\deploy-portainer.ps1 -Action logs -Environment dev        - Logs do desenvolvimento"
        exit 1
    }
}
