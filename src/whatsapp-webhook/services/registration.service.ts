import { Injectable, Inject } from '@nestjs/common';
import { ILogger } from '../../shared/application/interfaces/logger.interface';
import { IConversationRepository } from '../../shared/domain/interfaces/conversation-repository.interface';
import { IUserRepository } from '../../shared/domain/interfaces/user-repository.interface';
import { RegisterUserViaWhatsappUseCase } from '../../shared/application/use-cases/register-user-via-whatsapp.use-case';
import { EvolutionApiService } from './evolution-api.service';
import { RegistrationMessagesService } from './registration-messages.service';
import {
  extractRegistrationData,
  validateEmail,
  isCancelCommand,
  isRestartCommand,
} from '../../shared/infrastructure/utils/registration.utils';

export type RegistrationStatus = 'pending' | 'collecting_name' | 'collecting_email' | 'confirming' | 'completed' | 'cancelled';

interface RegistrationMetadata {
  registrationStatus: RegistrationStatus;
  registrationData: {
    name?: string;
    email?: string;
    whatsappNumber: string;
  };
}

@Injectable()
export class RegistrationService {
  constructor(
    @Inject('ILogger')
    private readonly logger: ILogger,
    @Inject('IConversationRepository')
    private readonly conversationRepository: IConversationRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly registerUserViaWhatsappUseCase: RegisterUserViaWhatsappUseCase,
    private readonly evolutionApiService: EvolutionApiService,
  ) {}

  /**
   * Verifica se usuário está cadastrado pelo número de WhatsApp
   */
  async checkUserRegistration(phoneNumber: string): Promise<boolean> {
    const user = await this.userRepository.findByWhatsappNumber(phoneNumber);
    return !!user;
  }

  /**
   * Inicia fluxo de cadastro
   */
  async startRegistration(conversationId: string, phoneNumber: string, instanceName: string, remoteJid?: string): Promise<void> {
    this.logger.info('[REGISTRATION] Iniciando fluxo de cadastro', {
      conversationId,
      phoneNumber,
    });

    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) {
      throw new Error(`Conversa ${conversationId} não encontrada`);
    }

    // Atualizar metadata com estado inicial
    const metadata: RegistrationMetadata = {
      registrationStatus: 'pending',
      registrationData: {
        whatsappNumber: phoneNumber,
      },
    };

    conversation.metadata = { ...conversation.metadata, ...metadata };
    await this.conversationRepository.save(conversation);

    // O remoteJid já deve estar normalizado (número limpo) antes de chegar aqui
    // Se não fornecido, construir a partir do phoneNumber
    const numberToSend = remoteJid || phoneNumber;

