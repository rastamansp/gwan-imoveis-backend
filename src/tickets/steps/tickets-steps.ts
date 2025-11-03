import { Given, When, Then } from '@cucumber/cucumber';
import axios, { AxiosInstance } from 'axios';
import { TestWorld } from '../../../test/bdd/support/world';

/**
 * Cliente HTTP para testes de API REST
 */
class RestApiClient {
  private readonly baseUrl: string;
  private readonly client: AxiosInstance;
  private authToken?: string;

  constructor(baseUrl: string = process.env.TEST_BASE_URL || 'http://localhost:3001/api') {
    this.baseUrl = baseUrl;
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  setAuthToken(token: string): void {
    this.authToken = token;
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  async post<T>(url: string, data: any): Promise<{ data: T; status: number }> {
    try {
      const response = await this.client.post<T>(url, data);
      return { data: response.data, status: response.status };
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message ||
            error.message ||
            `Erro ao fazer POST para ${url}`,
        );
      }
      throw error;
    }
  }

  async get<T>(url: string): Promise<{ data: T; status: number }> {
    try {
      const response = await this.client.get<T>(url);
      return { data: response.data, status: response.status };
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message ||
            error.message ||
            `Erro ao fazer GET para ${url}`,
        );
      }
      throw error;
    }
  }

  async put<T>(url: string, data?: any): Promise<{ data: T; status: number }> {
    try {
      const response = await this.client.put<T>(url, data);
      return { data: response.data, status: response.status };
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message ||
            error.message ||
            `Erro ao fazer PUT para ${url}`,
        );
      }
      throw error;
    }
  }
}

// Estender TestWorld para armazenar dados de API REST
interface RestApiWorld extends TestWorld {
  apiClient?: RestApiClient;
  createdEvent?: any;
  createdCategories?: any[];
  createdTickets?: any[];
  ticketToValidate?: any;
  userId?: string;
}

// Helper para obter cliente API com tipagem explícita
function getApiClient(this: RestApiWorld): RestApiClient {
  if (!this.apiClient) {
    this.apiClient = new RestApiClient();
  }
  return this.apiClient as RestApiClient;
}

Given('que a API está disponível', async function (this: RestApiWorld) {
  try {
    // Health endpoint não está em /api, mas na raiz
    const healthUrl = process.env.TEST_BASE_URL 
      ? process.env.TEST_BASE_URL.replace('/api', '/health')
      : 'http://localhost:3001/health';
    
    const response = await axios.get(healthUrl, { timeout: 5000 });
    if (response.status !== 200) {
      throw new Error('API não está respondendo corretamente');
    }
    this.attach('✅ API está disponível', 'text/plain');
  } catch (error) {
    const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3001/api';
    throw new Error(
      `API não está disponível em ${baseUrl}. Certifique-se de que a aplicação está rodando.`,
    );
  }
});

Given('que tenho um token de autenticação válido', async function (this: RestApiWorld) {
  const client = getApiClient.call(this);
  try {
    // Tentar fazer login como admin ou criar um usuário de teste
    interface LoginResponse {
      access_token: string;
      user: any;
    }
    const result = await client.post('/auth/login', {
      email: process.env.TEST_USER_EMAIL || 'admin@gwanshop.com',
      password: process.env.TEST_USER_PASSWORD || 'admin123',
    });
    const { data, status } = result as { data: LoginResponse; status: number };

    if (status === 200 && data.access_token) {
      client.setAuthToken(data.access_token);
      this.userId = data.user?.id || data.user?.sub;
      this.attach('✅ Token de autenticação obtido', 'text/plain');
    } else {
      throw new Error('Não foi possível obter token de autenticação');
    }
  } catch (error: any) {
    this.attach(`⚠️ Erro ao obter token: ${error.message}`, 'text/plain');
    // Em caso de erro, tentar continuar sem token (pode falhar depois)
  }
});

