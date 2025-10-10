import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  phone?: string;
  role: 'USER' | 'ORGANIZER' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class UsersService {
  private users: User[] = [
    {
      id: '1',
      name: 'Admin',
      email: 'admin@gwanshop.com',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      role: 'ADMIN',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      name: 'João Silva',
      email: 'joao@email.com',
      password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
      phone: '11999999999',
      role: 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  async create(userData: Partial<User>): Promise<User> {
    const user: User = {
      id: uuidv4(),
      name: userData.name,
      email: userData.email,
      password: userData.password,
      phone: userData.phone,
      role: userData.role || 'USER',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.users.push(user);
    return user;
  }

  async findAll(): Promise<User[]> {
    return this.users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    });
  }

  async findById(id: string): Promise<User | undefined> {
    const user = this.users.find(user => user.id === id);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    }
    return undefined;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.users.find(user => user.email === email);
  }

  async update(id: string, userData: Partial<User>): Promise<User | undefined> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return undefined;

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...userData,
      updatedAt: new Date(),
    };

    const { password, ...userWithoutPassword } = this.users[userIndex];
    return userWithoutPassword as User;
  }

  async delete(id: string): Promise<boolean> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return false;

    this.users.splice(userIndex, 1);
    return true;
  }
}
