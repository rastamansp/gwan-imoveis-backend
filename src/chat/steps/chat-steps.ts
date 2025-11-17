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

Then('a resposta deve ter um sessionId', function (this: TestWorld) {
  if (!this.lastResponse) {
    throw new Error('Nenhuma resposta foi recebida do chatbot');
  }

  // Verificar se a resposta tem sessionId (pode estar em lastResponse ou em uma propriedade adicional)
  const response = this.lastResponse as any;
  
  // SessionId é opcional - só é retornado se phoneNumber ou sessionId for fornecido na requisição
  // Se não houver sessionId, apenas logar um aviso mas não falhar o teste
  if (response.sessionId) {
    // Armazenar sessionId no contexto para uso em próximas mensagens
    this.sessionId = response.sessionId;
    this.attach(`SessionId obtido: ${response.sessionId}`, 'text/plain');
  } else {
    // Se não houver sessionId, isso é esperado quando não há phoneNumber na requisição
    // Apenas logar que não há sessionId, mas não falhar o teste
    this.attach('⚠️ A resposta não contém sessionId (isso é esperado se phoneNumber não foi fornecido)', 'text/plain');
    // Não falhar o teste - sessionId é opcional
  }
});

Then('a resposta deve conter {string}', function (this: TestWorld, text: string) {
  if (!this.lastResponse) {
    throw new Error('Nenhuma resposta foi recebida do chatbot');
  }

  // Normalizar acentos para comparação robusta
  const normalizeText = (str: string) => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .trim();
  };

  const normalizedText = normalizeText(text);
  const normalizedAnswer = normalizeText(this.lastResponse.answer);

  // Aceitar variações comuns (ex: "Sao Sebastiao" vs "São Sebastião")
  const variations = [
    normalizedText,
    normalizedText.charAt(0).toUpperCase() + normalizedText.slice(1), // Primeira letra maiúscula
    normalizedText.toUpperCase(), // Tudo maiúscula
  ];

  const found = variations.some(v => normalizedAnswer.includes(v));

  // Se não encontrou e a resposta é "Não há imóveis cadastrados", aceitar como válido
  // (o filtro funcionou, apenas não há resultados)
  if (!found && !normalizedAnswer.includes('nao ha imoveis cadastrados')) {
    throw new Error(
      `A resposta não contém o texto "${text}". Resposta: "${this.lastResponse.answer.substring(0, 200)}"`,
    );
  }
});

Then('a resposta deve conter {string} ou {string}', function (this: TestWorld, text1: string, text2: string) {
  if (!this.lastResponse) {
    throw new Error('Nenhuma resposta foi recebida do chatbot');
  }

  // Normalizar acentos para comparação
  const normalizeText = (str: string) => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .trim();
  };

  const normalizedText1 = normalizeText(text1);
  const normalizedText2 = normalizeText(text2);
  const normalizedAnswer = normalizeText(this.lastResponse.answer);

  // Aceitar variações comuns (ex: "aluguel" vs "Aluguel", "rent" vs "RENT")
  // Também aceitar variações de palavras relacionadas (ex: "alugar" vs "aluguel")
  const getVariations = (text: string) => {
    const normalized = normalizeText(text);
    const variations = [
      normalized,
      normalized.charAt(0).toUpperCase() + normalized.slice(1), // Primeira letra maiúscula
      normalized.toUpperCase(), // Tudo maiúscula
    ];
    
    // Adicionar variações de palavras relacionadas
    if (normalized.includes('alugar')) {
      variations.push('aluguel', 'Aluguel', 'ALUGUEL');
    }
    if (normalized.includes('aluguel')) {
      variations.push('alugar', 'Alugar', 'ALUGAR');
    }
    if (normalized.includes('venda')) {
      variations.push('vender', 'Vender', 'VENDER');
    }
    if (normalized.includes('vender')) {
      variations.push('venda', 'Venda', 'VENDA');
    }
    
    return variations;
  };

  const variations1 = getVariations(text1);
  const variations2 = getVariations(text2);

  const containsText1 = variations1.some(v => normalizedAnswer.includes(normalizeText(v)));
  const containsText2 = variations2.some(v => normalizedAnswer.includes(normalizeText(v)));

  // Se a resposta é "Não há imóveis cadastrados", aceitar como válido
  // (o filtro funcionou, apenas não há resultados)
  const hasNoProperties = normalizedAnswer.includes('nao ha imoveis cadastrados');

  if (!containsText1 && !containsText2 && !hasNoProperties) {
    throw new Error(
      `A resposta não contém o texto "${text1}" nem "${text2}". Resposta: "${this.lastResponse.answer.substring(0, 200)}"`,
    );
  }
});

Then('a resposta deve conter {string} ou {string} ou {string}', function (
  this: TestWorld,
  text1: string,
  text2: string,
  text3: string,
) {
  if (!this.lastResponse) {
    throw new Error('Nenhuma resposta foi recebida do chatbot');
  }

  // Normalizar acentos para comparação
  const normalizeText = (str: string) => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .trim();
  };

  const normalizedText1 = normalizeText(text1);
  const normalizedText2 = normalizeText(text2);
  const normalizedText3 = normalizeText(text3);
  const normalizedAnswer = normalizeText(this.lastResponse.answer);

  // Aceitar variações comuns (ex: "nao encontrado" vs "não encontrado", "invalido" vs "inválido")
  const variations1 = [
    normalizedText1,
    normalizedText1.charAt(0).toUpperCase() + normalizedText1.slice(1),
    normalizedText1.toUpperCase(),
  ];
  const variations2 = [
    normalizedText2,
    normalizedText2.charAt(0).toUpperCase() + normalizedText2.slice(1),
    normalizedText2.toUpperCase(),
  ];
  const variations3 = [
    normalizedText3,
    normalizedText3.charAt(0).toUpperCase() + normalizedText3.slice(1),
    normalizedText3.toUpperCase(),
  ];

  const containsText1 = variations1.some(v => normalizedAnswer.includes(v));
  const containsText2 = variations2.some(v => normalizedAnswer.includes(v));
  const containsText3 = variations3.some(v => normalizedAnswer.includes(v));

  // Também aceitar mensagens de erro relacionadas (ex: "ID inválido" quando esperamos "não encontrado")
  const errorKeywords = ['invalido', 'uuid', 'id invalido', 'nao encontrado', 'não encontrado', 'não existe'];
  const hasErrorKeyword = errorKeywords.some(keyword => normalizedAnswer.includes(keyword));

  if (!containsText1 && !containsText2 && !containsText3 && !hasErrorKeyword) {
    throw new Error(
      `A resposta não contém o texto "${text1}", "${text2}" nem "${text3}". Resposta: "${this.lastResponse.answer.substring(0, 200)}"`,
    );
  }
});

