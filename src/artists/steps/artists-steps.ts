import { Then } from '@cucumber/cucumber';
import { TestWorld } from '../../../test/bdd/support/world';

/**
 * Steps específicos para artistas
 */

Then('a resposta deve listar {int} artistas', function (this: TestWorld, expectedCount: number) {
  if (!this.lastResponse) {
    throw new Error('Nenhuma resposta foi recebida do chatbot');
  }

  const actualCount = this.extractItemCount('artistas?');
  
  if (actualCount !== expectedCount && actualCount > 0) {
    // Se encontrou algum número, validar
    if (actualCount !== expectedCount) {
      throw new Error(
        `Esperado ${expectedCount} artistas, mas a resposta menciona ${actualCount}`,
      );
    }
  }

  // Verificar se a resposta contém informações sobre artistas
  if (!this.responseContains('artista')) {
    throw new Error('A resposta não menciona artistas');
  }
});

Then('deve conter o artista {string}', function (this: TestWorld, artistName: string) {
  if (!this.lastResponse) {
    throw new Error('Nenhuma resposta foi recebida do chatbot');
  }

  if (!this.responseContainsTitle(artistName)) {
    throw new Error(
      `Esperado que a resposta contenha o artista "${artistName}", mas recebido: "${this.lastResponse.answer}"`,
    );
  }
});

Then('a resposta deve mencionar detalhes do artista', function (this: TestWorld) {
  if (!this.lastResponse) {
    throw new Error('Nenhuma resposta foi recebida do chatbot');
  }

  const detailKeywords = [
    'nome',
    'artístico',
    'biografia',
    'instagram',
    'youtube',
    'spotify',
    'evento',
  ];
  const foundKeyword = detailKeywords.some((keyword) =>
    this.lastResponse!.answer.toLowerCase().includes(keyword),
  );

  if (!foundKeyword) {
    throw new Error(
      `Esperado que a resposta mencione detalhes do artista, mas recebido: "${this.lastResponse.answer}"`,
    );
  }
});

Then('a resposta deve mencionar eventos vinculados ao artista', function (this: TestWorld) {
  if (!this.lastResponse) {
    throw new Error('Nenhuma resposta foi recebida do chatbot');
  }

  const eventKeywords = ['evento', 'eventos', 'show', 'apresentação'];
  const foundKeyword = eventKeywords.some((keyword) =>
    this.lastResponse!.answer.toLowerCase().includes(keyword),
  );

  if (!foundKeyword) {
    throw new Error(
      `Esperado que a resposta mencione eventos vinculados ao artista, mas recebido: "${this.lastResponse.answer}"`,
    );
  }
});

Then('a resposta deve mencionar redes sociais do artista', function (this: TestWorld) {
  if (!this.lastResponse) {
    throw new Error('Nenhuma resposta foi recebida do chatbot');
  }

  const socialKeywords = ['instagram', 'youtube', 'spotify', 'twitter', 'tiktok'];
  const foundKeyword = socialKeywords.some((keyword) =>
    this.lastResponse!.answer.toLowerCase().includes(keyword),
  );

  if (!foundKeyword) {
    throw new Error(
      `Esperado que a resposta mencione redes sociais do artista, mas recebido: "${this.lastResponse.answer}"`,
    );
  }
});

Then('a resposta deve listar artistas', function (this: TestWorld) {
  if (!this.lastResponse) {
    throw new Error('Nenhuma resposta foi recebida do chatbot');
  }

  // Verificar se a resposta contém informações sobre artistas
  const artistKeywords = ['artista', 'artistas', 'músico', 'músicos', 'banda', 'bandas'];
  const foundKeyword = artistKeywords.some((keyword) =>
    this.lastResponse!.answer.toLowerCase().includes(keyword),
  );

  if (!foundKeyword) {
    throw new Error('A resposta não menciona artistas');
  }
});

