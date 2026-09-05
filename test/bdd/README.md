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
│   └── chat-health-steps.ts
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

- `TEST_BASE_URL`: URL base da aplicação (padrão: `http://localhost:3003`, porta do slot 3)

```bash
TEST_BASE_URL=http://localhost:3003 npm run test:bdd
```

## ⚠️ A API precisa subir com os limites de teste

A suíte dispara 343 steps contra o mesmo IP em menos de um minuto. Isso estoura o rate limiting
(`THROTTLE_PUBLIC_PER_MINUTE=120` no default de produção) e **todos os cenários falham** — inclusive
os que nada têm a ver com o endpoint limitado.

O sintoma engana: a mensagem dizia "API não está disponível" enquanto a aplicação respondia
normalmente, só que com `429`. Os steps de disponibilidade hoje distinguem os dois casos, mas o
ajuste de ambiente continua necessário. Suba a API assim:

```bash
THROTTLE_PUBLIC_PER_MINUTE=100000 THROTTLE_PUBLIC_PER_DAY=1000000 \
THROTTLE_AUTH_PER_MINUTE=1000 THROTTLE_AUTH_PER_DAY=100000 \
THROTTLE_AI_PER_MINUTE=1000 THROTTLE_AI_PER_DAY=100000 \
npm run start:dev
```

Esses valores valem **só para teste** — nunca para produção, onde o limite é o que protege o
`/chat`, que custa dinheiro por mensagem.

O login é autenticado **uma vez por credencial** por execução (`support/token-cache.ts`), então
cenário que precise exercitar o próprio login deve invalidar a entrada antes.

## Tags

Os cenários podem ser marcados com tags para execução seletiva:

- `@smoke`: Testes de fumaça (críticos)
- `@chat`: Relacionados ao chatbot
- `@integration`: Testes de integração
- `@negative`: Testes de casos negativos

```bash
# Executar apenas testes smoke
cucumber-js --config test/bdd/.cucumberrc.js --tags @smoke
```

## Features Disponíveis

### chat.feature
Cenários para o chatbot de imóveis:
- Consultas sobre imóveis
- Busca de propriedades
- Informações sobre locação e venda

### chat-integration.feature
Cenários de integração que combinam múltiplas ferramentas:
- Fluxos completos de conversação
- Múltiplas ferramentas em uma conversa

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

### chat-health-steps.ts
- Steps relacionados ao chatbot de saúde (se aplicável)

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

