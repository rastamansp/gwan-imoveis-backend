export interface IStorageService {
  uploadFile(file: Buffer, fileName: string, folder?: string): Promise<string>;
  /**
   * Faz upload em um caminho determinístico (sem timestamp), sobrescrevendo o conteúdo anterior se existir.
   * Útil para artefatos derivados que precisam de identidade estável (ex: cache de PDF por imóvel).
   */
  putObjectAtPath(filePath: string, buffer: Buffer, contentType: string): Promise<string>;
  /**
   * Baixa o conteúdo binário do objeto. Lança se o objeto não existir.
   */
  getObject(filePath: string): Promise<Buffer>;
  deleteFile(filePath: string): Promise<boolean>;
  getFileUrl(filePath: string): string;
  fileExists(filePath: string): Promise<boolean>;
}

