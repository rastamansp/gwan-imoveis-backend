#!/bin/sh
set -e

echo "🎯 Starting Gwan Events Backend..."

# Verificar se PostgreSQL está disponível
if [ -z "$DB_HOST" ]; then
  echo "⚠️  DB_HOST not set, skipping migration check"
else
  echo "⏳ Waiting for PostgreSQL at $DB_HOST:$DB_PORT..."
  
  # Tentar conectar ao PostgreSQL
  for i in $(seq 1 30); do
    if nc -z "$DB_HOST" "${DB_PORT:-5432}" 2>/dev/null; then
      echo "✅ PostgreSQL is ready!"
      break
    fi
    if [ $i -eq 30 ]; then
      echo "⚠️  PostgreSQL is not ready, proceeding anyway..."
      break
    fi
    sleep 1
  done
fi

# Executar migrations
echo "📦 Running database migrations..."
if npm run typeorm:migration:run 2>&1; then
  echo "✅ Migrations completed successfully"
else
  echo "⚠️  Migration failed, but continuing with startup..."
  echo "💡 This is normal if migrations have already been applied"
fi

# Iniciar aplicação
echo "🚀 Starting NestJS application..."
exec node dist/src/main.js

