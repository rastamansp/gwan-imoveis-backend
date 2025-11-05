#!/bin/bash
# Script para limpar mensagens do banco de dados e cache Redis
# ATENÇÃO: Esta operação é IRREVERSÍVEL!

echo "============================================"
echo "Limpando mensagens do banco de dados e cache Redis"
echo "============================================"
echo ""

# Limpar cache Redis
echo "Limpando cache Redis..."
redis-cli FLUSHDB
if [ $? -eq 0 ]; then
    echo "[OK] Cache Redis limpo com sucesso!"
else
    echo "[ERRO] Não foi possível limpar o cache Redis. Verifique se o Redis está rodando."
fi
echo ""

# Limpar banco de dados usando psql
echo "Limpando mensagens do banco de dados..."
echo "Por favor, execute manualmente o script SQL: scripts/clear-messages.sql"
echo "Ou execute diretamente no psql:"
echo 'psql -h postgres.gwan.com.br -p 5433 -U postgres -d gwan_events -c "DELETE FROM messages;"'
echo ""

