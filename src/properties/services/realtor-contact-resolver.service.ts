import { Injectable, Inject } from '@nestjs/common';
import { IUserWhatsappConfigRepository } from '../../shared/domain/interfaces/user-whatsapp-config-repository.interface';
import { EvolutionApiService } from '../../whatsapp-webhook/services/evolution-api.service';
import { User } from '../../shared/domain/entities/user.entity';
import { ILogger } from '../../shared/application/interfaces/logger.interface';

export type RealtorContactSource = 'evolution' | 'profile' | 'user';

export interface RealtorContact {
  whatsapp: string | null;
  source: RealtorContactSource | null;
}

@Injectable()
export class RealtorContactResolverService {
  constructor(
    @Inject('IUserWhatsappConfigRepository')
    private readonly whatsappConfigRepo: IUserWhatsappConfigRepository,
    private readonly evolutionApi: EvolutionApiService,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  async resolveWhatsapp(realtor: User): Promise<RealtorContact> {
    try {
      const config = await this.whatsappConfigRepo.findByUserId(realtor.id);
      if (config?.evolutionInstanceId) {
        const instance = await this.evolutionApi.fetchInstanceById(config.evolutionInstanceId);
        if (instance?.connectionStatus === 'open' && instance.number) {
          return { whatsapp: instance.number, source: 'evolution' };
        }
      }
    } catch (err) {
      this.logger.warn('Falha ao resolver WhatsApp via Evolution', {
        realtorId: realtor.id,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    const profileWhatsapp =
      realtor.realtorProfile?.whatsappBusiness || realtor.realtorProfile?.phone;
    if (profileWhatsapp) {
      return { whatsapp: profileWhatsapp, source: 'profile' };
    }

    const userWhatsapp = realtor.whatsappNumber || realtor.phone;
    if (userWhatsapp) {
      return { whatsapp: userWhatsapp, source: 'user' };
    }

    return { whatsapp: null, source: null };
  }
}
