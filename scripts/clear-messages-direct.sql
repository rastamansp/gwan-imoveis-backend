-- ============================================
-- LIMPAR TODAS AS MENSAGENS DO BANCO DE DADOS
-- ============================================
-- Execute este comando SQL diretamente no seu banco de dados
-- ============================================

DELETE FROM messages;

-- Verificar se foi limpo
SELECT COUNT(*) as total_messages FROM messages;

