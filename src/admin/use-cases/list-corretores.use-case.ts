import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository } from '../../shared/domain/interfaces/user-repository.interface';
import { IRealtorProfileRepository } from '../../shared/domain/interfaces/realtor-profile-repository.interface';
import { UserRole } from '../../shared/domain/value-objects/user-role.enum';
import { ILogger } from '../../shared/application/interfaces/logger.interface';

export interface CorretorWithProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  businessName: string | null;
  whatsappBusiness: string | null;
  createdAt: Date;
}

@Injectable()
export class ListCorretoresUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IRealtorProfileRepository')
    private readonly realtorProfileRepository: IRealtorProfileRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(): Promise<CorretorWithProfile[]> {
    const allUsers = await this.userRepository.findAll();
    const corretores = allUsers.filter(
      (u) => u.role === UserRole.CORRETOR || u.role === UserRole.ADMIN,
    );

    this.logger.info('[Admin] Listando corretores', { total: corretores.length });

    const results: CorretorWithProfile[] = [];
    for (const user of corretores) {
      const profile = await this.realtorProfileRepository.findByUserId(user.id);
      results.push({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone ?? null,
        businessName: profile?.businessName ?? null,
        whatsappBusiness: profile?.whatsappBusiness ?? null,
        createdAt: user.createdAt,
      });
    }

    return results;
  }
}
