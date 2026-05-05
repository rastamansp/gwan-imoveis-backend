import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client as MinioClient } from 'minio';
import { IStorageService } from '../../application/interfaces/storage-service.interface';
import { ILogger } from '../../application/interfaces/logger.interface';

@Injectable()
export class MinioStorageService implements IStorageService, OnModuleInit {
  private minioClient: MinioClient;
  private bucketName: string;
  private baseUrl: string;

  constructor(
    private readonly configService: ConfigService,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  private isAvailable = false;

  async onModuleInit() {
    const endpoint = this.configService.get<string>('MINIO_ENDPOINT');
    const port = this.configService.get<number>('MINIO_PORT', 443);
    const useSSL = this.configService.get<string>('MINIO_USE_SSL') === 'true';
    const accessKey = this.configService.get<string>('MINIO_ACCESS_KEY');
    const secretKey = this.configService.get<string>('MINIO_SECRET_KEY');
    this.bucketName = this.configService.get<string>('MINIO_BUCKET');

    if (!endpoint || !accessKey || !secretKey || !this.bucketName) {
      this.logger.warn('MinIO desativado — variáveis de ambiente incompletas', {
        endpoint: endpoint ?? '(não definido)',
        bucket: this.bucketName ?? '(não definido)',
        accessKey: accessKey ? '***' : '(não definido)',
        secretKey: secretKey ? '***' : '(não definido)',
      });
      return;
    }

    this.minioClient = new MinioClient({
      endPoint: endpoint,
      port: port,
      useSSL: useSSL,
      accessKey: accessKey,
      secretKey: secretKey,
    });

    const protocol = useSSL ? 'https' : 'http';
    this.baseUrl = `${protocol}://${endpoint}:${port}/${this.bucketName}`;

    try {
      await this.ensureBucketExists();
      this.isAvailable = true;
      this.logger.info('MinIO Storage Service inicializado', { endpoint, port, bucket: this.bucketName, useSSL });
    } catch (error) {
      this.logger.warn('MinIO indisponível — upload de imagens desativado até reconexão', {
        endpoint,
        port,
        error: error.message,
        hint: 'Para uso local, defina MINIO_ENDPOINT=localhost no .env',
      });
    }
  }

  private async ensureBucketExists(): Promise<void> {
    const exists = await this.minioClient.bucketExists(this.bucketName);
    if (!exists) {
      await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
      this.logger.info('Bucket criado', { bucket: this.bucketName });
    }
  }

  private assertAvailable(): void {
    if (!this.isAvailable) {
      throw new Error('Serviço de storage (MinIO) não está disponível. Verifique a conexão e as variáveis de ambiente.');
    }
  }

  async uploadFile(file: Buffer, fileName: string, folder: string = 'properties'): Promise<string> {
    this.assertAvailable();
    try {
      const timestamp = Date.now();
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filePath = `${folder}/${timestamp}-${sanitizedFileName}`;

      await this.minioClient.putObject(this.bucketName, filePath, file, file.length, {
        'Content-Type': this.getContentType(fileName),
      });

      this.logger.info('Arquivo enviado para MinIO', { filePath, bucket: this.bucketName });
      return filePath;
    } catch (error) {
      this.logger.error('Erro ao fazer upload para MinIO', {
        fileName,
        error: error.message,
      });
      throw error;
    }
  }

  async deleteFile(filePath: string): Promise<boolean> {
    this.assertAvailable();
    try {
      await this.minioClient.removeObject(this.bucketName, filePath);
      this.logger.info('Arquivo removido do MinIO', { filePath, bucket: this.bucketName });
      return true;
    } catch (error) {
      this.logger.error('Erro ao remover arquivo do MinIO', {
        filePath,
        error: error.message,
      });
      return false;
    }
  }

  getFileUrl(filePath: string): string {
    return `${this.baseUrl}/${filePath}`;
  }

  async fileExists(filePath: string): Promise<boolean> {
    if (!this.isAvailable) return false;
    try {
      await this.minioClient.statObject(this.bucketName, filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  private getContentType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const contentTypes: { [key: string]: string } = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
    };
    return contentTypes[ext || ''] || 'application/octet-stream';
  }
}

