#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Gerador automático de diagramas Mermaid
 */

class MermaidDiagramGenerator {
  constructor() {
    this.srcPath = path.join(__dirname, '../src');
    this.docsPath = path.join(__dirname, '../docs');
    this.outputPath = path.join(__dirname, '../docs/generated');
  }

  /**
   * Executa o gerador de diagramas
   */
  async generate() {
    console.log('📊 Gerando diagramas Mermaid...');
    
    try {
      // Criar diretório de saída
      this.ensureOutputDir();
      
      // Gerar diagramas
      await this.generateSystemArchitecture();
      await this.generateDataFlow();
      await this.generateModuleDependencies();
      await this.generateApiFlow();
      await this.generateDatabaseSchema();
      await this.generateMCPFlow();
      
      console.log('✅ Diagramas Mermaid gerados com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao gerar diagramas:', error.message);
      process.exit(1);
    }
  }

  /**
   * Cria diretório de saída
   */
  ensureOutputDir() {
    if (!fs.existsSync(this.outputPath)) {
      fs.mkdirSync(this.outputPath, { recursive: true });
    }
  }

  /**
   * Gera diagrama de arquitetura do sistema
   */
  async generateSystemArchitecture() {
    const diagram = `graph TB
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
    METRICS --> ALERTS`;

    await this.saveDiagram('system-architecture', diagram, 'Arquitetura do Sistema');
  }

  /**
   * Gera diagrama de fluxo de dados
   */
  async generateDataFlow() {
    const diagram = `sequenceDiagram
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
    F-->>U: Interface atualizada`;

    await this.saveDiagram('data-flow', diagram, 'Fluxo de Dados');
  }

  /**
   * Gera diagrama de dependências entre módulos
   */
  async generateModuleDependencies() {
    const modules = this.findModules();
    
    let diagram = 'graph TB\n';
    diagram += '    subgraph "Presentation Layer"\n';
    
    for (const module of modules) {
      const moduleName = module.charAt(0).toUpperCase() + module.slice(1);
      diagram += `        ${moduleName}Controller[${moduleName} Controller]\n`;
    }
    
    diagram += '    end\n';
    diagram += '    subgraph "Application Layer"\n';
    
    for (const module of modules) {
      const moduleName = module.charAt(0).toUpperCase() + module.slice(1);
      diagram += `        ${moduleName}Service[${moduleName} Service]\n`;
    }
    
    diagram += '    end\n';
    diagram += '    subgraph "Domain Layer"\n';
    diagram += '        Entities[Entities]\n';
    diagram += '        ValueObjects[Value Objects]\n';
    diagram += '        DomainServices[Domain Services]\n';
    diagram += '    end\n';
    diagram += '    subgraph "Infrastructure Layer"\n';
    diagram += '        Repositories[Repositories]\n';
    diagram += '        ExternalServices[External Services]\n';
    diagram += '    end\n';
    
    // Conectar camadas
    for (const module of modules) {
      const moduleName = module.charAt(0).toUpperCase() + module.slice(1);
      diagram += `    ${moduleName}Controller --> ${moduleName}Service\n`;
      diagram += `    ${moduleName}Service --> Entities\n`;
      diagram += `    ${moduleName}Service --> Repositories\n`;
    }
    
    diagram += '    Repositories --> Entities\n';
    diagram += '    ExternalServices --> DomainServices\n';

    await this.saveDiagram('module-dependencies', diagram, 'Dependências entre Módulos');
  }

  /**
   * Gera diagrama de fluxo da API
   */
  async generateApiFlow() {
    const modules = this.findModules();
    
    let diagram = 'graph TB\n';
    diagram += '    Client[Cliente] --> Gateway[API Gateway]\n';
    diagram += '    Gateway --> Auth[Auth Module]\n';
    
    for (const module of modules) {
      const moduleName = module.charAt(0).toUpperCase() + module.slice(1);
      diagram += `    Gateway --> ${moduleName}[${moduleName} Module]\n`;
      diagram += `    ${moduleName} --> DB[(Database)]\n`;
    }
    
    diagram += '    Auth --> DB\n';
    diagram += '    Gateway --> MCP[MCP Server]\n';
    diagram += '    MCP --> Gateway\n';
    
    // Adicionar fluxos específicos
    diagram += '    Gateway --> Cache[Cache Layer]\n';
    diagram += '    Cache --> DB\n';
    diagram += '    Gateway --> Logs[Logging]\n';

    await this.saveDiagram('api-flow', diagram, 'Fluxo da API');
  }

  /**
   * Gera diagrama de schema do banco
   */
  async generateDatabaseSchema() {
    const entities = this.findEntities();
    
    let diagram = 'erDiagram\n';
    
    for (const entity of entities) {
      diagram += `    ${entity.name} {\n`;
      
      // Adicionar propriedades básicas
      diagram += '        string id\n';
      diagram += '        datetime createdAt\n';
      diagram += '        datetime updatedAt\n';
      
      // Adicionar propriedades específicas da entidade
      if (entity.properties) {
        for (const prop of entity.properties) {
          diagram += `        ${prop.type} ${prop.name}\n`;
        }
      }
      
      diagram += '    }\n';
    }
    
    // Adicionar relacionamentos
    diagram += '    User ||--o{ Event : creates\n';
    diagram += '    Event ||--o{ Ticket : has\n';
    diagram += '    User ||--o{ Ticket : owns\n';
    diagram += '    Ticket ||--o{ Payment : generates\n';

    await this.saveDiagram('database-schema', diagram, 'Schema do Banco de Dados');
  }

