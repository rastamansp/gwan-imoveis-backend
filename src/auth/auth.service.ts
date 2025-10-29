import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterUserUseCase } from '../shared/application/use-cases/register-user.use-case';
import { LoginUserUseCase } from '../shared/application/use-cases/login-user.use-case';
import { IUserRepository } from '../shared/domain/interfaces/user-repository.interface';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly jwtService: JwtService,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async register(userData: any) {
    const result = await this.registerUserUseCase.execute(userData);
    return result;
  }
}
