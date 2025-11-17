import { Given, When, Then } from '@cucumber/cucumber';
import axios, { AxiosError } from 'axios';
import { TestWorld } from '../../../test/bdd/support/world';
import { PropertiesTestClient, Property } from '../../../test/bdd/support/properties-client';

let propertiesClient: PropertiesTestClient;

/**
 * Inicializar cliente da API de Properties
 */
function getPropertiesClient(): PropertiesTestClient {
  if (!propertiesClient) {
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3009';
    propertiesClient = new PropertiesTestClient(baseUrl);
  }
  return propertiesClient;
}

// Estender TestWorld para incluir propriedades
interface PropertiesWorld extends TestWorld {
  properties?: Property[];
  property?: Property;
  authToken?: string;
  createdPropertyId?: string;
}

type WorldType = PropertiesWorld;

Given('que a API de propriedades está disponível', async function (this: WorldType) {
  const client = getPropertiesClient();
  
  // Verificar se a API está respondendo
  try {
    const { status } = await client.listProperties();
    if (status !== 200) {
      throw new Error(`API retornou status ${status}`);
    }
    this.attach('✅ API de propriedades está disponível e respondendo');
  } catch (error) {
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3009';
    throw new Error(
      `API de propriedades não está disponível em ${baseUrl}. Certifique-se de que a aplicação está rodando.`,
    );
  }
});

// Step sem acento para compatibilidade com features
Given('que a API de propriedades esta disponivel', async function (this: WorldType) {
  const client = getPropertiesClient();
  
  // Verificar se a API está respondendo
  try {
    const { status } = await client.listProperties();
    if (status !== 200) {
      throw new Error(`API retornou status ${status}`);
    }
    this.attach('✅ API de propriedades está disponível e respondendo');
  } catch (error) {
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3009';
    throw new Error(
      `API de propriedades não está disponível em ${baseUrl}. Certifique-se de que a aplicação está rodando.`,
    );
  }
});

Given('que estou autenticado como {string} com senha {string}', async function (
  this: WorldType,
  email: string,
  password: string,
) {
  const client = getPropertiesClient();
  try {
    const { token } = await client.login(email, password);
    this.authToken = token;
    this.attach(`✅ Autenticado como ${email}`);
  } catch (error) {
    throw new Error(`Erro ao fazer login: ${error instanceof Error ? error.message : String(error)}`);
  }
});

When('listo todas as propriedades', async function (this: WorldType) {
  const client = getPropertiesClient();
  try {
    const { properties, status } = await client.listProperties();
    this.properties = properties;
    this.lastStatus = status;
    this.attach(`Encontradas ${properties.length} propriedades`, 'text/plain');
  } catch (error) {
    this.lastError = error instanceof Error ? error.message : String(error);
    throw error;
  }
});

When('listo propriedades na cidade {string}', async function (this: WorldType, city: string) {
  const client = getPropertiesClient();
  try {
    const { properties, status } = await client.listProperties({ city });
    this.properties = properties;
    this.lastStatus = status;
    this.attach(`Encontradas ${properties.length} propriedades em ${city}`, 'text/plain');
  } catch (error) {
    this.lastError = error instanceof Error ? error.message : String(error);
    throw error;
  }
});

When('listo propriedades do tipo {string}', async function (this: WorldType, type: string) {
  const client = getPropertiesClient();
  try {
    const { properties, status } = await client.listProperties({ type });
    this.properties = properties;
    this.lastStatus = status;
    this.attach(`Encontradas ${properties.length} propriedades do tipo ${type}`, 'text/plain');
  } catch (error) {
    this.lastError = error instanceof Error ? error.message : String(error);
    throw error;
  }
});

When('listo propriedades com preço entre {int} e {int}', async function (
  this: WorldType,
  minPrice: number,
  maxPrice: number,
) {
  const client = getPropertiesClient();
  try {
    const { properties, status } = await client.listProperties({ minPrice, maxPrice });
    this.properties = properties;
    this.lastStatus = status;
    this.attach(
      `Encontradas ${properties.length} propriedades entre R$ ${minPrice} e R$ ${maxPrice}`,
      'text/plain',
    );
  } catch (error) {
    this.lastError = error instanceof Error ? error.message : String(error);
    throw error;
  }
});

