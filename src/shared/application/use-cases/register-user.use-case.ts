import { Injectable, Inject } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { ILogger } from '../interfaces/logger.interface';
import { RegisterDto } from '../../../auth/dto/register.dto';
import { UserRole } from '../../domain/value-objects/user-role.enum';
import { UserAlreadyExistsException } from '../../domain/exceptions/user-already-exists.exception';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(registerDto: RegisterDto): Promise<User> {
    const startTime = Date.now();
    
    this.logger.info('Iniciando registro de usuário', {
      email: registerDto.email,
      name: registerDto.name,
      timestamp: new Date().toISOString(),
    });

    try {
      // Verificar se usuário já existe
      const existingUser = await this.userRepository.findByEmail(registerDto.email);
      if (existingUser) {
        throw new UserAlreadyExistsException(registerDto.email);
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      // Criar usuário
      const user = User.create(
        uuidv4(),
        registerDto.name,
        registerDto.email,
        hashedPassword,
        registerDto.phone,
        undefined, // whatsappNumber - não é fornecido no registro
        (registerDto.role as UserRole) || UserRole.USER,
        new Date(),
        new Date(),
      );

      // Salvar usuário
      const savedUser = await this.userRepository.save(user);

      const duration = Date.now() - startTime;
      this.logger.info('Usuário registrado com sucesso', {
        userId: savedUser.id,
        email: savedUser.email,
        duration,
      });

      return savedUser;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao registrar usuário', {
        email: registerDto.email,
        error: error.message,
        duration,
      });
      throw error;
    }
  }
}
