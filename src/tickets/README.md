# Módulo de Tickets

Este módulo contém toda a lógica relacionada à gestão de tickets e compra de ingressos no sistema.

## Estrutura

```
tickets/
├── tickets.controller.ts      # Controller REST para endpoints de tickets
├── tickets.http              # Arquivos de teste HTTP para a API
├── tickets.module.ts          # Módulo NestJS
├── features/                 # Testes BDD (Cucumber)
│   └── tickets-integration.feature  # Cenários de integração do fluxo completo
└── steps/                     # Step definitions para testes BDD
    └── tickets-steps.ts       # Steps específicos para tickets
```

## APIs Disponíveis

Consulte o Swagger em `http://localhost:3001/api` para documentação completa das APIs.

### Endpoints Principais

- `GET /api/tickets` - Listar tickets
- `GET /api/tickets/:id` - Obter ticket por ID
- `POST /api/tickets` - Comprar tickets (criar ingressos)
- `POST /api/tickets/validate` - Validar ticket por QR code
- `PUT /api/tickets/:id/use` - Marcar ticket como usado
- `PUT /api/tickets/:id/transfer` - Transferir ticket
- `PUT /api/tickets/:id/cancel` - Cancelar ticket
- `GET /api/tickets/user/:userId` - Obter tickets do usuário
- `GET /api/tickets/event/:eventId` - Obter tickets do evento

## Testes BDD

Este módulo possui testes BDD usando Cucumber para validar o fluxo completo de compra de ingressos.

### Executar Testes BDD

```bash
# Executar todos os testes BDD
npm run test:bdd

# Executar apenas testes de tickets
npx cucumber-js --config test/bdd/.cucumberrc.js --tags @tickets

# Executar apenas testes smoke de tickets
npx cucumber-js --config test/bdd/.cucumberrc.js --tags @tickets --tags @smoke
```

### Features Disponíveis

#### tickets-integration.feature
Cenários de integração para validar o fluxo completo:
- Criar evento e adicionar categorias de ingressos
- Comprar ingressos sem dados de identificação
- Comprar ingressos com dados de identificação (nome, sobrenome, tipo e número de documento)
- Validar tickets usando QR code
- Consultar tickets do usuário e do evento
- Verificar status e dados de identificação dos tickets

### Variáveis de Ambiente para Testes

```bash
# URL base da API (padrão: http://localhost:3001/api)
TEST_BASE_URL=http://localhost:3001/api

# Credenciais de teste (padrão: admin@gwanshop.com / admin123)
TEST_USER_EMAIL=admin@gwanshop.com
TEST_USER_PASSWORD=admin123
```

## Fluxo de Compra de Ingressos

O processo de compra segue as seguintes etapas:

1. **Validações**: usuário, evento, categoria e disponibilidade
2. **Criação dos tickets**: com dados de identificação (se fornecidos)
3. **Geração de QR codes**: para cada ticket
4. **Salvamento dos tickets**: no banco de dados
5. **Atualização do evento**: contador de ingressos vendidos
6. **Atualização da categoria**: contador de ingressos vendidos

**Nota**: O pagamento é considerado aprovado no use case atual (simulação). A integração real com gateway de pagamento será implementada posteriormente.

## Campos de Identificação

Ao comprar um ingresso, é possível fornecer os seguintes dados opcionais:

- `holderFirstName`: Primeiro nome do titular
- `holderLastName`: Sobrenome do titular
- `documentType`: Tipo de documento (CPF, RG, CNH, PASSAPORTE, OUTRO)
- `documentNumber`: Número do documento

Esses campos são armazenados no ticket e podem ser consultados posteriormente para validação na entrada do evento.