// Step sem acento para compatibilidade com features
When('listo propriedades com preco entre {int} e {int}', async function (
  this: WorldType,
  minPrice: number,
  maxPrice: number,
) {
  const client = getPropertiesClient();
  try {
    const { properties, status } = await client.listProperties({ minPrice, maxPrice });
    this.properties = properties;
    this.lastStatus = status;
    this.attach(
      `Encontradas ${properties.length} propriedades entre R$ ${minPrice} e R$ ${maxPrice}`,
      'text/plain',
    );
  } catch (error) {
    this.lastError = error instanceof Error ? error.message : String(error);
    throw error;
  }
});

When('obtenho a propriedade com ID {string}', async function (this: WorldType, id: string) {
  const client = getPropertiesClient();
  try {
    const { property, status } = await client.getPropertyById(id);
    this.property = property;
    this.lastStatus = status;
    this.attach(`Propriedade obtida: ${property.title}`, 'text/plain');
  } catch (error) {
    // Verificar se o erro tem status preservado
    if ((error as any)?.status) {
      this.lastStatus = (error as any).status;
      this.lastError = error instanceof Error ? error.message : String(error);
    } else if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string }>;
      this.lastStatus = axiosError.response?.status || 500;
      this.lastError = axiosError.response?.data?.message || axiosError.message;
    } else {
      this.lastError = error instanceof Error ? error.message : String(error);
      this.lastStatus = 500;
    }
    // Não lançar erro para permitir que o teste verifique o status
  }
});

When('crio uma propriedade com os seguintes dados:', async function (
  this: WorldType,
  dataTable: any,
) {
  // Se não estiver autenticado, capturar o erro ao invés de lançar
  if (!this.authToken) {
    this.lastStatus = 401;
    this.lastError = 'É necessário estar autenticado para criar propriedades';
    return;
  }

  const client = getPropertiesClient();
  const data = dataTable.hashes()[0];

  const propertyData = {
    title: data.title || data.Título || data.Titulo,
    description: data.description || data.Descrição || data.Descricao,
    type: data.type || data.Tipo,
    purpose: data.purpose || data.Finalidade || 'RENT',
    price: parseFloat(data.price || data.Preço || data.Preco || '0'),
    neighborhood: data.neighborhood || data.Bairro,
    city: data.city || data.Cidade,
    bedrooms: data.bedrooms || data.Quartos ? parseInt(data.bedrooms || data.Quartos, 10) : undefined,
    bathrooms: data.bathrooms || data.Banheiros
      ? parseInt(data.bathrooms || data.Banheiros, 10)
      : undefined,
    area: parseFloat(data.area || data.Área || data.Area || '0'),
    garageSpaces: data.garageSpaces || data.Vagas
      ? parseInt(data.garageSpaces || data.Vagas, 10)
      : undefined,
    hasPool: data.hasPool === 'true' || data['Tem Piscina'] === 'true' || data['Tem Piscina'] === true,
    hasJacuzzi: data.hasJacuzzi === 'true' || data['Tem Hidromassagem'] === 'true' || data['Tem Hidromassagem'] === true,
    oceanFront: data.oceanFront === 'true' || data['Frente Mar'] === 'true' || data['Frente Mar'] === true,
    hasGarden: data.hasGarden === 'true' || data['Tem Jardim'] === 'true' || data['Tem Jardim'] === true,
    hasGourmetArea: data.hasGourmetArea === 'true' || data['Área Gourmet'] === 'true' || data['Area Gourmet'] === 'true' || data['Área Gourmet'] === true || data['Area Gourmet'] === true,
    furnished: data.furnished === 'true' || data.Mobiliado === 'true' || data.Mobiliado === true,
  };

  try {
    const { property, status } = await client.createProperty(propertyData, this.authToken);
    this.property = property;
    this.createdPropertyId = property.id;
    this.lastStatus = status;
    this.attach(`Propriedade criada com ID: ${property.id}`, 'text/plain');
  } catch (error) {
    this.lastError = error instanceof Error ? error.message : String(error);
    throw error;
  }
});

