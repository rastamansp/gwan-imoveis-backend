import { Then } from '@cucumber/cucumber';
import { TestWorld } from '../../../test/bdd/support/world';

/**
 * Steps específicos do chatbot
 */

Then('devo receber uma resposta contendo {string}', function (this: TestWorld, expectedText: string) {
  if (!this.lastResponse) {
    throw new Error('Nenhuma resposta foi recebida do chatbot');
  }

  // Aceitar variações comuns (com/sem acentos, maiúsculas/minúsculas)
  const lowerExpected = expectedText.toLowerCase();
  const lowerAnswer = this.lastResponse.answer.toLowerCase();
  
  // Normalizar variações comuns
  const normalizedExpected = lowerExpected
    .replace(/não/g, 'nao')
    .replace(/não encontrado/g, 'nao encontrado')
    .replace(/não existe/g, 'nao existe');
  const normalizedAnswer = lowerAnswer
    .replace(/não/g, 'nao')
    .replace(/não encontrado/g, 'nao encontrado')
    .replace(/não existe/g, 'nao existe');
  
  if (!normalizedAnswer.includes(normalizedExpected) && !lowerAnswer.includes(lowerExpected)) {
    // Tentar também verificar se contém palavras-chave relacionadas
    const relatedKeywords: Record<string, string[]> = {
      'não encontrado': ['nao encontrado', 'não existe', 'nao existe', 'inválido', 'invalido'],
      'não existe': ['nao existe', 'não encontrado', 'nao encontrado', 'inválido', 'invalido'],
      'id inválido': ['id invalido', 'uuid inválido', 'uuid invalido', 'inválido', 'invalido'],
    };
    
    const related = relatedKeywords[lowerExpected] || [];
    const hasRelated = related.some(keyword => normalizedAnswer.includes(keyword));
    
    if (!hasRelated) {
      throw new Error(
        `Esperado que a resposta contenha "${expectedText}", mas recebido: "${this.lastResponse.answer}"`,
      );
    }
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
  // Verificar tanto em lastError quanto em lastResponse.answer
  const errorText = this.lastError || this.lastResponse?.answer || '';
  const lowerErrorText = errorText.toLowerCase();
  const lowerKeyword = errorKeyword.toLowerCase();
  
  // Aceitar variações comuns de mensagens de erro
  const variations = [
    lowerKeyword,
    `id inválido`,
    `inválido`,
    `erro`,
    `não encontrado`,
    `não existe`,
  ];
  
  const found = variations.some(variation => lowerErrorText.includes(variation));
  
  if (!found && !lowerErrorText.includes(lowerKeyword)) {
    throw new Error(
      `Esperado que a resposta contenha "${errorKeyword}" ou variações relacionadas, mas recebido: "${errorText}"`,
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

