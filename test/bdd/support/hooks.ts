import { Before, After, BeforeAll, AfterAll, setDefaultTimeout, setWorldConstructor } from '@cucumber/cucumber';
import { TestWorld } from './world';
import { TestClient } from './test-client';

// Registrar o World personalizado
setWorldConstructor(TestWorld);

// Timeout padrão de 60 segundos (aumentado para chat que pode demorar mais)
setDefaultTimeout(60 * 1000);

let testClient: TestClient;

/**
 * Exportar testClient para uso nos steps
 */
export function getTestClient(): TestClient {
  if (!testClient) {
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3009';
    testClient = new TestClient(baseUrl);
  }
  return testClient;
}

BeforeAll(async () => {
  // Obter base URL do ambiente ou usar padrão
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3009';

  // Verificar se a aplicação está rodando
  testClient = new TestClient(baseUrl);

  console.log(`🧪 Configurando testes BDD - Base URL: ${baseUrl}`);

  // Opcional: Verificar saúde da aplicação
  try {
    await testClient.sendMessage('test');
  } catch (error) {
    console.warn('⚠️  Aviso: Não foi possível conectar à aplicação. Certifique-se de que está rodando.');
    console.warn('   Execute: npm run start:dev');
  }
});

Before(async function (this: TestWorld) {
  // Resetar contexto antes de cada cenário
  this.reset();
  this.attach('Contexto resetado para novo cenário');
});

After(async function (this: TestWorld) {
  // Limpar contexto após cada cenário
  if (this.lastError) {
    this.attach(`Erro capturado: ${this.lastError}`, 'text/plain');
  }

  if (this.lastResponse) {
    this.attach(
      JSON.stringify(this.lastResponse, null, 2),
      'application/json',
    );
  }
});

AfterAll(async () => {
  console.log('✅ Testes BDD concluídos');
});

