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

// Step sem acento para compatibilidade com features
Given('que o chatbot esta disponivel', async function (this: TestWorld) {
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
    const { response, status } = await testClient.sendMessage(message, undefined, this.sessionId);
    testClient.validateResponse(response);
    
    this.lastResponse = response;
    this.lastStatus = status;
    this.chatHistory.push({ message, response });
    
    // Atualizar sessionId se retornado
    if (response.sessionId) {
      this.sessionId = response.sessionId;
    }
    
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
    const { response, status } = await testClient.sendMessage(message, userCtx, this.sessionId);
    testClient.validateResponse(response);
    
    this.lastResponse = response;
    this.lastStatus = status;
    this.chatHistory.push({ message, response });
    
    // Atualizar sessionId se retornado
    if (response.sessionId) {
      this.sessionId = response.sessionId;
    }
    
    this.attach(`Mensagem enviada: "${message}"`, 'text/plain');
    this.attach(`Contexto do usuário: ${userCtxDocString}`, 'application/json');
  } catch (error) {
    this.lastError = error instanceof Error ? error.message : String(error);
    throw error;
  }
});

// Versão com dois pontos (docString)
When('envio a mensagem {string} com contexto do usuario:', async function (
  this: TestWorld,
  message: string,
  userCtxDocString: string,
) {
  const testClient = getTestClient();
  try {
    const userCtx = JSON.parse(userCtxDocString);
    const { response, status } = await testClient.sendMessage(message, userCtx, this.sessionId);
    testClient.validateResponse(response);
    
    this.lastResponse = response;
    this.lastStatus = status;
    this.chatHistory.push({ message, response });
    
    // Atualizar sessionId se retornado
    if (response.sessionId) {
      this.sessionId = response.sessionId;
    }
    
    this.attach(`Mensagem enviada: "${message}"`, 'text/plain');
    this.attach(`Contexto do usuário: ${userCtxDocString}`, 'application/json');
  } catch (error) {
    this.lastError = error instanceof Error ? error.message : String(error);
    throw error;
  }
});

When('envio a mensagem {string} com a mesma sessao', async function (this: TestWorld, message: string) {
  const testClient = getTestClient();
  
  // Se não há sessionId, criar um phoneNumber temporário para forçar criação de sessão
  if (!this.sessionId) {
    // Criar um phoneNumber temporário válido (formato brasileiro)
    const tempPhoneNumber = `551199999${String(Date.now()).slice(-4)}`;
    try {
      // Primeira mensagem para criar sessão
      const { response: firstResponse } = await testClient.sendMessage(
        'test',
        undefined,
        undefined,
        tempPhoneNumber,
      );
      if (firstResponse.sessionId) {
        this.sessionId = firstResponse.sessionId;
        this.attach(`SessionId criado: ${this.sessionId}`, 'text/plain');
      } else {
        // Se não retornou sessionId, tentar usar o sessionId da última resposta do histórico
        if (this.chatHistory.length > 0 && this.chatHistory[this.chatHistory.length - 1].response?.sessionId) {
          this.sessionId = (this.chatHistory[this.chatHistory.length - 1].response as any).sessionId;
          this.attach(`SessionId obtido do histórico: ${this.sessionId}`, 'text/plain');
        }
      }
    } catch (error) {
      // Se falhar, tentar usar sessionId do histórico
      if (this.chatHistory.length > 0 && this.chatHistory[this.chatHistory.length - 1].response?.sessionId) {
        this.sessionId = (this.chatHistory[this.chatHistory.length - 1].response as any).sessionId;
        this.attach(`SessionId obtido do histórico após erro: ${this.sessionId}`, 'text/plain');
      } else {
        this.attach('⚠️ Não foi possível criar sessão, continuando sem sessionId', 'text/plain');
      }
    }
  }
  
  try {
    const { response, status } = await testClient.sendMessage(message, undefined, this.sessionId);
    testClient.validateResponse(response);
    
    this.lastResponse = response;
    this.lastStatus = status;
    this.chatHistory.push({ message, response });
    
    // Atualizar sessionId se retornado
    if (response.sessionId) {
      this.sessionId = response.sessionId;
    }
    
    this.attach(`Mensagem enviada: "${message}"`, 'text/plain');
    if (this.sessionId) {
      this.attach(`SessionId usado: ${this.sessionId}`, 'text/plain');
    } else {
      this.attach('⚠️ Mensagem enviada sem sessionId (continuando mesmo assim)', 'text/plain');
    }
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

