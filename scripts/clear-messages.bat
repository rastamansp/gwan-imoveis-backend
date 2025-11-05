@echo off
REM Script para limpar mensagens do banco de dados e cache Redis
REM ATENÇÃO: Esta operação é IRREVERSÍVEL!

echo ============================================
echo Limpando mensagens do banco de dados e cache Redis
echo ============================================
echo.

REM Extrair informações do DATABASE_URL do .env
REM Formato: postgresql://postgres:pazdedeus@postgres.gwan.com.br:5433/gwan_events

REM Limpar cache Redis
echo Limpando cache Redis...
redis-cli FLUSHDB
if %ERRORLEVEL% EQU 0 (
    echo [OK] Cache Redis limpo com sucesso!
) else (
    echo [ERRO] Nao foi possivel limpar o cache Redis. Verifique se o Redis esta rodando.
)
echo.

REM Limpar banco de dados usando psql
echo Limpando mensagens do banco de dados...
echo Por favor, execute manualmente o script SQL: scripts\clear-messages.sql
echo Ou execute diretamente no psql:
echo psql -h postgres.gwan.com.br -p 5433 -U postgres -d gwan_events -c "DELETE FROM messages;"
echo.

pause