Given(
  'que crio um evento com os seguintes dados:',
  async function (this: RestApiWorld, dataTable: any) {
    const eventData: any = {};
    dataTable.hashes().forEach((row: any) => {
      eventData[row.campo] = row.valor;
    });

    const client = getApiClient.call(this);
    const result = await client.post('/events', eventData);
    const { data, status } = result;

    if (status === 201 || status === 200) {
      this.createdEvent = data;
      this.attach(`Evento criado: ${JSON.stringify(data, null, 2)}`, 'application/json');
    } else {
      throw new Error(`Erro ao criar evento: status ${status}`);
    }
  },
);

Then('o evento deve ser criado com sucesso', function (this: RestApiWorld) {
  if (!this.createdEvent || !this.createdEvent.id) {
    throw new Error('Evento não foi criado ou não possui ID');
  }
  this.attach(`✅ Evento criado com ID: ${this.createdEvent.id}`, 'text/plain');
});

Then('o evento deve ter um ID', function (this: RestApiWorld) {
  if (!this.createdEvent?.id) {
    throw new Error('Evento não possui ID');
  }
});

When(
  'adiciono as seguintes categorias de ingressos ao evento:',
  async function (this: RestApiWorld, dataTable: any) {
    if (!this.createdEvent?.id) {
      throw new Error('Evento não foi criado. Crie um evento primeiro.');
    }

    const categories = dataTable.hashes().map((row: any) => ({
      name: row.name,
      price: parseFloat(row.price),
      quantity: parseInt(row.quantity, 10),
    }));

    const client = getApiClient.call(this);
    const result = await client.post(`/events/${this.createdEvent.id}/categories`, {
      categories,
    });
    const { data, status } = result;

    if (status === 201 || status === 200) {
      this.createdCategories = Array.isArray(data) ? data : data.categories || [];
      this.attach(
        `Categorias criadas: ${JSON.stringify(this.createdCategories, null, 2)}`,
        'application/json',
      );
    } else {
      throw new Error(`Erro ao criar categorias: status ${status}`);
    }
  },
);

Then('as categorias devem ser criadas com sucesso', function (this: RestApiWorld) {
  if (!this.createdCategories || this.createdCategories.length === 0) {
    throw new Error('Nenhuma categoria foi criada');
  }
  this.attach(`✅ ${this.createdCategories.length} categorias criadas`, 'text/plain');
});

When(
  'compro {string} ingressos da categoria {string} para o evento criado',
  async function (this: RestApiWorld, quantity: string, categoryName: string) {
    if (!this.createdEvent?.id) {
      throw new Error('Evento não foi criado.');
    }

    if (!this.createdCategories || this.createdCategories.length === 0) {
      throw new Error('Nenhuma categoria foi criada.');
    }

    const category = this.createdCategories.find((cat: any) => cat.name === categoryName);
    if (!category) {
      throw new Error(`Categoria "${categoryName}" não encontrada`);
    }

    const client = getApiClient.call(this);
    const result = await client.post('/tickets', {
      eventId: this.createdEvent.id,
      categoryId: category.id,
      quantity: parseInt(quantity, 10),
    });
    const { data, status } = result;

    if (status === 201 || status === 200) {
      this.createdTickets = Array.isArray(data) ? data : [];
      this.attach(`Tickets criados: ${JSON.stringify(this.createdTickets, null, 2)}`, 'application/json');
    } else {
      throw new Error(`Erro ao comprar ingressos: status ${status}`);
    }
  },
);

