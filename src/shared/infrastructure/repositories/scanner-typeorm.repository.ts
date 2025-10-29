import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Scanner, ScannerStatus, ScannerRole } from '../../domain/entities/scanner.entity';
import { IScannerRepository } from '../../domain/interfaces/scanner-repository.interface';

@Injectable()
export class ScannerTypeOrmRepository implements IScannerRepository {
  constructor(
    @InjectRepository(Scanner)
    private readonly repository: Repository<Scanner>,
  ) {}

  async save(scanner: Scanner): Promise<Scanner> {
    return await this.repository.save(scanner);
  }

  async findById(id: string): Promise<Scanner | null> {
    return await this.repository.findOne({ where: { id } });
  }

  async findByApiKey(apiKey: string): Promise<Scanner | null> {
    return await this.repository.findOne({ where: { apiKey } });
  }

  async findByName(name: string): Promise<Scanner | null> {
    return await this.repository.findOne({ where: { name } });
  }

  async findAll(): Promise<Scanner[]> {
    return await this.repository.find({
      order: { createdAt: 'DESC' }
    });
  }

  async findByLocation(location: string): Promise<Scanner[]> {
    return await this.repository.find({
      where: { location },
      order: { createdAt: 'DESC' }
    });
  }

  async findByStatus(status: ScannerStatus): Promise<Scanner[]> {
    return await this.repository.find({
      where: { status },
      order: { createdAt: 'DESC' }
    });
  }

  async findByRole(role: ScannerRole): Promise<Scanner[]> {
    return await this.repository.find({
      where: { role },
      order: { createdAt: 'DESC' }
    });
  }

  async update(scanner: Scanner): Promise<Scanner> {
    return await this.repository.save(scanner);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
