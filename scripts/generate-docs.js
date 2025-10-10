#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Gerador automático de documentação
 * Analisa o código fonte e gera documentação atualizada
 */

class DocsGenerator {
  constructor() {
    this.srcPath = path.join(__dirname, '../src');
    this.docsPath = path.join(__dirname, '../docs');
    this.outputPath = path.join(__dirname, '../docs/generated');
  }

  /**
   * Executa o gerador completo
   */
  async generate() {
    console.log('🚀 Iniciando geração automática de documentação...');
    
    try {
      // Criar diretório de saída
      this.ensureOutputDir();
      
      // Gerar documentação de APIs
      await this.generateApiDocs();
      
      // Gerar diagramas Mermaid
      await this.generateMermaidDiagrams();
      
      // Gerar documentação de módulos
      await this.generateModuleDocs();
      
      // Validar documentação
      await this.validateDocs();
      
      console.log('✅ Documentação gerada com sucesso!');
      console.log(`📁 Arquivos gerados em: ${this.outputPath}`);
      
    } catch (error) {
      console.error('❌ Erro ao gerar documentação:', error.message);
      process.exit(1);
    }
  }

  /**
   * Cria diretório de saída se não existir
   */
  ensureOutputDir() {
    if (!fs.existsSync(this.outputPath)) {
      fs.mkdirSync(this.outputPath, { recursive: true });
    }
  }

  /**
   * Gera documentação das APIs automaticamente
   */
  async generateApiDocs() {
    console.log('📡 Gerando documentação de APIs...');
    
    const apiDocs = {
      title: 'APIs Geradas Automaticamente',
      description: 'Documentação gerada automaticamente a partir do código fonte',
      timestamp: new Date().toISOString(),
      endpoints: []
    };

    // Analisar controllers
    const controllers = this.findControllers();
    
    for (const controller of controllers) {
      const endpoints = this.analyzeController(controller);
      apiDocs.endpoints.push(...endpoints);
    }

    // Salvar documentação
    const outputFile = path.join(this.outputPath, 'api-generated.md');
    const content = this.generateApiMarkdown(apiDocs);
    fs.writeFileSync(outputFile, content);
    
    console.log(`✅ Documentação de APIs salva em: ${outputFile}`);
  }

  /**
   * Encontra todos os controllers
   */
  findControllers() {
    const controllers = [];
    const modulesPath = path.join(this.srcPath, 'modules');
    
    if (!fs.existsSync(modulesPath)) {
      return controllers;
    }

    const modules = fs.readdirSync(modulesPath);
    
    for (const module of modules) {
      const controllerFile = path.join(modulesPath, module, `${module}.controller.ts`);
      if (fs.existsSync(controllerFile)) {
        controllers.push({
          module,
          file: controllerFile,
          content: fs.readFileSync(controllerFile, 'utf8')
        });
      }
    }

    return controllers;
  }

