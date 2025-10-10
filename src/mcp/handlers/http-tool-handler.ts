import { request } from 'undici';
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

    // Fazer a requisição
    const response = await request(url, {
      method: tool.httpMethod,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const responseBody = await response.body.text();
    let data: any;

    try {
      data = JSON.parse(responseBody);
    } catch {
      data = responseBody;
    }

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return {
        success: true,
        data,
        statusCode: response.statusCode,
      };
    } else {
      return {
        success: false,
        error: `HTTP ${response.statusCode}: ${data.message || data}`,
        statusCode: response.statusCode,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Erro desconhecido na requisição HTTP',
    };
  }
}
