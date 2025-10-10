#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { bootstrapMcp } from './bootstrap-mcp';
import { openapiToMcpTools } from './converters/openapi-to-mcp';
import { executeHttpTool } from './handlers/http-tool-handler';
import { ToolWithMetadata, HttpToolOptions } from './types/mcp-types';
import { McpAuthMiddleware } from './middleware/auth.middleware';

async function main() {
  console.error('🚀 Iniciando MCP Server (SSE via stdio)...');

  // Obter documento OpenAPI do NestJS
  const { document } = await bootstrapMcp();
  
  // Converter para tools MCP
  const baseUrl = process.env.MCP_BASE_URL || 'http://localhost:3001';
  const tools = openapiToMcpTools(document, baseUrl);
  const authMiddleware = new McpAuthMiddleware();
  const authToken = process.env.MCP_AUTH_TOKEN;
  const requireAuth = !!authToken;

  console.error(`📋 ${tools.length} tools MCP carregados:`);
  for (const tool of tools) {
    console.error(`  - ${tool.name}: ${tool.description}`);
  }
  
  if (requireAuth) {
    console.error(`🔐 Autenticação habilitada (token configurado)`);
  } else {
    console.error(`🔓 Autenticação desabilitada (sem token)`);
  }

  // Criar servidor MCP
  const server = new Server(
    {
      name: 'gwan-events-mcp-sse',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Registrar handler para listar tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    };
  });

  // Registrar handler para executar tools
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    const tool = tools.find(t => t.name === name);
    if (!tool) {
      throw new Error(`Tool '${name}' não encontrado`);
    }

    // Validar autenticação se necessário
    if (requireAuth) {
      const providedToken = args?._authToken || args?.authToken;
      if (!authMiddleware.validateToken(providedToken as string, authToken)) {
        throw new Error('Authentication required. Provide token via _authToken or authToken parameter.');
      }
    }

    const options: HttpToolOptions = {
      baseUrl,
      authToken,
      timeout: 10000,
      requireAuth,
    };

    const result = await executeHttpTool(tool, args || {}, options);

    if (result.success) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result.data, null, 2),
          },
        ],
      };
    } else {
      throw new Error(result.error || 'Erro desconhecido');
    }
  });

  // Criar transport stdio (mesmo que server-stdio.ts mas com nome diferente)
  const transport = new StdioServerTransport();
  
  // Conectar servidor ao transport
  await server.connect(transport);
  
  console.error('✅ MCP Server (SSE via stdio) conectado e pronto!');
}

main().catch((error) => {
  console.error('❌ Erro no MCP Server:', error);
  process.exit(1);
});
