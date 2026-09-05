/**
 * Porta de transcrição de áudio (F18).
 *
 * O adapter de produção é o `gwan-stt`, mas a porta não sabe disso — o que ela
 * expressa é o contrato mínimo de que o domínio precisa: descobrir se dá para
 * transcrever agora, e transcrever.
 *
 * `isAvailable()` existe separado de propósito. O `gwan-stt` **não tem plano B**:
 * sem worker vivo a resposta é 503, e o worker roda na máquina do mantenedor,
 * não no servidor. Perguntar antes é barato; mandar o áudio para descobrir custa
 * tráfego e espera para receber um erro no fim.
 */
export interface TranscriptionResult {
  text: string;
  language?: string;
  durationSeconds?: number;
}

export interface ITranscriptionService {
  /** Há worker capaz de transcrever agora? Nunca lança: indisponível é `false`. */
  isAvailable(): Promise<boolean>;

  /** Estado legível para o /health, sem derrubar nada. */
  status(): Promise<{ configured: boolean; available: boolean; detail?: string }>;

  /**
   * Transcreve o áudio. Lança `TranscriptionUnavailableError` quando não há quem
   * transcreva — o chamador distingue "tente de novo depois" de "esse áudio não
   * dá para transcrever".
   */
  transcribe(input: {
    audio: Buffer;
    fileName: string;
    mimeType?: string;
    language?: string;
  }): Promise<TranscriptionResult>;
}

/** Falta worker / serviço fora do ar. É retentável. */
export class TranscriptionUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TranscriptionUnavailableError';
  }
}

/** O áudio em si é o problema (formato, tamanho, corrompido). Não adianta repetir. */
export class TranscriptionFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TranscriptionFailedError';
  }
}
