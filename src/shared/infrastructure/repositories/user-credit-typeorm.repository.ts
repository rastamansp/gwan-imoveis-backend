import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserCredit } from '../../domain/entities/user-credit.entity';
import { IUserCreditRepository } from '../../domain/interfaces/user-credit-repository.interface';

@Injectable()
export class UserCreditTypeOrmRepository implements IUserCreditRepository {
  constructor(
    @InjectRepository(UserCredit)
    private readonly userCreditRepository: Repository<UserCredit>,
  ) {}

  async save(userCredit: UserCredit): Promise<UserCredit> {
    return await this.userCreditRepository.save(userCredit);
  }

  async findById(id: string): Promise<UserCredit | null> {
    return await this.userCreditRepository.findOne({ where: { id } });
  }

  async findByUserId(userId: string): Promise<UserCredit | null> {
    return await this.userCreditRepository.findOne({ where: { userId } });
  }

  async createOrGetByUserId(userId: string): Promise<UserCredit> {
    let userCredit = await this.findByUserId(userId);
    if (!userCredit) {
      userCredit = UserCredit.create(userId, 0);
      userCredit = await this.save(userCredit);
    }
    return userCredit;
  }

  async update(id: string, updatedUserCredit: UserCredit): Promise<UserCredit | null> {
    const result = await this.userCreditRepository.update(id, updatedUserCredit);
    if (result.affected === 0) {
      return null;
    }
    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.userCreditRepository.delete(id);
    return result.affected > 0;
  }
}

