import { Inject, Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { AudioTranscriptionService } from './audio-transcription.service';
import { ILogger } from '../../shared/application/interfaces/logger.interface';

/**
 * Lidos em tempo de boot, não em constante de módulo.
 *
 * O decorador `@Interval(nome, ms)` exige um valor no momento do import — e o
 * `process.env` só é populado pelo `ConfigModule.forRoot()`, que roda **depois**.
 * Com o decorador, `STT_RECONCILER_INTERVAL_MS` era silenciosamente ignorado:
 * medido em 2026-09-04, o log anunciava `intervalMs: 60000` com o `.env` pedindo
 * 15000. Registrar o intervalo pelo `SchedulerRegistry` no bootstrap resolve —
 * aí a configuração já existe.
 */
const num = (name: string, fallback: number): number => {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

/**
 * Retoma os áudios que ficaram esperando worker (F18).
 *
 * Roda em intervalo, e a **primeira coisa que faz é a pergunta barata**: há
 * worker? Com o PC do mantenedor desligado — que é o estado normal — o tique
 * inteiro custa uma requisição de health e termina.
 *
 * Quem responde ao cliente é o callback registrado pelo `WhatsappWebhookService`.
 * O reconciliador não conhece bot nem Evolution: ele cuida da fila.
 */
@Injectable()
export class AudioTranscriptionReconciler implements OnApplicationBootstrap {
  private running = false;

  private onTranscribed?: (
    job: {
      instanceName: string;
      remoteJid: string;
      messageId: string;
      conversationId: string | null;
      userId: string | null;
    },
    text: string,
  ) => Promise<void>;

  private onExpired?: (job: {
    instanceName: string;
    remoteJid: string;
    messageId: string;
  }) => Promise<void>;

  constructor(
    private readonly audio: AudioTranscriptionService,
    private readonly scheduler: SchedulerRegistry,
    @Inject('ILogger') private readonly logger: ILogger,
  ) {}

  private batch = 5;

  registerHandlers(handlers: {
    onTranscribed: typeof AudioTranscriptionReconciler.prototype.onTranscribed;
    onExpired: typeof AudioTranscriptionReconciler.prototype.onExpired;
  }): void {
    this.onTranscribed = handlers.onTranscribed;
    this.onExpired = handlers.onExpired;
  }

  /**
   * Um agendador que silenciosamente não roda é indistinguível de um que roda e
   * não acha trabalho. Esta linha no boot separa os dois casos.
   */
  onApplicationBootstrap(): void {
    const intervalMs = num('STT_RECONCILER_INTERVAL_MS', 60_000);
    this.batch = num('STT_RECONCILER_BATCH', 5);

    const timer = setInterval(() => {
      void this.tick();
    }, intervalMs);
    this.scheduler.addInterval('stt-audio-reconciler', timer);

    this.logger.info('[F18] Reconciliador de áudio ativo', {
      intervalMs,
      batch: this.batch,
    });
  }

  async tick(): Promise<void> {
    // Um tique por vez: o anterior pode estar esperando uma transcrição longa.
    if (this.running) return;
    this.running = true;

    try {
      const due = await this.audio.findDueJobs(this.batch);
      if (due.length === 0) return;

      // Só depois de saber que há trabalho é que perguntamos pelo worker.
      const available = await this.audio.isWorkerAvailable();

      for (const job of due) {
        // Expirados não dependem de worker: são resolvidos de qualquer jeito.
        if (this.audio.isExpired(job)) {
          await this.audio.markExpired(job);
          this.logger.info('[F18] Áudio expirado', { messageId: job.messageId });
          await this.safely(() =>
            this.onExpired?.({
              instanceName: job.instanceName,
              remoteJid: job.remoteJid,
              messageId: job.messageId,
            }),
          );
          continue;
        }

        if (!available) continue;

        if (!(await this.audio.claim(job))) {
          // Outra instância pegou este job entre o SELECT e o UPDATE.
          continue;
        }

        try {
          const text = await this.audio.transcribeJob(job);
          await this.audio.markDone(job, text);

          this.logger.info('[F18] Áudio pendente transcrito', {
            messageId: job.messageId,
            textLength: text.length,
            attempts: job.attempts,
          });

          await this.safely(() =>
            this.onTranscribed?.(
              {
                instanceName: job.instanceName,
                remoteJid: job.remoteJid,
                messageId: job.messageId,
                conversationId: job.conversationId,
                userId: job.userId,
              },
              text,
            ),
          );
        } catch (error) {
          const reason = error instanceof Error ? error.message : String(error);
          // Continua pendente: o `claim` já agendou a próxima tentativa. Só sai
          // da fila por sucesso, expiração ou erro do próprio áudio.
          this.logger.warn('[F18] Falha ao transcrever job pendente', {
            messageId: job.messageId,
            attempts: job.attempts,
            reason,
          });
        }
      }
    } catch (error) {
      // O reconciliador nunca pode derrubar o processo.
      this.logger.error('[F18] Erro no reconciliador de áudio', {
        reason: error instanceof Error ? error.message : String(error),
      });
    } finally {
      this.running = false;
    }
  }

  /** Falha ao responder o cliente não pode desfazer o trabalho já concluído. */
  private async safely(fn: () => Promise<void> | undefined): Promise<void> {
    try {
      await fn();
    } catch (error) {
      this.logger.error('[F18] Falha ao entregar resposta de áudio', {
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
