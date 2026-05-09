import { When, Then } from '@cucumber/cucumber';
import { TestWorld } from '../../../test/bdd/support/world';
import { PropertiesTestClient } from '../../../test/bdd/support/properties-client';

interface SearchWorld extends TestWorld {
  searchResults?: Array<{ property: any; score: number; distance: number }>;
}

let client: PropertiesTestClient | null = null;
function getClient(): PropertiesTestClient {
  if (!client) {
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3009';
    client = new PropertiesTestClient(baseUrl);
  }
  return client;
}

When('faço busca semântica com query {string}', async function (this: SearchWorld, q: string) {
  const { results, status } = await getClient().semanticSearch({ q });
  this.lastStatus = status;
  this.searchResults = results;
});

When('faço busca semântica com query {string} e cidade {string}', async function (this: SearchWorld, q: string, city: string) {
  const { results, status } = await getClient().semanticSearch({ q, city });
  this.lastStatus = status;
  this.searchResults = results;
});

When(
  'faço busca semântica com query {string} finalidade {string} e preço máximo {int}',
  async function (this: SearchWorld, q: string, purpose: string, maxPrice: number) {
    const { results, status } = await getClient().semanticSearch({ q, purpose, maxPrice });
    this.lastStatus = status;
    this.searchResults = results;
  },
);

When('faço busca semântica sem parâmetro q', async function (this: SearchWorld) {
  const { results, status } = await getClient().semanticSearch({});
  this.lastStatus = status;
  this.searchResults = results;
});

When('faço busca semântica com query {string} e limite {int}', async function (this: SearchWorld, q: string, limit: number) {
  const { results, status } = await getClient().semanticSearch({ q, limit });
  this.lastStatus = status;
  this.searchResults = results;
});

Then('devo receber uma lista de resultados de busca semântica', function (this: SearchWorld) {
  if (!Array.isArray(this.searchResults)) {
    throw new Error('Resposta não é uma lista');
  }
});

Then('os resultados devem estar ordenados por score decrescente', function (this: SearchWorld) {
  const scores = (this.searchResults ?? []).map((r) => r.score);
  for (let i = 1; i < scores.length; i += 1) {
    if (scores[i] > scores[i - 1] + 1e-6) {
      throw new Error(`Resultados não ordenados: posição ${i - 1}=${scores[i - 1]} < ${i}=${scores[i]}`);
    }
  }
});

Then('todos os resultados devem estar na cidade {string}', function (this: SearchWorld, city: string) {
  for (const hit of this.searchResults ?? []) {
    if (hit.property?.city !== city) {
      throw new Error(`Imóvel ${hit.property?.id} está em ${hit.property?.city}, esperado ${city}`);
    }
  }
});

Then('todos os resultados devem ter finalidade {string}', function (this: SearchWorld, purpose: string) {
  for (const hit of this.searchResults ?? []) {
    if (hit.property?.purpose !== purpose) {
      throw new Error(`Imóvel ${hit.property?.id} tem purpose ${hit.property?.purpose}, esperado ${purpose}`);
    }
  }
});

Then('devo receber no máximo {int} resultados de busca semântica', function (this: SearchWorld, max: number) {
  const len = this.searchResults?.length ?? 0;
  if (len > max) {
    throw new Error(`Esperado no máximo ${max} resultados, recebido ${len}`);
  }
});
