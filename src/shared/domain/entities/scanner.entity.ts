import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ScannerStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED'
}

export enum ScannerRole {
  VALIDATOR = 'VALIDATOR',    // Pode apenas validar ingressos
  MANAGER = 'MANAGER',        // Pode validar e fazer check-in
  ADMIN = 'ADMIN'             // Acesso total
}

@Entity('scanners')
export class Scanner {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  apiKey: string;

  @Column({ type: 'varchar', length: 255 })
  secretKey: string;

  @Column({ type: 'varchar', length: 100 })
  location: string;

  @Column({ type: 'varchar', length: 50, default: ScannerRole.VALIDATOR })
  role: ScannerRole;

  @Column({ type: 'varchar', length: 50, default: ScannerStatus.ACTIVE })
  status: ScannerStatus;

  @Column({ type: 'timestamp', nullable: true })
  lastUsedAt: Date;

  @Column({ type: 'varchar', length: 45, nullable: true })
  lastUsedIp: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor(
    name?: string,
    location?: string,
    role?: ScannerRole,
    apiKey?: string,
    secretKey?: string
  ) {
    if (name) this.name = name;
    if (location) this.location = location;
    if (role) this.role = role;
    if (apiKey) this.apiKey = apiKey;
    if (secretKey) this.secretKey = secretKey;
  }

  // Métodos de domínio
  public isActive(): boolean {
    return this.status === ScannerStatus.ACTIVE;
  }

  public canValidate(): boolean {
    return this.isActive() && [
      ScannerRole.VALIDATOR,
      ScannerRole.MANAGER,
      ScannerRole.ADMIN
    ].includes(this.role);
  }

  public canCheckIn(): boolean {
    return this.isActive() && [
      ScannerRole.MANAGER,
      ScannerRole.ADMIN
    ].includes(this.role);
  }

  public canManage(): boolean {
    return this.isActive() && this.role === ScannerRole.ADMIN;
  }

  public updateLastUsed(ip?: string): void {
    this.lastUsedAt = new Date();
    if (ip) this.lastUsedIp = ip;
  }

  public activate(): void {
    this.status = ScannerStatus.ACTIVE;
  }

  public deactivate(): void {
    this.status = ScannerStatus.INACTIVE;
  }

  public suspend(): void {
    this.status = ScannerStatus.SUSPENDED;
  }

  public promoteToManager(): void {
    this.role = ScannerRole.MANAGER;
  }

  public promoteToAdmin(): void {
    this.role = ScannerRole.ADMIN;
  }

  public demoteToValidator(): void {
    this.role = ScannerRole.VALIDATOR;
  }

  // Método estático para criar scanner
  public static create(
    name: string,
    location: string,
    role: ScannerRole = ScannerRole.VALIDATOR,
    apiKey?: string,
    secretKey?: string
  ): Scanner {
    const scanner = new Scanner();
    scanner.name = name;
    scanner.location = location;
    scanner.role = role;
    scanner.status = ScannerStatus.ACTIVE;
    scanner.apiKey = apiKey || this.generateApiKey();
    scanner.secretKey = secretKey || this.generateSecretKey();
    return scanner;
  }

  private static generateApiKey(): string {
    return 'scanner_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  private static generateSecretKey(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}
