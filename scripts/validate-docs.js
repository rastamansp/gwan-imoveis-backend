#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Validador de documentação
 */

class DocsValidator {
  constructor() {
    this.docsPath = path.join(__dirname, '../docs');
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Executa validação completa
   */
  async validate() {
    console.log('🔍 Validando documentação...');
    
    try {
      // Validar estrutura de arquivos
      await this.validateFileStructure();
      
      // Validar conteúdo Markdown
      await this.validateMarkdownContent();
      
      // Validar diagramas Mermaid
      await this.validateMermaidDiagrams();
      
      // Validar links
      await this.validateLinks();
      
      // Validar consistência
      await this.validateConsistency();
      
      // Exibir resultados
      this.displayResults();
      
    } catch (error) {
      console.error('❌ Erro durante validação:', error.message);
      process.exit(1);
    }
  }

  /**
   * Valida estrutura de arquivos
   */
  async validateFileStructure() {
    console.log('📁 Validando estrutura de arquivos...');
    
    const requiredFiles = [
      'README.md',
      'architecture/overview.md',
      'development/setup.md',
      'api/overview.md',
      'mcp/overview.md',
      'deployment/environment.md',
      'diagrams/system-architecture.md'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(this.docsPath, file);
      if (!fs.existsSync(filePath)) {
        this.errors.push(`Arquivo obrigatório não encontrado: ${file}`);
      }
    }
    
    // Validar diretórios
    const requiredDirs = [
      'architecture',
      'development',
      'api',
      'mcp',
      'deployment',
      'diagrams'
    ];
    
    for (const dir of requiredDirs) {
      const dirPath = path.join(this.docsPath, dir);
      if (!fs.existsSync(dirPath)) {
        this.errors.push(`Diretório obrigatório não encontrado: ${dir}`);
      }
    }
  }

  /**
   * Valida conteúdo Markdown
   */
  async validateMarkdownContent() {
    console.log('📝 Validando conteúdo Markdown...');
    
    const markdownFiles = this.findMarkdownFiles();
    
    for (const file of markdownFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Validar título
      if (!content.includes('# ')) {
        this.warnings.push(`${file}: Arquivo sem título principal`);
      }
      
      // Validar estrutura básica
      if (content.length < 100) {
        this.warnings.push(`${file}: Arquivo muito pequeno (${content.length} caracteres)`);
      }
      
      // Validar links quebrados
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      let match;
      
      while ((match = linkRegex.exec(content)) !== null) {
        const [, text, url] = match;
        
        // Verificar se é link interno
        if (!url.startsWith('http') && !url.startsWith('mailto:')) {
          const linkPath = path.resolve(path.dirname(file), url);
          if (!fs.existsSync(linkPath)) {
            this.errors.push(`${file}: Link quebrado: ${url}`);
          }
        }
      }
      
      // Validar código
      const codeBlocks = content.match(/```[\s\S]*?```/g);
      if (codeBlocks) {
        for (const block of codeBlocks) {
          if (block.includes('```\n```')) {
            this.warnings.push(`${file}: Bloco de código vazio encontrado`);
          }
        }
      }
    }
  }

  /**
   * Valida diagramas Mermaid
   */
  async validateMermaidDiagrams() {
    console.log('📊 Validando diagramas Mermaid...');
    
    const markdownFiles = this.findMarkdownFiles();
    
    for (const file of markdownFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Buscar blocos Mermaid
      const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/g;
      let match;
      
      while ((match = mermaidRegex.exec(content)) !== null) {
        const diagram = match[1];
        
        // Validar sintaxe básica
        if (!diagram.trim()) {
          this.errors.push(`${file}: Diagrama Mermaid vazio`);
          continue;
        }
        
        // Validar tipos de diagrama
        const validTypes = ['graph', 'flowchart', 'sequenceDiagram', 'erDiagram', 'gantt', 'pie'];
        const hasValidType = validTypes.some(type => diagram.includes(type));
        
        if (!hasValidType) {
          this.warnings.push(`${file}: Tipo de diagrama Mermaid não reconhecido`);
        }
        
        // Validar nós e conexões
        if (diagram.includes('graph') || diagram.includes('flowchart')) {
          this.validateGraphDiagram(file, diagram);
        }
        
        if (diagram.includes('sequenceDiagram')) {
          this.validateSequenceDiagram(file, diagram);
        }
        
        if (diagram.includes('erDiagram')) {
          this.validateERDiagram(file, diagram);
        }
      }
    }
  }

  /**
   * Valida diagrama de grafo
   */
  validateGraphDiagram(file, diagram) {
    // Verificar se tem nós
    const nodeRegex = /\w+\[[^\]]+\]/g;
    const nodes = diagram.match(nodeRegex);
    
    if (!nodes || nodes.length < 2) {
      this.warnings.push(`${file}: Diagrama de grafo com poucos nós (${nodes?.length || 0})`);
    }
    
    // Verificar se tem conexões
    const connectionRegex = /\w+\s*-->\s*\w+/g;
    const connections = diagram.match(connectionRegex);
    
    if (!connections || connections.length === 0) {
      this.warnings.push(`${file}: Diagrama de grafo sem conexões`);
    }
  }

