# 📚 Documentação - Litoral Imóveis Backend

Bem-vindo à documentação completa do **Litoral Imóveis Backend**, uma plataforma de corretora de locação e venda de imóveis construída com NestJS e TypeScript, seguindo os princípios de **Clean Architecture**, **SOLID** e **Domain-Driven Design**.

## 📋 Índice Geral

### 🏗️ Arquitetura

#### Visão Geral
- [Visão Geral da Arquitetura](./architecture/overview.md) - Princípios e estrutura geral

#### TOGAF (Enterprise Architecture)
- [TOGAF - Índice Principal](./togaf/README.md) - Framework TOGAF completo
  - [Business Architecture](./togaf/business-architecture/) - Capacidades, processos, organização
  - [Application Architecture](./togaf/application-architecture/) - Aplicações, serviços, interfaces
  - [Data Architecture](./togaf/data-architecture/) - Entidades, governança, fluxos
  - [Technology Architecture](./togaf/technology-architecture/) - Tecnologias, plataformas, infraestrutura
  - [Artefatos Transversais](./togaf/) - Matrizes, princípios, roadmap

#### Diagramas
- [Arquitetura do Sistema](./diagrams/system-architecture.md)
- [Fluxo do Usuário](./diagrams/user-journey-flow.md)
- [Fluxo do Chatbot](./diagrams/chatbot-flow.md)
- [Diagramas de API](./diagrams/api-mermaid.md)

### 🔧 Desenvolvimento

- [Guia de Configuração](./development/setup.md) - Setup do ambiente de desenvolvimento
- [Documentação Automática](./development/auto-documentation.md) - Sistema de geração de documentação

### 🚀 APIs

- [Documentação da API](./api/overview.md) - Visão geral das APIs
- [Administração de Imóveis](./api/properties-admin.md) - Guia para frontend
- [Fluxo Completo do Usuário](./api/user-journey-api-calls.md) - Jornada do usuário via API

### 🤖 Funcionalidades

#### Chatbot
- [Fluxo de Chamadas do Chatbot](./features/chatbot/chatbot-flow.md) - Como o chatbot funciona
- [Diagramas do Chatbot](./diagrams/chatbot-flow.md) - Diagramas visuais

#### MCP (Model Context Protocol)
- [Visão Geral do MCP](./features/mcp/overview.md) - Introdução ao MCP
- [Guia de Integração MCP](./features/mcp/integration.md) - Como integrar com MCP

### 🚀 Deploy e Produção

- [Deploy Automático](./deployment/deploy-automation.md) - Automação de deploy
- [Deploy com Docker](./deployment/docker.md) - Docker e containers
- [Arquivos Docker](./deployment/docker-files.md) - Configurações Docker
- [Deploy com Portainer](./deployment/portainer.md) - Gerenciamento via Portainer
- [Configuração de Ambiente](./deployment/environment.md) - Variáveis de ambiente

### 📊 Operações

- [Monitoramento](./operations/monitoring/overview.md) - Monitoramento e observabilidade
- [Backup](./operations/backup/overview.md) - Estratégias de backup

### 📖 Referências

- [Integração Frontend - Produtos](./references/frontend-products-integration.md) - Guia de integração
- [Prompt Frontend - Produtos](./references/frontend-prompt-products.md) - Especificações para frontend
- [Exemplos RAG vs Query](./references/examples-rag-vs-query.md) - Exemplos de busca
- [Índice de Referências](./references/README.md) - Todos os documentos de referência

## 🎯 Início Rápido

### Para Desenvolvedores

1. **[Configuração do Ambiente](./development/setup.md)** - Comece aqui para configurar seu ambiente
2. **[Visão Geral da Arquitetura](./architecture/overview.md)** - Entenda a estrutura do projeto
3. **[Documentação Automática](./development/auto-documentation.md)** - Como gerar documentação

### Para Arquitetos

1. **[TOGAF - Visão Geral](./togaf/README.md)** - Framework TOGAF completo
2. **[Arquitetura de Negócio](./togaf/business-architecture/)** - Capacidades e processos
3. **[Arquitetura de Aplicação](./togaf/application-architecture/)** - Aplicações e serviços
4. **[Arquitetura de Dados](./togaf/data-architecture/)** - Modelo de dados
5. **[Arquitetura de Tecnologia](./togaf/technology-architecture/)** - Stack tecnológica

