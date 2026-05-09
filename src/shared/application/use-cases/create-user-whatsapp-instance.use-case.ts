import { Injectable, Inject, NotFoundException, ConflictException } from '@nestjs/common';
import { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { IUserWhatsappConfigRepository } from '../../domain/interfaces/user-whatsapp-config-repository.interface';
import { UserWhatsappConfig } from '../../domain/entities/user-whatsapp-config.entity';
import { EvolutionApiService } from '../../../whatsapp-webhook/services/evolution-api.service';
import { ILogger } from '../interfaces/logger.interface';
import { slugify, emailPrefixSlug } from '../../infrastructure/utils/slugify.util';

@Injectable()
export class CreateUserWhatsappInstanceUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IUserWhatsappConfigRepository')
    private readonly configRepository: IUserWhatsappConfigRepository,
    private readonly evolutionApi: EvolutionApiService,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  /**
   * Cria a instância Evolution para o usuário (idempotente).
   * Se o usuário já tem config, retorna a existente — não chama o Evolution.
   */
  async execute(userId: string): Promise<UserWhatsappConfig> {
    const existing = await this.configRepository.findByUserId(userId);
    if (existing) {
      return existing;
    }

    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const instanceName = await this.resolveAvailableInstanceName(user.name, user.email, user.id);

    // Pode existir uma instância órfã no Evolution com esse nome (ex.: tentativa
    // anterior que falhou ao persistir do nosso lado). Nesse caso, adotamos.
    const existingOnEvolution = await this.evolutionApi.fetchInstanceByName(instanceName);
    const created = existingOnEvolution ?? (await this.evolutionApi.createInstance({
      instanceName,
      integration: 'WHATSAPP-BAILEYS',
    }));

    if (existingOnEvolution) {
      this.logger.info('[CREATE] Adotando instância órfã já existente no Evolution', {
        userId: user.id,
        instanceName: created.name,
        instanceId: created.id,
      });
    }

    // Garante que o webhook configurado por env seja aplicado, mesmo que o body
    // do create não o tenha aceitado e mesmo no caminho de adoção de instância órfã.
    await this.evolutionApi.applyConfiguredWebhook(created.name);

    const config = new UserWhatsappConfig();
    config.userId = user.id;
    config.evolutionInstanceId = created.id;
    config.evolutionInstanceName = created.name;

    const saved = await this.configRepository.save(config);

    this.logger.info('[CREATE] Config WhatsApp persistida', {
      userId: user.id,
      instanceName: saved.evolutionInstanceName,
    });

    return saved;
  }

  /**
   * Resolve o nome único da instância seguindo a regra de colisão do plano (seção 2.2):
   *  1. slug(user.name)
   *  2. slug(user.name) + "_" + slug(emailPrefix)
   *  3. slug(user.name) + "_" + slug(emailPrefix) + "_" + user.id.slice(0,6)
   */
  private async resolveAvailableInstanceName(
    name: string,
    email: string,
    userId: string,
  ): Promise<string> {
    const baseSlug = slugify(name) || 'user';

    const candidates = [
      baseSlug,
      `${baseSlug}_${emailPrefixSlug(email)}`.replace(/_+/g, '_'),
      `${baseSlug}_${emailPrefixSlug(email)}_${userId.replace(/-/g, '').slice(0, 6)}`.replace(/_+/g, '_'),
    ];

    for (const candidate of candidates) {
      const trimmed = candidate.slice(0, 64);
      const collision = await this.configRepository.findByInstanceName(trimmed);
      if (!collision) {
        return trimmed;
      }
    }

    throw new ConflictException('Não foi possível gerar um nome de instância único');
  }
}
