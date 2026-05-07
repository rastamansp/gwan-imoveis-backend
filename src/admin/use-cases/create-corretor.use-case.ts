import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';
import { IUserRepository } from '../../shared/domain/interfaces/user-repository.interface';
import { IRealtorProfileRepository } from '../../shared/domain/interfaces/realtor-profile-repository.interface';
import { User } from '../../shared/domain/entities/user.entity';
import { RealtorProfile } from '../../shared/domain/entities/realtor-profile.entity';
import { UserRole } from '../../shared/domain/value-objects/user-role.enum';
import { ILogger } from '../../shared/application/interfaces/logger.interface';
import { CreateCorretorDto } from '../presentation/dtos/create-corretor.dto';

export interface CreateCorretorResult {
  user: User;
  profile: RealtorProfile;
}

@Injectable()
export class CreateCorretorUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IRealtorProfileRepository')
    private readonly realtorProfileRepository: IRealtorProfileRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(dto: CreateCorretorDto): Promise<CreateCorretorResult> {
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(`E-mail já cadastrado: ${dto.email}`);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = User.create(
      uuidv4(),
      dto.name,
      dto.email,
      hashedPassword,
      dto.phone,
      null,
      null,
      UserRole.CORRETOR,
      new Date(),
      new Date(),
    );

    const savedUser = await this.userRepository.save(user);

    const profile = new RealtorProfile();
    profile.userId = savedUser.id;
    profile.businessName = dto.businessName ?? undefined;
    profile.contactName = dto.name;
    profile.phone = dto.phone ?? undefined;
    profile.whatsappBusiness = dto.whatsappBusiness ?? undefined;

    const savedProfile = await this.realtorProfileRepository.save(profile);

    this.logger.info('[Admin] Corretor criado com sucesso', {
      userId: savedUser.id,
      email: savedUser.email,
    });

    return { user: savedUser, profile: savedProfile };
  }
}
