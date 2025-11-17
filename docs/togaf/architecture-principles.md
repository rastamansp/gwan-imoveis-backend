# Architecture Principles - Princípios Arquiteturais

## Visão Geral

Este documento define os **princípios arquiteturais** que guiam o desenvolvimento e evolução da plataforma Litoral Imóveis, garantindo consistência, qualidade e alinhamento estratégico.

## Princípios Fundamentais

### 1. Clean Architecture

**Definição**: A arquitetura é organizada em camadas concêntricas, onde cada camada depende apenas das camadas internas.

**Aplicação**:
- **Domain Layer**: Independente de frameworks, contém regras de negócio puras
- **Application Layer**: Casos de uso que orquestram a lógica de negócio
- **Infrastructure Layer**: Implementações concretas (repositories, serviços externos)
- **Presentation Layer**: Controllers, DTOs, interfaces de usuário

**Benefícios**:
- Testabilidade
- Independência de frameworks
- Flexibilidade para mudanças
- Manutenibilidade

**Exemplo**:
```typescript
// Domain (independente)
export class Property {
  public updatePrice(newPrice: number): void {
    // Lógica de domínio pura
  }
}

// Application (usa domain)
@Injectable()
export class UpdatePropertyUseCase {
  async execute(id: string, price: number) {
    const property = await this.repository.findById(id);
    property.updatePrice(price); // Método de domínio
    return await this.repository.save(property);
  }
}
```

### 2. SOLID Principles

**Single Responsibility Principle (SRP)**
- Cada classe tem uma única responsabilidade
- Exemplo: `PropertyService` gerencia apenas propriedades

**Open/Closed Principle (OCP)**
- Aberto para extensão, fechado para modificação
- Exemplo: Novos formatadores podem ser adicionados sem modificar `ChatService`

**Liskov Substitution Principle (LSP)**
- Objetos derivados devem ser substituíveis pelos base
- Exemplo: Qualquer implementação de `IPropertyRepository` pode ser usada

**Interface Segregation Principle (ISP)**
- Interfaces específicas são melhores que genéricas
- Exemplo: `IPropertyRepository` vs interface genérica `IRepository`

**Dependency Inversion Principle (DIP)**
- Dependa de abstrações, não de implementações
- Exemplo: Use Cases dependem de `IPropertyRepository`, não de `PropertyTypeOrmRepository`

### 3. Domain-Driven Design (DDD)

**Entities**
- Objetos com identidade única
- Exemplo: `Property`, `User`, `Conversation`

**Value Objects**
- Objetos imutáveis sem identidade
- Exemplo: `PropertyType`, `UserRole`, `MessageDirection`

**Aggregates**
- Conjuntos de entidades relacionadas
- Exemplo: `Property` (aggregate root) + `PropertyImage`

**Repositories**
- Abstrações para persistência de agregados
- Exemplo: `IPropertyRepository`

**Domain Services**
- Lógica de negócio que não pertence a uma entidade
- Exemplo: Validação complexa de regras de negócio

### 4. Separation of Concerns

**Aplicação**:
- **Controllers**: Apenas recebem requisições e delegam
- **Use Cases**: Orquestram lógica de negócio
- **Repositories**: Apenas acesso a dados
- **Services**: Lógica técnica (não de negócio)

**Benefícios**:
- Código mais limpo
- Facilita testes
- Reutilização
- Manutenibilidade

### 5. Dependency Injection

**Aplicação**:
- Todas as dependências injetadas via constructor
- Uso de interfaces para abstrações
- Container de DI do NestJS

**Benefícios**:
- Testabilidade (mocks fáceis)
- Flexibilidade (troca de implementações)
- Baixo acoplamento

**Exemplo**:
```typescript
@Injectable()
export class CreatePropertyUseCase {
  constructor(
    @Inject('IPropertyRepository')
    private readonly propertyRepository: IPropertyRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}
}
```

## Princípios de Design

### 6. Fail Fast

**Aplicação**:
- Validação de entrada o mais cedo possível
- Erros claros e específicos
- Não silenciar erros

**Benefícios**:
- Debugging mais fácil
- Melhor experiência do desenvolvedor
- Prevenção de bugs

### 7. Explicit over Implicit

**Aplicação**:
- Código explícito e claro
- Evitar "magic numbers"
- Nomes descritivos
- Tipos explícitos

**Benefícios**:
- Legibilidade
- Manutenibilidade
- Redução de erros

