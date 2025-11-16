import { Injectable, Inject } from '@nestjs/common';
import { IPropertyImageRepository } from '../../domain/interfaces/property-image-repository.interface';
import { IPropertyRepository } from '../../domain/interfaces/property-repository.interface';
import { PropertyImage } from '../../domain/entities/property-image.entity';
import { ILogger } from '../interfaces/logger.interface';
import { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { UserRole } from '../../domain/value-objects/user-role.enum';

@Injectable()
export class ReorderPropertyImagesUseCase {
  constructor(
    @Inject('IPropertyImageRepository')
    private readonly propertyImageRepository: IPropertyImageRepository,
    @Inject('IPropertyRepository')
    private readonly propertyRepository: IPropertyRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(propertyId: string, imageOrders: Array<{ imageId: string; order: number }>, realtorId: string): Promise<PropertyImage[]> {
    const startTime = Date.now();

    this.logger.info('Reordering property images', {
      propertyId,
      imageOrders: imageOrders.length,
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
        throw new Error('Only realtors and administrators can reorder images');
      }

      if (property.realtorId !== realtorId && realtor.role !== UserRole.ADMIN) {
        throw new Error('Only the property owner or administrator can reorder images');
      }

      // Verificar se todas as imagens pertencem à propriedade
      const allImages = await this.propertyImageRepository.findByPropertyId(propertyId);
      const imageIds = allImages.map(img => img.id);
      
      for (const item of imageOrders) {
        if (!imageIds.includes(item.imageId)) {
          throw new Error(`Imagem ${item.imageId} não pertence a esta propriedade`);
        }
      }

      // Atualizar ordem de cada imagem
      const updatedImages: PropertyImage[] = [];
      for (const item of imageOrders) {
        const image = await this.propertyImageRepository.findById(item.imageId);
        if (image) {
          image.updateOrder(item.order);
          const updated = await this.propertyImageRepository.save(image);
          updatedImages.push(updated);
        }
      }

      const duration = Date.now() - startTime;
      this.logger.info('Imagens reordenadas com sucesso', {
        propertyId,
        count: updatedImages.length,
        duration,
      });

      // Retornar todas as imagens ordenadas
      return await this.propertyImageRepository.findByPropertyId(propertyId);
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao reordenar imagens de propriedade', {
        propertyId,
        error: error.message,
        duration,
      });
      throw error;
    }
  }
}