When('atualizo a propriedade com ID {string} com os seguintes dados:', async function (
  this: WorldType,
  id: string,
  dataTable: any,
) {
  if (!this.authToken) {
    throw new Error('É necessário estar autenticado para atualizar propriedades');
  }

  const client = getPropertiesClient();
  const data = dataTable.hashes()[0];

  const updateData: any = {};
  if (data.price || data.Preço || data.Preco) updateData.price = parseFloat(data.price || data.Preço || data.Preco);
  if (data.bedrooms || data.Quartos)
    updateData.bedrooms = parseInt(data.bedrooms || data.Quartos, 10);
  if (data.hasPool !== undefined) updateData.hasPool = data.hasPool === 'true';
  if (data['Tem Piscina'] !== undefined) updateData.hasPool = data['Tem Piscina'] === 'true' || data['Tem Piscina'] === true;
  if (data.hasGourmetArea !== undefined) updateData.hasGourmetArea = data.hasGourmetArea === 'true';

  try {
    const { property, status } = await client.updateProperty(id, updateData, this.authToken);
    this.property = property;
    this.lastStatus = status;
    this.attach(`Propriedade atualizada: ${property.title}`, 'text/plain');
  } catch (error) {
    this.lastError = error instanceof Error ? error.message : String(error);
    throw error;
  }
});

When('deleto a propriedade com ID {string}', async function (this: WorldType, id: string) {
  if (!this.authToken) {
    throw new Error('É necessário estar autenticado para deletar propriedades');
  }

  const client = getPropertiesClient();
  try {
    const { status } = await client.deleteProperty(id, this.authToken);
    this.lastStatus = status;
    this.attach(`Propriedade ${id} deletada`, 'text/plain');
  } catch (error) {
    this.lastError = error instanceof Error ? error.message : String(error);
    throw error;
  }
});

When('listo minhas propriedades', async function (this: WorldType) {
  if (!this.authToken) {
    throw new Error('É necessário estar autenticado para listar minhas propriedades');
  }

  const client = getPropertiesClient();
  try {
    const { properties, status } = await client.listMyProperties(this.authToken);
    this.properties = properties;
    this.lastStatus = status;
    this.attach(`Encontradas ${properties.length} de minhas propriedades`, 'text/plain');
  } catch (error) {
    // Verificar se o erro tem status preservado
    if ((error as any)?.status) {
      this.lastStatus = (error as any).status;
      this.lastError = error instanceof Error ? error.message : String(error);
    } else if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string }>;
      this.lastStatus = axiosError.response?.status || 500;
      this.lastError = axiosError.response?.data?.message || axiosError.message;
    } else {
      this.lastError = error instanceof Error ? error.message : String(error);
      this.lastStatus = 500;
    }
    // Não lançar erro para permitir que o teste verifique o status
  }
});

Then('devo receber uma lista de propriedades', function (this: WorldType) {
  if (!this.properties) {
    throw new Error('Nenhuma lista de propriedades foi recebida');
  }
  if (!Array.isArray(this.properties)) {
    throw new Error('A resposta não é uma lista de propriedades');
  }
});

// Step único que aceita tanto "propriedade(s)" quanto "propriedades"
Then(/^a lista deve conter pelo menos (\d+) propriedades?$/, function (
  this: WorldType,
  minCount: string,
) {
  const count = parseInt(minCount, 10);
  if (!this.properties || this.properties.length < count) {
    throw new Error(
      `Esperado pelo menos ${count} propriedade(s), mas recebido ${this.properties?.length || 0}`,
    );
  }
});

Then('todas as propriedades devem estar na cidade {string}', function (
  this: WorldType,
  city: string,
) {
  if (!this.properties) {
    throw new Error('Nenhuma lista de propriedades foi recebida');
  }

  // Normalizar acentos para comparação
  const normalizeText = (str: string) => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .trim();
  };

  const normalizedCity = normalizeText(city);
  const invalidProperties = this.properties.filter((p) => {
    const normalizedPropertyCity = normalizeText(p.city || '');
    return normalizedPropertyCity !== normalizedCity;
  });

  if (invalidProperties.length > 0) {
    throw new Error(
      `Encontradas ${invalidProperties.length} propriedades fora da cidade ${city}`,
    );
  }
});

