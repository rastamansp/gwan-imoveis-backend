import { Injectable, Inject } from '@nestjs/common';
import { IRealtorProfileRepository } from '../../domain/interfaces/realtor-profile-repository.interface';
import { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { UserRole } from '../../domain/value-objects/user-role.enum';
import { RealtorProfile } from '../../domain/entities/realtor-profile.entity';
import { UpdateRealtorProfileDto } from '../../../realtors/presentation/dtos/update-realtor-profile.dto';
import { ILogger } from '../interfaces/logger.interface';

@Injectable()
export class UpdateMyRealtorProfileUseCase {
  constructor(
    @Inject('IRealtorProfileRepository')
    private readonly profileRepository: IRealtorProfileRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(userId: string, updateDto: UpdateRealtorProfileDto): Promise<RealtorProfile> {
    this.logger.info('Atualizando perfil do corretor', { userId });

    // Verificar se o usuário existe e é CORRETOR
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    if (user.role !== UserRole.CORRETOR && user.role !== UserRole.ADMIN) {
      throw new Error('Apenas corretores podem atualizar este perfil');
    }

    // Buscar perfil existente ou criar novo
    let profile = await this.profileRepository.findByUserId(userId);

    if (!profile) {
      // Criar novo perfil
      profile = new RealtorProfile();
      profile.userId = userId;
    }

    // Atualizar campos
    if (updateDto.nomeFantasia !== undefined) {
      profile.nomeFantasia = updateDto.nomeFantasia;
    }
    if (updateDto.nomeContato !== undefined) {
      profile.nomeContato = updateDto.nomeContato;
    }
    if (updateDto.telefone !== undefined) {
      profile.telefone = updateDto.telefone;
    }
    if (updateDto.email !== undefined) {
      profile.email = updateDto.email;
    }
    if (updateDto.instagram !== undefined) {
      profile.instagram = updateDto.instagram;
    }
    if (updateDto.facebook !== undefined) {
      profile.facebook = updateDto.facebook;
    }
    if (updateDto.linkedin !== undefined) {
      profile.linkedin = updateDto.linkedin;
    }
    if (updateDto.whatsappBusiness !== undefined) {
      profile.whatsappBusiness = updateDto.whatsappBusiness;
    }

    profile.updatedAt = new Date();

    const savedProfile = await this.profileRepository.save(profile);

    this.logger.info('Perfil do corretor atualizado com sucesso', {
      profileId: savedProfile.id,
      userId,
    });

    return savedProfile;
  }
}