  /**
   * Gera diagrama de fluxo MCP
   */
  async generateMCPFlow() {
    const diagram = `graph TB
    subgraph "MCP Clients"
        CLAUDE[Claude Desktop]
        VSCODE[VS Code Extension]
        OTHER[Other MCP Clients]
    end
    
    subgraph "MCP Server"
        STDIO[Stdio Transport]
        SSE[SSE Transport]
        SERVER[MCP Server Core]
    end
    
    subgraph "Tool Processing"
        CONVERTER[OpenAPI Converter]
        HANDLER[HTTP Handler]
        AUTH[Auth Middleware]
    end
    
    subgraph "Backend Services"
        NESTJS[NestJS API]
        SWAGGER[Swagger/OpenAPI]
        DB[(Database)]
    end
    
    CLAUDE --> STDIO
    VSCODE --> SSE
    OTHER --> STDIO
    
    STDIO --> SERVER
    SSE --> SERVER
    
    SERVER --> CONVERTER
    CONVERTER --> SWAGGER
    SERVER --> HANDLER
    HANDLER --> AUTH
    AUTH --> NESTJS
    
    NESTJS --> SWAGGER
    NESTJS --> DB`;

    await this.saveDiagram('mcp-flow', diagram, 'Fluxo MCP');
  }

  /**
   * Encontra módulos no projeto
   */
  findModules() {
    const modules = [];
    const modulesPath = path.join(this.srcPath, 'modules');
    
    if (!fs.existsSync(modulesPath)) {
      return modules;
    }

    const items = fs.readdirSync(modulesPath);
    
    for (const item of items) {
      const itemPath = path.join(modulesPath, item);
      if (fs.statSync(itemPath).isDirectory()) {
        modules.push(item);
      }
    }

    return modules;
  }

  /**
   * Encontra entidades no projeto
   */
  findEntities() {
    const entities = [];
    const sharedPath = path.join(this.srcPath, 'shared');
    
    if (!fs.existsSync(sharedPath)) {
      return entities;
    }

    // Buscar em shared/domain/entities
    const entitiesPath = path.join(sharedPath, 'domain', 'entities');
    if (fs.existsSync(entitiesPath)) {
      const files = fs.readdirSync(entitiesPath);
      
      for (const file of files) {
        if (file.endsWith('.entity.ts')) {
          const entityName = file.replace('.entity.ts', '');
          entities.push({
            name: entityName.charAt(0).toUpperCase() + entityName.slice(1),
            file: file,
            properties: this.extractEntityProperties(path.join(entitiesPath, file))
          });
        }
      }
    }

    return entities;
  }

  /**
   * Extrai propriedades de uma entidade
   */
  extractEntityProperties(filePath) {
    const properties = [];
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Regex para encontrar propriedades
      const propRegex = /@Column\([^)]*\)\s*\w+:\s*(\w+)/g;
      let match;
      
      while ((match = propRegex.exec(content)) !== null) {
        properties.push({
          name: match[1],
          type: 'string' // Simplificado para o exemplo
        });
      }
    } catch (error) {
      console.warn(`⚠️  Erro ao ler entidade ${filePath}:`, error.message);
    }
    
    return properties;
  }

  /**
   * Salva diagrama em arquivo
   */
  async saveDiagram(name, diagram, title) {
    const content = this.generateDiagramMarkdown(name, diagram, title);
    const outputFile = path.join(this.outputPath, `${name}.md`);
    fs.writeFileSync(outputFile, content);
    console.log(`✅ Diagrama ${name} salvo`);
  }

  /**
   * Gera Markdown para diagrama
   */
  generateDiagramMarkdown(name, diagram, title) {
    let content = `# ${title}\n\n`;
    content += `Diagrama gerado automaticamente em ${new Date().toISOString()}\n\n`;
    content += '```mermaid\n';
    content += diagram;
    content += '\n```\n\n';
    content += '## Descrição\n\n';
    content += 'Este diagrama foi gerado automaticamente a partir da análise do código fonte.\n\n';
    content += '## Como usar\n\n';
    content += '1. Copie o código Mermaid acima\n';
    content += '2. Cole em um editor que suporte Mermaid (GitHub, GitLab, etc.)\n';
    content += '3. O diagrama será renderizado automaticamente\n\n';
    content += '## Atualização\n\n';
    content += 'Este diagrama é atualizado automaticamente quando o código fonte é modificado.\n';
    
    return content;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const generator = new MermaidDiagramGenerator();
  generator.generate().catch(console.error);
}

module.exports = MermaidDiagramGenerator;
