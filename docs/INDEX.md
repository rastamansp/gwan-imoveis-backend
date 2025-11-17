# 📑 Índice Completo da Documentação

Índice visual completo de toda a documentação do projeto Litoral Imóveis Backend.

## 🗂️ Estrutura Completa

```
docs/
│
├── 📄 README.md                    # Índice principal e ponto de entrada
├── 📄 INDEX.md                     # Este arquivo - Índice completo
│
├── 🏗️ architecture/                # Arquitetura Geral
│   ├── README.md                   # Índice de arquitetura
│   └── overview.md                 # Visão geral da arquitetura
│
├── 📐 togaf/                       # TOGAF Enterprise Architecture
│   ├── README.md                   # Índice TOGAF
│   │
│   ├── business-architecture/     # Arquitetura de Negócio
│   │   ├── business-capabilities.md
│   │   ├── business-processes.md
│   │   ├── organization-structure.md
│   │   ├── business-services.md
│   │   └── business-architecture-diagram.md
│   │
│   ├── application-architecture/  # Arquitetura de Aplicação
│   │   ├── application-catalog.md
│   │   ├── application-interfaces.md
│   │   ├── application-services.md
│   │   ├── application-component-diagram.md
│   │   └── application-communication-diagram.md
│   │
│   ├── data-architecture/          # Arquitetura de Dados
│   │   ├── data-catalog.md
│   │   ├── data-entities.md
│   │   ├── data-governance.md
│   │   ├── data-flow-diagram.md
│   │   └── data-architecture-diagram.md
│   │
│   ├── technology-architecture/    # Arquitetura de Tecnologia
│   │   ├── technology-catalog.md
│   │   ├── platform-services.md
│   │   ├── deployment-architecture.md
│   │   ├── infrastructure-diagram.md
│   │   └── technology-standards.md
│   │
│   └── [Artefatos Transversais]
│       ├── architecture-overview.md
│       ├── architecture-principles.md
│       ├── architecture-roadmap.md
│       ├── application-data-matrix.md
│       └── application-function-matrix.md
│
├── 🔧 development/                 # Desenvolvimento
│   ├── setup.md                    # Configuração do ambiente
│   └── auto-documentation.md       # Sistema de documentação automática
│
├── 🚀 api/                         # Documentação de APIs
│   ├── README.md                   # Índice de APIs
│   ├── overview.md                 # Visão geral das APIs
│   ├── properties-admin.md         # Guia de administração de imóveis
│   └── user-journey-api-calls.md   # Fluxo completo do usuário
│
├── 🤖 features/                    # Funcionalidades
│   ├── README.md                   # Índice de funcionalidades
│   │
│   ├── chatbot/                    # Chatbot Inteligente
│   │   └── chatbot-flow.md
│   │
│   └── mcp/                        # Model Context Protocol
│       ├── overview.md
│       └── integration.md
│
├── 🚀 deployment/                   # Deploy e Produção
│   ├── README.md                   # Índice de deploy
│   ├── deploy-automation.md        # Deploy automático
│   ├── docker.md                   # Docker e containers
│   ├── docker-files.md             # Configurações Docker
│   ├── portainer.md                # Deploy com Portainer
│   └── environment.md              # Variáveis de ambiente
│
├── 📊 operations/                  # Operações
│   ├── README.md                   # Índice de operações
│   │
│   ├── monitoring/                 # Monitoramento
│   │   └── overview.md
│   │
│   └── backup/                     # Backup
│       └── overview.md
│
├── 📈 diagrams/                    # Diagramas
│   ├── README.md                   # Índice de diagramas
│   ├── system-architecture.md      # Arquitetura do sistema
│   ├── user-journey-flow.md        # Fluxo do usuário
│   ├── chatbot-flow.md             # Fluxo do chatbot
│   └── api-mermaid.md              # Diagramas de API
│
└── 📖 references/                  # Referências
    ├── README.md                   # Índice de referências
    ├── frontend-products-integration.md
    ├── frontend-prompt-products.md
    └── examples-rag-vs-query.md
```

## 🎯 Navegação Rápida por Perfil

### 👨‍💻 Desenvolvedor
1. [Setup do Ambiente](./development/setup.md)
2. [Arquitetura Geral](./architecture/overview.md)
3. [APIs](./api/README.md)
4. [Documentação Automática](./development/auto-documentation.md)

### 🏗️ Arquiteto
1. [TOGAF - Visão Geral](./togaf/README.md)
2. [Business Architecture](./togaf/business-architecture/)
3. [Application Architecture](./togaf/application-architecture/)
4. [Data Architecture](./togaf/data-architecture/)
5. [Technology Architecture](./togaf/technology-architecture/)

### 🔧 DevOps
1. [Deploy Automático](./deployment/deploy-automation.md)
2. [Docker](./deployment/docker.md)
3. [Monitoramento](./operations/monitoring/overview.md)
4. [Backup](./operations/backup/overview.md)

### 🔌 Integrador
1. [APIs](./api/README.md)
2. [MCP Server](./features/mcp/overview.md)
3. [Chatbot](./features/chatbot/chatbot-flow.md)
4. [Swagger UI](http://localhost:3001/api)

## 📊 Estatísticas da Documentação

- **Total de Documentos**: ~50 arquivos
- **TOGAF Artefatos**: 26 documentos
- **Diagramas**: 4 diagramas principais
- **Guias de Desenvolvimento**: 2 guias
- **Documentação de APIs**: 3 documentos
- **Documentação de Deploy**: 5 documentos

## 🔍 Busca Rápida

### Por Tópico

**Arquitetura**
- [Visão Geral](./architecture/overview.md)
- [TOGAF](./togaf/README.md)
- [Princípios](./togaf/architecture-principles.md)
- [Roadmap](./togaf/architecture-roadmap.md)

**APIs**
- [Visão Geral](./api/overview.md)
- [Properties](./api/properties-admin.md)
- [User Journey](./api/user-journey-api-calls.md)

**Deploy**
- [Docker](./deployment/docker.md)
- [Portainer](./deployment/portainer.md)
- [Environment](./deployment/environment.md)

**Funcionalidades**
- [Chatbot](./features/chatbot/chatbot-flow.md)
- [MCP](./features/mcp/overview.md)

**Operações**
- [Monitoramento](./operations/monitoring/overview.md)
- [Backup](./operations/backup/overview.md)

## 📝 Convenções

- Todos os documentos em **Markdown**
- Diagramas em **Mermaid**
- APIs documentadas em **Swagger/OpenAPI**
- Estrutura hierárquica clara
- Links cruzados entre documentos relacionados

## 🔄 Atualização

Última atualização: 2025-01-16  
Versão da documentação: 1.0.0

---

[← Voltar para README Principal](./README.md)

