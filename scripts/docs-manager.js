#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Gerenciador de documentação automática
 */

class DocsManager {
  constructor() {
    this.scriptsPath = path.join(__dirname);
    this.docsPath = path.join(__dirname, '../docs');
    this.outputPath = path.join(__dirname, '../docs/generated');
  }

  /**
   * Executa comando principal
   */
  async run() {
    const command = process.argv[2];
    
    switch (command) {
      case 'generate':
        await this.generate();
        break;
      case 'validate':
        await this.validate();
        break;
      case 'serve':
        await this.serve();
        break;
      case 'clean':
        await this.clean();
        break;
      case 'watch':
        await this.watch();
        break;
      case 'help':
        this.showHelp();
        break;
      default:
        console.log('❌ Comando não reconhecido. Use "help" para ver os comandos disponíveis.');
        process.exit(1);
    }
  }

  /**
   * Gera toda a documentação
   */
  async generate() {
    console.log('🚀 Gerando documentação completa...');
    
    try {
      // Criar diretório de saída
      this.ensureOutputDir();
      
      // Executar geradores
      console.log('📡 Gerando documentação de APIs...');
      execSync(`node ${path.join(this.scriptsPath, 'generate-api-docs.js')}`, { stdio: 'inherit' });
      
      console.log('📊 Gerando diagramas Mermaid...');
      execSync(`node ${path.join(this.scriptsPath, 'generate-mermaid-diagrams.js')}`, { stdio: 'inherit' });
      
      console.log('📚 Gerando documentação geral...');
      execSync(`node ${path.join(this.scriptsPath, 'generate-docs.js')}`, { stdio: 'inherit' });
      
      // Validar documentação gerada
      console.log('🔍 Validando documentação...');
      execSync(`node ${path.join(this.scriptsPath, 'validate-docs.js')}`, { stdio: 'inherit' });
      
      console.log('✅ Documentação gerada com sucesso!');
      console.log(`📁 Arquivos gerados em: ${this.outputPath}`);
      
    } catch (error) {
      console.error('❌ Erro ao gerar documentação:', error.message);
      process.exit(1);
    }
  }

  /**
   * Valida a documentação
   */
  async validate() {
    console.log('🔍 Validando documentação...');
    
    try {
      execSync(`node ${path.join(this.scriptsPath, 'validate-docs.js')}`, { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ Erro na validação:', error.message);
      process.exit(1);
    }
  }

  /**
   * Serve a documentação localmente
   */
  async serve() {
    console.log('🌐 Servindo documentação localmente...');
    
    try {
      // Verificar se o servidor está rodando
      const isServerRunning = this.checkServerStatus();
      
      if (!isServerRunning) {
        console.log('⚠️  Servidor NestJS não está rodando. Iniciando...');
        console.log('💡 Execute "npm run start:dev" em outro terminal e tente novamente.');
        return;
      }
      
      // Servir documentação estática
      const port = process.env.DOCS_PORT || 8080;
      console.log(`📖 Documentação disponível em: http://localhost:${port}`);
      console.log('📁 Servindo arquivos de:', this.docsPath);
      
      // Usar http-server se disponível
      try {
        execSync(`npx http-server ${this.docsPath} -p ${port} -o`, { stdio: 'inherit' });
      } catch (error) {
        console.log('💡 Instale http-server: npm install -g http-server');
        console.log(`💡 Ou use: python -m http.server ${port} -d ${this.docsPath}`);
      }
      
    } catch (error) {
      console.error('❌ Erro ao servir documentação:', error.message);
      process.exit(1);
    }
  }

  /**
   * Limpa arquivos gerados
   */
  async clean() {
    console.log('🧹 Limpando arquivos gerados...');
    
    try {
      if (fs.existsSync(this.outputPath)) {
        fs.rmSync(this.outputPath, { recursive: true, force: true });
        console.log('✅ Arquivos gerados removidos');
      } else {
        console.log('ℹ️  Nenhum arquivo gerado encontrado');
      }
    } catch (error) {
      console.error('❌ Erro ao limpar arquivos:', error.message);
      process.exit(1);
    }
  }

  /**
   * Monitora mudanças e regenera documentação
   */
  async watch() {
    console.log('👀 Monitorando mudanças...');
    
    try {
      // Verificar se chokidar está disponível
      try {
        require('chokidar');
      } catch (error) {
        console.log('💡 Instalando chokidar...');
        execSync('npm install chokidar', { stdio: 'inherit' });
      }
      
      const chokidar = require('chokidar');
      
      // Monitorar arquivos fonte
      const srcPath = path.join(__dirname, '../src');
      const watcher = chokidar.watch(srcPath, {
        ignored: /(^|[\/\\])\../, // ignorar arquivos ocultos
        persistent: true
      });
      
      let isGenerating = false;
      
      watcher.on('change', async (filePath) => {
        if (isGenerating) return;
        
        console.log(`📝 Arquivo alterado: ${path.relative(process.cwd(), filePath)}`);
        
        isGenerating = true;
        
        try {
          // Aguardar um pouco para evitar regeneração excessiva
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          console.log('🔄 Regenerando documentação...');
          await this.generate();
          
        } catch (error) {
          console.error('❌ Erro ao regenerar documentação:', error.message);
        } finally {
          isGenerating = false;
        }
      });
      
      console.log('✅ Monitoramento ativo. Pressione Ctrl+C para parar.');
      
    } catch (error) {
      console.error('❌ Erro ao iniciar monitoramento:', error.message);
      process.exit(1);
    }
  }

  /**
   * Mostra ajuda
   */
  showHelp() {
    console.log('📚 Gerenciador de Documentação Automática');
    console.log('==========================================');
    console.log('');
    console.log('Comandos disponíveis:');
    console.log('');
    console.log('  generate    Gera toda a documentação automaticamente');
    console.log('  validate    Valida a documentação existente');
    console.log('  serve       Serve a documentação localmente');
    console.log('  clean       Remove arquivos gerados');
    console.log('  watch       Monitora mudanças e regenera automaticamente');
    console.log('  help        Mostra esta ajuda');
    console.log('');
    console.log('Exemplos:');
    console.log('  node scripts/docs-manager.js generate');
    console.log('  node scripts/docs-manager.js validate');
    console.log('  node scripts/docs-manager.js serve');
    console.log('');
    console.log('Variáveis de ambiente:');
    console.log('  DOCS_PORT    Porta para servir documentação (padrão: 8080)');
    console.log('  API_BASE_URL URL base da API (padrão: http://localhost:3001)');
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
   * Verifica se o servidor está rodando
   */
  checkServerStatus() {
    try {
      const { execSync } = require('child_process');
      execSync('curl -s http://localhost:3001 > /dev/null', { stdio: 'ignore' });
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const manager = new DocsManager();
  manager.run().catch(console.error);
}

module.exports = DocsManager;
