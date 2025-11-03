import { Then } from '@cucumber/cucumber';
import { TestWorld } from '../../../test/bdd/support/world';

/**
 * Steps específicos do chatbot
 */

Then('devo receber uma resposta contendo {string}', function (this: TestWorld, expectedText: string) {
  if (!this.lastResponse) {
    throw new Error('Nenhuma resposta foi recebida do chatbot');
  }

  if (!this.responseContains(expectedText)) {
    throw new Error(
      `Esperado que a resposta contenha "${expectedText}", mas recebido: "${this.lastResponse.answer}"`,
    );
  }
});

Then('a resposta deve usar a ferramenta {string}', function (this: TestWorld, toolName: string) {
  if (!this.lastResponse) {
    throw new Error('Nenhuma resposta foi recebida do chatbot');
  }

  if (!this.toolWasUsed(toolName)) {
    const toolsUsed = this.lastResponse.toolsUsed?.map((t) => t.name).join(', ') || 'nenhuma';
    throw new Error(
      `Esperado que a resposta use a ferramenta "${toolName}", mas ferramentas usadas: ${toolsUsed}`,
    );
  }
});

Then('a resposta não deve usar a ferramenta {string}', function (this: TestWorld, toolName: string) {
  if (!this.lastResponse) {
    throw new Error('Nenhuma resposta foi recebida do chatbot');
  }

  if (this.toolWasUsed(toolName)) {
    throw new Error(
      `Esperado que a resposta NÃO use a ferramenta "${toolName}", mas ela foi usada.`,
    );
  }
});

Then('a resposta deve usar pelo menos uma ferramenta', function (this: TestWorld) {
  if (!this.lastResponse) {
    throw new Error('Nenhuma resposta foi recebida do chatbot');
  }

  if (!this.lastResponse.toolsUsed || this.lastResponse.toolsUsed.length === 0) {
    throw new Error('Esperado que a resposta use pelo menos uma ferramenta, mas nenhuma foi usada.');
  }
});

Then('a resposta deve usar exatamente {int} ferramenta(s)', function (
  this: TestWorld,
  expectedCount: number,
) {
  if (!this.lastResponse) {
    throw new Error('Nenhuma resposta foi recebida do chatbot');
  }

  const actualCount = this.lastResponse.toolsUsed?.length || 0;
  if (actualCount !== expectedCount) {
    throw new Error(
      `Esperado que a resposta use exatamente ${expectedCount} ferramenta(s), mas usou ${actualCount}.`,
    );
  }
});

Then('devo receber uma mensagem de erro sobre {string}', function (
  this: TestWorld,
  errorKeyword: string,
) {
  if (!this.lastError) {
    throw new Error('Era esperado um erro, mas nenhum erro foi recebido');
  }

  if (!this.lastError.toLowerCase().includes(errorKeyword.toLowerCase())) {
    throw new Error(
      `Esperado que o erro contenha "${errorKeyword}", mas recebido: "${this.lastError}"`,
    );
  }
});

Then('a resposta deve ser uma string não vazia', function (this: TestWorld) {
  if (!this.lastResponse) {
    throw new Error('Nenhuma resposta foi recebida do chatbot');
  }

  if (!this.lastResponse.answer || this.lastResponse.answer.trim().length === 0) {
    throw new Error('A resposta do chatbot está vazia');
  }
});

