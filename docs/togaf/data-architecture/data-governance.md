# Data Governance - Governança de Dados

## Visão Geral

Este documento define as **políticas e padrões de governança de dados** da plataforma Litoral Imóveis, garantindo qualidade, segurança e conformidade.

## Princípios de Governança

### 1. Qualidade de Dados

**Padrões**:
- Todos os campos obrigatórios devem ser validados
- Validação de formato (email, telefone, URLs)
- Validação de ranges (preços, áreas, quantidades)
- Validação de integridade referencial

**Responsabilidades**:
- DTOs: Validação de entrada (class-validator)
- Entities: Validação de regras de negócio
- Database: Constraints de integridade

**Métricas**:
- Taxa de dados inválidos: < 0.1%
- Completude de dados: > 95%

### 2. Segurança de Dados

**Classificação de Dados**:

**Públicos**:
- Informações de imóveis (título, descrição, preço, características)
- Perfis profissionais de corretores (nome fantasia, contato público)

**Confidenciais**:
- Dados pessoais de usuários (email, telefone)
- Senhas (hash bcrypt)
- Tokens JWT

**Restritos**:
- Dados administrativos
- Logs de sistema
- Dados financeiros (créditos)

**Proteção**:
- Senhas: Hash bcrypt (salt rounds: 10)
- Tokens: JWT com expiração
- Comunicação: HTTPS obrigatório
- Banco de dados: SSL/TLS
- Storage: Acesso via URLs assinadas (futuro)

### 3. Privacidade de Dados

**LGPD Compliance**:
- Consentimento para coleta de dados
- Direito ao esquecimento (deletar dados)
- Portabilidade de dados (export)
- Transparência sobre uso de dados

**Retenção**:
- Dados de conversas: 2 anos
- Logs de sistema: 90 dias
- Dados de usuários: Indefinido (até solicitação de exclusão)

**Anonimização**:
- Dados históricos podem ser anonimizados após período de retenção

### 4. Padrões de Nomenclatura

**Tabelas**: snake_case, plural
- `properties`
- `property_images`
- `users`
- `realtor_profiles`

**Colunas**: snake_case
- `realtor_id`
- `cover_image_url`
- `has_pool`

**Entidades TypeScript**: PascalCase
- `Property`
- `PropertyImage`
- `User`

**Campos TypeScript**: camelCase
- `realtorId`
- `coverImageUrl`
- `hasPool`

**Enums**: PascalCase
- `PropertyType`
- `UserRole`
- `MessageDirection`

### 5. Padrões de Dados

**IDs**:
- Tipo: UUID v4
- Geração: Automática pelo banco ou aplicação
- Formato: `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`

**Timestamps**:
- Formato: ISO 8601 (UTC)
- Campos: `createdAt`, `updatedAt`
- Tipo: TIMESTAMP com timezone

**Valores Monetários**:
- Tipo: DECIMAL(precision, scale)
- Precision: 12 para preços, 10 para créditos
- Scale: 2 (centavos)
- Exemplo: `850000.00`

**Valores de Área**:
- Tipo: DECIMAL(10, 2)
- Unidade: metros quadrados (m²)
- Exemplo: `150.50`

**Booleanos**:
- Tipo: BOOLEAN
- Padrão: false
- Nomenclatura: `has*`, `is*`

**Textos Longos**:
- Tipo: TEXT (sem limite)
- Uso: Descrições, conteúdo de mensagens

**JSON**:
- Tipo: JSONB (PostgreSQL)
- Uso: Metadados flexíveis, arrays de tools

### 6. Migrações e Versionamento

**Padrão de Nomenclatura**:
- Formato: `{timestamp}-{Description}.ts`
- Exemplo: `1733500000000-RenameFieldsToEnglish.ts`

**Boas Práticas**:
- Migrações reversíveis quando possível
- Testes de migração em ambiente de desenvolvimento
- Backup antes de migrações em produção
- Documentação de mudanças significativas

