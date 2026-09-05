import {
  Injectable,
  Inject,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { IConversationRepository } from '../../shared/domain/interfaces/conversation-repository.interface';
import { IMessageRepository } from '../../shared/domain/interfaces/message-repository.interface';
import { IUserWhatsappConfigRepository } from '../../shared/domain/interfaces/user-whatsapp-config-repository.interface';
import { Conversation } from '../../shared/domain/entities/conversation.entity';
import { Message } from '../../shared/domain/entities/message.entity';
import { MessageDirection } from '../../shared/domain/value-objects/message-direction.enum';
import { MessageChannel } from '../../shared/domain/value-objects/message-channel.enum';
import { ConversationStatus } from '../../shared/domain/value-objects/conversation-status.enum';
import { ILogger } from '../../shared/application/interfaces/logger.interface';
import { UserRole } from '../../shared/domain/value-objects/user-role.enum';
import { EvolutionApiService } from '../../whatsapp-webhook/services/evolution-api.service';
import { normalizeNumberForEvolutionSDK } from '../../shared/infrastructure/utils/whatsapp.utils';

export interface ReplyConversationInput {
  conversationId: string;
  requesterId: string;
  requesterRole: UserRole;
  text: string;
}

/** De onde veio o nome da instância usada no envio (para log e diagnóstico). */
type InstanceSource = 'corretor-atribuido' | 'remetente' | 'snapshot-da-conversa';

interface InstanceCandidate {
  name: string;
  source: InstanceSource;
}

@Injectable()
export class ReplyConversationUseCase {
  constructor(
    @Inject('IConversationRepository')
    private readonly conversationRepository: IConversationRepository,
    @Inject('IMessageRepository')
    private readonly messageRepository: IMessageRepository,
    @Inject('IUserWhatsappConfigRepository')
    private readonly whatsappConfigRepository: IUserWhatsappConfigRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
    private readonly evolutionApiService: EvolutionApiService,
  ) {}

  async execute(input: ReplyConversationInput): Promise<Message> {
    const { conversationId, requesterId, requesterRole, text } = input;

    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException(`Conversa não encontrada: ${conversationId}`);
    }

    if (conversation.status !== ConversationStatus.ACTIVE) {
      throw new BadRequestException('Não é possível responder uma conversa encerrada');
    }

    if (requesterRole !== UserRole.ADMIN && !conversation.isAssignedTo(requesterId)) {
      throw new ForbiddenException('Acesso negado: esta conversa não está atribuída a você');
    }

    // `normalizeNumberForEvolutionSDK` lança `Error` cru para formato inválido
    // (ex.: phoneNumber gravado como @lid). Sem este catch viraria 500 opaco.
    let recipient: string;
    try {
      recipient = normalizeNumberForEvolutionSDK(conversation.phoneNumber);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn('[Conversations] Número da conversa inválido para envio', {
        conversationId,
        phoneNumber: conversation.phoneNumber,
        reason,
      });
      throw new BadRequestException(`Número do cliente inválido para envio via WhatsApp: ${reason}`);
    }

    const instance = await this.resolveInstance(conversation, requesterId);

    this.logger.info('[Conversations] Enviando resposta manual via WhatsApp', {
      conversationId,
      requesterId,
      recipient,
      instanceName: instance.name,
      instanceSource: instance.source,
      textLength: text.length,
    });

    try {
      await this.evolutionApiService.sendTextMessage(instance.name, recipient, text);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.error('[Conversations] Falha ao enviar resposta via Evolution', {
        conversationId,
        instanceName: instance.name,
        recipient,
        reason,
      });
      throw new ServiceUnavailableException(
        `Não foi possível enviar a mensagem pelo WhatsApp (instância "${instance.name}"). ` +
          'Verifique a conexão do WhatsApp em /profile e tente novamente.',
      );
    }

    // O envio saiu por outra instância que não a registrada na conversa: fixa o
    // vínculo novo, para que a próxima resposta não repita toda a resolução e para
    // que a inbox mostre a instância que de fato atende esta conversa.
    if (instance.name !== conversation.instanceName) {
      const anterior = conversation.instanceName;
      conversation.instanceName = instance.name;
      await this.conversationRepository.update(conversation.id, conversation);
      this.logger.info('[Conversations] Instância da conversa remapeada após envio', {
        conversationId,
        de: anterior,
        para: instance.name,
        origem: instance.source,
      });
    }

    const message = Message.create(
      uuidv4(),
      conversationId,
      text,
      MessageDirection.OUTGOING,
      new Date(),
      null,
      conversation.phoneNumber,
      MessageChannel.WHATSAPP,
    );

    const saved = await this.messageRepository.save(message);

    this.logger.info('[Conversations] Resposta enviada e salva', {
      conversationId,
      messageId: saved.id,
    });

    return saved;
  }

  /**
   * Decide por qual instância Evolution a resposta sai.
   *
   * `conversations.instanceName` é um *snapshot* do momento em que o cliente
   * escreveu — o nome muda quando o corretor recria a conexão em `/profile`, e
   * conversas antigas passam a apontar para uma instância que não existe mais
   * (foi o que aconteceu com `gwan`, `gwan_imoveis` e `minha-instancia`). Por isso
   * a fonte de verdade aqui é o vínculo vivo do `/profile`, nesta ordem:
   *
   *   1. instância do corretor atribuído — mantém o cliente recebendo do número
   *      que ele já conhece;
   *   2. instância de quem está respondendo (o caso do ADMIN atendendo conversa
   *      de um corretor cuja conexão caiu);
   *   3. o snapshot da conversa, como último recurso.
   *
   * Só entra na conta candidato que a Evolution confirme com sessão `open`: com
   * status `close` o `sendText` devolveria 500 opaco.
   */
  private async resolveInstance(
    conversation: Conversation,
    requesterId: string,
  ): Promise<InstanceCandidate> {
    const candidates = await this.buildCandidates(conversation, requesterId);

    if (candidates.length === 0) {
      throw new ServiceUnavailableException(
        'Nenhuma instância de WhatsApp está vinculada a esta conversa. Conecte o WhatsApp em /profile.',
      );
    }

    const recusados: string[] = [];

    for (const candidate of candidates) {
      let instance: Awaited<ReturnType<typeof this.evolutionApiService.fetchInstanceByName>>;

      try {
        instance = await this.evolutionApiService.fetchInstanceByName(candidate.name);
      } catch (error) {
        // Evolution fora do ar ou instável: não dá para afirmar que o candidato é
        // inválido. Segue para o envio, que ainda é coberto pelo try/catch com 503.
        this.logger.warn('[Conversations] Não foi possível checar o status da instância; seguindo para o envio', {
          instanceName: candidate.name,
          reason: error instanceof Error ? error.message : String(error),
        });
        return candidate;
      }

      if (!instance) {
        recusados.push(`"${candidate.name}" não existe mais`);
        continue;
      }

      if (instance.name !== candidate.name) {
        this.logger.warn('[Conversations] Consulta de instância devolveu nome divergente; ignorando checagem', {
          requested: candidate.name,
          returned: instance.name,
        });
        return candidate;
      }

      if (instance.connectionStatus !== 'open') {
        recusados.push(`"${candidate.name}" está "${instance.connectionStatus}"`);
        continue;
      }

      return candidate;
    }

    this.logger.warn('[Conversations] Envio bloqueado: nenhuma instância utilizável', {
      conversationId: conversation.id,
      requesterId,
      recusados,
    });

    throw new ServiceUnavailableException(
      `WhatsApp indisponível para esta conversa (${recusados.join('; ')}). ` +
        'Conecte o WhatsApp em /profile lendo o QR Code e tente novamente.',
    );
  }

  private async buildCandidates(
    conversation: Conversation,
    requesterId: string,
  ): Promise<InstanceCandidate[]> {
    const candidates: InstanceCandidate[] = [];
    const vistos = new Set<string>();

    const adicionar = (name: string | undefined | null, source: InstanceSource): void => {
      if (!name || vistos.has(name)) {
        return;
      }
      vistos.add(name);
      candidates.push({ name, source });
    };

    if (conversation.assignedRealtorId) {
      const config = await this.whatsappConfigRepository.findByUserId(conversation.assignedRealtorId);
      adicionar(config?.evolutionInstanceName, 'corretor-atribuido');
    }

    const requesterConfig = await this.whatsappConfigRepository.findByUserId(requesterId);
    adicionar(requesterConfig?.evolutionInstanceName, 'remetente');

    adicionar(conversation.instanceName, 'snapshot-da-conversa');

    return candidates;
  }
}