When(
  'compro {string} ingressos da categoria {string} para o evento criado com os seguintes dados do titular:',
  async function (this: RestApiWorld, quantity: string, categoryName: string, dataTable: any) {
    if (!this.createdEvent?.id) {
      throw new Error('Evento não foi criado.');
    }

    if (!this.createdCategories || this.createdCategories.length === 0) {
      throw new Error('Nenhuma categoria foi criada.');
    }

    const category = this.createdCategories.find((cat: any) => cat.name === categoryName);
    if (!category) {
      throw new Error(`Categoria "${categoryName}" não encontrada`);
    }

    const holderData: any = {};
    dataTable.hashes().forEach((row: any) => {
      holderData[row.campo] = row.valor;
    });

    const client = getApiClient.call(this);
    const result = await client.post('/tickets', {
      eventId: this.createdEvent.id,
      categoryId: category.id,
      quantity: parseInt(quantity, 10),
      holderFirstName: holderData.firstName,
      holderLastName: holderData.lastName,
      documentType: holderData.documentType,
      documentNumber: holderData.documentNumber,
    });
    const { data, status } = result;

    if (status === 201 || status === 200) {
      this.createdTickets = Array.isArray(data) ? data : [];
      this.attach(`Tickets criados: ${JSON.stringify(this.createdTickets, null, 2)}`, 'application/json');
    } else {
      throw new Error(`Erro ao comprar ingressos: status ${status}`);
    }
  },
);

Then('a compra deve ser realizada com sucesso', function (this: RestApiWorld) {
  if (!this.createdTickets || this.createdTickets.length === 0) {
    throw new Error('Nenhum ticket foi criado na compra');
  }
  this.attach(`✅ Compra realizada: ${this.createdTickets.length} tickets criados`, 'text/plain');
});

Then('deve retornar {string} tickets', function (this: RestApiWorld, expectedCount: string) {
  const expected = parseInt(expectedCount, 10);
  if (!this.createdTickets || this.createdTickets.length !== expected) {
    throw new Error(
      `Esperado ${expected} tickets, mas recebido ${this.createdTickets?.length || 0}`,
    );
  }
});

Then('os tickets devem ter status {string}', function (this: RestApiWorld, expectedStatus: string) {
  if (!this.createdTickets) {
    throw new Error('Nenhum ticket foi criado');
  }

  const invalidTickets = this.createdTickets.filter(
    (ticket: any) => ticket.status !== expectedStatus,
  );

  if (invalidTickets.length > 0) {
    throw new Error(
      `Alguns tickets não têm status "${expectedStatus}": ${JSON.stringify(invalidTickets)}`,
    );
  }
});

Then('os tickets devem ter QR code', function (this: RestApiWorld) {
  if (!this.createdTickets) {
    throw new Error('Nenhum ticket foi criado');
  }

  const ticketsWithoutQR = this.createdTickets.filter(
    (ticket: any) => !ticket.qrCode || !ticket.qrCodeData,
  );

  if (ticketsWithoutQR.length > 0) {
    throw new Error(`Alguns tickets não têm QR code: ${JSON.stringify(ticketsWithoutQR)}`);
  }
});

Then(
  'os tickets devem ter os dados de identificação:',
  function (this: RestApiWorld, dataTable: any) {
    if (!this.createdTickets) {
      throw new Error('Nenhum ticket foi criado');
    }

    const expectedData: any = {};
    dataTable.hashes().forEach((row: any) => {
      expectedData[row.campo] = row.valor;
    });

    const invalidTickets = this.createdTickets.filter((ticket: any) => {
      return (
        ticket.holderFirstName !== expectedData.holderFirstName ||
        ticket.holderLastName !== expectedData.holderLastName ||
        ticket.documentType !== expectedData.documentType ||
        ticket.documentNumber !== expectedData.documentNumber
      );
    });

    if (invalidTickets.length > 0) {
      throw new Error(
        `Alguns tickets não têm os dados de identificação corretos: ${JSON.stringify(invalidTickets)}`,
      );
    }
  },
);

