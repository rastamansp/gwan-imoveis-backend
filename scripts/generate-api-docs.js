#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const axios = require('axios');

/**
 * Gerador de documentação de APIs baseado no Swagger/OpenAPI
 */

class ApiDocsGenerator {
  constructor() {
    this.baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
    this.docsPath = path.join(__dirname, '../docs');
    this.outputPath = path.join(__dirname, '../docs/generated');
  }

  /**
   * Executa o gerador de documentação de APIs
   */
  async generate() {
    console.log('📡 Gerando documentação de APIs...');
    
    try {
      // Buscar documentação OpenAPI
      const openApiSpec = await this.fetchOpenApiSpec();
      
      // Gerar documentação por módulo
      await this.generateModuleDocs(openApiSpec);
      
      // Gerar documentação completa
      await this.generateCompleteDocs(openApiSpec);
      
      // Gerar exemplos de uso
      await this.generateUsageExamples(openApiSpec);
      
      console.log('✅ Documentação de APIs gerada com sucesso!');
      
    } catch (error) {
      console.error('❌ Erro ao gerar documentação de APIs:', error.message);
      process.exit(1);
    }
  }

  /**
   * Busca a especificação OpenAPI
   */
  async fetchOpenApiSpec() {
    try {
      const response = await axios.get(`${this.baseUrl}/api-json`);
      return response.data;
    } catch (error) {
      console.warn('⚠️  Não foi possível buscar OpenAPI spec, usando dados mockados');
      return this.getMockOpenApiSpec();
    }
  }

