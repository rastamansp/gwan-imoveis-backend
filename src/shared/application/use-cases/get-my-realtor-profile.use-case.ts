import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IRealtorProfileRepository } from '../../domain/interfaces/realtor-profile-repository.interface';
import { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { UserRole } from '../../domain/value-objects/user-role.enum';
import { RealtorProfile } from '../../domain/entities/realtor-profile.entity';
import { ILogger } from '../interfaces/logger.interface';

@Injectable()
export class GetMyRealtorProfileUseCase {
  constructor(
    @Inject('IRealtorProfileRepository')
    private readonly profileRepository: IRealtorProfileRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(userId: string): Promise<RealtorProfile> {
    this.logger.debug('Buscando perfil do corretor', { userId });

    // Verificar se o usuário existe e é CORRETOR
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (user.role !== UserRole.CORRETOR && user.role !== UserRole.ADMIN) {
      throw new Error('Apenas corretores podem acessar este perfil');
    }

    // Buscar perfil
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Perfil do corretor não encontrado');
    }

    return profile;
  }
}