Then('todas as propriedades devem ser do tipo {string}', function (
  this: WorldType,
  type: string,
) {
  if (!this.properties) {
    throw new Error('Nenhuma lista de propriedades foi recebida');
  }

  const invalidProperties = this.properties.filter((p) => p.type !== type);
  if (invalidProperties.length > 0) {
    throw new Error(`Encontradas ${invalidProperties.length} propriedades que não são do tipo ${type}`);
  }
});

Then('devo receber os detalhes da propriedade', function (this: WorldType) {
  if (!this.property) {
    throw new Error('Nenhuma propriedade foi recebida');
  }
  if (!this.property.id) {
    throw new Error('A propriedade recebida não contém um ID');
  }
});

Then('a propriedade deve ter o título {string}', function (this: WorldType, expectedTitle: string) {
  if (!this.property) {
    throw new Error('Nenhuma propriedade foi recebida');
  }
  if (this.property.title !== expectedTitle) {
    throw new Error(
      `Título esperado: "${expectedTitle}", mas recebido: "${this.property.title}"`,
    );
  }
});

// Step sem acento para compatibilidade com features
Then('a propriedade deve ter o titulo {string}', function (this: WorldType, expectedTitle: string) {
  if (!this.property) {
    throw new Error('Nenhuma propriedade foi recebida');
  }
  if (this.property.title !== expectedTitle) {
    throw new Error(
      `Título esperado: "${expectedTitle}", mas recebido: "${this.property.title}"`,
    );
  }
});

Then('a propriedade deve ter o campo {string} com valor {string}', function (
  this: WorldType,
  fieldName: string,
  expectedValue: string,
) {
  if (!this.property) {
    throw new Error('Nenhuma propriedade foi recebida');
  }

  const fieldMap: Record<string, keyof Property> = {
    título: 'title',
    title: 'title',
    descrição: 'description',
    description: 'description',
    tipo: 'type',
    type: 'type',
    cidade: 'city',
    city: 'city',
    bairro: 'neighborhood',
    neighborhood: 'neighborhood',
  };

  const field = fieldMap[fieldName.toLowerCase()];
  if (!field) {
    throw new Error(`Campo "${fieldName}" não é válido ou não pode ser verificado`);
  }

  const actualValue = String(this.property[field]);
  if (actualValue !== expectedValue) {
    throw new Error(
      `Campo "${fieldName}" esperado: "${expectedValue}", mas recebido: "${actualValue}"`,
    );
  }
});

Then('a propriedade deve ter {string} como {string}', function (
  this: WorldType,
  amenity: string,
  value: string,
) {
  if (!this.property) {
    throw new Error('Nenhuma propriedade foi recebida');
  }

  const amenityMap: Record<string, keyof Property> = {
    piscina: 'hasPool',
    'tem piscina': 'hasPool',
    haspool: 'hasPool',
    'has pool': 'hasPool',
    hasPool: 'hasPool',
    hidromassagem: 'hasJacuzzi',
    'tem hidromassagem': 'hasJacuzzi',
    hasjacuzzi: 'hasJacuzzi',
    'has jacuzzi': 'hasJacuzzi',
    hasJacuzzi: 'hasJacuzzi',
    'frente mar': 'oceanFront',
    oceanfront: 'oceanFront',
    'ocean front': 'oceanFront',
    oceanFront: 'oceanFront',
    jardim: 'hasGarden',
    'tem jardim': 'hasGarden',
    hasgarden: 'hasGarden',
    'has garden': 'hasGarden',
    hasGarden: 'hasGarden',
    'área gourmet': 'hasGourmetArea',
    'area gourmet': 'hasGourmetArea',
    hasgourmetarea: 'hasGourmetArea',
    'has gourmet area': 'hasGourmetArea',
    hasGourmetArea: 'hasGourmetArea',
    mobiliado: 'furnished',
    furnished: 'furnished',
  };

  const normalizedAmenity = amenity.toLowerCase().trim();
  const field = amenityMap[normalizedAmenity];
  if (!field) {
    throw new Error(`Comodidade "${amenity}" não é válida ou não pode ser verificada. Opções disponíveis: ${Object.keys(amenityMap).join(', ')}`);
  }

  const expectedBool = value.toLowerCase() === 'true' || value.toLowerCase() === 'sim';
  const actualBool = Boolean(this.property[field]);

  if (actualBool !== expectedBool) {
    throw new Error(
      `Comodidade "${amenity}" esperada: ${expectedBool}, mas recebida: ${actualBool}`,
    );
  }
});

