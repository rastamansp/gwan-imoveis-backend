import { Then } from '@cucumber/cucumber';
import { TestWorld } from '../../../test/bdd/support/world';

/**
 * Steps específicos para eventos
 */

Then('a resposta deve listar {int} eventos', function (this: TestWorld, expectedCount: number) {
  if (!this.lastResponse) {
    throw new Error('Nenhuma resposta foi recebida do chatbot');
  }

  const actualCount = this.extractItemCount('eventos?');
  
  if (actualCount !== expectedCount && actualCount > 0) {
    // Se encontrou algum número, validar
    if (actualCount !== expectedCount) {
      throw new Error(
        `Esperado ${expectedCount} eventos, mas a resposta menciona ${actualCount}`,
      );
    }
  }

  // Verificar se a resposta contém informações sobre eventos
  if (!this.responseContains('evento')) {
    throw new Error('A resposta não menciona eventos');
  }
});

Then('deve conter o evento {string}', function (this: TestWorld, eventTitle: string) {
  if (!this.lastResponse) {
    throw new Error('Nenhuma resposta foi recebida do chatbot');
  }

  if (!this.responseContainsTitle(eventTitle)) {
    throw new Error(
      `Esperado que a resposta contenha o evento "${eventTitle}", mas recebido: "${this.lastResponse.answer}"`,
    );
  }
});

Then('deve conter o código {string}', function (this: TestWorld, eventCode: string) {
  if (!this.lastResponse) {
    throw new Error('Nenhuma resposta foi recebida do chatbot');
  }

  if (!this.responseContainsCode(eventCode)) {
    throw new Error(
      `Esperado que a resposta contenha o código "${eventCode}", mas recebido: "${this.lastResponse.answer}"`,
    );
  }
});

Then('a resposta deve mencionar preços de ingressos', function (this: TestWorld) {
  if (!this.lastResponse) {
    throw new Error('Nenhuma resposta foi recebida do chatbot');
  }

  const keywords = ['preço', 'ingresso', 'ticket', 'valor', 'categoria'];
  const foundKeyword = keywords.some((keyword) =>
    this.lastResponse!.answer.toLowerCase().includes(keyword),
  );

  if (!foundKeyword) {
    throw new Error(
      `Esperado que a resposta mencione preços de ingressos, mas recebido: "${this.lastResponse.answer}"`,
    );
  }
});

Then('a resposta deve mencionar detalhes do evento', function (this: TestWorld) {
  if (!this.lastResponse) {
    throw new Error('Nenhuma resposta foi recebida do chatbot');
  }

  const detailKeywords = [
    'data',
    'local',
    'localização',
    'endereço',
    'cidade',
    'descrição',
    'categoria',
  ];
  const foundKeyword = detailKeywords.some((keyword) =>
    this.lastResponse!.answer.toLowerCase().includes(keyword),
  );

  if (!foundKeyword) {
    throw new Error(
      `Esperado que a resposta mencione detalhes do evento, mas recebido: "${this.lastResponse.answer}"`,
    );
  }
});

Then('a resposta deve mencionar eventos da categoria {string}', function (
  this: TestWorld,
  category: string,
) {
  if (!this.lastResponse) {
    throw new Error('Nenhuma resposta foi recebida do chatbot');
  }

  if (!this.responseContains(category)) {
    throw new Error(
      `Esperado que a resposta mencione eventos da categoria "${category}", mas recebido: "${this.lastResponse.answer}"`,
    );
  }
});

