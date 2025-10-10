import { Injectable } from '@nestjs/common';
import { User } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/interfaces/user-repository.interface';

@Injectable()
export class UserInMemoryRepository implements IUserRepository {
  private users: User[] = [
    new User(
      '1',
      'Admin',
      'admin@gwanshop.com',
      '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      undefined,
      'ADMIN' as any,
      new Date(),
      new Date(),
    ),
    new User(
      '2',
      'João Silva',
      'joao@email.com',
      '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      '11999999999',
      'USER' as any,
      new Date(),
      new Date(),
    ),
  ];

  async save(user: User): Promise<User> {
    this.users.push(user);
    return user;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.find(user => user.id === id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.users.find(user => user.email === email) || null;
  }

  async findAll(): Promise<User[]> {
    return [...this.users];
  }

  async update(id: string, updatedUser: User): Promise<User | null> {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) return null;

    this.users[index] = updatedUser;
    return updatedUser;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) return false;

    this.users.splice(index, 1);
    return true;
  }
}
