import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import axios from 'axios';
import {
  AudioTranscriptionStatus,
  WhatsappAudioTranscription,
} from '../../shared/domain/entities/whatsapp-audio-transcription.entity';
import {
  ITranscriptionService,
  TranscriptionUnavailableError,
} from '../../shared/application/interfaces/transcription-service.interface';
import { ILogger } from '../../shared/application/interfaces/logger.interface';

export interface AudioJobInput {
  messageId: string;
  instanceName: string;
  remoteJid: string;
  phoneNumber: string | null;
  conversationId: string | null;
  userId: string | null;
  audioMessage: any;
  /** Payload cru da mensagem — o base64 pode chegar em vários lugares. */
  rawMessage: any;
}

/**
 * Lidas em tempo de chamada, e não em constante de módulo.
 *
 * `ConfigModule.forRoot()` só popula `process.env` quando o `AppModule` é
 * avaliado — depois do import destes arquivos. Uma constante no topo do módulo
 * congelaria o default e **ignoraria a configuração em silêncio**, que é o pior
 * modo de uma variável de ambiente falhar.
 */
const num = (name: string, fallback: number): number => {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const maxAudioMb = () => num('STT_MAX_AUDIO_MB', 25);
const maxAttempts = () => num('STT_MAX_ATTEMPTS', 60);
const retryBackoffSeconds = () => num('STT_RETRY_BACKOFF_SECONDS', 120);
const pendingTtlHours = () => num('STT_PENDING_TTL_HOURS', 6);

/**
 * Recebimento de áudio no WhatsApp (F18).
 *
 * Trata dois mundos que o `gwan-stt` obriga a separar:
 *
 * - **Há worker** → transcreve na hora, e o áudio vira uma mensagem de texto
 *   normal para o bot. O caminho feliz não passa pela fila.
 * - **Não há worker** → o job fica pendente com o áudio guardado, e o
 *   reconciliador responde quando a máquina do mantenedor voltar.
 *
 * O segundo caso é o estado *normal*, não um incidente: o worker roda no PC do
 * mantenedor e fica desligado boa parte do tempo.
 */
@Injectable()
export class AudioTranscriptionService {
  constructor(
    @InjectRepository(WhatsappAudioTranscription)
    private readonly jobs: Repository<WhatsappAudioTranscription>,
    @Inject('ITranscriptionService')
    private readonly transcription: ITranscriptionService,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  // ------------------------------------------------------------ extração

  /**
   * Tira os bytes do áudio do payload do webhook.
   *
   * ⚠️ **A origem do binário não estava documentada.** A instância é criada com
   * `base64: true` no `MESSAGES_UPSERT`, o que deveria trazer o áudio no próprio
   * payload — mas o DTO declarava `audioMessage?: any` e nenhum áudio real havia
   * passado por aqui (log de produção de 720h: zero ocorrências). Então tentamos
   * as duas rotas conhecidas, **na ordem barata primeiro**, e registramos qual
   * funcionou: o primeiro áudio real em produção resolve a dúvida sozinho.
   */
  async extractAudio(
    input: AudioJobInput,
  ): Promise<{ audio: Buffer; mimeType: string; source: string } | null> {
    const mimeType = input.audioMessage?.mimetype || 'audio/ogg';

    // Rota 1: base64 no próprio payload (esperada com `base64: true`).
    const inline =
      input.rawMessage?.base64 ??
      input.rawMessage?.message?.base64 ??
      input.audioMessage?.base64;

    if (typeof inline === 'string' && inline.length > 0) {
      const audio = this.decodeBase64(inline);
      if (audio) return { audio, mimeType, source: 'webhook-base64' };
    }

    // Rota 2: pedir à Evolution. Só se a primeira não trouxe nada.
    const fetched = await this.fetchFromEvolution(input);
    if (fetched) return { audio: fetched, mimeType, source: 'evolution-api' };

    return null;
  }

  private decodeBase64(value: string): Buffer | null {
    try {
      // Aceita tanto o base64 puro quanto a forma `data:audio/ogg;base64,...`.
      const payload = value.includes(',') ? value.slice(value.indexOf(',') + 1) : value;
      const buffer = Buffer.from(payload, 'base64');
      return buffer.length > 0 ? buffer : null;
    } catch {
      return null;
    }
  }

  private async fetchFromEvolution(input: AudioJobInput): Promise<Buffer | null> {
    const baseUrl = (process.env.EVOLUTION_INSTANCE_URL || '').replace(/\/+$/, '');
    const apiKey = process.env.EVOLUTION_API_KEY;
    if (!baseUrl || !apiKey) return null;

    try {
      const { data, status } = await axios.post(
        `${baseUrl}/chat/getBase64FromMediaMessage/${input.instanceName}`,
        { message: { key: { id: input.messageId } }, convertToMp4: false },
        {
          headers: { apikey: apiKey, 'Content-Type': 'application/json' },
          timeout: 30_000,
          validateStatus: () => true,
        },
      );

      if (status >= 400 || !data?.base64) {
        this.logger.warn('[F18] Evolution não devolveu o áudio', {
          messageId: input.messageId,
          status,
        });
        return null;
      }

      return this.decodeBase64(data.base64);
    } catch (error) {
      this.logger.warn('[F18] Falha ao buscar áudio na Evolution', {
        messageId: input.messageId,
        reason: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  // ---------------------------------------------------------- recebimento

  /**
   * Registra o áudio e tenta transcrever agora.
   *
   * Devolve o texto quando dá para responder de imediato; `null` significa "o
   * job ficou pendente ou não deu" — e quem chama **não** deve mandar nada ao bot.
   */
  async receiveAudio(input: AudioJobInput): Promise<{
    text: string | null;
    status: AudioTranscriptionStatus;
    reason?: string;
  }> {
    // Idempotência: reentrega de webhook não pode virar segundo job.
    const existing = await this.jobs.findOne({ where: { messageId: input.messageId } });
    if (existing) {
      this.logger.info('[F18] Áudio já registrado, ignorando reentrega', {
        messageId: input.messageId,
        status: existing.status,
      });
      return { text: null, status: existing.status, reason: 'duplicado' };
    }

    const extracted = await this.extractAudio(input);

    const job = this.jobs.create({
      messageId: input.messageId,
      instanceName: input.instanceName,
      remoteJid: input.remoteJid,
      phoneNumber: input.phoneNumber,
      conversationId: input.conversationId,
      userId: input.userId,
      mimeType: extracted?.mimeType ?? null,
      sizeBytes: extracted?.audio.length ?? 0,
      attempts: 0,
      // Explícito, não por default: "estado terminal não guarda bytes" é
      // invariante da feature, e invariante que depende de campo não preenchido
      // é invariante que ninguém enxerga ao ler o código.
      audio: null,
    });

    if (!extracted) {
      job.status = AudioTranscriptionStatus.FAILED;
      job.lastError = 'não foi possível obter o áudio (nem no webhook, nem na Evolution)';
      await this.jobs.save(job);
      return { text: null, status: job.status, reason: job.lastError };
    }

    this.logger.info('[F18] Áudio recebido', {
      messageId: input.messageId,
      sizeBytes: extracted.audio.length,
      source: extracted.source,
    });

    // Teto de tamanho: acima dele o job nasce falho e nenhum byte é gravado.
    if (extracted.audio.length > maxAudioMb() * 1024 * 1024) {
      job.status = AudioTranscriptionStatus.FAILED;
      job.lastError = `áudio acima de ${maxAudioMb()}MB`;
      await this.jobs.save(job);
      return { text: null, status: job.status, reason: job.lastError };
    }

    // Pergunta barata antes de gastar tráfego e espera para receber 503.
    const available = await this.transcription.isAvailable();
    if (!available) {
      job.status = AudioTranscriptionStatus.PENDING;
      job.audio = extracted.audio;
      job.nextAttemptAt = new Date(Date.now() + retryBackoffSeconds() * 1000);
      await this.jobs.save(job);
      this.logger.info('[F18] Sem worker; áudio enfileirado', {
        messageId: input.messageId,
      });
      return { text: null, status: job.status, reason: 'sem-worker' };
    }

    try {
      const result = await this.transcription.transcribe({
        audio: extracted.audio,
        fileName: `${input.messageId}.ogg`,
        mimeType: extracted.mimeType,
      });

      job.status = AudioTranscriptionStatus.DONE;
      job.transcribedText = result.text;
      job.audio = null; // terminal: os bytes somem
      job.attempts = 1;
      await this.jobs.save(job);

      this.logger.info('[F18] Áudio transcrito', {
        messageId: input.messageId,
        // Nunca o texto: só o tamanho.
        textLength: result.text.length,
      });

      return { text: result.text, status: job.status };
    } catch (error) {
      const retryable = error instanceof TranscriptionUnavailableError;
      job.attempts = 1;
      job.lastError = (error instanceof Error ? error.message : String(error)).slice(0, 500);

      if (retryable) {
        job.status = AudioTranscriptionStatus.PENDING;
        job.audio = extracted.audio;
        job.nextAttemptAt = new Date(Date.now() + retryBackoffSeconds() * 1000);
      } else {
        job.status = AudioTranscriptionStatus.FAILED;
        job.audio = null;
      }

      await this.jobs.save(job);
      return { text: null, status: job.status, reason: job.lastError };
    }
  }

  // -------------------------------------------------------- reconciliação

  /** Jobs pendentes cuja hora chegou. */
  async findDueJobs(limit = 10): Promise<WhatsappAudioTranscription[]> {
    return this.jobs.find({
      where: {
        status: AudioTranscriptionStatus.PENDING,
        nextAttemptAt: LessThanOrEqual(new Date()),
      },
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  /**
   * Toma o job para si, por **UPDATE condicional**. Duas instâncias da API não
   * coordenam entre si; sem isso, as duas responderiam o mesmo áudio.
   */
  async claim(job: WhatsappAudioTranscription): Promise<boolean> {
    const result = await this.jobs
      .createQueryBuilder()
      .update(WhatsappAudioTranscription)
      .set({
        attempts: () => '"attempts" + 1',
        nextAttemptAt: new Date(Date.now() + retryBackoffSeconds() * 1000),
      })
      .where('id = :id AND status = :status AND attempts = :attempts', {
        id: job.id,
        status: AudioTranscriptionStatus.PENDING,
        attempts: job.attempts,
      })
      .execute();

    const claimed = (result.affected ?? 0) > 0;
    if (claimed) {
      // O UPDATE incrementou no banco; sem isto o objeto em memória fica velho e
      // um `save()` posterior devolveria o contador ao valor anterior.
      job.attempts += 1;
    }
    return claimed;
  }

  isExpired(job: WhatsappAudioTranscription): boolean {
    const ageHours = (Date.now() - new Date(job.createdAt).getTime()) / 3_600_000;
    return ageHours >= pendingTtlHours() || job.attempts >= maxAttempts();
  }

  async markExpired(job: WhatsappAudioTranscription): Promise<void> {
    job.status = AudioTranscriptionStatus.EXPIRED;
    job.audio = null;
    job.lastError = `expirado após ${pendingTtlHours()}h ou ${maxAttempts()} tentativas`;
    await this.jobs.save(job);
  }

  async markDone(job: WhatsappAudioTranscription, text: string): Promise<void> {
    job.status = AudioTranscriptionStatus.DONE;
    job.transcribedText = text;
    job.audio = null;
    await this.jobs.save(job);
  }

  async markFailed(job: WhatsappAudioTranscription, reason: string): Promise<void> {
    job.status = AudioTranscriptionStatus.FAILED;
    job.audio = null;
    job.lastError = reason.slice(0, 500);
    await this.jobs.save(job);
  }

  async transcribeJob(job: WhatsappAudioTranscription): Promise<string> {
    if (!job.audio) {
      throw new Error('job sem áudio guardado');
    }
    const result = await this.transcription.transcribe({
      audio: job.audio,
      fileName: `${job.messageId}.ogg`,
      mimeType: job.mimeType || 'audio/ogg',
    });
    return result.text;
  }

  isWorkerAvailable(): Promise<boolean> {
    return this.transcription.isAvailable();
  }

  status() {
    return this.transcription.status();
  }
}
