import { Given, When, Then } from '@cucumber/cucumber';
import axios from 'axios';
import * as sharp from 'sharp';
import * as assert from 'assert';
import { TestWorld } from '../../../test/bdd/support/world';
import { getToken } from '../../../test/bdd/support/token-cache';

/**
 * Steps do tour virtual 360 (F16).
 *
 * Exercita a API real: monta o tour como corretor autenticado e depois lê como
 * visitante anônimo, que é o par que a feature promete (escrita restrita ao dono,
 * leitura pública).
 */

interface TourScene {
  id: string;
  name: string;
  imageUrl: string;
  order: number;
  initialYaw: number;
  hotspots: Array<{
    id: string;
    targetSceneId: string;
    yaw: number;
    pitch: number;
    label: string | null;
  }>;
}

interface TourWorld extends TestWorld {
  tourToken?: string;
  tourPropertyId?: string;
  tourScenes?: TourScene[];
  tourStatus?: number;
  tourError?: string;
}

const baseUrl = () => process.env.TEST_BASE_URL || 'http://localhost:3003';

/**
 * Gera uma panorâmica de verdade nas dimensões pedidas. Imagem sintética basta:
 * o que a API valida é a proporção do arquivo, não o conteúdo dele.
 */
async function panorama(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 120, g: 160, b: 200 },
    },
  })
    .jpeg()
    .toBuffer();
}

function sceneNamed(world: TourWorld, name: string): TourScene {
  const scene = (world.tourScenes ?? []).find((s) => s.name === name);
  assert.ok(scene, `Ambiente "${name}" não encontrado no tour`);
  return scene;
}

async function refreshScenes(world: TourWorld): Promise<void> {
  const { data, status } = await axios.get<TourScene[]>(
    `${baseUrl()}/api/properties/${world.tourPropertyId}/tour/scenes`,
    { validateStatus: () => true },
  );
  world.tourStatus = status;
  world.tourScenes = Array.isArray(data) ? data : [];
}

Given(
  'que estou autenticado no tour como {string} com senha {string}',
  async function (this: TourWorld, email: string, password: string) {
    this.tourToken = await getToken(baseUrl(), email, password);
    assert.ok(this.tourToken, 'Login não devolveu token');
  },
);

Given('que criei um imovel para o tour', async function (this: TourWorld) {
  const { data } = await axios.post(
    `${baseUrl()}/api/properties`,
    {
      title: `Imovel de tour ${Date.now()}`,
      description: 'Imovel criado por teste automatizado do tour virtual',
      type: 'CASA',
      purpose: 'SALE',
      price: 850000,
      neighborhood: 'Maresias',
      city: 'Sao Sebastiao',
      bedrooms: 3,
      bathrooms: 2,
      area: 150,
    },
    { headers: { Authorization: `Bearer ${this.tourToken}` } },
  );
  this.tourPropertyId = data.id;
  this.tourScenes = [];
  assert.ok(this.tourPropertyId, 'Imóvel não foi criado');
});

When(
  'envio a panoramica {string} com {int}x{int}',
  async function (this: TourWorld, name: string, width: number, height: number) {
    const buffer = await panorama(width, height);
    const form = new FormData();
    // Uint8Array e não Buffer: o tipo BlobPart não aceita Buffer diretamente.
    form.append(
      'scene',
      new Blob([new Uint8Array(buffer)], { type: 'image/jpeg' }),
      `${name}.jpg`,
    );
    form.append('name', name);

    const response = await axios.post(
      `${baseUrl()}/api/properties/${this.tourPropertyId}/tour/scenes`,
      form,
      {
        headers: { Authorization: `Bearer ${this.tourToken}` },
        validateStatus: () => true,
      },
    );

    this.tourStatus = response.status;
    this.tourError = response.data?.message;

    if (response.status === 201) {
      await refreshScenes(this);
    }
  },
);

When(
  /^(?:crio|tento criar) um portal de "([^"]+)" para "([^"]+)"$/,
  async function (this: TourWorld, from: string, to: string) {
    const origem = sceneNamed(this, from);
    const destino = sceneNamed(this, to);

    const response = await axios.put(
      `${baseUrl()}/api/properties/${this.tourPropertyId}/tour/scenes/${origem.id}/hotspots`,
      { hotspots: [{ targetSceneId: destino.id, yaw: 1.2, pitch: 0, label: null }] },
      {
        headers: { Authorization: `Bearer ${this.tourToken}` },
        validateStatus: () => true,
      },
    );

    this.tourStatus = response.status;
    this.tourError = response.data?.message;

    if (response.status === 200) {
      await refreshScenes(this);
    }
  },
);

When('removo o ambiente {string}', async function (this: TourWorld, name: string) {
  const scene = sceneNamed(this, name);
  const response = await axios.delete(
    `${baseUrl()}/api/properties/${this.tourPropertyId}/tour/scenes/${scene.id}`,
    {
      headers: { Authorization: `Bearer ${this.tourToken}` },
      validateStatus: () => true,
    },
  );
  this.tourStatus = response.status;
  await refreshScenes(this);
});

// Sem cabeçalho de autorização: é o caminho do visitante.
When('um visitante nao autenticado consulta o tour', async function (this: TourWorld) {
  await refreshScenes(this);
});

Then('o status da resposta do tour deve ser {int}', function (this: TourWorld, expected: number) {
  assert.strictEqual(this.tourStatus, expected);
});

Then(
  /^o tour deve ter (\d+) ambientes?$/,
  function (this: TourWorld, expected: string) {
    assert.strictEqual((this.tourScenes ?? []).length, Number(expected));
  },
);

Then('o ambiente de entrada do tour deve ser {string}', function (this: TourWorld, name: string) {
  const ordered = [...(this.tourScenes ?? [])].sort((a, b) => a.order - b.order);
  assert.ok(ordered.length > 0, 'O tour está vazio');
  assert.strictEqual(ordered[0].name, name);
});

Then(
  // "portal" e "portais" são formas diferentes, não plural por sufixo.
  /^o ambiente "([^"]+)" deve ter (\d+) (?:portal|portais)$/,
  function (this: TourWorld, name: string, expected: string) {
    assert.strictEqual(sceneNamed(this, name).hotspots.length, Number(expected));
  },
);

Then(
  'o portal de {string} deve levar para {string}',
  function (this: TourWorld, from: string, to: string) {
    const origem = sceneNamed(this, from);
    const destino = sceneNamed(this, to);
    assert.ok(
      origem.hotspots.some((h) => h.targetSceneId === destino.id),
      `Nenhum portal de "${from}" aponta para "${to}"`,
    );
  },
);

Then('a mensagem de erro do tour deve citar a proporcao', function (this: TourWorld) {
  assert.ok(
    /propor/i.test(this.tourError ?? ''),
    `Mensagem não cita a proporção: ${this.tourError}`,
  );
});
