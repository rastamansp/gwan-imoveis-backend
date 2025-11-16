import { Injectable, Inject } from '@nestjs/common';
import { IPropertyImageRepository } from '../../domain/interfaces/property-image-repository.interface';
import { IPropertyRepository } from '../../domain/interfaces/property-repository.interface';
import { PropertyImage } from '../../domain/entities/property-image.entity';
import { IStorageService } from '../interfaces/storage-service.interface';
import { IImageProcessorService } from '../interfaces/image-processor-service.interface';
import { ILogger } from '../interfaces/logger.interface';
import { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { UserRole } from '../../domain/value-objects/user-role.enum';

@Injectable()
export class CreatePropertyImageUseCase {
  private readonly MAX_IMAGES_PER_PROPERTY = 10;

  constructor(
    @Inject('IPropertyImageRepository')
    private readonly propertyImageRepository: IPropertyImageRepository,
    @Inject('IPropertyRepository')
    private readonly propertyRepository: IPropertyRepository,
    @Inject('IStorageService')
    private readonly storageService: IStorageService,
    @Inject('IImageProcessorService')
    private readonly imageProcessorService: IImageProcessorService,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(
    propertyId: string,
    imageBuffer: Buffer,
    fileName: string,
    corretorId: string,
    isCover: boolean = false,
  ): Promise<PropertyImage> {
    const startTime = Date.now();

    this.logger.info('Criando nova imagem de propriedade', {
      propertyId,
      fileName,
      corretorId,
      isCover,
    });

    try {
      // Verificar se a propriedade existe e pertence ao corretor
      const property = await this.propertyRepository.findById(propertyId);
      if (!property) {
        throw new Error('Propriedade não encontrada');
      }

      // Verificar permissões
      const corretor = await this.userRepository.findById(corretorId);
      if (!corretor) {
        throw new Error('Corretor não encontrado');
      }

      if (corretor.role !== UserRole.CORRETOR && corretor.role !== UserRole.ADMIN) {
        throw new Error('Apenas corretores e administradores podem adicionar imagens');
      }

      if (property.corretorId !== corretorId && corretor.role !== UserRole.ADMIN) {
        throw new Error('Apenas o dono da propriedade ou administrador podem adicionar imagens');
      }

      // Verificar limite de imagens
      const imageCount = await this.propertyImageRepository.countByPropertyId(propertyId);
      if (imageCount >= this.MAX_IMAGES_PER_PROPERTY) {
        throw new Error(`Limite de ${this.MAX_IMAGES_PER_PROPERTY} imagens por propriedade atingido`);
      }

      // Processar imagem
      const processed = await this.imageProcessorService.processImage(imageBuffer, fileName);

      // Upload da imagem original
      const originalFileName = `original-${fileName}`;
      const originalPath = await this.storageService.uploadFile(
        processed.original,
        originalFileName,
        `properties/${propertyId}`,
      );

      // Upload do thumbnail
      const thumbnailFileName = `thumb-${fileName}`;
      const thumbnailPath = await this.storageService.uploadFile(
        processed.thumbnail,
        thumbnailFileName,
        `properties/${propertyId}`,
      );

      // Se for capa, remover capa anterior
      if (isCover) {
        const existingCover = await this.propertyImageRepository.findCoverByPropertyId(propertyId);
        if (existingCover) {
          existingCover.removeAsCover();
          await this.propertyImageRepository.save(existingCover);
        }
      }

      // Criar entidade PropertyImage
      const propertyImage = new PropertyImage();
      propertyImage.propertyId = propertyId;
      propertyImage.url = this.storageService.getFileUrl(originalPath);
      propertyImage.thumbnailUrl = this.storageService.getFileUrl(thumbnailPath);
      propertyImage.filePath = originalPath; // Armazenar caminho relativo para facilitar deleção
      propertyImage.thumbnailPath = thumbnailPath; // Armazenar caminho relativo para facilitar deleção
      propertyImage.isCover = isCover;
      propertyImage.order = imageCount; // Ordem baseada no número de imagens existentes

      const savedImage = await this.propertyImageRepository.save(propertyImage);

      // Atualizar coverImageUrl na propriedade se for capa
      if (isCover) {
        property.coverImageUrl = savedImage.url;
        await this.propertyRepository.update(propertyId, property);
      }

      const duration = Date.now() - startTime;
      this.logger.info('Imagem de propriedade criada com sucesso', {
        imageId: savedImage.id,
        propertyId,
        isCover,
        duration,
      });

      return savedImage;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao criar imagem de propriedade', {
        propertyId,
        fileName,
        error: error.message,
        duration,
      });
      throw error;
    }
  }
}

