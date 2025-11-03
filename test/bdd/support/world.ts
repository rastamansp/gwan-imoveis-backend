import { World } from '@cucumber/cucumber';

export interface ChatResponse {
  answer: string;
  toolsUsed?: Array<{
    name: string;
    arguments?: Record<string, unknown>;
  }>;
}

export interface TestContext {
  lastResponse?: ChatResponse;
  lastStatus?: number;
  lastError?: string;
  chatHistory: Array<{
    message: string;
    response?: ChatResponse;
  }>;
}

/**
 * Classe World do Cucumber para compartilhar contexto entre steps
 */
export class TestWorld extends World implements TestContext {
  public lastResponse?: ChatResponse;
  public lastStatus?: number;
  public lastError?: string;
  public chatHistory: Array<{
    message: string;
    response?: ChatResponse;
  }> = [];

  /**
   * Limpar contexto após cada cenário
   */
  public reset(): void {
    this.lastResponse = undefined;
    this.lastStatus = undefined;
    this.lastError = undefined;
    this.chatHistory = [];
  }

  /**
   * Verificar se a resposta contém um texto específico
   */
  public responseContains(text: string): boolean {
    if (!this.lastResponse?.answer) {
      return false;
    }
    return this.lastResponse.answer.toLowerCase().includes(text.toLowerCase());
  }

  /**
   * Verificar se foi usada uma ferramenta específica
   */
  public toolWasUsed(toolName: string): boolean {
    if (!this.lastResponse?.toolsUsed) {
      return false;
    }
    return this.lastResponse.toolsUsed.some((tool) => tool.name === toolName);
  }

  /**
   * Extrair quantidade de itens da resposta (eventos, artistas, etc.)
   */
  public extractItemCount(keyword: string): number {
    if (!this.lastResponse?.answer) {
      return 0;
    }

    // Tentar extrair números associados à keyword
    const regex = new RegExp(`(\\d+)\\s+${keyword}`, 'i');
    const match = this.lastResponse.answer.match(regex);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Verificar se a resposta contém um código específico
   */
  public responseContainsCode(code: string): boolean {
    if (!this.lastResponse?.answer) {
      return false;
    }
    return this.lastResponse.answer.includes(code);
  }

  /**
   * Verificar se a resposta contém um título específico
   */
  public responseContainsTitle(title: string): boolean {
    if (!this.lastResponse?.answer) {
      return false;
    }
    return this.lastResponse.answer.toLowerCase().includes(title.toLowerCase());
  }
}

// O World será registrado via hooks.ts

