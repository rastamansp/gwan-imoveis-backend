-- Script de inicialização do banco de dados
-- Este arquivo é executado automaticamente quando o container PostgreSQL é criado

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Criar usuário específico para a aplicação (opcional)
-- CREATE USER gwan_app WITH PASSWORD 'app_password';
-- GRANT ALL PRIVILEGES ON DATABASE gwan_events TO gwan_app;

-- Configurações de performance
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET track_activity_query_size = 2048;
ALTER SYSTEM SET pg_stat_statements.track = 'all';
ALTER SYSTEM SET log_min_duration_statement = 1000;
ALTER SYSTEM SET log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ';

-- Recarregar configurações
SELECT pg_reload_conf();

-- Criar índices de performance (serão criados após as migrações)
-- Estes serão executados via migrações do TypeORM

-- Log de inicialização
DO $$
BEGIN
    RAISE NOTICE 'Banco de dados inicializado com sucesso em %', now();
END $$;