  /**
   * Especificação OpenAPI mockada para desenvolvimento
   */
  getMockOpenApiSpec() {
    return {
      info: {
        title: 'Gwan Events API',
        version: '1.0.0',
        description: 'API para plataforma de eventos e venda de ingressos'
      },
      paths: {
        '/api/events': {
          get: {
            summary: 'Listar eventos',
            description: 'Lista todos os eventos disponíveis',
            parameters: [
              {
                name: 'category',
                in: 'query',
                required: false,
                schema: { type: 'string' }
              },
              {
                name: 'city',
                in: 'query',
                required: false,
                schema: { type: 'string' }
              }
            ],
            responses: {
              '200': {
                description: 'Lista de eventos',
                content: {
                  'application/json': {
                    schema: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Event' }
                    }
                  }
                }
              }
            }
          },
          post: {
            summary: 'Criar evento',
            description: 'Cria um novo evento',
            requestBody: {
              required: true,
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/CreateEventDto' }
                }
              }
            },
            responses: {
              '201': {
                description: 'Evento criado',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/Event' }
                  }
                }
              }
            }
          }
        },
        '/api/events/{id}': {
          get: {
            summary: 'Obter evento por ID',
            description: 'Obtém detalhes de um evento específico',
            parameters: [
              {
                name: 'id',
                in: 'path',
                required: true,
                schema: { type: 'string' }
              }
            ],
            responses: {
              '200': {
                description: 'Detalhes do evento',
                content: {
                  'application/json': {
                    schema: { $ref: '#/components/schemas/Event' }
                  }
                }
              }
            }
          }
        }
      },
      components: {
        schemas: {
          Event: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              date: { type: 'string', format: 'date-time' },
              location: { type: 'string' },
              city: { type: 'string' },
              state: { type: 'string' },
              category: { type: 'string' },
              status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'SOLD_OUT'] },
              maxCapacity: { type: 'integer' },
              soldTickets: { type: 'integer' }
            }
          },
          CreateEventDto: {
            type: 'object',
            required: ['title', 'description', 'date', 'location'],
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              date: { type: 'string', format: 'date-time' },
              location: { type: 'string' },
              city: { type: 'string' },
              state: { type: 'string' },
              category: { type: 'string' },
              maxCapacity: { type: 'integer' }
            }
          }
        }
      }
    };
  }

  /**
   * Gera documentação por módulo
   */
  async generateModuleDocs(openApiSpec) {
    const modules = this.groupEndpointsByModule(openApiSpec);
    
    for (const [moduleName, endpoints] of Object.entries(modules)) {
      const content = this.generateModuleMarkdown(moduleName, endpoints, openApiSpec);
      const outputFile = path.join(this.outputPath, `api-${moduleName}.md`);
      fs.writeFileSync(outputFile, content);
      console.log(`✅ Documentação do módulo ${moduleName} salva`);
    }
  }

  /**
   * Agrupa endpoints por módulo
   */
  groupEndpointsByModule(openApiSpec) {
    const modules = {};
    
    for (const [path, pathItem] of Object.entries(openApiSpec.paths)) {
      // Extrair módulo do path
      const pathParts = path.split('/');
      const moduleName = pathParts[2] || 'general'; // /api/{module}/...
      
      if (!modules[moduleName]) {
        modules[moduleName] = [];
      }
      
      for (const [method, operation] of Object.entries(pathItem)) {
        if (typeof operation === 'object' && operation.summary) {
          modules[moduleName].push({
            path,
            method: method.toUpperCase(),
            operation
          });
        }
      }
    }
    
    return modules;
  }

  /**
   * Gera Markdown para um módulo
   */
  generateModuleMarkdown(moduleName, endpoints, openApiSpec) {
    const title = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
    
    let content = `# API ${title}\n\n`;
    content += `Documentação automática dos endpoints do módulo ${moduleName}.\n\n`;
    content += `**Gerado em:** ${new Date().toISOString()}\n\n`;
    content += `## Endpoints\n\n`;
    
    for (const endpoint of endpoints) {
      content += `### ${endpoint.method} ${endpoint.path}\n\n`;
      content += `**${endpoint.operation.summary}**\n\n`;
      
      if (endpoint.operation.description) {
        content += `${endpoint.operation.description}\n\n`;
      }
      
      // Parâmetros
      if (endpoint.operation.parameters && endpoint.operation.parameters.length > 0) {
        content += `**Parâmetros:**\n\n`;
        for (const param of endpoint.operation.parameters) {
          content += `- \`${param.name}\` (${param.in})`;
          if (param.required) content += ' - **Obrigatório**';
          if (param.schema) content += ` - ${param.schema.type}`;
          content += '\n';
        }
        content += '\n';
      }
      
      // Request Body
      if (endpoint.operation.requestBody) {
        content += `**Request Body:**\n\n`;
        content += `\`\`\`json\n`;
        content += this.generateExampleBody(endpoint.operation.requestBody, openApiSpec);
        content += `\n\`\`\`\n\n`;
      }
      
      // Respostas
      if (endpoint.operation.responses) {
        content += `**Respostas:**\n\n`;
        for (const [statusCode, response] of Object.entries(endpoint.operation.responses)) {
          content += `- \`${statusCode}\` - ${response.description}\n`;
        }
        content += '\n';
      }
      
      // Exemplo de uso
      content += `**Exemplo de uso:**\n\n`;
      content += `\`\`\`bash\n`;
      content += this.generateCurlExample(endpoint);
      content += `\n\`\`\`\n\n`;
      
      content += '---\n\n';
    }
    
    return content;
  }

  /**
   * Gera exemplo de body JSON
   */
  generateExampleBody(requestBody, openApiSpec) {
    if (requestBody.content && requestBody.content['application/json']) {
      const schema = requestBody.content['application/json'].schema;
      return this.generateExampleFromSchema(schema, openApiSpec);
    }
    return '{}';
  }

  /**
   * Gera exemplo a partir de schema
   */
  generateExampleFromSchema(schema, openApiSpec) {
    if (schema.$ref) {
      const refName = schema.$ref.split('/').pop();
      const refSchema = openApiSpec.components.schemas[refName];
      if (refSchema) {
        return this.generateExampleFromSchema(refSchema, openApiSpec);
      }
    }
    
    if (schema.type === 'object' && schema.properties) {
      const example = {};
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        example[propName] = this.generateExampleValue(propSchema);
      }
      return JSON.stringify(example, null, 2);
    }
    
    return '{}';
  }

  /**
   * Gera valor de exemplo para propriedade
   */
  generateExampleValue(schema) {
    switch (schema.type) {
      case 'string':
        if (schema.format === 'date-time') return '2024-06-15T20:00:00.000Z';
        if (schema.enum) return schema.enum[0];
        return 'string';
      case 'integer':
        return 1;
      case 'number':
        return 1.0;
      case 'boolean':
        return true;
      case 'array':
        return [];
      case 'object':
        return {};
      default:
        return null;
    }
  }

  /**
   * Gera exemplo de curl
   */
  generateCurlExample(endpoint) {
    const url = `${this.baseUrl}${endpoint.path}`;
    let curl = `curl -X ${endpoint.method} "${url}"`;
    
    if (endpoint.method === 'POST' || endpoint.method === 'PUT' || endpoint.method === 'PATCH') {
      curl += ` \\\n  -H "Content-Type: application/json" \\\n  -d '{}'`;
    }
    
    return curl;
  }

  /**
   * Gera documentação completa
   */
  async generateCompleteDocs(openApiSpec) {
    const content = this.generateCompleteMarkdown(openApiSpec);
    const outputFile = path.join(this.outputPath, 'api-complete.md');
    fs.writeFileSync(outputFile, content);
    console.log('✅ Documentação completa salva');
  }

  /**
   * Gera Markdown completo
   */
  generateCompleteMarkdown(openApiSpec) {
    let content = `# Documentação Completa da API\n\n`;
    content += `**${openApiSpec.info.title}** - ${openApiSpec.info.description}\n\n`;
    content += `**Versão:** ${openApiSpec.info.version}\n\n`;
    content += `**Gerado em:** ${new Date().toISOString()}\n\n`;
    
    // Estatísticas
    const totalEndpoints = Object.values(openApiSpec.paths).reduce((acc, pathItem) => {
      return acc + Object.keys(pathItem).filter(key => 
        typeof pathItem[key] === 'object' && pathItem[key].summary
      ).length;
    }, 0);
    
    content += `## Estatísticas\n\n`;
    content += `- **Total de endpoints:** ${totalEndpoints}\n`;
    content += `- **Total de paths:** ${Object.keys(openApiSpec.paths).length}\n`;
    content += `- **Schemas definidos:** ${Object.keys(openApiSpec.components?.schemas || {}).length}\n\n`;
    
    // Lista de endpoints
    content += `## Lista de Endpoints\n\n`;
    
    for (const [path, pathItem] of Object.entries(openApiSpec.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (typeof operation === 'object' && operation.summary) {
          content += `- **${method.toUpperCase()}** \`${path}\` - ${operation.summary}\n`;
        }
      }
    }
    
    content += '\n';
    
    // Schemas
    if (openApiSpec.components?.schemas) {
      content += `## Schemas\n\n`;
      
      for (const [schemaName, schema] of Object.entries(openApiSpec.components.schemas)) {
        content += `### ${schemaName}\n\n`;
        content += `\`\`\`json\n`;
        content += JSON.stringify(schema, null, 2);
        content += `\n\`\`\`\n\n`;
      }
    }
    
    return content;
  }

  /**
   * Gera exemplos de uso
   */
  async generateUsageExamples(openApiSpec) {
    const content = this.generateUsageMarkdown(openApiSpec);
    const outputFile = path.join(this.outputPath, 'api-examples.md');
    fs.writeFileSync(outputFile, content);
    console.log('✅ Exemplos de uso salvos');
  }

  /**
   * Gera Markdown de exemplos
   */
  generateUsageMarkdown(openApiSpec) {
    let content = `# Exemplos de Uso da API\n\n`;
    content += `Exemplos práticos de como usar a API.\n\n`;
    content += `**Gerado em:** ${new Date().toISOString()}\n\n`;
    
    // Exemplos por módulo
    const modules = this.groupEndpointsByModule(openApiSpec);
    
    for (const [moduleName, endpoints] of Object.entries(modules)) {
      const title = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
      content += `## ${title}\n\n`;
      
      for (const endpoint of endpoints.slice(0, 3)) { // Limitar a 3 exemplos por módulo
        content += `### ${endpoint.operation.summary}\n\n`;
        content += `\`\`\`bash\n`;
        content += this.generateCurlExample(endpoint);
        content += `\n\`\`\`\n\n`;
        
        if (endpoint.operation.requestBody) {
          content += `**Request Body:**\n\n`;
          content += `\`\`\`json\n`;
          content += this.generateExampleBody(endpoint.operation.requestBody, openApiSpec);
          content += `\n\`\`\`\n\n`;
        }
      }
    }
    
    return content;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const generator = new ApiDocsGenerator();
  generator.generate().catch(console.error);
}

module.exports = ApiDocsGenerator;
