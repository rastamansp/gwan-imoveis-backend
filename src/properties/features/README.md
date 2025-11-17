# Arquivos de Feature BDD - Propriedades

Este diretório contém os arquivos de feature BDD (Behavior-Driven Development) organizados por endpoint para facilitar a manutenção e execução dos testes.

## Estrutura de Arquivos

### Endpoints Principais

- **`list-properties.feature`** - `GET /api/properties`
  - Listagem pública de propriedades
  - Filtros por cidade, tipo, finalidade, preço e realtor
  - Filtros combinados

- **`get-property-by-id.feature`** - `GET /api/properties/:id`
  - Obter detalhes de uma propriedade específica
  - Validação de informações do realtor
  - Tratamento de propriedade inexistente

- **`list-my-properties.feature`** - `GET /api/properties/me`
  - Listar apenas propriedades do usuário autenticado
  - Requer autenticação (CORRETOR ou ADMIN)

- **`create-property.feature`** - `POST /api/properties`
  - Criar nova propriedade
  - Validação de comodidades
  - Validação de finalidade (purpose)
  - Tratamento de erros de autenticação e validação

- **`update-property.feature`** - `PUT /api/properties/:id`
  - Atualizar propriedade existente
  - Validação de permissões (apenas dono ou ADMIN)
  - Tratamento de erros de autenticação

- **`delete-property.feature`** - `DELETE /api/properties/:id`
  - Deletar propriedade
  - Validação de permissões (apenas dono ou ADMIN)
  - Tratamento de erros de autenticação

### Validações e Integrações

- **`property-validation.feature`** - Validações gerais
  - Verificação de campos em inglês
  - Validação de estrutura de dados

- **`properties-integration.feature`** - Integração com Chat
  - Busca de propriedades via chatbot
  - Filtros através de conversação natural

## Executando Testes

### Executar todos os testes de propriedades
```bash
npm run test:bdd
```

### Executar testes de um endpoint específico
```bash
# Listar propriedades
npx cucumber-js src/properties/features/list-properties.feature --require-module ts-node/register --require test/bdd/support/hooks.ts --require test/bdd/steps/common-steps.ts --require src/properties/steps/properties-steps.ts

# Criar propriedade
npx cucumber-js src/properties/features/create-property.feature --require-module ts-node/register --require test/bdd/support/hooks.ts --require test/bdd/steps/common-steps.ts --require src/properties/steps/properties-steps.ts

# Obter por ID
npx cucumber-js src/properties/features/get-property-by-id.feature --require-module ts-node/register --require test/bdd/support/hooks.ts --require test/bdd/steps/common-steps.ts --require src/properties/steps/properties-steps.ts
```

### Executar testes por tag
```bash
# Apenas testes de smoke
npx cucumber-js --tags "@smoke"

# Apenas testes de filtros
npx cucumber-js --tags "@filters"

# Apenas testes de autenticação
npx cucumber-js --tags "@auth"
```

## Tags Disponíveis

- `@smoke` - Testes básicos de smoke
- `@properties` - Todos os testes de propriedades
- `@list` - Testes de listagem
- `@get` - Testes de obtenção por ID
- `@create` - Testes de criação
- `@update` - Testes de atualização
- `@delete` - Testes de deleção
- `@auth` - Testes que requerem autenticação
- `@filters` - Testes de filtros
- `@city` - Filtros por cidade
- `@type` - Filtros por tipo
- `@price` - Filtros por preço
- `@purpose` - Filtros por finalidade
- `@realtor` - Filtros por realtor
- `@combined` - Filtros combinados
- `@amenities` - Testes de comodidades
- `@validation` - Testes de validação
- `@negative` - Testes negativos (erros esperados)
- `@notfound` - Testes de recursos não encontrados
- `@integration` - Testes de integração
- `@chat` - Testes de integração com chat

## Benefícios da Organização por Endpoint

1. **Facilita identificação de impacto**: Quando um endpoint é alterado, é fácil identificar quais testes precisam ser atualizados
2. **Execução seletiva**: Permite executar apenas os testes relevantes para uma mudança específica
3. **Manutenção simplificada**: Cada arquivo foca em um único endpoint, facilitando a leitura e manutenção
4. **Melhor organização**: Estrutura clara e intuitiva para novos desenvolvedores

