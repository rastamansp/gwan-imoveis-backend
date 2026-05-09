/**
 * DTOs que espelham as respostas relevantes da Evolution API (v2)
 * para o fluxo de gerenciamento de instâncias por usuário.
 *
 * Mantemos apenas os campos que o front consome — o payload completo
 * da Evolution tem dezenas de propriedades irrelevantes para nós.
 */

export type EvolutionConnectionStatus = 'open' | 'close' | 'connecting';

export interface EvolutionInstanceDto {
  id: string;
  name: string;
  connectionStatus: EvolutionConnectionStatus;
  ownerJid?: string | null;
  profileName?: string | null;
  profilePicUrl?: string | null;
  number?: string | null;
  integration?: string | null;
}

export interface EvolutionConnectDto {
  pairingCode: string | null;
  code: string | null;
  base64: string | null;
  count?: number;
}

export interface EvolutionCreateInstanceInput {
  instanceName: string;
  integration: 'WHATSAPP-BAILEYS';
  webhook?: EvolutionWebhookConfig;
}

/**
 * Lista canônica de eventos Evolution v2 que o webhook pode receber.
 * Mantida aqui só como referência — o default que efetivamente subscrevemos
 * fica em `EvolutionApiService` (apenas `MESSAGES_UPSERT`).
 */
export type EvolutionWebhookEvent =
  | 'APPLICATION_STARTUP'
  | 'QRCODE_UPDATED'
  | 'MESSAGES_SET'
  | 'MESSAGES_UPSERT'
  | 'MESSAGES_UPDATE'
  | 'MESSAGES_DELETE'
  | 'SEND_MESSAGE'
  | 'CONTACTS_SET'
  | 'CONTACTS_UPSERT'
  | 'CONTACTS_UPDATE'
  | 'PRESENCE_UPDATE'
  | 'CHATS_SET'
  | 'CHATS_UPSERT'
  | 'CHATS_UPDATE'
  | 'CHATS_DELETE'
  | 'GROUPS_UPSERT'
  | 'GROUP_UPDATE'
  | 'GROUP_PARTICIPANTS_UPDATE'
  | 'CONNECTION_UPDATE'
  | 'LABELS_EDIT'
  | 'LABELS_ASSOCIATION'
  | 'CALL'
  | 'TYPEBOT_START'
  | 'TYPEBOT_CHANGE_STATUS';

export interface EvolutionWebhookConfig {
  url: string;
  byEvents?: boolean;
  base64?: boolean;
  events: EvolutionWebhookEvent[];
}
