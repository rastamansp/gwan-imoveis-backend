import { Injectable, Inject } from '@nestjs/common';
import { UserCredit } from '../../domain/entities/user-credit.entity';
import { IUserCreditRepository } from '../../domain/interfaces/user-credit-repository.interface';
import { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { ILogger } from '../interfaces/logger.interface';
import { UserNotFoundException } from '../../domain/exceptions/user-not-found.exception';

@Injectable()
export class GetUserBalanceUseCase {
  constructor(
    @Inject('IUserCreditRepository')
    private readonly userCreditRepository: IUserCreditRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async execute(userId: string): Promise<{ balance: number; userCredit: UserCredit | null }> {
    const startTime = Date.now();
    
    this.logger.info('Consultando saldo de créditos', {
      userId,
      timestamp: new Date().toISOString(),
    });

    try {
      // Verificar se o usuário existe
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new UserNotFoundException(userId);
      }

      // Obter ou criar registro de crédito do usuário
      let userCredit = await this.userCreditRepository.findByUserId(userId);
      if (!userCredit) {
        userCredit = UserCredit.create(userId, 0);
        userCredit = await this.userCreditRepository.save(userCredit);
      }

      const balance = userCredit.getBalance();

      const duration = Date.now() - startTime;
      this.logger.info('Saldo consultado com sucesso', {
        userId,
        balance,
        duration,
      });

      return { balance, userCredit };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro ao consultar saldo', {
        userId,
        error: error.message,
        duration,
      });
      throw error;
    }
  }
}

