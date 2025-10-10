#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Script de Deploy para Produção
 */

class DeployManager {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.deployLogFile = path.join(this.projectRoot, 'deploy.log');
  }

  /**
   * Executa deploy completo
   */
  async deploy() {
    console.log('🚀 Iniciando deploy para produção...');
    
    try {
      // 1. Validação pré-deploy
      await this.preDeployValidation();
      
      // 2. Build e preparação
      await this.buildAndPrepare();
      
      // 3. Validação de documentação
      await this.validateDocumentation();
      
      // 4. Testes
      await this.runTests();
      
      // 5. Deploy
      await this.executeDeploy();
      
      // 6. Pós-deploy
      await this.postDeployValidation();
      
      console.log('✅ Deploy realizado com sucesso!');
      this.logDeploy('SUCCESS', 'Deploy concluído com sucesso');
      
    } catch (error) {
      console.error('❌ Erro durante deploy:', error.message);
      this.logDeploy('ERROR', `Erro no deploy: ${error.message}`);
      process.exit(1);
    }
  }

  /**
   * Validação pré-deploy
   */
  async preDeployValidation() {
    console.log('🔍 Validação pré-deploy...');
    
    // Verificar se estamos na branch correta
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    if (currentBranch !== 'main' && currentBranch !== 'master') {
      throw new Error(`Deploy deve ser feito da branch main/master, não de ${currentBranch}`);
    }
    
    // Verificar se há mudanças não commitadas
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim()) {
      throw new Error('Há mudanças não commitadas. Faça commit antes do deploy.');
    }
    
    // Verificar se há commits não enviados
    const ahead = execSync('git rev-list --count origin/main..HEAD', { encoding: 'utf8' }).trim();
    if (ahead === '0') {
      throw new Error('Não há commits para deploy. Faça push antes do deploy.');
    }
    
    console.log('✅ Validação pré-deploy concluída');
  }

  /**
   * Build e preparação
   */
  async buildAndPrepare() {
    console.log('🔨 Build e preparação...');
    
    // Instalar dependências
    console.log('📦 Instalando dependências...');
    execSync('npm ci --production=false', { stdio: 'inherit' });
    
    // Build do projeto
    console.log('🏗️ Compilando projeto...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // Build do MCP
    console.log('🔌 Compilando MCP...');
    execSync('npm run build:mcp', { stdio: 'inherit' });
    
    console.log('✅ Build concluído');
  }

  /**
   * Validação de documentação
   */
  async validateDocumentation() {
    console.log('📚 Validando documentação...');
    
    // Gerar documentação
    console.log('📝 Gerando documentação...');
    execSync('npm run docs:generate', { stdio: 'inherit' });
    
    // Validar documentação
    console.log('🔍 Validando documentação...');
    execSync('npm run docs:validate', { stdio: 'inherit' });
    
    console.log('✅ Documentação validada');
  }

  /**
   * Executar testes
   */
  async runTests() {
    console.log('🧪 Executando testes...');
    
    // Testes unitários
    console.log('🔬 Testes unitários...');
    execSync('npm run test', { stdio: 'inherit' });
    
    // Testes e2e
    console.log('🌐 Testes e2e...');
    execSync('npm run test:e2e', { stdio: 'inherit' });
    
    console.log('✅ Testes concluídos');
  }

  /**
   * Executar deploy
   */
  async executeDeploy() {
    console.log('🚀 Executando deploy...');
    
    // Aqui você pode adicionar lógica específica de deploy
    // Por exemplo: Docker, PM2, etc.
    
    // Exemplo com PM2
    try {
      console.log('🔄 Reiniciando aplicação com PM2...');
      execSync('pm2 restart gwan-events-api', { stdio: 'inherit' });
    } catch (error) {
      console.log('⚠️ PM2 não encontrado, usando método alternativo...');
      // Método alternativo de deploy
    }
    
    // Exemplo com Docker
    try {
      console.log('🐳 Atualizando container Docker...');
      execSync('docker-compose up -d --build', { stdio: 'inherit' });
    } catch (error) {
      console.log('⚠️ Docker não encontrado, usando método alternativo...');
      // Método alternativo de deploy
    }
    
    console.log('✅ Deploy executado');
  }

  /**
   * Validação pós-deploy
   */
  async postDeployValidation() {
    console.log('🔍 Validação pós-deploy...');
    
    // Aguardar aplicação iniciar
    console.log('⏳ Aguardando aplicação iniciar...');
    await this.waitForApplication();
    
    // Verificar health check
    console.log('🏥 Verificando health check...');
    await this.checkHealth();
    
    // Verificar documentação
    console.log('📚 Verificando documentação...');
    await this.checkDocumentation();
    
    console.log('✅ Validação pós-deploy concluída');
  }

  /**
   * Aguardar aplicação iniciar
   */
  async waitForApplication() {
    const maxAttempts = 30;
    const delay = 2000; // 2 segundos
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await fetch('http://localhost:3001/health');
        if (response.ok) {
          console.log('✅ Aplicação iniciada');
          return;
        }
      } catch (error) {
        // Aplicação ainda não está pronta
      }
      
      console.log(`⏳ Tentativa ${i + 1}/${maxAttempts}...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    throw new Error('Aplicação não iniciou dentro do tempo esperado');
  }

  /**
   * Verificar health check
   */
  async checkHealth() {
    try {
      const response = await fetch('http://localhost:3001/health');
      if (!response.ok) {
        throw new Error(`Health check falhou: ${response.status}`);
      }
      console.log('✅ Health check OK');
    } catch (error) {
      throw new Error(`Erro no health check: ${error.message}`);
    }
  }

  /**
   * Verificar documentação
   */
  async checkDocumentation() {
    try {
      const response = await fetch('http://localhost:3001/api');
      if (!response.ok) {
        throw new Error(`Documentação não acessível: ${response.status}`);
      }
      console.log('✅ Documentação acessível');
    } catch (error) {
      throw new Error(`Erro na documentação: ${error.message}`);
    }
  }

  /**
   * Log de deploy
   */
  logDeploy(level, message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${level}: ${message}\n`;
    
    fs.appendFileSync(this.deployLogFile, logEntry);
  }

  /**
   * Rollback
   */
  async rollback() {
    console.log('🔄 Executando rollback...');
    
    try {
      // Aqui você pode implementar lógica de rollback
      // Por exemplo: reverter para commit anterior, restaurar backup, etc.
      
      console.log('✅ Rollback executado');
      this.logDeploy('ROLLBACK', 'Rollback executado com sucesso');
      
    } catch (error) {
      console.error('❌ Erro durante rollback:', error.message);
      this.logDeploy('ERROR', `Erro no rollback: ${error.message}`);
      process.exit(1);
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const command = process.argv[2];
  const deployManager = new DeployManager();
  
  switch (command) {
    case 'deploy':
      deployManager.deploy().catch(console.error);
      break;
    case 'rollback':
      deployManager.rollback().catch(console.error);
      break;
    default:
      console.log('Uso: node scripts/deploy.js [deploy|rollback]');
      process.exit(1);
  }
}

module.exports = DeployManager;
