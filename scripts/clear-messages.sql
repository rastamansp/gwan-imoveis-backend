-- ============================================
-- Script para LIMPAR TODAS AS MENSAGENS do banco de dados
-- ============================================
-- ATENÇÃO: Esta operação é IRREVERSÍVEL!
-- Execute apenas se tiver certeza que deseja limpar todas as mensagens
-- ============================================

-- Desabilitar verificação de chaves estrangeiras temporariamente (se necessário)
-- SET session_replication_role = 'replica';

-- Limpar todas as mensagens da tabela messages
DELETE FROM messages;

-- Verificar se todas as mensagens foram removidas
SELECT COUNT(*) as total_messages_restantes FROM messages;

-- Se quiser limpar também as conversas (opcional - descomente se necessário):
-- DELETE FROM conversations;
-- SELECT COUNT(*) as total_conversations_restantes FROM conversations;

-- Reabilitar verificação de chaves estrangeiras
-- SET session_replication_role = 'origin';

-- ============================================
-- IMPORTANTE: Após executar este script, também é necessário limpar o cache Redis
-- Execute no terminal: redis-cli FLUSHDB
-- ============================================
