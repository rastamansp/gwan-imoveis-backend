# Arquitetura do Sistema

Diagrama gerado automaticamente em 2025-10-10T23:37:23.455Z

```mermaid
graph TB
    subgraph "Frontend"
        FE[Frontend Web]
        FE_MOBILE[Mobile App]
    end
    
    subgraph "API Gateway"
        GW[API Gateway]
        LB[Load Balancer]
    end
    
    subgraph "Backend Services"
        API[REST API<br/>NestJS]
        MCP[MCP Server<br/>Model Context Protocol]
        AUTH[Auth Service]
        PAYMENT[Payment Service]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL<br/>Database)]
        REDIS[(Redis<br/>Cache)]
        FILES[File Storage<br/>S3/MinIO]
    end
    
    subgraph "External Services"
        EMAIL[Email Service<br/>SMTP/SendGrid]
        SMS[SMS Service<br/>Twilio]
        PAYMENT_GW[Payment Gateway<br/>Stripe/MercadoPago]
    end
    
    subgraph "Monitoring"
        LOGS[Logs<br/>ELK Stack]
        METRICS[Metrics<br/>Prometheus]
        ALERTS[Alerts<br/>Grafana]
    end
    
    FE --> GW
    FE_MOBILE --> GW
    GW --> LB
    LB --> API
    LB --> MCP
    
    API --> AUTH
    API --> PAYMENT
    API --> DB
    API --> REDIS
    API --> FILES
    
    MCP --> API
    
    PAYMENT --> PAYMENT_GW
    API --> EMAIL
    API --> SMS
    
    API --> LOGS
    API --> METRICS
    METRICS --> ALERTS
```

## Descrição

Este diagrama foi gerado automaticamente a partir da análise do código fonte.

## Como usar

1. Copie o código Mermaid acima
2. Cole em um editor que suporte Mermaid (GitHub, GitLab, etc.)
3. O diagrama será renderizado automaticamente

## Atualização

Este diagrama é atualizado automaticamente quando o código fonte é modificado.
