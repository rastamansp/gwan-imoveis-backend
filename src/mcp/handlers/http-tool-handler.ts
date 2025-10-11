import axios from 'axios';
import { ToolWithMetadata, HttpToolOptions, HttpToolResult } from '../types/mcp-types';
import { McpAuthMiddleware } from '../middleware/auth.middleware';

export async function executeHttpTool(
  tool: ToolWithMetadata,
  args: any,
  options: HttpToolOptions
): Promise<HttpToolResult> {
  const authMiddleware = new McpAuthMiddleware();
  
  try {
    // Validar autenticação se token for fornecido
    if (options.authToken) {
      const providedToken = args._authToken || args.authToken;
      if (!authMiddleware.validateToken(providedToken, options.authToken)) {
        return {
          success: false,
          error: 'Invalid authentication token',
          statusCode: 401,
        };
      }
    }
    // Construir URL
    let url = `${options.baseUrl}${tool.httpPath}`;
    
    // Substituir path parameters
    for (const [key, value] of Object.entries(args)) {
      if (tool.httpPath.includes(`{${key}}`)) {
        url = url.replace(`{${key}}`, String(value));
      }
    }

    // Preparar headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'MCP-Server/1.0',
    };

    // Adicionar token de autenticação se fornecido
    if (options.authToken) {
      headers['Authorization'] = `Bearer ${options.authToken}`;
    }

    // Preparar query parameters
    const queryParams = new URLSearchParams();
    let body: any = undefined;

    // Separar query params do body (ignorar campos de autenticação)
    for (const [key, value] of Object.entries(args)) {
      // Ignorar campos de autenticação
      if (key === '_authToken' || key === 'authToken') {
        continue;
      }
      
      if (!tool.httpPath.includes(`{${key}}`)) {
        if (tool.httpMethod === 'GET') {
          // Para GET, tudo vai como query param
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        } else {
          // Para outros métodos, vai no body
          if (body === undefined) {
            body = {};
          }
          body[key] = value;
        }
      }
    }

    // Adicionar query params à URL
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }

    // Fazer a requisição com axios
    const response = await axios({
      method: tool.httpMethod.toLowerCase(),
      url,
      headers,
      data: body,
      timeout: options.timeout || 10000,
    });

    return {
      success: true,
      data: response.data,
      statusCode: response.status,
    };
  } catch (error: any) {
    if (error.response) {
      // Erro de resposta HTTP
      return {
        success: false,
        error: `HTTP ${error.response.status}: ${error.response.data?.message || error.response.statusText}`,
        statusCode: error.response.status,
      };
    } else if (error.request) {
      // Erro de rede
      return {
        success: false,
        error: 'Erro de rede - servidor não respondeu',
      };
    } else {
      // Outros erros
      return {
        success: false,
        error: error.message || 'Erro desconhecido na requisição HTTP',
      };
    }
  }
}
