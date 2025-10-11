# Backup - Gwan Events Backend

## Visão Geral

Este documento descreve as estratégias de backup para o Gwan Events Backend em produção.

## Tipos de Backup

### Backup de Dados
- **Database**: Backup completo do PostgreSQL
- **Uploads**: Backup de arquivos enviados
- **Logs**: Backup de logs importantes

### Backup de Configuração
- **Environment Variables**: Variáveis de ambiente
- **Docker Compose**: Configurações de deploy
- **SSL Certificates**: Certificados SSL

### Backup de Código
- **Git Repository**: Código fonte
- **Docker Images**: Imagens Docker
- **Dependencies**: Dependências do projeto

## Estratégias de Backup

### Backup Automático
```bash
#!/bin/bash
# Backup diário automático
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/$DATE"

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Backup do banco de dados
pg_dump gwan_events > $BACKUP_DIR/database.sql

# Backup de uploads
tar -czf $BACKUP_DIR/uploads.tar.gz /app/uploads

# Backup de logs
tar -czf $BACKUP_DIR/logs.tar.gz /app/logs

# Backup de configurações
cp -r /app/config $BACKUP_DIR/
```

### Backup Manual
```bash
# Backup completo manual
docker exec gwan-events-backend-prod pg_dump gwan_events > backup_$(date +%Y%m%d).sql

# Backup de volumes
docker run --rm -v gwan-events-backend_logs_data:/data -v $(pwd):/backup alpine tar czf /backup/logs_backup.tar.gz -C /data .
```

## Frequência de Backup

### Diário
- **Database**: Backup completo diário
- **Logs**: Backup de logs importantes
- **Configurações**: Backup de mudanças

### Semanal
- **Uploads**: Backup completo semanal
- **Docker Images**: Backup de imagens
- **SSL Certificates**: Backup de certificados

### Mensal
- **Backup Completo**: Backup de tudo
- **Teste de Restore**: Teste de restauração
- **Arquivo**: Backup para arquivo

## Armazenamento

### Local
- **Disco Local**: Backup local temporário
- **NAS**: Backup em rede
- **USB**: Backup portátil

### Cloud
- **AWS S3**: Backup na nuvem
- **Google Cloud**: Backup alternativo
- **Azure**: Backup terceiro

### Remoto
- **Servidor Dedicado**: Backup remoto
- **FTP**: Backup via FTP
- **RSYNC**: Sincronização remota

## Restauração

### Restauração de Database
```bash
# Restaurar banco de dados
docker exec -i gwan-events-backend-prod psql gwan_events < backup_20240101.sql
```

### Restauração de Volumes
```bash
# Restaurar logs
docker run --rm -v gwan-events-backend_logs_data:/data -v $(pwd):/backup alpine tar xzf /backup/logs_backup.tar.gz -C /data
```

### Restauração Completa
```bash
# Parar serviços
docker-compose down

# Restaurar volumes
docker volume rm gwan-events-backend_logs_data
docker volume create gwan-events-backend_logs_data

# Restaurar dados
# ... (procedimento completo)

# Reiniciar serviços
docker-compose up -d
```

## Monitoramento de Backup

### Verificação Automática
- **Integridade**: Verificar integridade dos backups
- **Tamanho**: Monitorar tamanho dos backups
- **Frequência**: Verificar frequência dos backups

### Alertas
- **Backup Falhou**: Alerta se backup falhar
- **Backup Antigo**: Alerta se backup estiver antigo
- **Espaço Baixo**: Alerta se espaço estiver baixo

## Próximos Passos

1. Configuração detalhada de backup
2. Criação de scripts automatizados
3. Procedimentos de restauração
4. Monitoramento de backups