### Para DevOps

1. **[Configuração de Produção](./deployment/environment.md)** - Variáveis de ambiente
2. **[Deploy Automático](./deployment/deploy-automation.md)** - Pipeline de deploy
3. **[Docker](./deployment/docker.md)** - Containers e orquestração
4. **[Monitoramento](./operations/monitoring/overview.md)** - Observabilidade

### Para Integração

1. **[Documentação da API](./api/overview.md)** - Endpoints disponíveis
2. **[Swagger UI](http://localhost:3001/api)** - Documentação interativa
3. **[MCP Server](./features/mcp/overview.md)** - Integração via Model Context Protocol
4. **[Chatbot](./features/chatbot/chatbot-flow.md)** - Integração com chatbot

## 📊 Estrutura da Documentação

```
docs/
├── README.md                    # Este arquivo - Índice principal
├── architecture/                # Arquitetura geral
│   ├── README.md
│   └── overview.md
├── togaf/                       # TOGAF Enterprise Architecture
│   ├── README.md
│   ├── business-architecture/  # Arquitetura de Negócio
│   ├── application-architecture/ # Arquitetura de Aplicação
│   ├── data-architecture/       # Arquitetura de Dados
│   └── technology-architecture/ # Arquitetura de Tecnologia
├── development/                 # Guias de desenvolvimento
│   ├── setup.md
│   └── auto-documentation.md
├── api/                         # Documentação de APIs
│   ├── README.md
│   ├── overview.md
│   ├── properties-admin.md
│   └── user-journey-api-calls.md
├── features/                    # Funcionalidades específicas
│   ├── README.md
│   ├── chatbot/
│   │   └── chatbot-flow.md
│   └── mcp/
│       ├── overview.md
│       └── integration.md
├── deployment/                  # Deploy e produção
│   ├── README.md
│   ├── deploy-automation.md
│   ├── docker.md
│   ├── docker-files.md
│   ├── portainer.md
│   └── environment.md
├── operations/                  # Operações e manutenção
│   ├── README.md
│   ├── monitoring/
│   │   └── overview.md
│   └── backup/
│       └── overview.md
├── diagrams/                    # Diagramas visuais
│   ├── README.md
│   ├── system-architecture.md
│   ├── user-journey-flow.md
│   ├── chatbot-flow.md
│   └── api-mermaid.md
└── references/                  # Referências e exemplos
    ├── README.md
    ├── frontend-products-integration.md
    ├── frontend-prompt-products.md
    └── examples-rag-vs-query.md
```

## 🔗 Links Úteis

- **Swagger UI**: [http://localhost:3001/api](http://localhost:3001/api) - Documentação interativa da API
- **Health Check**: [http://localhost:3001/api/health](http://localhost:3001/api/health) - Status da aplicação
- **MCP Server**: [Documentação MCP](./features/mcp/overview.md) - Model Context Protocol

## 📝 Convenções de Documentação

### Formato
- **Markdown** para toda documentação
- **Mermaid** para diagramas
- **Swagger/OpenAPI** para APIs

### Estrutura
- Cada documento tem um título claro
- Seções bem organizadas
- Links cruzados entre documentos relacionados
- Exemplos práticos quando apropriado

### Manutenção
- Documentação atualizada junto com código
- Validação automática via scripts
- Geração automática quando possível
- Revisão periódica

## 🆘 Suporte e Contribuição

### Reportar Problemas
- [GitHub Issues](https://github.com/seu-usuario/litoral-imoveis-backend/issues)

### Contribuir com Documentação
1. Use diagramas Mermaid quando apropriado
2. Mantenha a estrutura consistente
3. Atualize o índice quando necessário
4. Valide a documentação antes do commit
5. Siga os padrões estabelecidos

## 📑 Índices Adicionais

- [Índice Completo](./INDEX.md) - Índice visual completo de toda documentação
- [Organização da Documentação](./ORGANIZATION.md) - Estrutura e princípios de organização
- [TOGAF - Índice](./togaf/README.md) - Documentação TOGAF completa

## 📅 Última Atualização

Documentação atualizada em: 2025-01-16  
Versão: 1.0.0

---

**Nota**: Esta documentação segue o framework **TOGAF** para organização arquitetural e está em constante evolução. Para sugestões ou melhorias, abra uma issue no repositório.