  /**
   * Analisa um controller e extrai endpoints
   */
  analyzeController(controller) {
    const endpoints = [];
    const content = controller.content;
    
    // Regex para encontrar métodos HTTP
    const methodRegex = /@(Get|Post|Put|Delete|Patch)\(['"`]([^'"`]*)['"`]\)/g;
    const operationRegex = /@ApiOperation\(\{[\s\S]*?summary:\s*['"`]([^'"`]*)['"`][\s\S]*?\}\)/g;
    const responseRegex = /@ApiResponse\(\{[\s\S]*?status:\s*(\d+)[\s\S]*?description:\s*['"`]([^'"`]*)['"`][\s\S]*?\}\)/g;
    
    let match;
    while ((match = methodRegex.exec(content)) !== null) {
      const [, method, route] = match;
      
      // Buscar descrição da operação
      const operationMatch = operationRegex.exec(content);
      const summary = operationMatch ? operationMatch[1] : `${method} ${route}`;
      
      // Buscar respostas
      const responses = [];
      let responseMatch;
      while ((responseMatch = responseRegex.exec(content)) !== null) {
        responses.push({
          status: parseInt(responseMatch[1]),
          description: responseMatch[2]
        });
      }
      
      endpoints.push({
        method: method.toUpperCase(),
        route: `/api${route}`,
        summary,
        responses,
        module: controller.module
      });
    }
    
    return endpoints;
  }

  /**
   * Gera Markdown para documentação de APIs
   */
  generateApiMarkdown(apiDocs) {
    let content = `# ${apiDocs.title}\n\n`;
    content += `${apiDocs.description}\n\n`;
    content += `**Gerado em:** ${apiDocs.timestamp}\n\n`;
    content += `## Endpoints Encontrados\n\n`;
    
    // Agrupar por módulo
    const groupedEndpoints = {};
    for (const endpoint of apiDocs.endpoints) {
      if (!groupedEndpoints[endpoint.module]) {
        groupedEndpoints[endpoint.module] = [];
      }
      groupedEndpoints[endpoint.module].push(endpoint);
    }
    
    // Gerar documentação por módulo
    for (const [module, endpoints] of Object.entries(groupedEndpoints)) {
      content += `### ${module.charAt(0).toUpperCase() + module.slice(1)}\n\n`;
      
      for (const endpoint of endpoints) {
        content += `#### ${endpoint.method} ${endpoint.route}\n\n`;
        content += `**Descrição:** ${endpoint.summary}\n\n`;
        
        if (endpoint.responses.length > 0) {
          content += `**Respostas:**\n\n`;
          for (const response of endpoint.responses) {
            content += `- \`${response.status}\` - ${response.description}\n`;
          }
          content += '\n';
        }
        
        content += '---\n\n';
      }
    }
    
    return content;
  }

  /**
   * Gera diagramas Mermaid automaticamente
   */
  async generateMermaidDiagrams() {
    console.log('📊 Gerando diagramas Mermaid...');
    
    const diagrams = {
      'api-flow': this.generateApiFlowDiagram(),
      'module-structure': this.generateModuleStructureDiagram(),
      'database-schema': this.generateDatabaseSchemaDiagram()
    };

    for (const [name, diagram] of Object.entries(diagrams)) {
      const outputFile = path.join(this.outputPath, `${name}.md`);
      const content = this.generateMermaidMarkdown(name, diagram);
      fs.writeFileSync(outputFile, content);
    }
    
    console.log('✅ Diagramas Mermaid gerados');
  }

  /**
   * Gera diagrama de fluxo da API
   */
  generateApiFlowDiagram() {
    const controllers = this.findControllers();
    const modules = controllers.map(c => c.module);
    
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
    
    return diagram;
  }

  /**
   * Gera diagrama de estrutura de módulos
   */
  generateModuleStructureDiagram() {
    const controllers = this.findControllers();
    
    let diagram = 'graph TB\n';
    diagram += '    subgraph "Backend Modules"\n';
    
    for (const controller of controllers) {
      const moduleName = controller.module.charAt(0).toUpperCase() + controller.module.slice(1);
      diagram += `        ${moduleName}[${moduleName}]\n`;
    }
    
    diagram += '    end\n';
    diagram += '    subgraph "Shared"\n';
    diagram += '        Domain[Domain Layer]\n';
    diagram += '        Application[Application Layer]\n';
    diagram += '        Infrastructure[Infrastructure Layer]\n';
    diagram += '    end\n';
    
    for (const controller of controllers) {
      const moduleName = controller.module.charAt(0).toUpperCase() + controller.module.slice(1);
      diagram += `    ${moduleName} --> Domain\n`;
      diagram += `    ${moduleName} --> Application\n`;
      diagram += `    ${moduleName} --> Infrastructure\n`;
    }
    
    return diagram;
  }

  /**
   * Gera diagrama de schema do banco
   */
  generateDatabaseSchemaDiagram() {
    // Este seria implementado analisando as entidades TypeORM
    let diagram = 'erDiagram\n';
    diagram += '    User {\n';
    diagram += '        string id\n';
    diagram += '        string email\n';
    diagram += '        string name\n';
    diagram += '        datetime createdAt\n';
    diagram += '    }\n';
    diagram += '    Event {\n';
    diagram += '        string id\n';
    diagram += '        string title\n';
    diagram += '        string description\n';
    diagram += '        datetime date\n';
    diagram += '        string location\n';
    diagram += '    }\n';
    diagram += '    Ticket {\n';
    diagram += '        string id\n';
    diagram += '        string eventId\n';
    diagram += '        string userId\n';
    diagram += '        string status\n';
    diagram += '    }\n';
    diagram += '    User ||--o{ Ticket : owns\n';
    diagram += '    Event ||--o{ Ticket : has\n';
    
    return diagram;
  }

  /**
   * Gera Markdown para diagramas Mermaid
   */
  generateMermaidMarkdown(name, diagram) {
    const title = name.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    
    let content = `# ${title}\n\n`;
    content += `Diagrama gerado automaticamente em ${new Date().toISOString()}\n\n`;
    content += '```mermaid\n';
    content += diagram;
    content += '\n```\n\n';
    content += '## Descrição\n\n';
    content += 'Este diagrama foi gerado automaticamente a partir da análise do código fonte.\n';
    
    return content;
  }

  /**
   * Gera documentação de módulos
   */
  async generateModuleDocs() {
    console.log('📦 Gerando documentação de módulos...');
    
    const modules = this.findControllers();
    const moduleDocs = {
      title: 'Módulos do Sistema',
      description: 'Documentação automática dos módulos',
      timestamp: new Date().toISOString(),
      modules: []
    };

    for (const module of modules) {
      const moduleInfo = this.analyzeModule(module);
      moduleDocs.modules.push(moduleInfo);
    }

    const outputFile = path.join(this.outputPath, 'modules-generated.md');
    const content = this.generateModuleMarkdown(moduleDocs);
    fs.writeFileSync(outputFile, content);
    
    console.log(`✅ Documentação de módulos salva em: ${outputFile}`);
  }

  /**
   * Analisa um módulo
   */
  analyzeModule(module) {
    const endpoints = this.analyzeController(module);
    
    return {
      name: module.module,
      file: module.file,
      endpoints: endpoints.length,
      methods: [...new Set(endpoints.map(e => e.method))],
      routes: endpoints.map(e => e.route)
    };
  }

  /**
   * Gera Markdown para documentação de módulos
   */
  generateModuleMarkdown(moduleDocs) {
    let content = `# ${moduleDocs.title}\n\n`;
    content += `${moduleDocs.description}\n\n`;
    content += `**Gerado em:** ${moduleDocs.timestamp}\n\n`;
    
    for (const module of moduleDocs.modules) {
      content += `## ${module.name.charAt(0).toUpperCase() + module.slice(1)}\n\n`;
      content += `**Arquivo:** \`${module.file}\`\n\n`;
      content += `**Endpoints:** ${module.endpoints}\n\n`;
      content += `**Métodos HTTP:** ${module.methods.join(', ')}\n\n`;
      content += `**Rotas:**\n`;
      for (const route of module.routes) {
        content += `- \`${route}\`\n`;
      }
      content += '\n---\n\n';
    }
    
    return content;
  }

  /**
   * Valida a documentação gerada
   */
  async validateDocs() {
    console.log('🔍 Validando documentação...');
    
    const generatedFiles = fs.readdirSync(this.outputPath);
    let errors = 0;
    
    for (const file of generatedFiles) {
      const filePath = path.join(this.outputPath, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Validar Markdown básico
      if (!content.includes('# ')) {
        console.warn(`⚠️  Arquivo ${file} não tem título Markdown`);
        errors++;
      }
      
      // Validar diagramas Mermaid
      if (file.includes('mermaid') && !content.includes('```mermaid')) {
        console.warn(`⚠️  Arquivo ${file} deveria conter diagrama Mermaid`);
        errors++;
      }
    }
    
    if (errors === 0) {
      console.log('✅ Validação concluída sem erros');
    } else {
      console.warn(`⚠️  ${errors} avisos encontrados`);
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const generator = new DocsGenerator();
  generator.generate().catch(console.error);
}

module.exports = DocsGenerator;
