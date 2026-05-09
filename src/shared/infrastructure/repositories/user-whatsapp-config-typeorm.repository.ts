import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserWhatsappConfig } from '../../domain/entities/user-whatsapp-config.entity';
import { IUserWhatsappConfigRepository } from '../../domain/interfaces/user-whatsapp-config-repository.interface';

@Injectable()
export class UserWhatsappConfigTypeOrmRepository implements IUserWhatsappConfigRepository {
  constructor(
    @InjectRepository(UserWhatsappConfig)
    private readonly repository: Repository<UserWhatsappConfig>,
  ) {}

  async findByUserId(userId: string): Promise<UserWhatsappConfig | null> {
    return this.repository.findOne({ where: { userId } });
  }

  async findByInstanceName(name: string): Promise<UserWhatsappConfig | null> {
    return this.repository.findOne({ where: { evolutionInstanceName: name } });
  }

  async save(config: UserWhatsappConfig): Promise<UserWhatsappConfig> {
    return this.repository.save(config);
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    const result = await this.repository.delete({ userId });
    return (result.affected ?? 0) > 0;
  }
}
