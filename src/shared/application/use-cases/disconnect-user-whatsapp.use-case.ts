import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUserWhatsappConfigRepository } from '../../domain/interfaces/user-whatsapp-config-repository.interface';
import { EvolutionApiService } from '../../../whatsapp-webhook/services/evolution-api.service';
import { ILogger } from '../interfaces/logger.interface';

@Injectable()
export class DisconnectUserWhatsappUseCase {
  constructor(
    @Inject('IUserWhatsappConfigRepository')
    private readonly configRepository: IUserWhatsappConfigRepository,
    private readonly evolutionApi: EvolutionApiService,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  /**
   * Desvincula o WhatsApp do usuário: logout, remoção da instância no Evolution e
   * da linha local — o `/profile` volta ao Estado A e o próximo "conectar" cria
   * uma instância nova.
   *
   * Antes isto era só `logout`, o que deixava instância `close` pendurada no
   * Evolution ocupando o nome; a instância acabava removida por fora e a config
   * local seguia apontando para um nome que não existia mais.
   *
   * O logout é best-effort: numa instância que já está `close` (ou sumiu) ele
   * falha, e abortar aí impediria a limpeza — que é justamente o objetivo.
   */
  async execute(userId: string): Promise<{ success: true }> {
    const config = await this.configRepository.findByUserId(userId);
    if (!config) {
      throw new NotFoundException('Instância de WhatsApp não criada para este usuário');
    }

    const instanceName = config.evolutionInstanceName;

    try {
      await this.evolutionApi.logoutInstance(instanceName);
    } catch (error) {
      this.logger.warn('[DISCONNECT] Logout falhou; seguindo para a remoção da instância', {
        userId,
        instanceName,
        reason: error instanceof Error ? error.message : String(error),
      });
    }

    await this.evolutionApi.deleteInstance(instanceName);
    await this.configRepository.deleteByUserId(userId);

    this.logger.info('[DISCONNECT] WhatsApp desvinculado do usuário', { userId, instanceName });

    return { success: true };
  }
}
