import { Injectable, Inject } from '@nestjs/common';
import { IUserWhatsappConfigRepository } from '../../domain/interfaces/user-whatsapp-config-repository.interface';
import { EvolutionApiService } from '../../../whatsapp-webhook/services/evolution-api.service';
import { EvolutionInstanceDto } from '../../../whatsapp-webhook/dtos/evolution-instance.dto';
import { ILogger } from '../interfaces/logger.interface';

export interface UserWhatsappStatus {
  hasInstance: boolean;
  instance?: EvolutionInstanceDto;
}

@Injectable()
export class GetUserWhatsappStatusUseCase {
  constructor(
    @Inject('IUserWhatsappConfigRepository')
    private readonly configRepository: IUserWhatsappConfigRepository,
    private readonly evolutionApi: EvolutionApiService,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  /**
   * Retorna o estado da integração do usuário consultando o Evolution em tempo real.
   * Se a Evolution não conhece mais a instância (órfã), apaga a linha local
   * e devolve `hasInstance: false` para que o front volte ao Estado A.
   */
  async execute(userId: string): Promise<UserWhatsappStatus> {
    const config = await this.configRepository.findByUserId(userId);

    if (!config) {
      return { hasInstance: false };
    }

    const liveInstance = await this.evolutionApi.fetchInstanceById(config.evolutionInstanceId);

    if (!liveInstance) {
      this.logger.warn('[STATUS] Instância órfã detectada — limpando config local', {
        userId,
        instanceId: config.evolutionInstanceId,
        instanceName: config.evolutionInstanceName,
      });
      await this.configRepository.deleteByUserId(userId);
      return { hasInstance: false };
    }

    return {
      hasInstance: true,
      instance: liveInstance,
    };
  }
}
