import { Inject, Injectable } from '@nestjs/common';
import axios from 'axios';
import {
  ITranscriptionService,
  TranscriptionFailedError,
  TranscriptionResult,
  TranscriptionUnavailableError,
} from '../../application/interfaces/transcription-service.interface';
import { ILogger } from '../../application/interfaces/logger.interface';

/**
 * Adapter do `gwan-stt` (tools/gwan-stt).
 *
 * O consumo é **interno** na `gwan-network` (`http://gwan-stt:8000`) — não passa
 * pelo Traefik, então nem DNS público nem TLS entram nesta conversa.
 *
 * Duas coisas do serviço moldam este adapter:
 *
 * 1. **Não há degradação.** Sem worker consumindo a fila, o `gwan-stt` responde
 *    503 e o `/health` diz `sem-worker` em vez de mentir `ok`. Por isso
 *    `isAvailable()` lê o health e conta os workers, em vez de tentar e torcer.
 * 2. **O worker roda na máquina do mantenedor.** Ele fica desligado boa parte do
 *    tempo, e isso é estado normal — não é incidente. Todo erro aqui distingue
 *    "tente depois" (`TranscriptionUnavailableError`) de "esse áudio não presta"
 *    (`TranscriptionFailedError`), porque só o primeiro merece nova tentativa.
 */
@Injectable()
export class GwanSttTranscriptionService implements ITranscriptionService {
  private readonly baseUrl = (process.env.STT_URL || '').replace(/\/+$/, '');
  private readonly timeoutMs = Number(process.env.STT_TIMEOUT_MS || 300_000);
  private readonly healthTimeoutMs = Number(process.env.STT_HEALTH_TIMEOUT_MS || 5_000);

  constructor(@Inject('ILogger') private readonly logger: ILogger) {}

  private get configured(): boolean {
    return this.baseUrl.length > 0;
  }

  async isAvailable(): Promise<boolean> {
    const { available } = await this.status();
    return available;
  }

  /**
   * Nunca lança: quem chama precisa decidir o que fazer, não tratar exceção. Sem
   * `STT_URL` o serviço simplesmente não está configurado, e o app segue como
   * antes desta feature.
   */
  async status(): Promise<{ configured: boolean; available: boolean; detail?: string }> {
    if (!this.configured) {
      return { configured: false, available: false, detail: 'STT_URL não configurada' };
    }

    try {
      const { data } = await axios.get(`${this.baseUrl}/health`, {
        timeout: this.healthTimeoutMs,
      });

      // No papel `client`, `workers` conta quem está consumindo a fila. No papel
      // `worker` (dev local, sem fila) o campo não existe e `status: ok` basta.
      const workers = typeof data?.workers === 'number' ? data.workers : null;
      const available = workers !== null ? workers > 0 : data?.status === 'ok';

      return {
        configured: true,
        available,
        detail: available
          ? undefined
          : `gwan-stt sem worker (status=${data?.status}, workers=${workers ?? 'n/a'})`,
      };
    } catch (error) {
      return {
        configured: true,
        available: false,
        detail: `gwan-stt inacessível: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  async transcribe(input: {
    audio: Buffer;
    fileName: string;
    mimeType?: string;
    language?: string;
  }): Promise<TranscriptionResult> {
    if (!this.configured) {
      throw new TranscriptionUnavailableError('STT_URL não configurada');
    }

    const form = new FormData();
    form.append(
      'file',
      new Blob([new Uint8Array(input.audio)], { type: input.mimeType || 'audio/ogg' }),
      input.fileName,
    );
    form.append('language', input.language || 'pt');

    let response;
    try {
      response = await axios.post(`${this.baseUrl}/api/transcribe`, form, {
        timeout: this.timeoutMs,
        validateStatus: () => true,
        maxBodyLength: Infinity,
      });
    } catch (error) {
      // Rede: o serviço pode voltar. Retentável.
      throw new TranscriptionUnavailableError(
        `falha ao falar com o gwan-stt: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    if (response.status === 503) {
      // O 503 do gwan-stt é o caso esperado, não um erro do sistema: worker
      // desligado ou broker inacessível. É exatamente o que a fila existe para
      // atravessar.
      throw new TranscriptionUnavailableError(
        this.detailOf(response.data) || 'gwan-stt sem worker disponível',
      );
    }

    if (response.status >= 400) {
      // 413 (grande demais), 422 (parâmetro inválido) e afins são do áudio.
      // Repetir daria o mesmo resultado.
      throw new TranscriptionFailedError(
        `gwan-stt recusou o áudio (HTTP ${response.status}): ${this.detailOf(response.data)}`,
      );
    }

    const text = typeof response.data?.text === 'string' ? response.data.text.trim() : '';
    if (!text) {
      throw new TranscriptionFailedError('transcrição vazia');
    }

    return {
      text,
      language: response.data?.language,
      durationSeconds: response.data?.durationSeconds,
    };
  }

  private detailOf(data: any): string {
    if (!data) return '';
    if (typeof data === 'string') return data.slice(0, 200);
    return String(data.detail ?? data.message ?? '').slice(0, 200);
  }
}
