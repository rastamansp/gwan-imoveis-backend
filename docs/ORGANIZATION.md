# 📚 Organização da Documentação

Este documento descreve a organização e estrutura da documentação do projeto Litoral Imóveis Backend.

## 🗂️ Estrutura Organizacional

A documentação está organizada em uma hierarquia lógica e navegável:

### 1. Nível Raiz (`docs/`)

**Arquivos Principais**:
- `README.md` - Índice principal e ponto de entrada
- `INDEX.md` - Índice visual completo
- `ORGANIZATION.md` - Este arquivo

### 2. Categorias Principais

#### 🏗️ Arquitetura (`architecture/`)
Documentação arquitetural geral e TOGAF.

**Conteúdo**:
- Visão geral da arquitetura
- TOGAF Enterprise Architecture (4 dimensões)
- Princípios e padrões
- Roadmap de evolução

#### 🔧 Desenvolvimento (`development/`)
Guias para desenvolvedores.

**Conteúdo**:
- Setup do ambiente
- Sistema de documentação automática
- Padrões de código

#### 🚀 APIs (`api/`)
Documentação de todas as APIs.

**Conteúdo**:
- Visão geral das APIs
- Guias específicos por funcionalidade
- Fluxos de integração

#### 🤖 Funcionalidades (`features/`)
Documentação de funcionalidades específicas.

**Conteúdo**:
- Chatbot inteligente
- MCP Server
- Outras funcionalidades

#### 🚀 Deploy (`deployment/`)
Documentação de deploy e produção.

**Conteúdo**:
- Deploy automático
- Docker e containers
- Portainer
- Configurações de ambiente

#### 📊 Operações (`operations/`)
Documentação operacional.

**Conteúdo**:
- Monitoramento
- Backup
- Manutenção

#### 📈 Diagramas (`diagrams/`)
Diagramas visuais do sistema.

**Conteúdo**:
- Arquitetura do sistema
- Fluxos de usuário
- Diagramas de API

#### 📖 Referências (`references/`)
Documentos de referência e exemplos.

**Conteúdo**:
- Guias de integração
- Exemplos
- Especificações

## 📋 Princípios de Organização

### Hierarquia Lógica
- Cada categoria tem um propósito claro
- Subdiretórios agrupam documentos relacionados
- README.md em cada diretório principal para navegação

### Navegação
- Links cruzados entre documentos relacionados
- Índices em cada nível
- Breadcrumbs implícitos via estrutura de diretórios

### Consistência
- Nomenclatura padronizada
- Estrutura similar em categorias relacionadas
- Formato consistente (Markdown)

## 🔍 Como Encontrar Documentação

### Por Tópico

**Arquitetura**:
- Geral: `architecture/`
- TOGAF: `togaf/`

**Desenvolvimento**:
- Setup: `development/setup.md`
- Documentação: `development/auto-documentation.md`

**APIs**:
- Visão geral: `api/overview.md`
- Específicas: `api/`

**Deploy**:
- Geral: `deployment/`
- Docker: `deployment/docker.md`

**Funcionalidades**:
- Chatbot: `features/chatbot/`
- MCP: `features/mcp/`

### Por Perfil

**Desenvolvedor**: `development/`, `api/`, `architecture/`
**Arquiteto**: `togaf/`, `architecture/`
**DevOps**: `deployment/`, `operations/`
**Integrador**: `api/`, `features/`

## 📊 Estatísticas

- **Total de Documentos**: 58 arquivos Markdown
- **Categorias Principais**: 8
- **TOGAF Artefatos**: 26 documentos
- **Diagramas**: 4 principais
- **Guias de Deploy**: 5 documentos

## 🔄 Manutenção

### Adicionar Nova Documentação

1. Identificar a categoria apropriada
2. Criar arquivo seguindo padrões de nomenclatura
3. Adicionar link no README.md da categoria
4. Atualizar índices principais se necessário

### Atualizar Documentação Existente

1. Localizar arquivo na estrutura
2. Fazer alterações
3. Verificar links quebrados
4. Atualizar data de última atualização

### Remover Documentação

1. Verificar dependências (links)
2. Remover arquivo
3. Atualizar índices
4. Remover links em outros documentos

## 📝 Convenções

### Nomenclatura
- Arquivos: `kebab-case.md`
- Diretórios: `kebab-case/`
- READMEs: `README.md` em cada diretório principal

### Estrutura de Documentos
- Título claro
- Seções bem organizadas
- Links para documentos relacionados
- Exemplos quando apropriado

### Links
- Relativos quando possível
- Absolutos apenas para URLs externas
- Verificar links regularmente

## 🎯 Objetivos da Organização

1. **Encontrar Rapidamente**: Estrutura intuitiva
2. **Navegar Facilmente**: Links e índices
3. **Manter Consistente**: Padrões claros
4. **Escalar Bem**: Estrutura extensível

## 📅 Histórico de Organização

- **2025-01-16**: Reorganização completa da documentação
  - Criação de estrutura hierárquica
  - Movimentação de arquivos para categorias apropriadas
  - Criação de índices e READMEs
  - Integração de TOGAF na estrutura principal

---

[← Voltar para README Principal](./README.md) | [Ver Índice Completo](./INDEX.md)

