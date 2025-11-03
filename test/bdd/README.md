# Testes BDD com Cucumber

Este diretório contém os testes BDD (Behavior-Driven Development) para o chatbot, usando Cucumber e Gherkin.

## Estrutura

```
test/bdd/
├── features/          # Arquivos .feature (cenários Gherkin)
│   └── chat/          # Cenários específicos do chatbot
├── steps/             # Step definitions (implementação dos steps)
│   ├── common-steps.ts
│   ├── chat-steps.ts
│   ├── events-steps.ts
│   └── artists-steps.ts
├── support/           # Arquivos de suporte
│   ├── world.ts       # Contexto compartilhado (World)
│   ├── test-client.ts # Cliente HTTP para testes
│   └── hooks.ts       # Hooks (Before/After)
└── reports/           # Relatórios gerados (gitignored)

```

## Executando os Testes

```bash
# Executar todos os testes BDD
npm run test:bdd

# Executar em modo watch (observa mudanças)
npm run test:bdd:watch

# Executar e gerar relatório
npm run test:bdd:report
```

## Variáveis de Ambiente

- `TEST_BASE_URL`: URL base da aplicação (padrão: `http://localhost:3001`)

```bash
TEST_BASE_URL=http://localhost:3001 npm run test:bdd
```

## Tags

Os cenários podem ser marcados com tags para execução seletiva:

- `@smoke`: Testes de fumaça (críticos)
- `@chat`: Relacionados ao chatbot
- `@events`: Relacionados a eventos
- `@artists`: Relacionados a artistas
- `@integration`: Testes de integração
- `@negative`: Testes de casos negativos

```bash
# Executar apenas testes smoke
cucumber-js --config test/bdd/.cucumberrc.js --tags @smoke

# Executar apenas testes de eventos
cucumber-js --config test/bdd/.cucumberrc.js --tags @events
```

## Features Disponíveis

### chat-events.feature
Cenários para buscar e consultar eventos:
- Listar eventos
- Buscar por ID, código, nome
- Busca semântica (RAG)
- Obter preços de ingressos

### chat-artists.feature
Cenários para buscar e consultar artistas:
- Listar artistas
- Buscar por ID, nome artístico, nome real
- Busca semântica (RAG)
- Eventos vinculados

### chat-integration.feature
Cenários de integração que combinam múltiplas ferramentas:
- Fluxos completos de conversação
- Múltiplas ferramentas em uma conversa
- Busca combinada de eventos e artistas

## Steps Compartilhados

Os steps estão organizados para reutilização:

### common-steps.ts
- `que o chatbot está disponível`
- `envio a mensagem {string}`
- `o status da resposta deve ser {int}`
- `devo receber uma resposta`
- `devo receber um erro`

### chat-steps.ts
- `devo receber uma resposta contendo {string}`
- `a resposta deve usar a ferramenta {string}`
- `a resposta deve usar pelo menos uma ferramenta`

### events-steps.ts
- `a resposta deve listar {int} eventos`
- `deve conter o evento {string}`
- `deve conter o código {string}`
- `a resposta deve mencionar preços de ingressos`

### artists-steps.ts
- `a resposta deve listar {int} artistas`
- `deve conter o artista {string}`
- `a resposta deve mencionar detalhes do artista`

## Relatórios

Após executar os testes, os relatórios são gerados em `test/bdd/reports/`:
- `cucumber-report.json`: Relatório em JSON
- `cucumber-report.html`: Relatório HTML visual

## Adicionando Novos Cenários

1. Crie ou edite um arquivo `.feature` em `features/`
2. Escreva os cenários em Gherkin
3. Implemente os steps necessários em `steps/`
4. Reutilize steps existentes quando possível

Exemplo:

```gherkin
Feature: Nova funcionalidade

  Scenario: Teste básico
    Given que o chatbot está disponível
    When envio a mensagem "nova mensagem"
    Then devo receber uma resposta
    And a resposta deve ser uma string não vazia
```

## Troubleshooting

### Erro: "Chatbot não está disponível"
Certifique-se de que a aplicação está rodando:
```bash
npm run start:dev
```

### Erro: "Cannot find module"
Instale as dependências:
```bash
npm install
```

### Timeout em steps
Aumente o timeout em `support/hooks.ts`:
```typescript
setDefaultTimeout(60 * 1000); // 60 segundos
```

