import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { User } from './user.entity';

@Entity('user_credits')
@Index(['userId'])
export class UserCredit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relacionamentos
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  // Métodos estáticos
  public static create(userId: string, initialBalance: number = 0): UserCredit {
    const userCredit = new UserCredit();
    userCredit.userId = userId;
    userCredit.balance = initialBalance;
    userCredit.createdAt = new Date();
    userCredit.updatedAt = new Date();
    return userCredit;
  }

  // Métodos de domínio
  public addCredit(amount: number): void {
    if (amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }
    this.balance = Number(this.balance) + amount;
    this.updatedAt = new Date();
  }

  public deductCredit(amount: number): void {
    if (amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }
    if (!this.hasEnoughCredit(amount)) {
      throw new Error('Insufficient credit balance');
    }
    this.balance = Number(this.balance) - amount;
    this.updatedAt = new Date();
  }

  public hasEnoughCredit(amount: number): boolean {
    return Number(this.balance) >= amount;
  }

  public getBalance(): number {
    return Number(this.balance);
  }
}

