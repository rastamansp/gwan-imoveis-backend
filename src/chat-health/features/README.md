# Testes BDD - Chat Health

Este diretório contém os arquivos de teste BDD (Behavior-Driven Development) para o chatbot de saúde.

## Arquivos

- `chat-health.feature` - Cenários básicos de teste do chatbot de saúde
- `chat-health-integration.feature` - Cenários de integração e fluxos completos

## Executando os Testes

### Executar todos os testes BDD
```bash
npm run test:bdd
```

### Executar apenas testes do chat-health
```bash
npm run test:bdd -- --tags "@chat-health"
```

### Executar apenas testes de integração
```bash
npm run test:bdd -- --tags "@integration"
```

### Executar apenas testes smoke
```bash
npm run test:bdd -- --tags "@smoke"
```

### Executar com watch mode
```bash
npm run test:bdd:watch
```

## Estrutura dos Testes

Os testes seguem o padrão Gherkin (Given-When-Then):

- **Given**: Pré-condições (ex: "que o chatbot de saúde está disponível")
- **When**: Ações (ex: "envio a consulta 'dor de cabeça'")
- **Then**: Resultados esperados (ex: "devo receber uma resposta")

## Tags Disponíveis

- `@chat-health` - Todos os testes do chatbot de saúde
- `@health` - Testes relacionados a saúde
- `@smoke` - Testes críticos (smoke tests)
- `@integration` - Testes de integração
- `@negative` - Testes de casos negativos/erros

## Exemplos de Uso

### Consulta Simples
```gherkin
Given que o chatbot de saúde está disponível
When envio a consulta "dor de cabeça e febre"
Then devo receber uma resposta
And o status da resposta deve ser 200
```

### Consulta com Sessão
```gherkin
Given que o chatbot de saúde está disponível
When envio a consulta "FEBRE" com sessão
Then devo receber uma resposta
And a resposta deve conter um sessionId
When envio a consulta "quais plantas são indicadas?" com a mesma sessão
Then devo receber uma resposta
And a resposta deve usar a mesma sessão
```

## Steps Disponíveis

### Given
- `que o chatbot de saúde está disponível` - Verifica se o chatbot está rodando

### When
- `envio a consulta "{string}"` - Envia uma consulta simples
- `envio a consulta "{string}" com sessão` - Envia consulta criando/buscando sessão
- `envio a consulta "{string}" com a mesma sessão` - Envia consulta usando sessão existente

### Then
- `devo receber uma resposta` - Verifica se houve resposta
- `o status da resposta deve ser {int}` - Verifica status HTTP
- `a resposta deve conter {string}` - Verifica se resposta contém texto
- `a resposta deve conter informações sobre doença` - Verifica informações de doença
- `o método de busca deve ser {string}` - Verifica método de busca usado
- `a similaridade deve ser maior que {int}` - Verifica similaridade (busca semântica)
- `a resposta deve mencionar plantas medicinais` - Verifica menção a plantas
- `a resposta deve mencionar recomendações de tratamento` - Verifica menção a tratamento
- `a resposta deve mencionar causas da doença` - Verifica menção a causas
- `a resposta deve conter um sessionId` - Verifica presença de sessionId
- `a resposta deve usar a mesma sessão` - Verifica continuidade de sessão
- `a resposta deve indicar que nenhuma doença foi encontrada` - Verifica mensagem de não encontrado

## Configuração

Os testes usam a variável de ambiente `TEST_BASE_URL` para determinar a URL base da API. Por padrão, usa `http://localhost:3001`.

```bash
TEST_BASE_URL=http://localhost:3001 npm run test:bdd
```

## Relatórios

Após a execução, os relatórios são gerados em:
- `test/bdd/reports/cucumber-report.json` - Relatório JSON
- `test/bdd/reports/cucumber-report.html` - Relatório HTML

