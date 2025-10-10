# Fluxo de Dados

Diagrama gerado automaticamente em 2025-10-10T23:37:23.457Z

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as API Gateway
    participant N as NestJS API
    participant D as Database
    participant E as External Services
    
    U->>F: Acessa aplicação
    F->>A: Request HTTP
    A->>N: Roteamento
    N->>N: Validação
    N->>N: Autenticação
    N->>D: Query/Command
    D-->>N: Response
    N->>E: Chamada externa (opcional)
    E-->>N: Response
    N->>N: Processamento
    N-->>A: Response
    A-->>F: Response
    F-->>U: Interface atualizada
```

## Descrição

Este diagrama foi gerado automaticamente a partir da análise do código fonte.

## Como usar

1. Copie o código Mermaid acima
2. Cole em um editor que suporte Mermaid (GitHub, GitLab, etc.)
3. O diagrama será renderizado automaticamente

## Atualização

Este diagrama é atualizado automaticamente quando o código fonte é modificado.