  /**
   * Valida diagrama de sequência
   */
  validateSequenceDiagram(file, diagram) {
    // Verificar participantes
    const participantRegex = /participant\s+\w+/g;
    const participants = diagram.match(participantRegex);
    
    if (!participants || participants.length < 2) {
      this.warnings.push(`${file}: Diagrama de sequência com poucos participantes (${participants?.length || 0})`);
    }
    
    // Verificar interações
    const interactionRegex = /\w+\s*->>\s*\w+:/g;
    const interactions = diagram.match(interactionRegex);
    
    if (!interactions || interactions.length === 0) {
      this.warnings.push(`${file}: Diagrama de sequência sem interações`);
    }
  }

  /**
   * Valida diagrama ER
   */
  validateERDiagram(file, diagram) {
    // Verificar entidades
    const entityRegex = /\w+\s*{\s*[\s\S]*?}/g;
    const entities = diagram.match(entityRegex);
    
    if (!entities || entities.length < 2) {
      this.warnings.push(`${file}: Diagrama ER com poucas entidades (${entities?.length || 0})`);
    }
    
    // Verificar relacionamentos
    const relationshipRegex = /\w+\s*\|\|--o\{\s*\w+/g;
    const relationships = diagram.match(relationshipRegex);
    
    if (!relationships || relationships.length === 0) {
      this.warnings.push(`${file}: Diagrama ER sem relacionamentos`);
    }
  }

  /**
   * Valida links
   */
  async validateLinks() {
    console.log('🔗 Validando links...');
    
    const markdownFiles = this.findMarkdownFiles();
    
    for (const file of markdownFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Buscar links internos
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      let match;
      
      while ((match = linkRegex.exec(content)) !== null) {
        const [, text, url] = match;
        
        // Verificar se é link interno
        if (!url.startsWith('http') && !url.startsWith('mailto:') && !url.startsWith('#')) {
          const linkPath = path.resolve(path.dirname(file), url);
          
          if (!fs.existsSync(linkPath)) {
            this.errors.push(`${file}: Link quebrado: ${url}`);
          }
        }
      }
    }
  }

  /**
   * Valida consistência
   */
  async validateConsistency() {
    console.log('🔄 Validando consistência...');
    
    // Verificar se todos os arquivos referenciados no README existem
    const readmePath = path.join(this.docsPath, 'README.md');
    if (fs.existsSync(readmePath)) {
      const readmeContent = fs.readFileSync(readmePath, 'utf8');
      
      // Buscar links para arquivos .md
      const linkRegex = /\[([^\]]+)\]\(([^)]+\.md)\)/g;
      let match;
      
      while ((match = linkRegex.exec(readmeContent)) !== null) {
        const [, text, url] = match;
        const linkPath = path.join(this.docsPath, url);
        
        if (!fs.existsSync(linkPath)) {
          this.errors.push(`README.md: Link para arquivo inexistente: ${url}`);
        }
      }
    }
    
    // Verificar se há arquivos órfãos
    const allFiles = this.findAllFiles();
    const referencedFiles = this.findReferencedFiles();
    
    for (const file of allFiles) {
      if (!referencedFiles.includes(file) && !file.includes('generated')) {
        this.warnings.push(`Arquivo não referenciado: ${path.relative(this.docsPath, file)}`);
      }
    }
  }

  /**
   * Encontra arquivos Markdown
   */
  findMarkdownFiles() {
    const files = [];
    
    const scanDir = (dir) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          scanDir(itemPath);
        } else if (item.endsWith('.md')) {
          files.push(itemPath);
        }
      }
    };
    
    scanDir(this.docsPath);
    return files;
  }

  /**
   * Encontra todos os arquivos
   */
  findAllFiles() {
    const files = [];
    
    const scanDir = (dir) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          scanDir(itemPath);
        } else {
          files.push(itemPath);
        }
      }
    };
    
    scanDir(this.docsPath);
    return files;
  }

  /**
   * Encontra arquivos referenciados
   */
  findReferencedFiles() {
    const referencedFiles = [];
    const markdownFiles = this.findMarkdownFiles();
    
    for (const file of markdownFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Buscar links para arquivos .md
      const linkRegex = /\[([^\]]+)\]\(([^)]+\.md)\)/g;
      let match;
      
      while ((match = linkRegex.exec(content)) !== null) {
        const [, text, url] = match;
        const linkPath = path.resolve(path.dirname(file), url);
        referencedFiles.push(linkPath);
      }
    }
    
    return referencedFiles;
  }

  /**
   * Exibe resultados da validação
   */
  displayResults() {
    console.log('\n📋 Resultados da Validação:');
    console.log('============================');
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ Documentação válida! Nenhum problema encontrado.');
      return;
    }
    
    if (this.errors.length > 0) {
      console.log(`\n❌ Erros encontrados (${this.errors.length}):`);
      this.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error}`);
      });
    }
    
    if (this.warnings.length > 0) {
      console.log(`\n⚠️  Avisos encontrados (${this.warnings.length}):`);
      this.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
    }
    
    console.log('\n📊 Resumo:');
    console.log(`  - Erros: ${this.errors.length}`);
    console.log(`  - Avisos: ${this.warnings.length}`);
    console.log(`  - Total: ${this.errors.length + this.warnings.length}`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ Validação falhou devido a erros.');
      process.exit(1);
    } else {
      console.log('\n✅ Validação concluída com sucesso (apenas avisos).');
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const validator = new DocsValidator();
  validator.validate().catch(console.error);
}

module.exports = DocsValidator;
