import { Given, When, Then } from '@cucumber/cucumber';
import { TestWorld } from '../support/world';
import { getTestClient } from '../support/hooks';

/**
 * Steps compartilhados reutilizáveis em múltiplos cenários
 */

Given('que o chatbot está disponível', async function (this: TestWorld) {
  const testClient = getTestClient();
  
  // Verificar se o chatbot está respondendo
  try {
    const { response } = await testClient.sendMessage('test');
    testClient.validateResponse(response);
    this.attach('✅ Chatbot está disponível e respondendo');
  } catch (error) {
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3001';
    throw new Error(
      `Chatbot não está disponível em ${baseUrl}. Certifique-se de que a aplicação está rodando.`,
    );
  }
});

When('envio a mensagem {string}', async function (this: TestWorld, message: string) {
  const testClient = getTestClient();
  try {
    const { response, status } = await testClient.sendMessage(message);
    testClient.validateResponse(response);
    
    this.lastResponse = response;
    this.lastStatus = status;
    this.chatHistory.push({ message, response });
    
    this.attach(`Mensagem enviada: "${message}"`, 'text/plain');
  } catch (error) {
    this.lastError = error instanceof Error ? error.message : String(error);
    throw error;
  }
});

When('envio a mensagem {string} com contexto do usuário', async function (
  this: TestWorld,
  message: string,
  userCtxDocString: string,
) {
  const testClient = getTestClient();
  try {
    const userCtx = JSON.parse(userCtxDocString);
    const { response, status } = await testClient.sendMessage(message, userCtx);
    testClient.validateResponse(response);
    
    this.lastResponse = response;
    this.lastStatus = status;
    this.chatHistory.push({ message, response });
    
    this.attach(`Mensagem enviada: "${message}"`, 'text/plain');
    this.attach(`Contexto do usuário: ${userCtxDocString}`, 'application/json');
  } catch (error) {
    this.lastError = error instanceof Error ? error.message : String(error);
    throw error;
  }
});

Then('o status da resposta deve ser {int}', function (this: TestWorld, expectedStatus: number) {
  if (this.lastStatus !== expectedStatus) {
    throw new Error(
      `Status esperado: ${expectedStatus}, mas recebido: ${this.lastStatus || 'N/A'}`,
    );
  }
});

Then('devo receber uma resposta', function (this: TestWorld) {
  if (!this.lastResponse) {
    throw new Error('Nenhuma resposta foi recebida do chatbot');
  }
});

Then('não devo receber uma resposta', function (this: TestWorld) {
  if (this.lastResponse) {
    throw new Error('Era esperado que não houvesse resposta, mas uma resposta foi recebida');
  }
});

Then('devo receber um erro', function (this: TestWorld) {
  if (!this.lastError) {
    throw new Error('Era esperado um erro, mas nenhum erro foi recebido');
  }
});

Then('não devo receber um erro', function (this: TestWorld) {
  if (this.lastError) {
    throw new Error(`Era esperado que não houvesse erro, mas recebido: ${this.lastError}`);
  }
});

