#!/bin/bash

# Script de Deploy para Portainer
# Este script facilita o deploy da aplicação via Portainer

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verificar se o arquivo .env existe
if [ ! -f ".env" ]; then
    error "Arquivo .env não encontrado!"
    echo "Copie o arquivo env.example para .env e configure as variáveis:"
    echo "cp env.example .env"
    exit 1
fi

# Carregar variáveis do .env
log "Carregando variáveis de ambiente..."
export $(cat .env | grep -v '^#' | xargs)

# Verificar variáveis obrigatórias
required_vars=(
    "JWT_SECRET"
    "DATABASE_PASSWORD"
    "REDIS_PASSWORD"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        error "Variável obrigatória não encontrada: $var"
        exit 1
    fi
done

success "Variáveis de ambiente carregadas com sucesso!"

# Verificar se a rede gwan existe
log "Verificando rede Docker 'gwan'..."
if ! docker network ls | grep -q "gwan"; then
    warning "Rede 'gwan' não encontrada. Criando..."
    docker network create gwan
    success "Rede 'gwan' criada com sucesso!"
else
    success "Rede 'gwan' encontrada!"
fi

# Função para deploy
deploy() {
    local environment=$1
    local compose_file="docker-compose.yml"
    
    case $environment in
        "dev")
            compose_file="docker-compose.dev.yml"
            log "Iniciando deploy para DESENVOLVIMENTO..."
            ;;
        "prod")
            compose_file="docker-compose.prod.yml"
            log "Iniciando deploy para PRODUÇÃO..."
            ;;
        *)
            compose_file="docker-compose.yml"
            log "Iniciando deploy para AMBIENTE PADRÃO..."
            ;;
    esac
    
    log "Usando arquivo: $compose_file"
    
    # Parar containers existentes
    log "Parando containers existentes..."
    docker-compose -f $compose_file down || true
    
    # Remover imagens antigas
    log "Removendo imagens antigas..."
    docker-compose -f $compose_file down --rmi all || true
    
    # Build e start
    log "Fazendo build e iniciando containers..."
    docker-compose -f $compose_file up -d --build
    
    # Aguardar containers iniciarem
    log "Aguardando containers iniciarem..."
    sleep 30
    
    # Verificar saúde dos containers
    log "Verificando saúde dos containers..."
    docker-compose -f $compose_file ps
    
    # Verificar logs
    log "Verificando logs..."
    docker-compose -f $compose_file logs --tail=50
    
    success "Deploy concluído com sucesso!"
}

# Função para rollback
rollback() {
    local environment=$1
    local compose_file="docker-compose.yml"
    
    case $environment in
        "dev")
            compose_file="docker-compose.dev.yml"
            ;;
        "prod")
            compose_file="docker-compose.prod.yml"
            ;;
    esac
    
    log "Iniciando rollback..."
    
    # Parar containers
    docker-compose -f $compose_file down
    
    # Remover volumes (cuidado!)
    warning "Removendo volumes... (dados serão perdidos!)"
    docker-compose -f $compose_file down -v
    
    success "Rollback concluído!"
}

# Função para status
status() {
    local environment=$1
    local compose_file="docker-compose.yml"
    
    case $environment in
        "dev")
            compose_file="docker-compose.dev.yml"
            ;;
        "prod")
            compose_file="docker-compose.prod.yml"
            ;;
    esac
    
    log "Status dos containers:"
    docker-compose -f $compose_file ps
    
    log "Logs recentes:"
    docker-compose -f $compose_file logs --tail=20
}

# Função para logs
logs() {
    local environment=$1
    local compose_file="docker-compose.yml"
    
    case $environment in
        "dev")
            compose_file="docker-compose.dev.yml"
            ;;
        "prod")
            compose_file="docker-compose.prod.yml"
            ;;
    esac
    
    docker-compose -f $compose_file logs -f
}

# Menu principal
case "${1:-}" in
    "deploy")
        deploy "${2:-}"
        ;;
    "rollback")
        rollback "${2:-}"
        ;;
    "status")
        status "${2:-}"
        ;;
    "logs")
        logs "${2:-}"
        ;;
    *)
        echo "Uso: $0 {deploy|rollback|status|logs} [dev|prod]"
        echo ""
        echo "Comandos disponíveis:"
        echo "  deploy [dev|prod]  - Fazer deploy da aplicação"
        echo "  rollback [dev|prod] - Fazer rollback da aplicação"
        echo "  status [dev|prod]   - Verificar status dos containers"
        echo "  logs [dev|prod]    - Ver logs dos containers"
        echo ""
        echo "Exemplos:"
        echo "  $0 deploy prod     - Deploy para produção"
        echo "  $0 deploy dev      - Deploy para desenvolvimento"
        echo "  $0 status prod     - Status da produção"
        echo "  $0 logs dev        - Logs do desenvolvimento"
        exit 1
        ;;
esac
