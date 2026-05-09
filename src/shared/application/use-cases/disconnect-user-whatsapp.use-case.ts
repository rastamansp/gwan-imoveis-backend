import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUserWhatsappConfigRepository } from '../../domain/interfaces/user-whatsapp-config-repository.interface';
import { EvolutionApiService } from '../../../whatsapp-webhook/services/evolution-api.service';

@Injectable()
export class DisconnectUserWhatsappUseCase {
  constructor(
    @Inject('IUserWhatsappConfigRepository')
    private readonly configRepository: IUserWhatsappConfigRepository,
    private readonly evolutionApi: EvolutionApiService,
  ) {}

  /**
   * Faz logout da instância sem apagá-la (continua existindo no Evolution e no nosso banco).
   * Mantido como endpoint preparado — sem botão visível na UI nesta entrega.
   */
  async execute(userId: string): Promise<{ success: true }> {
    const config = await this.configRepository.findByUserId(userId);
    if (!config) {
      throw new NotFoundException('Instância de WhatsApp não criada para este usuário');
    }

    await this.evolutionApi.logoutInstance(config.evolutionInstanceName);
    return { success: true };
  }
}