### 8. Don't Repeat Yourself (DRY)

**Aplicação**:
- Reutilização de código
- Evitar duplicação
- Extrair lógica comum

**Cuidados**:
- Não sobre-abstrair
- Balancear reutilização vs simplicidade

### 9. You Aren't Gonna Need It (YAGNI)

**Aplicação**:
- Implementar apenas o necessário
- Evitar over-engineering
- Adicionar complexidade quando necessário

**Benefícios**:
- Código mais simples
- Menos manutenção
- Foco no que importa

### 10. Keep It Simple, Stupid (KISS)

**Aplicação**:
- Soluções simples quando possível
- Evitar complexidade desnecessária
- Clareza sobre "cleverness"

**Benefícios**:
- Facilita entendimento
- Reduz bugs
- Facilita manutenção

## Princípios de API

### 11. RESTful Design

**Aplicação**:
- Verbos HTTP apropriados
- Status codes corretos
- Recursos nomeados corretamente
- Stateless

**Exemplo**:
```
GET    /api/properties        # Listar
GET    /api/properties/:id    # Obter
POST   /api/properties        # Criar
PUT    /api/properties/:id    # Atualizar
DELETE /api/properties/:id    # Deletar
```

### 12. Versionamento

**Aplicação**:
- Versionamento de APIs (futuro)
- Backward compatibility quando possível
- Documentação de breaking changes

### 13. Documentação

**Aplicação**:
- Swagger/OpenAPI para APIs
- Documentação de código (JSDoc)
- README atualizado
- Documentação arquitetural (TOGAF)

## Princípios de Segurança

### 14. Defense in Depth

**Aplicação**:
- Múltiplas camadas de segurança
- Validação em cada camada
- Autenticação e autorização
- HTTPS obrigatório

### 15. Least Privilege

**Aplicação**:
- Permissões mínimas necessárias
- Role-based access control
- Validação de permissões

### 16. Secure by Default

**Aplicação**:
- Configurações seguras por padrão
- Validação de entrada
- Sanitização de dados
- Proteção contra SQL injection, XSS

## Princípios de Performance

### 17. Caching Strategy

**Aplicação**:
- Cache de dados frequentes
- TTL apropriado
- Invalidação adequada
- Estratégia de cache por tipo de dado

### 18. Lazy Loading

**Aplicação**:
- Carregar dados sob demanda
- Evitar over-fetching
- Paginação quando apropriado

### 19. Optimize Critical Path

**Aplicação**:
- Otimizar operações frequentes
- Identificar bottlenecks
- Medir antes de otimizar

## Princípios de Qualidade

### 20. Testability

**Aplicação**:
- Código testável
- Dependências injetadas
- Mocks facilitados
- Testes em múltiplos níveis

### 21. Maintainability

**Aplicação**:
- Código limpo e legível
- Documentação adequada
- Padrões consistentes
- Refatoração contínua

### 22. Observability

**Aplicação**:
- Logs estruturados
- Métricas coletadas
- Traces (futuro)
- Health checks

## Princípios de Evolução

### 23. Incremental Development

**Aplicação**:
- Desenvolvimento incremental
- Releases frequentes
- Feedback contínuo
- Iteração rápida

### 24. Backward Compatibility

**Aplicação**:
- Manter compatibilidade quando possível
- Versionamento para breaking changes
- Deprecation warnings
- Migration paths

### 25. Technical Debt Management

**Aplicação**:
- Identificar e documentar technical debt
- Planejar refatorações
- Balancear features vs debt
- Revisões periódicas

## Aplicação dos Princípios

### Checklist de Decisões Arquiteturais

Ao tomar decisões arquiteturais, considerar:

- [ ] Alinha com Clean Architecture?
- [ ] Segue princípios SOLID?
- [ ] Respeita DDD?
- [ ] Mantém separação de responsabilidades?
- [ ] É testável?
- [ ] É seguro?
- [ ] É performático?
- [ ] É manutenível?
- [ ] É documentado?

## Revisão dos Princípios

**Frequência**: Anual ou quando necessário

**Processo**:
1. Revisar princípios existentes
2. Avaliar aplicação prática
3. Identificar novos princípios necessários
4. Atualizar documentação
5. Comunicar mudanças

## Referências

- Clean Architecture (Robert C. Martin)
- SOLID Principles
- Domain-Driven Design (Eric Evans)
- TOGAF Framework
- NestJS Best Practices

