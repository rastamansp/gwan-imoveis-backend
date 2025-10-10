import { Injectable } from '@nestjs/common';

export interface McpAuthOptions {
  authToken?: string;
  requireAuth: boolean;
}

@Injectable()
export class McpAuthMiddleware {
  /**
   * Valida se o token de autenticação está correto
   */
  public validateToken(token?: string, expectedToken?: string): boolean {
    // Se não há token esperado, não requer autenticação
    if (!expectedToken) {
      return true;
    }

    // Se há token esperado mas não foi fornecido, falha
    if (!token) {
      return false;
    }

    // Compara tokens de forma segura
    return this.secureCompare(token, expectedToken);
  }

  /**
   * Comparação segura de strings para evitar timing attacks
   */
  private secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Extrai token do header Authorization
   */
  public extractTokenFromHeader(authHeader?: string): string | undefined {
    if (!authHeader) {
      return undefined;
    }

    // Suporta "Bearer token" e "token" direto
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return authHeader;
  }

  /**
   * Gera erro de autenticação padronizado
   */
  public createAuthError(): Error {
    const error = new Error('Authentication required');
    error.name = 'McpAuthError';
    return error;
  }
}
