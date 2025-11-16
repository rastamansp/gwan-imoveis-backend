export interface IStorageService {
  uploadFile(file: Buffer, fileName: string, folder?: string): Promise<string>;
  deleteFile(filePath: string): Promise<boolean>;
  getFileUrl(filePath: string): string;
  fileExists(filePath: string): Promise<boolean>;
}

