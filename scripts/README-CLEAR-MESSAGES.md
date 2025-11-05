# 🔄 Limpar Mensagens do Banco de Dados

## ⚠️ ATENÇÃO
Esta operação **APAGA TODAS AS MENSAGENS** do banco de dados. É **IRREVERSÍVEL**!

## 📋 Passos para Limpar

### 1. Limpar Cache Redis

**Opção A - Se tiver Redis CLI instalado:**
```bash
redis-cli FLUSHDB
```

**Opção B - Via Docker (se Redis estiver rodando em Docker):**
```bash
docker exec -it <container-redis> redis-cli FLUSHDB
```

**Opção C - Se não tiver acesso ao Redis CLI:**
- Reinicie o servidor Redis (limpa o cache em memória)
- Ou aguarde o TTL expirar (24 horas)

### 2. Limpar Banco de Dados

**Opção A - Via psql (linha de comando):**
```bash
psql -h postgres.gwan.com.br -p 5433 -U postgres -d gwan_events -c "DELETE FROM messages;"
```

**Opção B - Via cliente SQL (pgAdmin, DBeaver, etc):**
1. Conecte ao banco: `postgres.gwan.com.br:5433/gwan_events`
2. Execute o comando:
```sql
DELETE FROM messages;
```

**Opção C - Via arquivo SQL:**
Execute o arquivo `scripts/clear-messages-direct.sql` no seu cliente SQL.

### 3. Verificar Limpeza

Execute para confirmar:
```sql
SELECT COUNT(*) as total_messages FROM messages;
```

O resultado deve ser `0`.

## 🔍 Verificar Cache Redis

Para verificar se há chaves de cache ainda ativas:
```bash
redis-cli KEYS "processed:messageId:*"
```

Para limpar apenas mensagens processadas do cache:
```bash
redis-cli KEYS "processed:messageId:*" | xargs redis-cli DEL
```

## 📝 Informações do Banco de Dados

- **Host:** postgres.gwan.com.br
- **Porta:** 5433
- **Database:** gwan_events
- **Usuário:** postgres
- **Senha:** (verifique no .env)

## 🚀 Após Limpar

1. Reinicie a aplicação para garantir que o cache em memória seja limpo
2. Monitore os logs para verificar se o problema de mensagens duplicadas foi resolvido
3. Teste enviando uma nova mensagem para verificar se funciona corretamente

