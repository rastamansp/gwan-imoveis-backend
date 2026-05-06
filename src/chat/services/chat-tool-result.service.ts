import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ChatToolResultService {
  private readonly logger = new Logger(ChatToolResultService.name);
  private readonly maxContentLength = 16000;

  safeJsonParse(s: string): Record<string, unknown> {
    try {
      return JSON.parse(s);
    } catch {
      return {};
    }
  }

  serializeToolResult(result: unknown): string {
    let filteredResult = result;

    if (Array.isArray(filteredResult) && filteredResult.length > 0) {
      try {
        const firstItem = filteredResult[0];
        if (firstItem && typeof firstItem === 'object' && 'coverImageUrl' in firstItem) {
          filteredResult = [...filteredResult].sort((a: any, b: any) => {
            const aHasImage = a?.coverImageUrl ? 1 : 0;
            const bHasImage = b?.coverImageUrl ? 1 : 0;
            return bHasImage - aHasImage;
          });
        }
      } catch (error) {
        this.logger.warn('Erro ao ordenar propriedades por imagem', { error });
      }
    }

    let resultContent = JSON.stringify(filteredResult);
    if (resultContent.length <= this.maxContentLength) return resultContent;

    if (!resultContent.startsWith('[')) {
      return resultContent.substring(0, this.maxContentLength - 20) + '...[truncado]';
    }

    const lastComma = this.findLastCompleteObject(resultContent, this.maxContentLength - 50);
    if (lastComma > 0) {
      const originalLength = resultContent.length;
      const truncated = resultContent.substring(0, lastComma) + ']';
      try {
        const parsed = JSON.parse(truncated);
        if (Array.isArray(parsed)) {
          this.logger.warn(`Resposta truncada de ${originalLength} para ${truncated.length} caracteres`);
          return truncated;
        }
      } catch (parseError) {
        this.logger.warn(
          `Falha ao validar JSON truncado, tentando versão conservadora: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        );
      }

      const conservativeLimit = Math.floor(this.maxContentLength * 0.7);
      const conservativeLastComma = this.findLastCompleteObject(resultContent, conservativeLimit);
      if (conservativeLastComma > 0) {
        const conservativeTruncated = resultContent.substring(0, conservativeLastComma) + ']';
        try {
          const parsed = JSON.parse(conservativeTruncated);
          if (Array.isArray(parsed)) {
            this.logger.warn(`Resposta truncada para versão conservadora: ${conservativeTruncated.length} caracteres`);
            return conservativeTruncated;
          }
        } catch {
          return this.emptyArrayResponse();
        }
      }
      return this.emptyArrayResponse();
    }

    let lastObjectEnd = -1;
    let depth = 0;
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < Math.min(resultContent.length, this.maxContentLength - 10); i++) {
      const char = resultContent[i];
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;

      if (char === '{') depth++;
      if (char === '}') {
        depth--;
        if (depth === 0 && i > 0) lastObjectEnd = i + 1;
      }
      if (char === '[') depth++;
      if (char === ']') depth--;
    }

    if (lastObjectEnd <= 0) return this.emptyArrayResponse();

    let nextCharIndex = lastObjectEnd;
    while (
      nextCharIndex < resultContent.length &&
      (resultContent[nextCharIndex] === ' ' ||
        resultContent[nextCharIndex] === '\n' ||
        resultContent[nextCharIndex] === '\r' ||
        resultContent[nextCharIndex] === '\t')
    ) {
      nextCharIndex++;
    }

    if (nextCharIndex < resultContent.length && resultContent[nextCharIndex] === ',') {
      const truncated = resultContent.substring(0, nextCharIndex) + ']';
      try {
        const parsed = JSON.parse(truncated);
        if (Array.isArray(parsed)) {
          this.logger.warn(`Resposta truncada usando último objeto: ${truncated.length} caracteres`);
          return truncated;
        }
      } catch {
        const fallback = resultContent.substring(0, lastObjectEnd) + ']';
        try {
          JSON.parse(fallback);
          this.logger.warn(`Resposta truncada usando último objeto (sem vírgula): ${fallback.length} caracteres`);
          return fallback;
        } catch {
          return this.emptyArrayResponse();
        }
      }
    }

    const truncated = resultContent.substring(0, lastObjectEnd) + ']';
    try {
      const parsed = JSON.parse(truncated);
      if (Array.isArray(parsed)) {
        this.logger.warn(`Resposta truncada usando último objeto: ${truncated.length} caracteres`);
        return truncated;
      }
      return this.emptyArrayResponse();
    } catch {
      return this.emptyArrayResponse();
    }
  }

  extractRawDataFromToolResults(toolResults: any[]): any {
    if (!toolResults || toolResults.length === 0) return null;

    try {
      const results = toolResults
        .map((m: any) => {
          try {
            const content = m.content;
            if (!content) return null;

            let data: any;
            if (typeof content === 'object') {
              data = content;
            } else if (typeof content === 'string') {
              try {
                data = JSON.parse(content);
              } catch (parseError) {
                this.logger.warn('Erro ao fazer parse do JSON da ferramenta:', {
                  contentLength: content.length,
                  contentPreview: content.substring(0, 200),
                  error: parseError instanceof Error ? parseError.message : String(parseError),
                });
                data = this.tryRecoverTruncatedArrayJson(content);
                if (!data) return null;
              }
            } else {
              return null;
            }

            if (data.error) return null;
            if (Array.isArray(data)) return data;
            if (data.properties) return Array.isArray(data.properties) ? data.properties : [data.properties];
            if (data.data) return Array.isArray(data.data) ? data.data : [data.data];

            if (typeof data === 'object' && !Array.isArray(data)) {
              const keys = Object.keys(data);
              const numericKeys = keys.filter((k) => /^\d+$/.test(k));
              if (numericKeys.length > 0 && numericKeys.length === keys.length) {
                return numericKeys.map((k) => data[k]).filter(Boolean);
              }
            }

            return data;
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      if (results.length > 0) {
        const allArrays = results.every((r) => Array.isArray(r));
        if (allArrays) return results.flat();
        if (results.length === 1) return results[0];
        return results[results.length - 1];
      }
    } catch (error) {
      this.logger.error('Erro ao extrair dados brutos das ferramentas', error as any);
    }

    return null;
  }

  private findLastCompleteObject(str: string, maxLen: number): number {
    let depth = 0;
    let inString = false;
    let escapeNext = false;
    let lastComma = -1;

    for (let i = 0; i < Math.min(str.length, maxLen); i++) {
      const char = str[i];
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;

      if (char === '{') depth++;
      if (char === '}') depth--;
      if (char === '[') depth++;
      if (char === ']') depth--;
      if (char === ',' && depth === 1) lastComma = i;
    }

    return lastComma;
  }

  private findValidArrayEnd(str: string, start: number): number {
    let depth = 0;
    let inString = false;
    let escapeNext = false;

    for (let i = start; i < str.length; i++) {
      const char = str[i];
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;

      if (char === '{') depth++;
      if (char === '}') depth--;
      if (char === '[') depth++;
      if (char === ']') {
        depth--;
        if (depth === 0) return i + 1;
      }
    }

    return -1;
  }

  private tryRecoverTruncatedArrayJson(content: string): any[] | null {
    const arrayStart = content.indexOf('[');
    if (arrayStart === -1) return null;

    const arrayEnd = this.findValidArrayEnd(content, arrayStart);
    if (arrayEnd > arrayStart) {
      const partialJson = content.substring(arrayStart, arrayEnd);
      try {
        const parsed = JSON.parse(partialJson);
        this.logger.debug(`JSON recuperado com sucesso após truncamento: ${partialJson.length} caracteres`);
        return parsed;
      } catch (recoveryError) {
        this.logger.warn(
          `Falha ao recuperar JSON truncado: ${recoveryError instanceof Error ? recoveryError.message : String(recoveryError)}`,
        );
      }
    }

    let lastValidComma = -1;
    let depth = 0;
    let inString = false;
    let escapeNext = false;

    for (let i = arrayStart; i < content.length; i++) {
      const char = content[i];
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (char === '\\') {
        escapeNext = true;
        continue;
      }
      if (char === '"') {
        inString = !inString;
        continue;
      }
      if (inString) continue;

      if (char === '{') depth++;
      if (char === '}') depth--;
      if (char === '[') depth++;
      if (char === ']') depth--;
      if (char === ',' && depth === 1) lastValidComma = i;
    }

    if (lastValidComma <= arrayStart) return null;

    const recoveredJson = content.substring(arrayStart, lastValidComma + 1) + ']';
    try {
      const parsed = JSON.parse(recoveredJson);
      this.logger.debug(`JSON recuperado parcialmente: ${recoveredJson.length} caracteres`);
      return parsed;
    } catch {
      return null;
    }
  }

  private emptyArrayResponse(): string {
    this.logger.warn('Resposta muito grande, retornando array vazio');
    return '[]';
  }
}
