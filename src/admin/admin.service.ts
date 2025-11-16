import { Injectable, Inject } from '@nestjs/common';
import { IUserRepository } from '../shared/domain/interfaces/user-repository.interface';
import { UserRole } from '../shared/domain/value-objects/user-role.enum';

@Injectable()
export class AdminService {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async getDashboardStats() {
    const users = await this.userRepository.findAll();

    return {
      users: {
        total: users.length,
        corretores: users.filter(u => u.role === UserRole.CORRETOR).length,
        customers: users.filter(u => u.role === UserRole.USER).length,
        admins: users.filter(u => u.role === UserRole.ADMIN).length,
      },
    };
  }

  async getUserAnalytics(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }
}
