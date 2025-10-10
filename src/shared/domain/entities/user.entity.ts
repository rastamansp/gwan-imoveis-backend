import { UserRole } from '../value-objects/user-role.enum';

export class User {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly email: string,
    public readonly password: string,
    public readonly phone?: string,
    public readonly role: UserRole = UserRole.USER,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

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

  public updateProfile(name: string, phone?: string): User {
    return new User(
      this.id,
      name,
      this.email,
      this.password,
      phone,
      this.role,
      this.createdAt,
      new Date(),
    );
  }

  public changeRole(newRole: UserRole): User {
    return new User(
      this.id,
      this.name,
      this.email,
      this.password,
      this.phone,
      newRole,
      this.createdAt,
      new Date(),
    );
  }

  public toPublic() {
    const { password, ...publicUser } = this;
    return publicUser;
  }
}
