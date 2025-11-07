import { UserCredit } from '../entities/user-credit.entity';

export const IUserCreditRepository = Symbol('IUserCreditRepository');

export interface IUserCreditRepository {
  save(userCredit: UserCredit): Promise<UserCredit>;
  findById(id: string): Promise<UserCredit | null>;
  findByUserId(userId: string): Promise<UserCredit | null>;
  createOrGetByUserId(userId: string): Promise<UserCredit>;
  update(id: string, userCredit: UserCredit): Promise<UserCredit | null>;
  delete(id: string): Promise<boolean>;
}

