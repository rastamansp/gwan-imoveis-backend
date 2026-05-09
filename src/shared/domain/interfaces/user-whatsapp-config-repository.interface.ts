import { UserWhatsappConfig } from '../entities/user-whatsapp-config.entity';

export interface IUserWhatsappConfigRepository {
  findByUserId(userId: string): Promise<UserWhatsappConfig | null>;
  findByInstanceName(name: string): Promise<UserWhatsappConfig | null>;
  save(config: UserWhatsappConfig): Promise<UserWhatsappConfig>;
  deleteByUserId(userId: string): Promise<boolean>;
}
