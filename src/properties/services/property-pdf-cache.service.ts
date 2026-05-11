import { Injectable, Inject } from '@nestjs/common';
import { IPropertyRepository } from '../../shared/domain/interfaces/property-repository.interface';
import { IPropertyImageRepository } from '../../shared/domain/interfaces/property-image-repository.interface';
import { IStorageService } from '../../shared/application/interfaces/storage-service.interface';
import { ILogger } from '../../shared/application/interfaces/logger.interface';
import { Property } from '../../shared/domain/entities/property.entity';
import { PropertyPdfService } from './property-pdf.service';
import { RealtorContactResolverService } from './realtor-contact-resolver.service';

const PDF_CONTENT_TYPE = 'application/pdf';

@Injectable()
export class PropertyPdfCacheService {
  constructor(
    @Inject('IPropertyRepository') private readonly propertyRepository: IPropertyRepository,
    @Inject('IPropertyImageRepository') private readonly imageRepository: IPropertyImageRepository,
    @Inject('IStorageService') private readonly storage: IStorageService,
    @Inject('ILogger') private readonly logger: ILogger,
    private readonly pdfService: PropertyPdfService,
    private readonly realtorContactResolver: RealtorContactResolverService,
  ) {}

  async getOrGenerate(property: Property): Promise<Buffer> {
    if (property.adPdfPath) {
      try {
        return await this.storage.getObject(property.adPdfPath);
      } catch (err) {
        this.logger.warn('PDF: cache miss apesar de adPdfPath registrado, regenerando', {
          propertyId: property.id,
          path: property.adPdfPath,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    return this.generateAndStore(property);
  }

  async deleteCached(property: Property): Promise<void> {
    if (!property.adPdfPath) return;
    try {
      await this.storage.deleteFile(property.adPdfPath);
    } catch (err) {
      this.logger.warn('PDF: falha ao remover cache do MinIO', {
        propertyId: property.id,
        path: property.adPdfPath,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  private async generateAndStore(property: Property): Promise<Buffer> {
    const [images, contact] = await Promise.all([
      this.imageRepository.findByPropertyId(property.id),
      property.realtor
        ? this.realtorContactResolver.resolveWhatsapp(property.realtor)
        : Promise.resolve(null),
    ]);

    const buffer = await this.pdfService.generate(property, images, contact);
    const path = this.buildPath(property.id);

    try {
      await this.storage.putObjectAtPath(path, buffer, PDF_CONTENT_TYPE);
      const url = this.storage.getFileUrl(path);
      property.adPdfPath = path;
      property.adPdfUrl = url;
      property.adPdfGeneratedAt = new Date();
      await this.propertyRepository.save(property);
      this.logger.info('PDF do anúncio gerado e cacheado no MinIO', {
        propertyId: property.id,
        path,
        size: buffer.length,
      });
    } catch (err) {
      this.logger.warn('PDF: falha ao salvar cache no MinIO; PDF será servido apenas em memória', {
        propertyId: property.id,
        path,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    return buffer;
  }

  private buildPath(propertyId: string): string {
    return `properties/${propertyId}/anuncio.pdf`;
  }
}
