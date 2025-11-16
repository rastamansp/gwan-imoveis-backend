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

  async onModuleInit() {
    const endpoint = this.configService.get<string>('MINIO_ENDPOINT');
    const port = this.configService.get<number>('MINIO_PORT', 443);
    const useSSL = this.configService.get<string>('MINIO_USE_SSL') === 'true';
    const accessKey = this.configService.get<string>('MINIO_ACCESS_KEY');
    const secretKey = this.configService.get<string>('MINIO_SECRET_KEY');
    this.bucketName = this.configService.get<string>('MINIO_BUCKET');

    // Validar variáveis obrigatórias
    if (!endpoint) {
      const error = new Error('MINIO_ENDPOINT não configurado. Verifique as variáveis de ambiente.');
      this.logger.error('Erro ao inicializar MinIO', {
        endpoint,
        port,
        accessKey: accessKey ? '***' : undefined,
        secretKey: secretKey ? '***' : undefined,
        bucket: this.bucketName,
        error: error.message,
      });
      throw error;
    }

    if (!accessKey || !secretKey) {
      const error = new Error('MINIO_ACCESS_KEY ou MINIO_SECRET_KEY não configurados. Verifique as variáveis de ambiente.');
      this.logger.error('Erro ao inicializar MinIO', {
        endpoint,
        port,
        accessKey: accessKey ? '***' : undefined,
        secretKey: secretKey ? '***' : undefined,
        bucket: this.bucketName,
        error: error.message,
      });
      throw error;
    }

    if (!this.bucketName) {
      const error = new Error('MINIO_BUCKET não configurado. Verifique as variáveis de ambiente.');
      this.logger.error('Erro ao inicializar MinIO', {
        endpoint,
        port,
        bucket: this.bucketName,
        error: error.message,
      });
      throw error;
    }

    this.logger.info('Inicializando MinIO Client', {
      endpoint,
      port,
      useSSL,
      bucket: this.bucketName,
      accessKeyConfigured: !!accessKey,
      secretKeyConfigured: !!secretKey,
    });

    this.minioClient = new MinioClient({
      endPoint: endpoint,
      port: port,
      useSSL: useSSL,
      accessKey: accessKey,
      secretKey: secretKey,
    });

    // Construir base URL
    const protocol = useSSL ? 'https' : 'http';
    this.baseUrl = `${protocol}://${endpoint}:${port}/${this.bucketName}`;

    // Garantir que o bucket existe
    await this.ensureBucketExists();

    this.logger.info('MinIO Storage Service inicializado', {
      endpoint,
      port,
      bucket: this.bucketName,
      useSSL,
    });
  }

  private async ensureBucketExists(): Promise<void> {
    try {
      const exists = await this.minioClient.bucketExists(this.bucketName);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucketName, 'us-east-1');
        this.logger.info('Bucket criado', { bucket: this.bucketName });
      }
    } catch (error) {
      this.logger.error('Erro ao verificar/criar bucket', {
        bucket: this.bucketName,
        error: error.message,
      });
      throw error;
    }
  }

  async uploadFile(file: Buffer, fileName: string, folder: string = 'properties'): Promise<string> {
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

