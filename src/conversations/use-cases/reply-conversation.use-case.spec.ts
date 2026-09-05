import { ServiceUnavailableException } from '@nestjs/common';
import { ReplyConversationUseCase } from './reply-conversation.use-case';
import { Conversation } from '../../shared/domain/entities/conversation.entity';
import { ConversationStatus } from '../../shared/domain/value-objects/conversation-status.enum';
import { UserRole } from '../../shared/domain/value-objects/user-role.enum';

const CORRETOR = 'corretor-1';
const ADMIN = 'admin-1';

function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  const conversation = Conversation.create(
    'conv-1',
    '5511987221050',
    'instancia-antiga',
    null,
    ConversationStatus.ACTIVE,
  );
  conversation.assignedRealtorId = CORRETOR;
  return Object.assign(conversation, overrides);
}

/** Instâncias que o Evolution "conhece", por nome. */
function makeEvolution(instancias: Record<string, string>) {
  return {
    sendTextMessage: jest.fn().mockResolvedValue(undefined),
    fetchInstanceByName: jest.fn(async (name: string) =>
      instancias[name] ? { name, connectionStatus: instancias[name] } : null,
    ),
  };
}

function makeSut(options: {
  conversation: Conversation;
  instancias: Record<string, string>;
  configs: Record<string, string>;
}) {
  const conversationRepository = {
    findById: jest.fn().mockResolvedValue(options.conversation),
    update: jest.fn().mockResolvedValue(options.conversation),
  };
  const messageRepository = {
    save: jest.fn(async (message) => message),
  };
  const whatsappConfigRepository = {
    findByUserId: jest.fn(async (userId: string) =>
      options.configs[userId] ? { evolutionInstanceName: options.configs[userId] } : null,
    ),
  };
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
  const evolution = makeEvolution(options.instancias);

  const sut = new ReplyConversationUseCase(
    conversationRepository as never,
    messageRepository as never,
    whatsappConfigRepository as never,
    logger as never,
    evolution as never,
  );

  return { sut, evolution, conversationRepository };
}

const input = {
  conversationId: 'conv-1',
  requesterId: ADMIN,
  requesterRole: UserRole.ADMIN,
  text: 'Olá',
};

describe('ReplyConversationUseCase — escolha da instância', () => {
  it('usa a instância atual do corretor atribuído, ignorando o snapshot da conversa', async () => {
    const conversation = makeConversation();
    const { sut, evolution, conversationRepository } = makeSut({
      conversation,
      instancias: { corretor_novo: 'open', admin_gwan: 'open' },
      configs: { [CORRETOR]: 'corretor_novo', [ADMIN]: 'admin_gwan' },
    });

    await sut.execute(input);

    expect(evolution.sendTextMessage).toHaveBeenCalledWith(
      'corretor_novo',
      expect.any(String),
      'Olá',
    );
    // Remapeia a conversa para não repetir a resolução no próximo envio.
    expect(conversation.instanceName).toBe('corretor_novo');
    expect(conversationRepository.update).toHaveBeenCalled();
  });

  it('cai para a instância de quem responde quando a do corretor não está conectada', async () => {
    const { sut, evolution } = makeSut({
      conversation: makeConversation(),
      instancias: { corretor_novo: 'close', admin_gwan: 'open' },
      configs: { [CORRETOR]: 'corretor_novo', [ADMIN]: 'admin_gwan' },
    });

    await sut.execute(input);

    expect(evolution.sendTextMessage).toHaveBeenCalledWith('admin_gwan', expect.any(String), 'Olá');
  });

  it('usa o snapshot da conversa quando ninguém tem instância vinculada', async () => {
    const { sut, evolution } = makeSut({
      conversation: makeConversation(),
      instancias: { 'instancia-antiga': 'open' },
      configs: {},
    });

    await sut.execute(input);

    expect(evolution.sendTextMessage).toHaveBeenCalledWith(
      'instancia-antiga',
      expect.any(String),
      'Olá',
    );
  });

  it('recusa com 503 e lista o motivo de cada candidato quando nenhum serve', async () => {
    const { sut, evolution } = makeSut({
      conversation: makeConversation(),
      instancias: { admin_gwan: 'connecting' },
      configs: { [CORRETOR]: 'corretor_sumido', [ADMIN]: 'admin_gwan' },
    });

    await expect(sut.execute(input)).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(evolution.sendTextMessage).not.toHaveBeenCalled();
  });

  it('segue para o envio quando a checagem no Evolution falha (não bloqueia por indisponibilidade)', async () => {
    const { sut, evolution } = makeSut({
      conversation: makeConversation(),
      instancias: {},
      configs: { [CORRETOR]: 'corretor_novo' },
    });
    evolution.fetchInstanceByName.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    await sut.execute(input);

    expect(evolution.sendTextMessage).toHaveBeenCalledWith(
      'corretor_novo',
      expect.any(String),
      'Olá',
    );
  });
});
