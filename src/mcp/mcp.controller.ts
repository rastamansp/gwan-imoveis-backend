import { Controller, Get, Post, Body, HttpCode, Inject, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import axios from 'axios';
import { openapiToMcpTools } from './converters/openapi-to-mcp';
import { executeHttpTool } from './handlers/http-tool-handler';
import { ToolWithMetadata } from './types/mcp-types';
import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

class CallToolDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsObject()
  @IsOptional()
  arguments?: Record<string, unknown>;

  @IsString()
  @IsOptional()
  authToken?: string;
}

@ApiTags('MCP')
@Controller('mcp')
export class McpBridgeController {
  private readonly baseUrl: string;
  private readonly requireAuth: boolean;
  private readonly serverAuthToken?: string;

  constructor() {
    this.baseUrl = process.env.MCP_BASE_URL || 'http://localhost:3001';
    this.serverAuthToken = process.env.MCP_AUTH_TOKEN;
    this.requireAuth = !!this.serverAuthToken;
  }

  @Get('tools')
  @ApiOperation({ summary: 'Listar tools MCP disponíveis (bridge HTTP)' })
  @ApiResponse({ status: 200, description: 'Lista de tools retornada' })
  async listTools(): Promise<{ tools: Array<Pick<ToolWithMetadata, 'name' | 'description' | 'inputSchema'>> }>
  {
    const document = await this.fetchOpenApiDocument();
    const tools = openapiToMcpTools(document as any, this.baseUrl);
    return { tools: tools.map(t => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })) };
  }

  @Post('tools/call')
  @HttpCode(200)
  @ApiOperation({ summary: 'Executar um tool MCP por nome (bridge HTTP)' })
  @ApiResponse({ status: 200, description: 'Resultado da execução do tool' })
  async callTool(@Body() body: CallToolDto): Promise<any> {
    // Tools públicas que não requerem autenticação MCP
    const publicTools = ['list_properties', 'get_property_by_id'];
    const isPublicTool = publicTools.includes(body.name);
    
    // Autenticação do servidor MCP (não confundir com JWT do backend)
    // Apenas para tools que não são públicas
    if (this.requireAuth && !isPublicTool) {
      if (!body.authToken || body.authToken !== this.serverAuthToken) {
        throw new UnauthorizedException('Authentication required');
      }
    }

    const document = await this.fetchOpenApiDocument();
    const tools = openapiToMcpTools(document as any, this.baseUrl);
    const tool = tools.find(t => t.name === body.name);
    if (!tool) {
      throw new BadRequestException(`Tool '${body.name}' não encontrado`);
    }

    // Não propagamos authToken como Authorization para o backend por padrão.
    // Se no futuro precisar JWT do backend, poderemos aceitar outro campo separado.
    const result = await executeHttpTool(tool, body.arguments || {}, {
      baseUrl: this.baseUrl,
      timeout: 10000,
      requireAuth: this.requireAuth,
    });

    if (!result.success) {
      throw new BadRequestException(result.error || 'Falha ao executar tool');
    }
    return result.data;
  }

  private async fetchOpenApiDocument(): Promise<unknown> {
    const url = `${this.baseUrl}/api-json`;
    const { data } = await axios.get(url, { timeout: 5000 });
    return data;
  }
}


