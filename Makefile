# Bootstrap targets para gwan-imoveis-backend
# Contrato: gwan-infra/apps/imoveis/docs/spec/40-architecture/dev-environment.md
# Decisão: ADR-005 do mesmo SDD
# Espelhado em make.ps1 (Windows). Alvos abaixo DEVEM existir nos dois.

SHELL := /bin/sh
.PHONY: help setup install up dev down health seed migrate test build clean

NPM       ?= npm
PORT      ?= 3001
HEALTH_URL ?= http://localhost:$(PORT)/api/health

help:
	@echo "Bootstrap targets (gwan-imoveis-backend)"
	@echo ""
	@echo "  setup    copia .env.example -> .env (se nao existir; nao sobrescreve)"
	@echo "  install  npm ci"
	@echo "  up / dev npm run start:dev  (porta $(PORT))"
	@echo "  down     mata processo escutando na porta $(PORT)"
	@echo "  health   curl $(HEALTH_URL)"
	@echo ""
	@echo "Extras:"
	@echo "  seed     npm run db:seed"
	@echo "  migrate  npm run typeorm:migration:run"
	@echo "  test     npm test"
	@echo "  build    npm run build"
	@echo "  clean    remove node_modules e dist"
	@echo ""
	@echo "Encadeie alvos: make setup install up health"

setup:
	@if [ -f .env ]; then \
		echo "[setup] .env ja existe, nao sobrescrevendo"; \
	elif [ -f .env.example ]; then \
		cp .env.example .env; \
		echo "[setup] .env criado a partir de .env.example -- preencha os segredos antes de subir"; \
	else \
		echo "[setup] ERRO: .env.example nao encontrado"; exit 1; \
	fi

install:
	$(NPM) ci

up dev:
	$(NPM) run start:dev

down:
	@pids="$$(lsof -ti tcp:$(PORT) 2>/dev/null || true)"; \
	if [ -n "$$pids" ]; then \
		echo "[down] matando PID(s) na porta $(PORT): $$pids"; \
		kill -TERM $$pids; \
	else \
		echo "[down] nada rodando na porta $(PORT)"; \
	fi

health:
	@curl -fsS -o /dev/null -w "[health] GET $(HEALTH_URL) -> %{http_code}\n" $(HEALTH_URL) \
		|| { echo "[health] backend nao respondeu -- esta rodando? (make up)"; exit 1; }

seed:
	$(NPM) run db:seed

migrate:
	$(NPM) run typeorm:migration:run

test:
	$(NPM) test

build:
	$(NPM) run build

clean:
	rm -rf node_modules dist
