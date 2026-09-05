import { AudioTranscriptionReconciler } from './audio-transcription.reconciler';
import { AudioTranscriptionStatus } from '../../shared/domain/entities/whatsapp-audio-transcription.entity';

/**
 * O reconciliador é o que faz a promessa "responde quando o worker voltar" ser
 * verdade. Os testes cobrem o que acontece nas bordas: worker ainda desligado,
 * job vencido, corrida entre duas instâncias e falha ao entregar a resposta.
 */

class FakeAudioService {
  due: any[] = [];
  available = true;
  claimable = true;
  transcribeResult = 'texto do audio';
  transcribeError: Error | null = null;
  expired = new Set<string>();

  markedExpired: string[] = [];
  markedDone: Array<{ id: string; text: string }> = [];
  claimed: string[] = [];

  async findDueJobs() {
    return this.due;
  }
  async isWorkerAvailable() {
    return this.available;
  }
  isExpired(job: any) {
    return this.expired.has(job.id);
  }
  async markExpired(job: any) {
    this.markedExpired.push(job.id);
    job.status = AudioTranscriptionStatus.EXPIRED;
  }
  async claim(job: any) {
    if (!this.claimable) return false;
    this.claimed.push(job.id);
    return true;
  }
  async transcribeJob() {
    if (this.transcribeError) throw this.transcribeError;
    return this.transcribeResult;
  }
  async markDone(job: any, text: string) {
    this.markedDone.push({ id: job.id, text });
    job.status = AudioTranscriptionStatus.DONE;
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
  debug() {}
}

const job = (id: string) => ({
  id,
  messageId: `msg-${id}`,
  instanceName: 'gwan_imoveis',
  remoteJid: '5511999999999@s.whatsapp.net',
  conversationId: 'conv-1',
  userId: null,
  attempts: 0,
  status: AudioTranscriptionStatus.PENDING,
});

describe('AudioTranscriptionReconciler', () => {
  let audio: FakeAudioService;
  let logger: FakeLogger;
  let reconciler: AudioTranscriptionReconciler;
  let transcribed: Array<{ messageId: string; text: string }>;
  let expiredNotices: string[];

  beforeEach(() => {
    audio = new FakeAudioService();
    logger = new FakeLogger();
    // SchedulerRegistry falso: o teste chama tick() diretamente, então o timer
    // real nunca precisa existir.
    const scheduler = { addInterval: jest.fn(), deleteInterval: jest.fn() };
    reconciler = new AudioTranscriptionReconciler(
      audio as any,
      scheduler as any,
      logger as any,
    );
    transcribed = [];
    expiredNotices = [];
    reconciler.registerHandlers({
      onTranscribed: async (j, text) => {
        transcribed.push({ messageId: j.messageId, text });
      },
      onExpired: async (j) => {
        expiredNotices.push(j.messageId);
      },
    });
  });

  it('não faz nada quando não há job pendente', async () => {
    await reconciler.tick();
    expect(audio.claimed).toHaveLength(0);
    expect(transcribed).toHaveLength(0);
  });

  it('transcreve e responde quando o worker volta', async () => {
    audio.due = [job('a')];
    await reconciler.tick();

    expect(audio.markedDone).toEqual([{ id: 'a', text: 'texto do audio' }]);
    expect(transcribed).toEqual([{ messageId: 'msg-a', text: 'texto do audio' }]);
  });

  /**
   * O estado normal: PC do mantenedor desligado. O tique tem de sair barato e
   * deixar o job onde está.
   */
  it('com worker ainda desligado, deixa o job pendente e não responde', async () => {
    audio.due = [job('a')];
    audio.available = false;

    await reconciler.tick();

    expect(audio.claimed).toHaveLength(0);
    expect(transcribed).toHaveLength(0);
    expect(audio.due[0].status).toBe(AudioTranscriptionStatus.PENDING);
  });

  /**
   * Expiração não depende de worker: um áudio vencido tem de ser resolvido de
   * qualquer jeito, senão ficaria pendente para sempre com a máquina desligada.
   */
  it('expira job vencido mesmo sem worker', async () => {
    const vencido = job('velho');
    audio.due = [vencido];
    audio.available = false;
    audio.expired.add('velho');

    await reconciler.tick();

    expect(audio.markedExpired).toEqual(['velho']);
    expect(expiredNotices).toEqual(['msg-velho']);
  });

  it('não tenta transcrever job que já expirou', async () => {
    audio.due = [job('velho')];
    audio.expired.add('velho');

    await reconciler.tick();

    expect(audio.claimed).toHaveLength(0);
    expect(transcribed).toHaveLength(0);
  });

  it('pula o job que outra instância tomou', async () => {
    audio.due = [job('a')];
    audio.claimable = false;

    await reconciler.tick();

    expect(audio.markedDone).toHaveLength(0);
    expect(transcribed).toHaveLength(0);
  });

  it('falha na transcrição mantém o job para a próxima tentativa', async () => {
    audio.due = [job('a')];
    audio.transcribeError = new Error('worker caiu no meio');

    await reconciler.tick();

    expect(audio.markedDone).toHaveLength(0);
    expect(audio.due[0].status).toBe(AudioTranscriptionStatus.PENDING);
    expect(logger.entries.some((e) => e.level === 'warn')).toBe(true);
  });

  /**
   * Se enviar a resposta falhar, o trabalho já feito não pode ser desfeito — o
   * job continua concluído e o erro fica registrado.
   */
  it('falha ao entregar a resposta não desfaz a conclusão', async () => {
    audio.due = [job('a')];
    reconciler.registerHandlers({
      onTranscribed: async () => {
        throw new Error('Evolution fora do ar');
      },
      onExpired: async () => {},
    });

    await reconciler.tick();

    expect(audio.markedDone).toHaveLength(1);
    expect(logger.entries.some((e) => e.level === 'error')).toBe(true);
  });

  it('erro inesperado não derruba o processo', async () => {
    audio.findDueJobs = async () => {
      throw new Error('banco fora');
    };
    await expect(reconciler.tick()).resolves.toBeUndefined();
    expect(logger.entries.some((e) => e.level === 'error')).toBe(true);
  });

  it('não registra o texto transcrito no log', async () => {
    audio.due = [job('a')];
    audio.transcribeResult = 'meu telefone é 11 99999-0000';

    await reconciler.tick();

    expect(JSON.stringify(logger.entries)).not.toContain('99999-0000');
  });

  it('processa vários jobs no mesmo tique', async () => {
    audio.due = [job('a'), job('b'), job('c')];
    await reconciler.tick();
    expect(transcribed.map((t) => t.messageId)).toEqual(['msg-a', 'msg-b', 'msg-c']);
  });
});