**Versionamento**:
- TypeORM migrations
- Controle de versão no Git
- Histórico de mudanças de schema

### 7. Backup e Recuperação

**Estratégia de Backup**:
- Backup diário do banco de dados
- Backup incremental a cada 6 horas
- Retenção: 30 dias de backups diários, 12 meses de backups mensais

**Storage**:
- Imagens: Replicação no MinIO
- Backup de arquivos: Sincronização com backup remoto

**Recuperação**:
- RTO (Recovery Time Objective): < 4 horas
- RPO (Recovery Point Objective): < 6 horas

### 8. Qualidade e Validação

**Validação em Múltiplas Camadas**:

1. **DTOs (Presentation)**:
   - class-validator decorators
   - Validação de tipos e formatos
   - Validação de ranges

2. **Use Cases (Application)**:
   - Validação de regras de negócio
   - Validação de permissões
   - Validação de integridade

3. **Entities (Domain)**:
   - Métodos de validação
   - Invariantes de domínio

4. **Database**:
   - Constraints de integridade
   - Foreign keys
   - Check constraints

**Exemplo de Validação em Camadas**:

```typescript
// DTO Layer
@IsString()
@IsNotEmpty()
@MaxLength(255)
title: string;

@IsNumber()
@Min(0)
@Max(100000000)
price: number;

// Use Case Layer
if (newPrice <= 0) {
  throw new Error('Price must be greater than zero');
}

// Entity Layer
public updatePrice(newPrice: number): void {
  if (newPrice <= 0) {
    throw new Error('Price must be greater than zero');
  }
  this.price = newPrice;
}
```

### 9. Auditoria e Rastreabilidade

**Campos de Auditoria**:
- `createdAt`: Data de criação
- `updatedAt`: Data de última atualização
- (Futuro) `createdBy`: Usuário que criou
- (Futuro) `updatedBy`: Usuário que atualizou

**Logs**:
- Todas as operações críticas são logadas
- Logs estruturados (JSON)
- Níveis: DEBUG, INFO, WARN, ERROR

**Rastreabilidade**:
- Histórico de mudanças em mensagens (response, toolsUsed)
- Metadados em conversas (JSONB)

### 10. Conformidade e Regulamentação

**LGPD (Lei Geral de Proteção de Dados)**:
- Consentimento explícito
- Finalidade específica
- Minimização de dados
- Transparência
- Segurança
- Direitos do titular

**Ações de Conformidade**:
- Política de privacidade
- Termos de uso
- Consentimento para cookies (futuro)
- Mecanismo de exclusão de dados
- Exportação de dados pessoais

## Matriz de Responsabilidades

| Aspecto | Responsável | Ferramenta |
|---------|------------|-----------|
| Validação de Entrada | DTOs | class-validator |
| Validação de Negócio | Use Cases | TypeScript |
| Integridade Referencial | Database | PostgreSQL Constraints |
| Segurança de Dados | Application | JWT, bcrypt, HTTPS |
| Backup | Infrastructure | Scripts automatizados |
| Migrações | Development | TypeORM |
| Logs | Application | NestJS Logger |
| Monitoramento | Infrastructure | (Futuro: Prometheus, Grafana) |

## Métricas de Qualidade

| Métrica | Objetivo | Atual |
|---------|----------|-------|
| Taxa de dados inválidos | < 0.1% | - |
| Completude de dados | > 95% | - |
| Tempo de backup | < 1 hora | - |
| Tempo de recuperação | < 4 horas | - |
| Disponibilidade de dados | 99.9% | - |

## Próximas Melhorias

- [ ] Implementar soft delete para dados críticos
- [ ] Adicionar campos de auditoria (createdBy, updatedBy)
- [ ] Implementar versionamento de entidades
- [ ] Adicionar data masking para logs
- [ ] Implementar encryption at rest
- [ ] Adicionar data retention policies automáticas
- [ ] Implementar data quality checks automatizados