    // Enviar mensagem de boas-vindas
    await this.evolutionApiService.sendTextMessage(
      instanceName,
      numberToSend,
      RegistrationMessagesService.getWelcomeMessage(),
    );
  }

  /**
   * Processa mensagem durante cadastro
   */
  async processRegistrationMessage(
    conversationId: string,
    phoneNumber: string,
    instanceName: string,
    message: string,
    remoteJid?: string,
  ): Promise<{ completed: boolean; shouldContinueChat: boolean }> {
    // Sempre recarregar conversa do banco para garantir metadata atualizado
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation || !conversation.metadata) {
      this.logger.error('[REGISTRATION] Conversa não encontrada ou sem metadata', {
        conversationId,
        hasMetadata: !!conversation?.metadata,
      });
      throw new Error(`Conversa ${conversationId} não encontrada ou sem metadata`);
    }

    const metadata = conversation.metadata as RegistrationMetadata;
    const currentStatus = metadata.registrationStatus;

    // Log detalhado para debug
    this.logger.info('[REGISTRATION] Processando mensagem de cadastro', {
      conversationId,
      phoneNumber,
      message: message.substring(0, 50), // Primeiros 50 caracteres
      currentStatus,
      hasName: !!metadata.registrationData.name,
      hasEmail: !!metadata.registrationData.email,
    });

    // O remoteJid já deve estar normalizado (número limpo) antes de chegar aqui
    // Se não fornecido, usar phoneNumber
    const numberToSend = remoteJid || phoneNumber;

    // Se status é confirming, processar confirmação ANTES de qualquer outra coisa
    // Isso evita que mensagens como "Sim" sejam interpretadas como dados
    if (currentStatus === 'confirming') {
      this.logger.debug('[REGISTRATION] Status é confirming, processando confirmação', { 
        message: message.substring(0, 20),
        currentStatus 
      });
      return await this.processConfirmation(conversation, phoneNumber, instanceName, message, numberToSend);
    }

    // Verificar comandos
    if (isCancelCommand(message)) {
      await this.cancelRegistration(conversationId, phoneNumber, instanceName, remoteJid);
      return { completed: false, shouldContinueChat: false };
    }

    if (isRestartCommand(message)) {
      await this.restartRegistration(conversationId, phoneNumber, instanceName, remoteJid);
      return { completed: false, shouldContinueChat: false };
    }

    // Processar conforme status
    switch (currentStatus) {
      case 'pending':
      case 'collecting_name':
        this.logger.debug('[REGISTRATION] Processando como coleta de nome', { currentStatus });
        return await this.processNameCollection(conversation, phoneNumber, instanceName, message, numberToSend);
      case 'collecting_email':
        this.logger.debug('[REGISTRATION] Processando como coleta de email', { currentStatus });
        return await this.processEmailCollection(conversation, phoneNumber, instanceName, message, numberToSend);
      default:
        this.logger.warn('[REGISTRATION] Status desconhecido ou já processado', { currentStatus });
        return { completed: false, shouldContinueChat: true };
    }
  }

  /**
   * Processa coleta de nome
   */
  private async processNameCollection(
    conversation: any,
    phoneNumber: string,
    instanceName: string,
    message: string,
    numberToSend: string,
  ): Promise<{ completed: boolean; shouldContinueChat: boolean }> {
    // Recarregar conversa do banco para garantir metadata atualizado
    const updatedConversation = await this.conversationRepository.findById(conversation.id);
    if (!updatedConversation || !updatedConversation.metadata) {
      throw new Error(`Conversa ${conversation.id} não encontrada ou sem metadata`);
    }

    const metadata = updatedConversation.metadata as RegistrationMetadata;
    const { name, email } = extractRegistrationData(message);

    this.logger.debug('[REGISTRATION] Processando coleta de nome', {
      conversationId: conversation.id,
      extractedName: name,
      extractedEmail: email,
      currentName: metadata.registrationData.name,
      currentEmail: metadata.registrationData.email,
    });

    // Atualizar nome se encontrado
    if (name) {
      metadata.registrationData.name = name;
      metadata.registrationStatus = email && validateEmail(email) ? 'confirming' : 'collecting_email';
    }

    // Atualizar email se encontrado e válido
    if (email && validateEmail(email)) {
      metadata.registrationData.email = email;
      if (metadata.registrationData.name) {
        metadata.registrationStatus = 'confirming';
      }
    }

    // Salvar metadata
    updatedConversation.metadata = { ...updatedConversation.metadata, ...metadata };
    await this.conversationRepository.save(updatedConversation);

    // Verificar se tem todos os dados
    if (metadata.registrationData.name && metadata.registrationData.email) {
      // Enviar confirmação
      await this.evolutionApiService.sendTextMessage(
        instanceName,
        numberToSend,
        RegistrationMessagesService.getConfirmationMessage(
          metadata.registrationData.name,
          metadata.registrationData.email,
        ),
      );
      return { completed: false, shouldContinueChat: false };
    }

    // Solicitar dados faltantes
    if (!metadata.registrationData.name) {
      await this.evolutionApiService.sendTextMessage(
        instanceName,
        numberToSend,
        RegistrationMessagesService.getNameNotFoundMessage(),
      );
    } else if (!metadata.registrationData.email) {
      await this.evolutionApiService.sendTextMessage(
        instanceName,
        numberToSend,
        RegistrationMessagesService.getRequestEmailMessage(),
      );
      metadata.registrationStatus = 'collecting_email';
      conversation.metadata = { ...conversation.metadata, ...metadata };
      await this.conversationRepository.save(conversation);
    }

    return { completed: false, shouldContinueChat: false };
  }

  /**
   * Processa coleta de email
   */
  private async processEmailCollection(
    conversation: any,
    phoneNumber: string,
    instanceName: string,
    message: string,
    numberToSend: string,
  ): Promise<{ completed: boolean; shouldContinueChat: boolean }> {
    // Recarregar conversa do banco para garantir metadata atualizado
    const updatedConversation = await this.conversationRepository.findById(conversation.id);
    if (!updatedConversation || !updatedConversation.metadata) {
      throw new Error(`Conversa ${conversation.id} não encontrada ou sem metadata`);
    }

    const metadata = updatedConversation.metadata as RegistrationMetadata;
    const { name, email } = extractRegistrationData(message);

    this.logger.debug('[REGISTRATION] Processando coleta de email', {
      conversationId: conversation.id,
      extractedName: name,
      extractedEmail: email,
      currentName: metadata.registrationData.name,
      currentEmail: metadata.registrationData.email,
    });

    // Atualizar nome se encontrado
    if (name && !metadata.registrationData.name) {
      metadata.registrationData.name = name;
    }

    // Processar email
    if (email) {
      if (validateEmail(email)) {
        metadata.registrationData.email = email;
        if (metadata.registrationData.name) {
          metadata.registrationStatus = 'confirming';
          updatedConversation.metadata = { ...updatedConversation.metadata, ...metadata };
          await this.conversationRepository.save(updatedConversation);

          // Enviar confirmação
          await this.evolutionApiService.sendTextMessage(
            instanceName,
            numberToSend,
            RegistrationMessagesService.getConfirmationMessage(
              metadata.registrationData.name!,
              metadata.registrationData.email,
            ),
          );
          return { completed: false, shouldContinueChat: false };
        } else {
          // Email válido mas falta nome
          metadata.registrationStatus = 'collecting_name';
          updatedConversation.metadata = { ...updatedConversation.metadata, ...metadata };
          await this.conversationRepository.save(updatedConversation);
          
          await this.evolutionApiService.sendTextMessage(
            instanceName,
            numberToSend,
            RegistrationMessagesService.getRequestNameMessage(),
          );
        }
      } else {
        // Email inválido
        await this.evolutionApiService.sendTextMessage(
          instanceName,
          numberToSend,
          RegistrationMessagesService.getInvalidEmailMessage(),
        );
      }
    } else {
      // Email não encontrado
      await this.evolutionApiService.sendTextMessage(
        instanceName,
        numberToSend,
        RegistrationMessagesService.getEmailNotFoundMessage(),
      );
    }

    updatedConversation.metadata = { ...updatedConversation.metadata, ...metadata };
    await this.conversationRepository.save(updatedConversation);

    return { completed: false, shouldContinueChat: false };
  }

  /**
   * Processa confirmação
   */
  private async processConfirmation(
    conversation: any,
    phoneNumber: string,
    instanceName: string,
    message: string,
    numberToSend: string,
  ): Promise<{ completed: boolean; shouldContinueChat: boolean }> {
    // Recarregar conversa do banco para garantir metadata atualizado
    const updatedConversation = await this.conversationRepository.findById(conversation.id);
    if (!updatedConversation || !updatedConversation.metadata) {
      throw new Error(`Conversa ${conversation.id} não encontrada ou sem metadata`);
    }

    const metadata = updatedConversation.metadata as RegistrationMetadata;
    const normalizedMessage = message.trim().toLowerCase();

    this.logger.info('[REGISTRATION] Processando confirmação', {
      conversationId: conversation.id,
      message: normalizedMessage,
      name: metadata.registrationData.name,
      email: metadata.registrationData.email,
    });

    if (normalizedMessage === 'sim' || normalizedMessage === 's' || normalizedMessage === 'yes') {
      // Confirmado - finalizar cadastro
      this.logger.info('[REGISTRATION] Confirmação aceita, finalizando cadastro', {
        conversationId: conversation.id,
      });
      return await this.completeRegistration(conversation.id, phoneNumber, instanceName, numberToSend);
    } else if (normalizedMessage === 'não' || normalizedMessage === 'nao' || normalizedMessage === 'n' || normalizedMessage === 'no') {
      // Não confirmado - reiniciar
      this.logger.info('[REGISTRATION] Confirmação negada, reiniciando cadastro', {
        conversationId: conversation.id,
      });
      await this.restartRegistration(conversation.id, phoneNumber, instanceName, numberToSend);
      return { completed: false, shouldContinueChat: false };
    } else {
      // Resposta não reconhecida - reenviar confirmação
      this.logger.warn('[REGISTRATION] Resposta de confirmação não reconhecida', {
        conversationId: conversation.id,
        message: normalizedMessage,
      });
      await this.evolutionApiService.sendTextMessage(
        instanceName,
        numberToSend,
        RegistrationMessagesService.getConfirmationMessage(
          metadata.registrationData.name!,
          metadata.registrationData.email!,
        ),
      );
      return { completed: false, shouldContinueChat: false };
    }
  }

  /**
   * Finaliza cadastro e cria usuário
   */
  async completeRegistration(conversationId: string, phoneNumber: string, instanceName: string, remoteJid?: string): Promise<{ completed: boolean; shouldContinueChat: boolean }> {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation || !conversation.metadata) {
      throw new Error(`Conversa ${conversationId} não encontrada ou sem metadata`);
    }

    const metadata = conversation.metadata as RegistrationMetadata;
    const { name, email } = metadata.registrationData;

    if (!name || !email) {
      throw new Error('Dados de cadastro incompletos');
    }

    try {
      // Criar usuário
      const { user, password } = await this.registerUserViaWhatsappUseCase.execute({
        name,
        email,
        whatsappNumber: phoneNumber,
      });

      // Atualizar conversa com userId
      conversation.userId = user.id;
      conversation.metadata = {
        ...conversation.metadata,
        registrationStatus: 'completed',
      };
      await this.conversationRepository.save(conversation);

      // Formatar número para envio
      // O remoteJid já deve estar normalizado (número limpo) antes de chegar aqui
      // Se não fornecido, usar phoneNumber
      const numberToSend = remoteJid || phoneNumber;

      // Enviar mensagem de sucesso
      await this.evolutionApiService.sendTextMessage(
        instanceName,
        numberToSend,
        RegistrationMessagesService.getRegistrationCompleteMessage(),
      );

      // Enviar credenciais
      await this.evolutionApiService.sendTextMessage(
        instanceName,
        numberToSend,
        RegistrationMessagesService.getCredentialsMessage(email, password),
      );

      this.logger.info('[REGISTRATION] Cadastro completado com sucesso', {
        conversationId,
        userId: user.id,
        email,
        phoneNumber,
      });

      return { completed: true, shouldContinueChat: true };
    } catch (error) {
      // Tratar erro de email já existente
      if (error instanceof Error && error.message.includes('já está cadastrado')) {
        // O remoteJid já deve estar normalizado (número limpo) antes de chegar aqui
      // Se não fornecido, usar phoneNumber
      const numberToSend = remoteJid || phoneNumber;
        await this.evolutionApiService.sendTextMessage(
          instanceName,
          numberToSend,
          RegistrationMessagesService.getEmailAlreadyExistsMessage(),
        );
      } else {
        this.logger.error('[REGISTRATION] Erro ao completar cadastro', {
          conversationId,
          error: error instanceof Error ? error.message : String(error),
        });
        // O remoteJid já deve estar normalizado (número limpo) antes de chegar aqui
      // Se não fornecido, usar phoneNumber
      const numberToSend = remoteJid || phoneNumber;
        await this.evolutionApiService.sendTextMessage(
          instanceName,
          numberToSend,
          '❌ Ocorreu um erro ao finalizar seu cadastro. Por favor, tente novamente mais tarde.',
        );
      }

      return { completed: false, shouldContinueChat: false };
    }
  }

  /**
   * Cancela cadastro
   */
  async cancelRegistration(conversationId: string, phoneNumber: string, instanceName: string, remoteJid?: string): Promise<void> {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (conversation && conversation.metadata) {
      const metadata = conversation.metadata as RegistrationMetadata;
      metadata.registrationStatus = 'cancelled';
      conversation.metadata = { ...conversation.metadata, ...metadata };
      await this.conversationRepository.save(conversation);
    }

    const numberToSend = remoteJid || `${phoneNumber}@s.whatsapp.net`;
    await this.evolutionApiService.sendTextMessage(
      instanceName,
      numberToSend,
      RegistrationMessagesService.getCancellationMessage(),
    );

    this.logger.info('[REGISTRATION] Cadastro cancelado', {
      conversationId,
      phoneNumber,
    });
  }

  /**
   * Reinicia cadastro
   */
  async restartRegistration(conversationId: string, phoneNumber: string, instanceName: string, remoteJid?: string): Promise<void> {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (conversation) {
      const metadata: RegistrationMetadata = {
        registrationStatus: 'pending',
        registrationData: {
          whatsappNumber: phoneNumber,
        },
      };
      conversation.metadata = { ...conversation.metadata, ...metadata };
      await this.conversationRepository.save(conversation);
    }

    const numberToSend = remoteJid || `${phoneNumber}@s.whatsapp.net`;
    await this.evolutionApiService.sendTextMessage(
      instanceName,
      numberToSend,
      RegistrationMessagesService.getRestartMessage(),
    );

    this.logger.info('[REGISTRATION] Cadastro reiniciado', {
      conversationId,
      phoneNumber,
    });
  }

  /**
   * Verifica se conversa tem cadastro em andamento
   */
  getRegistrationStatus(conversation: any): RegistrationStatus | null {
    if (!conversation?.metadata) return null;
    const metadata = conversation.metadata as RegistrationMetadata;
    const status = metadata.registrationStatus;
    
    // Log para debug
    this.logger.debug('[REGISTRATION] Status do cadastro', {
      conversationId: conversation.id,
      status,
      hasMetadata: !!conversation.metadata,
      metadataKeys: conversation.metadata ? Object.keys(conversation.metadata) : [],
    });
    
    return status || null;
  }
}