When('consulto o evento criado', async function (this: RestApiWorld) {
  if (!this.createdEvent?.id) {
    throw new Error('Evento não foi criado.');
  }

  const client = getApiClient.call(this);
  const result = await client.get(`/events/${this.createdEvent.id}`);
  const { data, status } = result;

  if (status === 200) {
    this.createdEvent = data;
    this.attach(`Evento consultado: ${JSON.stringify(data, null, 2)}`, 'application/json');
  } else {
    throw new Error(`Erro ao consultar evento: status ${status}`);
  }
});

Then('o evento deve mostrar que foram vendidos {string} ingressos', function (this: RestApiWorld, expectedSold: string) {
  const expected = parseInt(expectedSold, 10);
  if (!this.createdEvent?.soldTickets || this.createdEvent.soldTickets < expected) {
    throw new Error(
      `Esperado pelo menos ${expected} ingressos vendidos, mas recebido ${this.createdEvent?.soldTickets || 0}`,
    );
  }
});

Then('a categoria {string} deve ter {string} ingressos vendidos', function (this: RestApiWorld, categoryName: string, expectedSold: string) {
  const expected = parseInt(expectedSold, 10);
  // Assumindo que a resposta do evento inclui categorias com soldQuantity
  const category = this.createdEvent?.categories?.find((cat: any) => cat.name === categoryName);
  if (!category || category.soldQuantity < expected) {
    throw new Error(
      `Categoria "${categoryName}" deve ter pelo menos ${expected} ingressos vendidos`,
    );
  }
});

Then('o primeiro ticket deve ter um QR code válido', function (this: RestApiWorld) {
  if (!this.createdTickets || this.createdTickets.length === 0) {
    throw new Error('Nenhum ticket foi criado');
  }

  const firstTicket = this.createdTickets[0];
  if (!firstTicket.qrCodeData) {
    throw new Error('O primeiro ticket não possui QR code válido');
  }

  this.ticketToValidate = firstTicket;
});

When('valido o ticket usando o QR code do primeiro ticket', async function (this: RestApiWorld) {
  if (!this.ticketToValidate?.qrCodeData) {
    throw new Error('Ticket para validação não foi definido');
  }

  const client = getApiClient.call(this);
  const result = await client.post('/tickets/validate', {
    qrCodeData: this.ticketToValidate.qrCodeData,
  });
  const { data, status } = result;

  if (status === 200) {
    this.ticketToValidate = data;
    this.attach(`Ticket validado: ${JSON.stringify(data, null, 2)}`, 'application/json');
  } else {
    throw new Error(`Erro ao validar ticket: status ${status}`);
  }
});

Then('a validação deve ser bem-sucedida', function (this: RestApiWorld) {
  if (!this.ticketToValidate) {
    throw new Error('Ticket não foi validado');
  }
  this.attach('✅ Validação realizada com sucesso', 'text/plain');
});

Then('o ticket deve ser marcado como usado', async function (this: RestApiWorld) {
  if (!this.ticketToValidate?.id) {
    throw new Error('Ticket não possui ID para consulta');
  }

  const client = getApiClient.call(this);
  const result = await client.get(`/tickets/${this.ticketToValidate.id}`);
  const { data, status } = result;

  if (status === 200 && data.status === 'USED') {
    this.ticketToValidate = data;
  } else {
    throw new Error(`Ticket não foi marcado como usado. Status: ${data?.status}`);
  }
});

When('consulto o ticket validado', async function (this: RestApiWorld) {
  if (!this.ticketToValidate?.id) {
    throw new Error('Ticket não possui ID');
  }

  const client = getApiClient.call(this);
  const result = await client.get(`/tickets/${this.ticketToValidate.id}`);
  const { data, status } = result;

  if (status === 200) {
    this.ticketToValidate = data;
  } else {
    throw new Error(`Erro ao consultar ticket: status ${status}`);
  }
});

Then('o status do ticket deve ser {string}', function (this: RestApiWorld, expectedStatus: string) {
  if (!this.ticketToValidate || this.ticketToValidate.status !== expectedStatus) {
    throw new Error(
      `Esperado status "${expectedStatus}", mas recebido "${this.ticketToValidate?.status}"`,
    );
  }
});

