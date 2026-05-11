import { Injectable, Inject } from '@nestjs/common';
import { IPropertyRepository } from '../../domain/interfaces/property-repository.interface';
import { ILogger } from '../interfaces/logger.interface';
import { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { IStorageService } from '../interfaces/storage-service.interface';
import { UserRole } from '../../domain/value-objects/user-role.enum';

@Injectable()
export class DeletePropertyUseCase {
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

  async execute(propertyId: string, userId: string): Promise<void> {
    this.logger.info('Deletando imóvel', {
      propertyId,
      userId,
    });

    // Buscar imóvel
    const property = await this.propertyRepository.findById(propertyId);
    if (!property) {
      throw new Error('Imóvel não encontrado');
    }

    // Verificar permissões
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    const isAdmin = user.role === UserRole.ADMIN;
    const isOwner = property.realtorId === userId;

    if (!isAdmin && !isOwner) {
      throw new Error('Você não tem permissão para deletar este imóvel');
    }

    // Best-effort: limpar PDF cacheado no MinIO antes de remover o registro.
    if (property.adPdfPath) {
      try {
        await this.storageService.deleteFile(property.adPdfPath);
      } catch (err) {
        this.logger.warn('Falha ao remover PDF cacheado do MinIO; seguindo com delete da propriedade', {
          propertyId,
          path: property.adPdfPath,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    const deleted = await this.propertyRepository.delete(propertyId);
    if (!deleted) {
      throw new Error('Erro ao deletar imóvel');
    }

    this.logger.info('Imóvel deletado com sucesso', {
      propertyId,
      userId,
    });
  }
}

