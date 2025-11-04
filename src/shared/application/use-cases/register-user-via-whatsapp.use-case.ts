import { Injectable, Inject } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { ILogger } from '../interfaces/logger.interface';
import { UserRole } from '../../domain/value-objects/user-role.enum';
import { UserAlreadyExistsException } from '../../domain/exceptions/user-already-exists.exception';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { generatePassword } from '../../infrastructure/utils/registration.utils';

export interface RegisterUserViaWhatsappCommand {
  name: string;
  email: string;
  whatsappNumber: string;
}

@Injectable()
export class RegisterUserViaWhatsappUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(command: RegisterUserViaWhatsappCommand): Promise<{ user: User; password: string }> {
    const startTime = Date.now();

    this.logger.info('Iniciando registro de usuário via WhatsApp', {
      email: command.email,
      name: command.name,
      whatsappNumber: command.whatsappNumber,
      timestamp: new Date().toISOString(),
    });

    try {
      // Verificar se email já existe
      const existingUserByEmail = await this.userRepository.findByEmail(command.email);
      if (existingUserByEmail) {
        this.logger.warn('Tentativa de cadastro com email já existente', {
          email: command.email,
        });
        throw new UserAlreadyExistsException(command.email);
      }

      // Verificar se whatsappNumber já existe
      const existingUserByWhatsapp = await this.userRepository.findByWhatsappNumber(command.whatsappNumber);
      if (existingUserByWhatsapp) {
        this.logger.warn('Tentativa de cadastro com WhatsApp já existente', {
          whatsappNumber: command.whatsappNumber,
        });
        throw new Error('Este número de WhatsApp já está cadastrado');
      }

      // Gerar senha automaticamente
      const password = generatePassword(12);
      const hashedPassword = await bcrypt.hash(password, 10);

      // Criar usuário
      const user = User.create(
        uuidv4(),
        command.name,
        command.email,
        hashedPassword,
        null, // phone não é fornecido no cadastro via WhatsApp
        command.whatsappNumber,
        UserRole.USER,
        new Date(),
        new Date(),
      );

      // Salvar usuário
      const savedUser = await this.userRepository.save(user);

      const duration = Date.now() - startTime;
      this.logger.info('Usuário registrado com sucesso via WhatsApp', {
        userId: savedUser.id,
        email: savedUser.email,
        whatsappNumber: savedUser.whatsappNumber,
        duration,
      });

      return {
        user: savedUser,
        password, // Retornar senha em texto plano para enviar ao usuário
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao registrar usuário via WhatsApp', {
        email: command.email,
        whatsappNumber: command.whatsappNumber,
        error: error instanceof Error ? error.message : String(error),
        duration,
      });
      throw error;
    }
  }
}

