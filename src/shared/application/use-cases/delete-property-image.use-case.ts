import { Injectable, Inject } from '@nestjs/common';
import { IPropertyImageRepository } from '../../domain/interfaces/property-image-repository.interface';
import { IPropertyRepository } from '../../domain/interfaces/property-repository.interface';
import { IStorageService } from '../interfaces/storage-service.interface';
import { ILogger } from '../interfaces/logger.interface';
import { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { UserRole } from '../../domain/value-objects/user-role.enum';

@Injectable()
export class DeletePropertyImageUseCase {
  constructor(
    @Inject('IPropertyImageRepository')
    private readonly propertyImageRepository: IPropertyImageRepository,
    @Inject('IPropertyRepository')
    private readonly propertyRepository: IPropertyRepository,
    @Inject('IStorageService')
    private readonly storageService: IStorageService,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(propertyId: string, imageId: string, realtorId: string): Promise<boolean> {
    const startTime = Date.now();

    this.logger.info('Deleting property image', {
      propertyId,
      imageId,
      realtorId,
    });

    try {
      // Verify property
      const property = await this.propertyRepository.findById(propertyId);
      if (!property) {
        throw new Error('Property not found');
      }

      // Verify permissions
      const realtor = await this.userRepository.findById(realtorId);
      if (!realtor) {
        throw new Error('Realtor not found');
      }

      if (realtor.role !== UserRole.CORRETOR && realtor.role !== UserRole.ADMIN) {
        throw new Error('Only realtors and administrators can delete images');
      }

      if (property.realtorId !== realtorId && realtor.role !== UserRole.ADMIN) {
        throw new Error('Only the property owner or administrator can delete images');
      }

      // Verificar se a imagem existe e pertence à propriedade
      const image = await this.propertyImageRepository.findById(imageId);
      if (!image) {
        throw new Error('Imagem não encontrada');
      }

      if (image.propertyId !== propertyId) {
        throw new Error('Imagem não pertence a esta propriedade');
      }

      // Usar filePath armazenado na entidade, ou extrair da URL como fallback
      const urlPath = image.filePath || image.url.split('/').slice(-2).join('/');
      const thumbnailPath = image.thumbnailPath || image.thumbnailUrl?.split('/').slice(-2).join('/');

      // Deletar arquivos do storage
      await this.storageService.deleteFile(urlPath);
      if (thumbnailPath) {
        await this.storageService.deleteFile(thumbnailPath);
      }

      // Se for capa, limpar coverImageUrl da propriedade
      if (image.isCover) {
        property.coverImageUrl = null;
        await this.propertyRepository.update(propertyId, property);
      }

      // Deletar do banco
      const deleted = await this.propertyImageRepository.delete(imageId);

      const duration = Date.now() - startTime;
      this.logger.info('Imagem deletada com sucesso', {
        imageId,
        propertyId,
        deleted,
        duration,
      });

      return deleted;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao deletar imagem de propriedade', {
        propertyId,
        imageId,
        error: error.message,
        duration,
      });
      throw error;
    }
  }
}