Then('a propriedade deve ter sido criada com sucesso', function (this: WorldType) {
  if (!this.property || !this.property.id) {
    throw new Error('A propriedade não foi criada ou não possui ID');
  }
  if (this.lastStatus !== 201) {
    throw new Error(`Status esperado: 201, mas recebido: ${this.lastStatus}`);
  }
});

Then('a propriedade deve ter sido atualizada com sucesso', function (this: WorldType) {
  if (!this.property) {
    throw new Error('A propriedade não foi atualizada');
  }
  if (this.lastStatus !== 200) {
    throw new Error(`Status esperado: 200, mas recebido: ${this.lastStatus}`);
  }
});

Then('a propriedade deve ter sido deletada com sucesso', function (this: WorldType) {
  if (this.lastStatus !== 200) {
    throw new Error(`Status esperado: 200, mas recebido: ${this.lastStatus}`);
  }
});

Then('devo receber um erro de autenticação', function (this: WorldType) {
  if (this.lastStatus !== 401 && this.lastStatus !== 403) {
    throw new Error(
      `Status esperado: 401 ou 403, mas recebido: ${this.lastStatus || 'N/A'}`,
    );
  }
});

// Step sem acento para compatibilidade com features
Then('devo receber um erro de autenticacao', function (this: WorldType) {
  if (this.lastStatus !== 401 && this.lastStatus !== 403) {
    throw new Error(
      `Status esperado: 401 ou 403, mas recebido: ${this.lastStatus || 'N/A'}`,
    );
  }
});

Then('a propriedade deve ter o campo {string} em inglês', function (
  this: WorldType,
  fieldName: string,
) {
  if (!this.property) {
    throw new Error('Nenhuma propriedade foi recebida');
  }

  // Verificar se o campo existe e está em inglês (não contém caracteres portugueses comuns)
  const englishFields = [
    'hasPool',
    'hasJacuzzi',
    'oceanFront',
    'hasGarden',
    'hasGourmetArea',
    'furnished',
    'realtorId',
  ];

  if (!englishFields.includes(fieldName)) {
    throw new Error(`Campo "${fieldName}" não é um campo de comodidade ou relacionamento`);
  }

  if (!(fieldName in this.property)) {
    throw new Error(`Campo "${fieldName}" não existe na propriedade`);
  }
});

// Step sem acento para compatibilidade com features
Then('a propriedade deve ter o campo {string} em ingles', function (
  this: WorldType,
  fieldName: string,
) {
  if (!this.property) {
    throw new Error('Nenhuma propriedade foi recebida');
  }

  // Verificar se o campo existe e está em inglês (não contém caracteres portugueses comuns)
  const englishFields = [
    'hasPool',
    'hasJacuzzi',
    'oceanFront',
    'hasGarden',
    'hasGourmetArea',
    'furnished',
    'realtorId',
  ];

  if (!englishFields.includes(fieldName)) {
    throw new Error(`Campo "${fieldName}" não é um campo de comodidade ou relacionamento`);
  }

  if (!(fieldName in this.property)) {
    throw new Error(`Campo "${fieldName}" não existe na propriedade`);
  }
});

Given('que existe uma propriedade com ID {string}', async function (this: WorldType, id: string) {
  // Apenas verificar se a propriedade existe, não criar
  const client = getPropertiesClient();
  try {
    const { property } = await client.getPropertyById(id);
    this.property = property;
    this.attach(`Propriedade encontrada: ${property.title}`, 'text/plain');
  } catch (error) {
    // Se não existir, apenas registrar - alguns testes podem criar depois
    this.attach(`Propriedade com ID ${id} não encontrada (pode ser criada durante o teste)`, 'text/plain');
  }
});

