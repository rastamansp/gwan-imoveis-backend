import { Injectable, Inject } from '@nestjs/common';
import { UserCredit } from '../../domain/entities/user-credit.entity';
import { IUserCreditRepository, IUserCreditRepository as IUserCreditRepo } from '../../domain/interfaces/user-credit-repository.interface';
import { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { ILogger } from '../interfaces/logger.interface';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';
import { InvalidOperationException } from '../../domain/exceptions/invalid-operation.exception';

@Injectable()
export class AddCreditUseCase {
  constructor(
    @Inject('IUserCreditRepository')
    private readonly userCreditRepository: IUserCreditRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(userId: string, amount: number): Promise<UserCredit> {
    const startTime = Date.now();
    
    this.logger.info('Iniciando adição de créditos', {
      userId,
      amount,
      timestamp: new Date().toISOString(),
    });

    try {
      // Verificar se o usuário existe
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new UserNotFoundException(userId);
      }

      // Validar valor
      if (amount <= 0) {
        throw new InvalidOperationException(
          'Add credit',
          'Amount must be greater than zero'
        );
      }

      // Obter ou criar registro de crédito do usuário
      let userCredit = await this.userCreditRepository.findByUserId(userId);
      if (!userCredit) {
        userCredit = UserCredit.create(userId, 0);
        userCredit = await this.userCreditRepository.save(userCredit);
      }

      // Adicionar créditos
      userCredit.addCredit(amount);
      const savedUserCredit = await this.userCreditRepository.save(userCredit);

      const duration = Date.now() - startTime;
      this.logger.info('Créditos adicionados com sucesso', {
        userId,
        amount,
        newBalance: savedUserCredit.getBalance(),
        duration,
      });

      return savedUserCredit;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao adicionar créditos', {
        userId,
        amount,
        error: error.message,
        duration,
      });
      throw error;
    }
  }
}

