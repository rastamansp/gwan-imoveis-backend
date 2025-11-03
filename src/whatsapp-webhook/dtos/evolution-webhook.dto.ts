import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * Tipos de eventos da Evolution API
 */
export enum EvolutionEventType {
  MESSAGES_UPSERT = 'messages.upsert',
  MESSAGES_UPDATE = 'messages.update',
  MESSAGES_DELETE = 'messages.delete',
  CONNECTION_UPDATE = 'connection.update',
  QRCODE_UPDATE = 'qrcode.update',
  SEND_MESSAGE = 'send.message',
  CONTACTS_UPDATE = 'contacts.update',
  CONTACTS_UPSERT = 'contacts.upsert',
  GROUPS_UPSERT = 'groups.upsert',
  GROUPS_UPDATE = 'groups.update',
  PRESENCE_UPDATE = 'presence.update',
}

/**
 * Estrutura base do webhook da Evolution API
 * Aceita campos adicionais que o Evolution API pode enviar
 */
export class EvolutionWebhookDto {
  @ApiProperty({
    description: 'Tipo de evento recebido',
    example: 'messages.upsert',
    enum: EvolutionEventType,
  })
  @IsString()
  @IsNotEmpty()
  event: string;

  @ApiProperty({
    description: 'Nome da instância que gerou o evento',
    example: 'minha-instancia',
  })
  @IsString()
  @IsNotEmpty()
  instance: string;

  @ApiProperty({
    description: 'Dados do evento (estrutura varia conforme o tipo)',
    example: {},
  })
  @IsOptional()
  data: any;

  // Campos adicionais que o Evolution API pode enviar
  @ApiProperty({
    description: 'URL de destino do webhook',
    required: false,
  })
  @IsOptional()
  @IsString()
  destination?: string;

  @ApiProperty({
    description: 'Data e hora do evento',
    required: false,
  })
  @IsOptional()
  @IsString()
  date_time?: string;

  @ApiProperty({
    description: 'Remetente do evento (número WhatsApp)',
    required: false,
  })
  @IsOptional()
  @IsString()
  sender?: string;

  @ApiProperty({
    description: 'URL do servidor Evolution API',
    required: false,
  })
  @IsOptional()
  @IsString()
  server_url?: string;

  @ApiProperty({
    description: 'API Key do Evolution API',
    required: false,
  })
  @IsOptional()
  apikey?: string | null;
}

/**
 * DTO específico para mensagens recebidas (messages.upsert)
 */
export class MessageUpsertDto {
  @ApiProperty({ description: 'ID da mensagem' })
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };

  @ApiProperty({ description: 'Dados da mensagem' })
  message: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
    imageMessage?: any;
    videoMessage?: any;
    audioMessage?: any;
    documentMessage?: any;
  };

  @ApiProperty({ description: 'Timestamp da mensagem' })
  messageTimestamp?: number;

  @ApiProperty({ description: 'Pushname do remetente' })
  pushName?: string;
}

