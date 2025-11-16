import { Injectable, Inject } from '@nestjs/common';
import * as sharp from 'sharp';
import { IImageProcessorService, ProcessedImage } from '../../application/interfaces/image-processor-service.interface';
import { ILogger } from '../../application/interfaces/logger.interface';

@Injectable()
export class ImageProcessorService implements IImageProcessorService {
  private readonly MAX_WIDTH = 1920;
  private readonly MAX_HEIGHT = 1080;
  private readonly THUMBNAIL_WIDTH = 400;
  private readonly THUMBNAIL_HEIGHT = 300;
  private readonly QUALITY = 80;

  constructor(
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async processImage(imageBuffer: Buffer, fileName: string): Promise<ProcessedImage> {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      const format = metadata.format || 'jpeg';

      this.logger.info('Processando imagem', {
        fileName,
        originalWidth: metadata.width,
        originalHeight: metadata.height,
        format,
        size: imageBuffer.length,
      });

      // Processar imagem original (redimensionar se necessário)
      const original = await this.resizeImage(
        imageBuffer,
        this.MAX_WIDTH,
        this.MAX_HEIGHT,
        this.QUALITY,
      );

      // Gerar thumbnail
      const thumbnail = await this.generateThumbnail(
        imageBuffer,
        this.THUMBNAIL_WIDTH,
        this.THUMBNAIL_HEIGHT,
        this.QUALITY,
      );

      return {
        original,
        thumbnail,
        originalFormat: format,
      };
    } catch (error) {
      this.logger.error('Erro ao processar imagem', {
        fileName,
        error: error.message,
      });
      throw error;
    }
  }

  async resizeImage(
    imageBuffer: Buffer,
    maxWidth: number,
    maxHeight: number,
    quality: number = this.QUALITY,
  ): Promise<Buffer> {
    try {
      const metadata = await sharp(imageBuffer).metadata();
      const needsResize = metadata.width && metadata.height &&
        (metadata.width > maxWidth || metadata.height > maxHeight);

      if (!needsResize) {
        // Apenas otimizar sem redimensionar
        return await sharp(imageBuffer)
          .jpeg({ quality, mozjpeg: true })
          .toBuffer();
      }

      return await sharp(imageBuffer)
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
    } catch (error) {
      this.logger.error('Erro ao redimensionar imagem', {
        error: error.message,
      });
      throw error;
    }
  }

  async generateThumbnail(
    imageBuffer: Buffer,
    width: number,
    height: number,
    quality: number = this.QUALITY,
  ): Promise<Buffer> {
    try {
      return await sharp(imageBuffer)
        .resize(width, height, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();
    } catch (error) {
      this.logger.error('Erro ao gerar thumbnail', {
        error: error.message,
      });
      throw error;
    }
  }
}

