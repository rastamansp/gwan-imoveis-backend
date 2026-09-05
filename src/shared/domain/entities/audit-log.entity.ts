import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

/** Ações registradas na trilha. Fechado de propósito: string livre vira lixo em seis meses. */
export enum AuditAction {
  PROPERTY_CREATED = 'PROPERTY_CREATED',
  PROPERTY_UPDATED = 'PROPERTY_UPDATED',
  PROPERTY_DELETED = 'PROPERTY_DELETED',
  PROPERTY_IMAGE_DELETED = 'PROPERTY_IMAGE_DELETED',
  TOUR_SCENE_DELETED = 'TOUR_SCENE_DELETED',
  USER_PROMOTED = 'USER_PROMOTED',
  LOGIN_SUCCEEDED = 'LOGIN_SUCCEEDED',
  LOGIN_FAILED = 'LOGIN_FAILED',
  CONVERSATION_ASSIGNED = 'CONVERSATION_ASSIGNED',
  CONVERSATION_CLOSED = 'CONVERSATION_CLOSED',
}

/**
 * Trilha de auditoria (F19).
 *
 * **Append-only, garantido por trigger no PostgreSQL** — não por convenção nem
 * por `if` na aplicação. Auditoria que o próprio sistema pode reescrever não é
 * auditoria: é um log com pretensões. A garantia mora no schema, que é o único
 * lugar que duas instâncias da API não conseguem contornar.
 *
 * O que a trilha guarda é **que** a ação aconteceu — ator, alvo, momento,
 * origem. Nunca o conteúdo: senha, token, corpo de mensagem de WhatsApp e texto
 * livre do corretor ficam de fora, na mesma regra que já vale para o log.
 */
@Entity({ name: 'audit_log' })
@Index(['actorId', 'createdAt'])
@Index(['entityType', 'entityId'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Nulo em tentativa de login que falhou: ali não há ator identificado. */
  @Column({ type: 'uuid', nullable: true })
  actorId: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  actorRole: string | null;

  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @Column({ type: 'varchar', length: 64 })
  entityType: string;

  @Column({ type: 'varchar', length: 128, nullable: true })
  entityId: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  ip: string | null;

  /** Só o essencial, já sanitizado. Ver `AuditLogService.sanitize`. */
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