Then('o ticket deve ter uma data de uso registrada', function (this: RestApiWorld) {
  if (!this.ticketToValidate?.usedDate && !this.ticketToValidate?.usedAt) {
    throw new Error('Ticket não possui data de uso registrada');
  }
});

When('consulto os tickets do usuário', async function (this: RestApiWorld) {
  if (!this.userId) {
    throw new Error('User ID não está disponível');
  }

  const client = getApiClient.call(this);
  const result = await client.get(`/tickets/user/${this.userId}`);
  const { data, status } = result;

  if (status === 200) {
    this.createdTickets = Array.isArray(data) ? data : [];
    this.attach(`Tickets do usuário: ${JSON.stringify(this.createdTickets, null, 2)}`, 'application/json');
  } else {
    throw new Error(`Erro ao consultar tickets: status ${status}`);
  }
});

Then('deve retornar pelo menos {string} tickets', function (this: RestApiWorld, minCount: string) {
  const min = parseInt(minCount, 10);
  if (!this.createdTickets || this.createdTickets.length < min) {
    throw new Error(
      `Esperado pelo menos ${min} tickets, mas recebido ${this.createdTickets?.length || 0}`,
    );
  }
});

Then('os tickets retornados devem ter os dados de identificação corretos', function (this: RestApiWorld) {
  if (!this.createdTickets) {
    throw new Error('Nenhum ticket foi retornado');
  }

  const ticketsWithData = this.createdTickets.filter(
    (ticket: any) =>
      ticket.holderFirstName && ticket.holderLastName && ticket.documentType && ticket.documentNumber,
  );

  if (ticketsWithData.length === 0) {
    throw new Error('Nenhum ticket retornado possui dados de identificação');
  }
});

When('consulto os tickets do evento criado', async function (this: RestApiWorld) {
  if (!this.createdEvent?.id) {
    throw new Error('Evento não foi criado.');
  }

  const client = getApiClient.call(this);
  const result = await client.get(`/tickets/event/${this.createdEvent.id}`);
  const { data, status } = result;

  if (status === 200) {
    this.createdTickets = Array.isArray(data) ? data : [];
    this.attach(`Tickets do evento: ${JSON.stringify(this.createdTickets, null, 2)}`, 'application/json');
  } else {
    throw new Error(`Erro ao consultar tickets do evento: status ${status}`);
  }
});

Then('todos os tickets devem estar vinculados ao evento criado', function (this: RestApiWorld) {
  if (!this.createdTickets || this.createdTickets.length === 0) {
    throw new Error('Nenhum ticket foi retornado');
  }

  if (!this.createdEvent?.id) {
    throw new Error('Evento não foi criado');
  }

  const invalidTickets = this.createdTickets.filter(
    (ticket: any) => ticket.eventId !== this.createdEvent.id,
  );

  if (invalidTickets.length > 0) {
    throw new Error(
      `Alguns tickets não estão vinculados ao evento criado: ${JSON.stringify(invalidTickets)}`,
    );
  }
});

Then('todos os tickets devem ter a categoria {string}', function (this: RestApiWorld, categoryName: string) {
  if (!this.createdTickets || this.createdTickets.length === 0) {
    throw new Error('Nenhum ticket foi retornado');
  }

  const category = this.createdCategories?.find((cat: any) => cat.name === categoryName);
  if (!category) {
    throw new Error(`Categoria "${categoryName}" não encontrada`);
  }

  const invalidTickets = this.createdTickets.filter(
    (ticket: any) => ticket.categoryId !== category.id && ticket.categoryName !== categoryName,
  );

  if (invalidTickets.length > 0) {
    throw new Error(
      `Alguns tickets não têm a categoria "${categoryName}": ${JSON.stringify(invalidTickets)}`,
    );
  }
});

