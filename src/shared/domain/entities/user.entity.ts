import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserRole } from '../value-objects/user-role.enum';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  whatsappNumber?: string | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ type: 'uuid', nullable: true })
  preferredAgentId?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Constructor vazio para TypeORM
  constructor() {}

  // Constructor com parâmetros para criação manual
  static create(
    id: string,
    name: string,
    email: string,
    password: string,
    phone?: string,
    whatsappNumber?: string | null,
    preferredAgentId?: string | null,
    role: UserRole = UserRole.USER,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ): User {
    const user = new User();
    user.id = id;
    user.name = name;
    user.email = email;
    user.password = password;
    user.phone = phone;
    user.whatsappNumber = whatsappNumber || null;
    user.role = role;
    user.preferredAgentId = preferredAgentId || null;
    user.createdAt = createdAt;
    user.updatedAt = updatedAt;
    return user;
  }

  // Métodos de domínio
  public isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  public isOrganizer(): boolean {
    return this.role === UserRole.ORGANIZER;
  }

  public canCreateEvents(): boolean {
    return this.role === UserRole.ORGANIZER || this.role === UserRole.ADMIN;
  }

  public canManageUsers(): boolean {
    return this.role === UserRole.ADMIN;
  }

  public updateProfile(name: string, phone?: string, whatsappNumber?: string | null): User {
    this.name = name;
    this.phone = phone;
    this.whatsappNumber = whatsappNumber || null;
    this.updatedAt = new Date();
    return this;
  }

  public changeRole(newRole: UserRole): User {
    this.role = newRole;
    this.updatedAt = new Date();
    return this;
  }

  public toPublic() {
    const { password, ...publicUser } = this;
    return publicUser;
  }
}
