import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUserWhatsappConfigRepository } from '../../domain/interfaces/user-whatsapp-config-repository.interface';
import { EvolutionApiService } from '../../../whatsapp-webhook/services/evolution-api.service';

export interface ConnectUserWhatsappResult {
  qrcodeBase64: string;
  pairingCode: string | null;
  expiresInSeconds: number;
}

@Injectable()
export class ConnectUserWhatsappUseCase {
  /** Tempo padrão (em segundos) que o QR code da Evolution permanece válido. */
  private static readonly QR_TTL_SECONDS = 30;

  constructor(
    @Inject('IUserWhatsappConfigRepository')
    private readonly configRepository: IUserWhatsappConfigRepository,
    private readonly evolutionApi: EvolutionApiService,
  ) {}

  async execute(userId: string): Promise<ConnectUserWhatsappResult> {
    const config = await this.configRepository.findByUserId(userId);
    if (!config) {
      throw new NotFoundException('Instância de WhatsApp não criada para este usuário');
    }

    const result = await this.evolutionApi.connectInstance(config.evolutionInstanceName);

    return {
      qrcodeBase64: result.base64 ?? '',
      pairingCode: result.pairingCode,
      expiresInSeconds: ConnectUserWhatsappUseCase.QR_TTL_SECONDS,
    };
  }
}
