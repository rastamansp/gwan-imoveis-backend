import { AudioTranscriptionService } from './audio-transcription.service';
import {
  AudioTranscriptionStatus,
  WhatsappAudioTranscription,
} from '../../shared/domain/entities/whatsapp-audio-transcription.entity';
import {
  TranscriptionFailedError,
  TranscriptionUnavailableError,
} from '../../shared/application/interfaces/transcription-service.interface';

/**
 * F18 — recebimento de áudio no WhatsApp.
 *
 * O que estes testes protegem é a diferença entre os dois mundos que o
 * `gwan-stt` obriga a separar: "não há worker agora" (retentável, o áudio
 * precisa sobreviver) e "esse áudio não presta" (terminal, repetir não ajuda).
 * Confundir os dois faz o áudio do cliente sumir em silêncio ou a fila crescer
 * para sempre.
 */

const AUDIO = Buffer.from('bytes-de-audio-fake');
const BASE64 = AUDIO.toString('base64');

class FakeJobRepository {
  rows: WhatsappAudioTranscription[] = [];

  create(data: Partial<WhatsappAudioTranscription>): WhatsappAudioTranscription {
    const job = new WhatsappAudioTranscription();
    Object.assign(job, {
      attempts: 0,
      sizeBytes: 0,
      status: AudioTranscriptionStatus.PENDING,
      createdAt: new Date(),
      ...data,
    });
    return job;
  }

  async findOne({ where }: any): Promise<WhatsappAudioTranscription | null> {
    return this.rows.find((r) => r.messageId === where.messageId) ?? null;
  }

  async save(job: WhatsappAudioTranscription): Promise<WhatsappAudioTranscription> {
    if (!job.id) {
      job.id = `job-${this.rows.length + 1}`;
      this.rows.push(job);
    }
    return job;
  }

  async find(): Promise<WhatsappAudioTranscription[]> {
    return this.rows.filter((r) => r.status === AudioTranscriptionStatus.PENDING);
  }

  createQueryBuilder() {
    const self = this;
    let target: any = {};
    return {
      update() {
        return this;
      },
      set(values: any) {
        target.values = values;
        return this;
      },
      where(_sql: string, params: any) {
        target.params = params;
        return this;
      },
      async execute() {
        const row = self.rows.find(
          (r) =>
            r.id === target.params.id &&
            r.status === target.params.status &&
            r.attempts === target.params.attempts,
        );
        if (!row) return { affected: 0 };
        row.attempts += 1;
        return { affected: 1 };
      },
    } as any;
  }
}

class FakeTranscription {
  available = true;
  result = { text: 'quero uma casa com piscina em maresias' };
  throwOnTranscribe: Error | null = null;
  calls = 0;

  async isAvailable() {
    return this.available;
  }
  async status() {
    return { configured: true, available: this.available };
  }
  async transcribe() {
    this.calls++;
    if (this.throwOnTranscribe) throw this.throwOnTranscribe;
    return this.result;
  }
}

class FakeLogger {
  entries: any[] = [];
  info(m: string, c?: any) {
    this.entries.push({ level: 'info', m, c });
  }
  warn(m: string, c?: any) {
    this.entries.push({ level: 'warn', m, c });
  }
  error(m: string, c?: any) {
    this.entries.push({ level: 'error', m, c });
  }
  debug(m: string, c?: any) {
    this.entries.push({ level: 'debug', m, c });
  }
}

