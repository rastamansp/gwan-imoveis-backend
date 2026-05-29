# Bootstrap script para gwan-imoveis-backend (Windows)
# Contrato: gwan-infra/apps/imoveis/docs/spec/40-architecture/dev-environment.md
# Decisao: ADR-005 do mesmo SDD
# Espelho do Makefile -- mesmos alvos, mesmo comportamento observavel.
#
# Uso: .\make.ps1 <alvo> [<alvo>...]
# Ex.: .\make.ps1 setup install up health

[CmdletBinding()]
param(
    [Parameter(Position = 0, ValueFromRemainingArguments = $true)]
    [string[]]$Targets = @('help')
)

$ErrorActionPreference = 'Stop'

$Port = if ($env:PORT) { $env:PORT } else { '3001' }
$HealthUrl = "http://localhost:$Port/api/health"

function Show-Help {
    Write-Host "Bootstrap targets (gwan-imoveis-backend)"
    Write-Host ""
    Write-Host "  setup    copia .env.example -> .env (se nao existir; nao sobrescreve)"
    Write-Host "  install  npm ci"
    Write-Host "  up / dev npm run start:dev  (porta $Port)"
    Write-Host "  down     mata processo escutando na porta $Port"
    Write-Host "  health   GET $HealthUrl"
    Write-Host ""
    Write-Host "Extras:"
    Write-Host "  seed     npm run db:seed"
    Write-Host "  migrate  npm run typeorm:migration:run"
    Write-Host "  test     npm test"
    Write-Host "  build    npm run build"
    Write-Host "  clean    remove node_modules e dist"
    Write-Host ""
    Write-Host "Encadeie: .\make.ps1 setup install up health"
}

function Invoke-Setup {
    if (Test-Path .env) {
        Write-Host "[setup] .env ja existe, nao sobrescrevendo"
    } elseif (Test-Path .env.example) {
        Copy-Item .env.example .env
        Write-Host "[setup] .env criado a partir de .env.example -- preencha os segredos antes de subir"
    } else {
        throw "[setup] ERRO: .env.example nao encontrado"
    }
}

function Invoke-NpmTarget {
    param([string]$Script, [string[]]$Args = @())
    if ($Args.Count -gt 0) {
        & npm $Script @Args
    } else {
        & npm $Script
    }
    if ($LASTEXITCODE -ne 0) { throw "npm $Script falhou (exit $LASTEXITCODE)" }
}

function Invoke-Install { Invoke-NpmTarget -Script 'ci' }
function Invoke-Up      { Invoke-NpmTarget -Script 'run' -Args @('start:dev') }
function Invoke-Seed    { Invoke-NpmTarget -Script 'run' -Args @('db:seed') }
function Invoke-Migrate { Invoke-NpmTarget -Script 'run' -Args @('typeorm:migration:run') }
function Invoke-Test    { Invoke-NpmTarget -Script 'test' }
function Invoke-Build   { Invoke-NpmTarget -Script 'run' -Args @('build') }

function Invoke-Down {
    try {
        $conns = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction Stop
    } catch {
        Write-Host "[down] nada rodando na porta $Port"
        return
    }
    $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($targetPid in $pids) {
        Write-Host "[down] matando PID $targetPid na porta $Port"
        Stop-Process -Id $targetPid -Force -ErrorAction SilentlyContinue
    }
}

function Invoke-Health {
    try {
        $resp = Invoke-WebRequest -Uri $HealthUrl -UseBasicParsing -TimeoutSec 5
        Write-Host "[health] GET $HealthUrl -> $($resp.StatusCode)"
    } catch {
        throw "[health] backend nao respondeu -- esta rodando? (.\make.ps1 up)"
    }
}

function Invoke-Clean {
    foreach ($dir in @('node_modules', 'dist')) {
        if (Test-Path $dir) {
            Write-Host "[clean] removendo $dir"
            Remove-Item -Recurse -Force $dir
        }
    }
}

foreach ($t in $Targets) {
    switch ($t.ToLower()) {
        'help'    { Show-Help }
        'setup'   { Invoke-Setup }
        'install' { Invoke-Install }
        'up'      { Invoke-Up }
        'dev'     { Invoke-Up }
        'down'    { Invoke-Down }
        'health'  { Invoke-Health }
        'seed'    { Invoke-Seed }
        'migrate' { Invoke-Migrate }
        'test'    { Invoke-Test }
        'build'   { Invoke-Build }
        'clean'   { Invoke-Clean }
        default {
            Write-Error "[make.ps1] alvo desconhecido: $t. Use .\make.ps1 help"
            exit 1
        }
    }
}
