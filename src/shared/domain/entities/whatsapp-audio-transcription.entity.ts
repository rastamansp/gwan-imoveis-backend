import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum AudioTranscriptionStatus {
  /** Aguardando worker de transcrição. É o estado normal com o PC do mantenedor desligado. */
  PENDING = 'PENDING',
  /** Transcrito e respondido. */
  DONE = 'DONE',
  /** O áudio em si é o problema (grande demais, formato, corrompido). Não se repete. */
  FAILED = 'FAILED',
  /** Esperou além do TTL. Respondido com pedido de texto. */
  EXPIRED = 'EXPIRED',
}

/**
 * Job de transcrição de um áudio recebido pelo WhatsApp (F18).
 *
 * **Por que o áudio mora aqui e não no MinIO:** o bucket do Imóveis é criado com
 * política de leitura pública (serve foto de anúncio). Áudio de cliente é a voz
 * de uma pessoa dizendo o que procura e quanto pode pagar — num bucket público
 * isso é vazamento, não armazenamento. Como o áudio é temporário por natureza
 * (existe só enquanto o job está pendente), guardá-lo na própria linha o mantém
 * privado por construção e faz ele sumir junto com o job.
 *
 * **Por que o estado vive no PostgreSQL e não no Redis:** o Redis da P0 é cache
 * `allkeys-lru` e pode despejar a chave a qualquer momento. Perder o job faria o
 * áudio do cliente desaparecer em silêncio. Mesma decisão do `gwan-closer` na
 * importação de histórico, pelo mesmo motivo.
 */
@Entity({ name: 'whatsapp_audio_transcriptions' })
@Index(['status', 'nextAttemptAt'])
export class WhatsappAudioTranscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Id da mensagem na Evolution. **Único**: reentrega de webhook é normal, e sem
   * essa restrição o mesmo áudio seria transcrito e respondido duas vezes.
   */
  @Column({ type: 'varchar', length: 255, unique: true })
  messageId: string;

  @Column({ type: 'uuid', nullable: true })
  conversationId: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  phoneNumber: string | null;

  @Column({ type: 'varchar', length: 255 })
  instanceName: string;

  /** `remoteJid` original — é por ele que a Evolution envia a resposta. */
  @Column({ type: 'varchar', length: 255 })
  remoteJid: string;

  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  /** Apagado ao atingir qualquer estado terminal. */
  @Column({ type: 'bytea', nullable: true })
  audio: Buffer | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  mimeType: string | null;

  @Column({ type: 'int', default: 0 })
  sizeBytes: number;

  @Column({
    type: 'enum',
    enum: AudioTranscriptionStatus,
    default: AudioTranscriptionStatus.PENDING,
  })
  status: AudioTranscriptionStatus;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  /**
   * `timestamptz`, e não `timestamp`, porque esta coluna é comparada com relógio.
   * Com `timestamp without time zone`, app e banco em fusos diferentes deslocam
   * o agendamento em silêncio — medido em 2026-09-04: o Postgres do container
   * responde em UTC e o Node local em BRT, três horas de diferença que faziam um
   * job vencido parecer futuro.
   */
  @Column({ type: 'timestamptz', nullable: true })
  nextAttemptAt: Date | null;

  /** Guardado para a inbox; não vai para log. */
  @Column({ type: 'text', nullable: true })
  transcribedText: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  lastError: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  public isTerminal(): boolean {
    return this.status !== AudioTranscriptionStatus.PENDING;
  }
}