describe('AudioTranscriptionService', () => {
  let jobs: FakeJobRepository;
  let stt: FakeTranscription;
  let logger: FakeLogger;
  let service: AudioTranscriptionService;

  beforeEach(() => {
    jobs = new FakeJobRepository();
    stt = new FakeTranscription();
    logger = new FakeLogger();
    service = new AudioTranscriptionService(jobs as any, stt as any, logger as any);
  });

  const input = (overrides: any = {}) => ({
    messageId: 'msg-1',
    instanceName: 'gwan_imoveis',
    remoteJid: '5511999999999@s.whatsapp.net',
    phoneNumber: '5511999999999',
    conversationId: 'conv-1',
    userId: null,
    audioMessage: { mimetype: 'audio/ogg; codecs=opus' },
    rawMessage: { message: { base64: BASE64 } },
    ...overrides,
  });

  // ------------------------------------------------------------ extração

  describe('extração do áudio', () => {
    it('lê o base64 do payload do webhook', async () => {
      const extracted = await service.extractAudio(input());
      expect(extracted?.audio.equals(AUDIO)).toBe(true);
      expect(extracted?.source).toBe('webhook-base64');
    });

    it('aceita base64 na forma data-uri', async () => {
      const extracted = await service.extractAudio(
        input({ rawMessage: { base64: `data:audio/ogg;base64,${BASE64}` } }),
      );
      expect(extracted?.audio.equals(AUDIO)).toBe(true);
    });

    it('aceita base64 dentro do próprio audioMessage', async () => {
      const extracted = await service.extractAudio(
        input({
          rawMessage: {},
          audioMessage: { mimetype: 'audio/ogg', base64: BASE64 },
        }),
      );
      expect(extracted?.audio.equals(AUDIO)).toBe(true);
    });

    it('preserva o mimetype informado pela Evolution', async () => {
      const extracted = await service.extractAudio(input());
      expect(extracted?.mimeType).toBe('audio/ogg; codecs=opus');
    });

    it('devolve null quando não há áudio em lugar nenhum', async () => {
      const extracted = await service.extractAudio(
        input({ rawMessage: {}, audioMessage: {} }),
      );
      expect(extracted).toBeNull();
    });
  });

  // ---------------------------------------------------------- caminho feliz

  describe('com worker disponível', () => {
    it('transcreve na hora e devolve o texto para o bot', async () => {
      const outcome = await service.receiveAudio(input());
      expect(outcome.text).toBe('quero uma casa com piscina em maresias');
      expect(outcome.status).toBe(AudioTranscriptionStatus.DONE);
    });

    it('apaga os bytes do áudio ao concluir', async () => {
      await service.receiveAudio(input());
      expect(jobs.rows[0].audio).toBeNull();
      expect(jobs.rows[0].transcribedText).toBeTruthy();
    });

    it('registra o tamanho original mesmo depois de apagar os bytes', async () => {
      await service.receiveAudio(input());
      expect(jobs.rows[0].sizeBytes).toBe(AUDIO.length);
    });
  });

  // -------------------------------------------------------------- sem worker

  describe('sem worker disponível', () => {
    beforeEach(() => {
      stt.available = false;
    });

    it('enfileira o áudio e não devolve texto', async () => {
      const outcome = await service.receiveAudio(input());
      expect(outcome.text).toBeNull();
      expect(outcome.status).toBe(AudioTranscriptionStatus.PENDING);
      expect(outcome.reason).toBe('sem-worker');
    });

    it('preserva os bytes para a retentativa', async () => {
      await service.receiveAudio(input());
      expect(jobs.rows[0].audio?.equals(AUDIO)).toBe(true);
    });

    it('agenda a próxima tentativa', async () => {
      await service.receiveAudio(input());
      expect(jobs.rows[0].nextAttemptAt).toBeInstanceOf(Date);
    });

    /**
     * A pergunta barata existe para isso: com a máquina desligada, nem tenta
     * subir o áudio.
     */
    it('não chega a chamar a transcrição', async () => {
      await service.receiveAudio(input());
      expect(stt.calls).toBe(0);
    });
  });

  // ----------------------------------------------------------- idempotência

  describe('reentrega do webhook', () => {
    it('não cria um segundo job para o mesmo messageId', async () => {
      await service.receiveAudio(input());
      await service.receiveAudio(input());
      expect(jobs.rows).toHaveLength(1);
    });

    it('sinaliza duplicado, para o cliente não receber duas respostas', async () => {
      await service.receiveAudio(input());
      const second = await service.receiveAudio(input());
      expect(second.reason).toBe('duplicado');
      expect(second.text).toBeNull();
    });

    it('não transcreve de novo na reentrega', async () => {
      await service.receiveAudio(input());
      const antes = stt.calls;
      await service.receiveAudio(input());
      expect(stt.calls).toBe(antes);
    });
  });

  // ------------------------------------------------------- erros distintos

  describe('distinção entre erro retentável e terminal', () => {
    it('erro de indisponibilidade mantém o job pendente com o áudio', async () => {
      stt.throwOnTranscribe = new TranscriptionUnavailableError('sem worker');
      const outcome = await service.receiveAudio(input());
      expect(outcome.status).toBe(AudioTranscriptionStatus.PENDING);
      expect(jobs.rows[0].audio?.equals(AUDIO)).toBe(true);
    });

    it('erro do próprio áudio encerra o job e descarta os bytes', async () => {
      stt.throwOnTranscribe = new TranscriptionFailedError('formato não suportado');
      const outcome = await service.receiveAudio(input());
      expect(outcome.status).toBe(AudioTranscriptionStatus.FAILED);
      expect(jobs.rows[0].audio).toBeNull();
    });

    it('áudio irrecuperável do payload falha sem guardar bytes', async () => {
      const outcome = await service.receiveAudio(
        input({ rawMessage: {}, audioMessage: {} }),
      );
      expect(outcome.status).toBe(AudioTranscriptionStatus.FAILED);
      expect(jobs.rows[0].audio).toBeNull();
    });
  });

  // -------------------------------------------------------------- claim

  describe('tomada do job (UPDATE condicional)', () => {
    /**
     * Duas instâncias da API carregam **cópias independentes** da mesma linha —
     * é assim que a corrida acontece de verdade. A primeira a executar o UPDATE
     * incrementa `attempts`; a cópia da outra fica velha e o `WHERE` não casa.
     */
    it('só uma das instâncias concorrentes leva o job', async () => {
      stt.available = false;
      await service.receiveAudio(input());
      const persistido = jobs.rows[0];

      const instanciaA = { ...persistido } as WhatsappAudioTranscription;
      const instanciaB = { ...persistido } as WhatsappAudioTranscription;

      expect(await service.claim(instanciaA)).toBe(true);
      expect(await service.claim(instanciaB)).toBe(false);
    });

    it('o contador em memória acompanha o incremento do banco', async () => {
      stt.available = false;
      await service.receiveAudio(input());
      const job = { ...jobs.rows[0] } as WhatsappAudioTranscription;

      await service.claim(job);

      // Sem isto, um save() posterior devolveria o contador ao valor anterior.
      expect(job.attempts).toBe(1);
    });
  });

  // ---------------------------------------------------------- privacidade

  describe('privacidade', () => {
    it('não registra o texto transcrito no log', async () => {
      stt.result = { text: 'meu nome é Maria e meu telefone é 11 99999-0000' };
      await service.receiveAudio(input());

      const serializado = JSON.stringify(logger.entries);
      expect(serializado).not.toContain('Maria');
      expect(serializado).not.toContain('99999-0000');
    });

    it('registra apenas metadados do áudio', async () => {
      await service.receiveAudio(input());
      const serializado = JSON.stringify(logger.entries);
      expect(serializado).toContain('sizeBytes');
      expect(serializado).not.toContain(BASE64);
    });
  });
});
