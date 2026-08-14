import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { IPropertyRepository } from '../../domain/interfaces/property-repository.interface';
import { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { IStorageService } from '../interfaces/storage-service.interface';
import { ILogger } from '../interfaces/logger.interface';
import { UserRole } from '../../domain/value-objects/user-role.enum';
import { Property } from '../../domain/entities/property.entity';

/**
 * Uma foto equirretangular 360° tem proporção 2:1 (360° na horizontal por 180°
 * na vertical). Tolerância folgada porque encoders variam alguns pixels; o que
 * queremos barrar é a foto comum enviada por engano, que renderizaria como um
 * borrão esticado no visualizador.
 */
const EQUIRECTANGULAR_RATIO = 2;
const RATIO_TOLERANCE = 0.15;

interface UploadPropertyTourInput {
  propertyId: string;
  buffer: Buffer;
  fileName: string;
  requesterId: string;
  /** Dimensões lidas do arquivo pelo controller (via sharp). */
  width?: number;
  height?: number;
}

@Injectable()
export class UploadPropertyTourUseCase {
  constructor(
    @Inject('IPropertyRepository')
    private readonly propertyRepository: IPropertyRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IStorageService')
    private readonly storageService: IStorageService,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(input: UploadPropertyTourInput): Promise<Property> {
    const { propertyId, buffer, fileName, requesterId, width, height } = input;

    const property = await this.assertCanEdit(propertyId, requesterId);

    if (width && height) {
      const ratio = width / height;
      if (Math.abs(ratio - EQUIRECTANGULAR_RATIO) > RATIO_TOLERANCE) {
        throw new BadRequestException(
          `A imagem precisa ser panorâmica equirretangular (proporção 2:1). ` +
            `A enviada tem ${width}x${height} (proporção ${ratio.toFixed(2)}:1).`,
        );
      }
    }

    // A panorâmica sobe sem processamento: redimensionar ou recortar quebraria
    // a projeção e o tour sairia distorcido.
    const filePath = await this.storageService.uploadFile(
      buffer,
      `tour-${fileName}`,
      `properties/${propertyId}/tour`,
    );

    const previousPath = property.tourImagePath;

    property.tourImageUrl = this.storageService.getFileUrl(filePath);
    property.tourImagePath = filePath;

    const updated = await this.propertyRepository.update(propertyId, property);

    // Só remove o anterior depois que o novo já está salvo — se a remoção
    // falhar, sobra um objeto órfão no storage, o que é melhor do que um imóvel
    // apontando para um arquivo que não existe mais.
    if (previousPath) {
      await this.safeDelete(previousPath, propertyId);
    }

    // A galeria do anúncio mudou; o PDF em cache não reflete mais o imóvel.
    await this.propertyRepository.clearAdPdfCache(propertyId);

    this.logger.info('[Properties] Tour virtual enviado', { propertyId, requesterId, filePath });

    return updated;
  }

  async remove(propertyId: string, requesterId: string): Promise<Property> {
    const property = await this.assertCanEdit(propertyId, requesterId);

    if (!property.tourImagePath && !property.tourImageUrl) {
      throw new NotFoundException('Este imóvel não possui tour virtual');
    }

    const pathToDelete = property.tourImagePath;

    property.tourImageUrl = null;
    property.tourImagePath = null;

    const updated = await this.propertyRepository.update(propertyId, property);

    if (pathToDelete) {
      await this.safeDelete(pathToDelete, propertyId);
    }

    await this.propertyRepository.clearAdPdfCache(propertyId);

    this.logger.info('[Properties] Tour virtual removido', { propertyId, requesterId });

    return updated;
  }

  private async assertCanEdit(propertyId: string, requesterId: string): Promise<Property> {
    const property = await this.propertyRepository.findById(propertyId);
    if (!property) {
      throw new NotFoundException('Imóvel não encontrado');
    }

    const requester = await this.userRepository.findById(requesterId);
    if (!requester) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (requester.role !== UserRole.CORRETOR && requester.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Apenas corretores e administradores podem editar imóveis');
    }

    if (property.realtorId !== requesterId && requester.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Apenas o corretor dono do imóvel ou um administrador podem editá-lo');
    }

    return property;
  }

  /** Falha ao apagar o arquivo antigo não pode derrubar a operação inteira. */
  private async safeDelete(filePath: string, propertyId: string): Promise<void> {
    try {
      await this.storageService.deleteFile(filePath);
    } catch (error) {
      this.logger.warn('[Properties] Não foi possível remover o arquivo do tour no storage', {
        propertyId,
        filePath,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
