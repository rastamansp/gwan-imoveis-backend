/**
 * Configuração para documentação automática
 */

module.exports = {
  // Configurações gerais
  title: 'Gwan Events Backend',
  description: 'Documentação automática da plataforma de eventos e venda de ingressos',
  version: '1.0.0',
  
  // URLs e endpoints
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3001',
    swaggerPath: '/api-json',
    docsPath: '/api'
  },
  
  // Diretórios
  paths: {
    src: './src',
    docs: './docs',
    generated: './docs/generated',
    scripts: './scripts'
  },
  
  // Configurações de geração
  generation: {
    // Incluir arquivos específicos
    include: [
      'src/**/*.controller.ts',
      'src/**/*.service.ts',
      'src/**/*.entity.ts',
      'src/**/*.dto.ts',
      'src/**/*.interface.ts'
    ],
    
    // Excluir arquivos
    exclude: [
      'src/**/*.spec.ts',
      'src/**/*.test.ts',
      'node_modules/**',
      'dist/**'
    ],
    
    // Configurações de diagramas
    diagrams: {
      mermaid: {
        theme: 'default',
        backgroundColor: 'white',
        fontSize: 14
      },
      
      // Tipos de diagramas a gerar
      types: [
        'system-architecture',
        'data-flow',
        'module-dependencies',
        'api-flow',
        'database-schema',
        'mcp-flow'
      ]
    }
  },
  
  // Configurações de validação
  validation: {
    // Regras de validação
    rules: {
      // Tamanho mínimo de arquivos
      minFileSize: 100,
      
      // Arquivos obrigatórios
      requiredFiles: [
        'README.md',
        'architecture/overview.md',
        'development/setup.md',
        'api/overview.md',
        'mcp/overview.md',
        'deployment/environment.md',
        'diagrams/system-architecture.md'
      ],
      
      // Diretórios obrigatórios
      requiredDirs: [
        'architecture',
        'development',
        'api',
        'mcp',
        'deployment',
        'diagrams'
      ],
      
      // Validações de Markdown
      markdown: {
        requireTitle: true,
        requireDescription: true,
        maxLineLength: 120,
        requireCodeBlocks: false
      },
      
      // Validações de Mermaid
      mermaid: {
        requireDiagram: true,
        minNodes: 2,
        requireConnections: true
      }
    },
    
    // Níveis de erro
    errorLevels: {
      error: 'error',
      warning: 'warning',
      info: 'info'
    }
  },
  
  // Configurações de servidor
  server: {
    port: process.env.DOCS_PORT || 8080,
    host: 'localhost',
    open: true,
    cors: true
  },
  
  // Configurações de monitoramento
  watch: {
    // Arquivos para monitorar
    files: [
      'src/**/*.ts',
      'docs/**/*.md',
      'package.json',
      'tsconfig.json'
    ],
    
    // Ignorar arquivos
    ignored: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'docs/generated/**'
    ],
    
    // Delay para regeneração
    delay: 1000
  },
  
  // Configurações de templates
  templates: {
    // Template para documentação de API
    api: {
      title: 'API {module}',
      description: 'Documentação automática dos endpoints do módulo {module}',
      sections: [
        'overview',
        'endpoints',
        'schemas',
        'examples',
        'errors'
      ]
    },
    
    // Template para diagramas
    diagram: {
      title: '{title}',
      description: 'Diagrama gerado automaticamente em {timestamp}',
      sections: [
        'diagram',
        'description',
        'usage'
      ]
    }
  },
  
  // Configurações de exportação
  export: {
    // Formatos de exportação
    formats: ['markdown', 'html', 'pdf'],
    
    // Configurações de PDF
    pdf: {
      format: 'A4',
      margin: '20mm',
      displayHeaderFooter: true,
      headerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%;">{title}</div>',
      footerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%;">Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>'
    },
    
    // Configurações de HTML
    html: {
      theme: 'github',
      highlight: 'github',
      toc: true,
      tocDepth: 3
    }
  },
  
  // Configurações de logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: 'text',
    file: './docs/generated/logs/docs-generation.log'
  },
  
  // Configurações de cache
  cache: {
    enabled: true,
    ttl: 3600, // 1 hora
    directory: './docs/generated/cache'
  }
};
