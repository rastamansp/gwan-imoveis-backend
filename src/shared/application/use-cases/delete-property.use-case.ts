import { Injectable, Inject } from '@nestjs/common';
import { IPropertyRepository } from '../../domain/interfaces/property-repository.interface';
import { ILogger } from '../interfaces/logger.interface';
import { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { UserRole } from '../../domain/value-objects/user-role.enum';

@Injectable()
export class DeletePropertyUseCase {
  constructor(
    @Inject('IPropertyRepository')
    private readonly propertyRepository: IPropertyRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
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
    const isOwner = property.corretorId === userId;

    if (!isAdmin && !isOwner) {
      throw new Error('Você não tem permissão para deletar este imóvel');
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