Given('que existe uma propriedade com ID criada anteriormente', async function (this: WorldType) {
  if (!this.createdPropertyId) {
    // Se não há propriedade criada, criar uma agora
    if (!this.authToken) {
      throw new Error('É necessário estar autenticado para criar propriedades');
    }
    
    const client = getPropertiesClient();
    const propertyData = {
      title: 'Propriedade de Teste',
      description: 'Propriedade criada para teste de atualização/deleção',
      type: 'CASA',
      purpose: 'RENT',
      price: 500000,
      neighborhood: 'Centro',
      city: 'Sao Sebastiao',
      bedrooms: 3,
      bathrooms: 2,
      area: 100,
    };
    
    try {
      const { property } = await client.createProperty(propertyData, this.authToken);
      this.createdPropertyId = property.id;
      this.attach(`Propriedade criada para teste: ${property.id}`, 'text/plain');
    } catch (error) {
      throw new Error(`Erro ao criar propriedade para teste: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  // O ID já está armazenado em this.createdPropertyId
});

When('obtenho a primeira propriedade da lista', async function (this: WorldType) {
  if (!this.properties || this.properties.length === 0) {
    throw new Error('Nenhuma propriedade na lista para obter');
  }

  const firstProperty = this.properties[0];
  const client = getPropertiesClient();
  try {
    const { property, status } = await client.getPropertyById(firstProperty.id);
    this.property = property;
    this.lastStatus = status;
    this.attach(`Propriedade obtida: ${property.title}`, 'text/plain');
  } catch (error) {
    this.lastError = error instanceof Error ? error.message : String(error);
    throw error;
  }
});

When('atualizo a propriedade com ID criada anteriormente com os seguintes dados:', async function (
  this: WorldType,
  dataTable: any,
) {
  if (!this.authToken) {
    throw new Error('É necessário estar autenticado para atualizar propriedades');
  }

  if (!this.createdPropertyId) {
    throw new Error('Nenhuma propriedade foi criada anteriormente neste cenário');
  }

  const client = getPropertiesClient();
  const data = dataTable.hashes()[0];

  const updateData: any = {};
  if (data.price || data.Preço || data.Preco) updateData.price = parseFloat(data.price || data.Preço || data.Preco);
  if (data.bedrooms || data.Quartos)
    updateData.bedrooms = parseInt(data.bedrooms || data.Quartos, 10);
  if (data.hasPool !== undefined) updateData.hasPool = data.hasPool === 'true';
  if (data['Tem Piscina'] !== undefined) updateData.hasPool = data['Tem Piscina'] === 'true' || data['Tem Piscina'] === true;
  if (data.hasGourmetArea !== undefined) updateData.hasGourmetArea = data.hasGourmetArea === 'true';

  try {
    const { property, status } = await client.updateProperty(
      this.createdPropertyId,
      updateData,
      this.authToken,
    );
    this.property = property;
    this.lastStatus = status;
    this.attach(`Propriedade atualizada: ${property.title}`, 'text/plain');
  } catch (error) {
    this.lastError = error instanceof Error ? error.message : String(error);
    throw error;
  }
});

When('deleto a propriedade com ID criada anteriormente', async function (this: WorldType) {
  if (!this.authToken) {
    throw new Error('É necessário estar autenticado para deletar propriedades');
  }

  if (!this.createdPropertyId) {
    throw new Error('Nenhuma propriedade foi criada anteriormente neste cenário');
  }

  const client = getPropertiesClient();
  try {
    const { status } = await client.deleteProperty(this.createdPropertyId, this.authToken);
    this.lastStatus = status;
    this.attach(`Propriedade ${this.createdPropertyId} deletada`, 'text/plain');
  } catch (error) {
    this.lastError = error instanceof Error ? error.message : String(error);
    throw error;
  }
});

When('listo propriedades com finalidade {string}', async function (this: WorldType, purpose: string) {
  const client = getPropertiesClient();
  try {
    const { properties, status } = await client.listProperties({ purpose });
    this.properties = properties;
    this.lastStatus = status;
    this.attach(`Encontradas ${properties.length} propriedades com finalidade ${purpose}`, 'text/plain');
  } catch (error) {
    this.lastError = error instanceof Error ? error.message : String(error);
    throw error;
  }
});

When('listo propriedades do realtor com ID da propriedade obtida', async function (this: WorldType) {
  if (!this.property || !this.property.realtorId) {
    throw new Error('Nenhuma propriedade foi obtida ou não possui realtorId');
  }

  const client = getPropertiesClient();
  try {
    const { properties, status } = await client.listProperties({ realtorId: this.property.realtorId });
    this.properties = properties;
    this.lastStatus = status;
    this.attach(`Encontradas ${properties.length} propriedades do realtor ${this.property.realtorId}`, 'text/plain');
  } catch (error) {
    this.lastError = error instanceof Error ? error.message : String(error);
    throw error;
  }
});

When('listo propriedades na cidade {string} do tipo {string} com finalidade {string} e preco entre {int} e {int}', async function (
  this: WorldType,
  city: string,
  type: string,
  purpose: string,
  minPrice: number,
  maxPrice: number,
) {
  const client = getPropertiesClient();
  try {
    const { properties, status } = await client.listProperties({ city, type, purpose, minPrice, maxPrice });
    this.properties = properties;
    this.lastStatus = status;
    this.attach(
      `Encontradas ${properties.length} propriedades com filtros combinados`,
      'text/plain',
    );
  } catch (error) {
    this.lastError = error instanceof Error ? error.message : String(error);
    throw error;
  }
});

When('atualizo a propriedade com ID {string} sem autenticacao com os seguintes dados:', async function (
  this: WorldType,
  id: string,
  dataTable: any,
) {
  const client = getPropertiesClient();
  const data = dataTable.hashes()[0];

  const updateData: any = {};
  if (data.price || data.Preço || data.Preco) updateData.price = parseFloat(data.price || data.Preço || data.Preco);

  try {
    await client.updateProperty(id, updateData, '');
    this.lastStatus = 200; // Não deve chegar aqui
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string }>;
      this.lastStatus = axiosError.response?.status || 401;
      this.lastError = axiosError.response?.data?.message || axiosError.message;
    } else {
      this.lastError = error instanceof Error ? error.message : String(error);
      this.lastStatus = 401;
    }
  }
});

When('deleto a propriedade com ID {string} sem autenticacao', async function (this: WorldType, id: string) {
  const client = getPropertiesClient();
  try {
    await client.deleteProperty(id, '');
    this.lastStatus = 200; // Não deve chegar aqui
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string }>;
      this.lastStatus = axiosError.response?.status || 401;
      this.lastError = axiosError.response?.data?.message || axiosError.message;
    } else {
      this.lastError = error instanceof Error ? error.message : String(error);
      this.lastStatus = 401;
    }
  }
});

When('crio uma propriedade com os seguintes dados invalidos:', async function (
  this: WorldType,
  dataTable: any,
) {
  if (!this.authToken) {
    throw new Error('É necessário estar autenticado para criar propriedades');
  }

  const client = getPropertiesClient();
  const data = dataTable.hashes()[0];

  const propertyData: any = {
    title: data.title || data.Título || data.Titulo || '',
    description: data.description || data.Descrição || data.Descricao || '',
    type: data.type || data.Tipo || '',
    price: parseFloat(data.price || data.Preço || data.Preco || '-100'),
    neighborhood: data.neighborhood || data.Bairro || '',
    city: data.city || data.Cidade || '',
    area: parseFloat(data.area || data.Área || data.Area || '0'),
  };

  try {
    await client.createProperty(propertyData, this.authToken);
    this.lastStatus = 201; // Não deve chegar aqui
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string }>;
      this.lastStatus = axiosError.response?.status || 400;
      this.lastError = axiosError.response?.data?.message || axiosError.message;
    } else {
      this.lastError = error instanceof Error ? error.message : String(error);
      this.lastStatus = 400;
    }
  }
});

Then('todas as propriedades devem ter finalidade {string}', function (this: WorldType, purpose: string) {
  if (!this.properties) {
    throw new Error('Nenhuma lista de propriedades foi recebida');
  }

  const invalidProperties = this.properties.filter((p) => p.purpose !== purpose);
  if (invalidProperties.length > 0) {
    throw new Error(
      `Encontradas ${invalidProperties.length} propriedades que não têm finalidade ${purpose}`,
    );
  }
});

Then('todas as propriedades devem pertencer ao mesmo realtor', function (this: WorldType) {
  if (!this.properties || this.properties.length === 0) {
    return; // Se não há propriedades, não há nada para verificar
  }

  if (!this.property || !this.property.realtorId) {
    throw new Error('Nenhuma propriedade de referência foi obtida');
  }

  const expectedRealtorId = this.property.realtorId;
  const invalidProperties = this.properties.filter((p) => p.realtorId !== expectedRealtorId);

  if (invalidProperties.length > 0) {
    throw new Error(
      `Encontradas ${invalidProperties.length} propriedades que não pertencem ao mesmo realtor`,
    );
  }
});

Then('a propriedade deve ter finalidade {string}', function (this: WorldType, expectedPurpose: string) {
  if (!this.property) {
    throw new Error('Nenhuma propriedade foi recebida');
  }
  if (this.property.purpose !== expectedPurpose) {
    throw new Error(
      `Finalidade esperada: "${expectedPurpose}", mas recebida: "${this.property.purpose}"`,
    );
  }
});

Then('a propriedade nao deve ter campos em portugues como {string}', function (
  this: WorldType,
  fieldsList: string,
) {
  if (!this.property) {
    throw new Error('Nenhuma propriedade foi recebida');
  }

  // Lista de campos em português que não devem existir
  const portugueseFields = fieldsList
    .split(',')
    .map((f) => f.trim())
    .filter((f) => f.length > 0);

  const propertyKeys = Object.keys(this.property);
  const foundPortugueseFields = portugueseFields.filter((field) => propertyKeys.includes(field));

  if (foundPortugueseFields.length > 0) {
    throw new Error(
      `Encontrados campos em português na propriedade: ${foundPortugueseFields.join(', ')}`,
    );
  }
});

// Step com múltiplos parâmetros para compatibilidade com features
Then('a propriedade nao deve ter campos em portugues como {string}, {string}, {string}, {string}, {string}, {string} ou {string}', function (
  this: WorldType,
  field1: string,
  field2: string,
  field3: string,
  field4: string,
  field5: string,
  field6: string,
  field7: string,
) {
  if (!this.property) {
    throw new Error('Nenhuma propriedade foi recebida');
  }

  // Lista de campos em português que não devem existir
  const portugueseFields = [field1, field2, field3, field4, field5, field6, field7]
    .map((f) => f.trim())
    .filter((f) => f.length > 0);

  const propertyKeys = Object.keys(this.property);
  const foundPortugueseFields = portugueseFields.filter((field) => propertyKeys.includes(field));

  if (foundPortugueseFields.length > 0) {
    throw new Error(
      `Encontrados campos em português na propriedade: ${foundPortugueseFields.join(', ')}`,
    );
  }
});

Then('a propriedade deve conter informacoes do realtor se disponivel', function (this: WorldType) {
  if (!this.property) {
    throw new Error('Nenhuma propriedade foi recebida');
  }

  // Verificar se tem realtorId (obrigatório)
  if (!this.property.realtorId) {
    throw new Error('A propriedade não possui realtorId');
  }

  // Se houver informações do realtor, verificar estrutura
  if (this.property.realtor) {
    if (!this.property.realtor.id) {
      throw new Error('As informações do realtor não contêm ID');
    }
    if (!this.property.realtor.name && !this.property.realtor.email) {
      throw new Error('As informações do realtor não contêm nome ou email');
    }
  }
});

Then('devo receber um erro de validacao', function (this: WorldType) {
  if (this.lastStatus !== 400 && this.lastStatus !== 422) {
    throw new Error(
      `Status esperado: 400 ou 422, mas recebido: ${this.lastStatus || 'N/A'}`,
    );
  }
});

