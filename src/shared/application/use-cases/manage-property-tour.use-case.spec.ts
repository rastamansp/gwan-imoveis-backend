import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ManagePropertyTourUseCase } from './manage-property-tour.use-case';
import { PropertyTourScene, TourHotspot } from '../../domain/entities/property-tour-scene.entity';
import { UserRole } from '../../domain/value-objects/user-role.enum';

/**
 * Fakes em memória. Nenhum mock de biblioteca: as invariantes deste use case são
 * de domínio, e um fake que se comporta como o repositório real deixa o teste
 * falhar pelo motivo certo.
 */

const PROPERTY_ID = 'prop-1';
const OTHER_PROPERTY_ID = 'prop-2';
const OWNER_ID = 'corretor-dono';
const OTHER_REALTOR_ID = 'corretor-alheio';
const ADMIN_ID = 'admin-1';
const USER_ID = 'usuario-comum';

class FakeSceneRepository {
  scenes: PropertyTourScene[] = [];
  deleted: string[] = [];
  hotspotsCleanedFor: Array<{ propertyId: string; targetSceneId: string }> = [];

  async findByPropertyId(propertyId: string): Promise<PropertyTourScene[]> {
    return this.scenes
      .filter((s) => s.propertyId === propertyId)
      .sort((a, b) => a.order - b.order);
  }

  async findById(sceneId: string): Promise<PropertyTourScene | null> {
    return this.scenes.find((s) => s.id === sceneId) ?? null;
  }

  async countByPropertyId(propertyId: string): Promise<number> {
    return this.scenes.filter((s) => s.propertyId === propertyId).length;
  }

  async save(scene: PropertyTourScene): Promise<PropertyTourScene> {
    if (!scene.id) {
      scene.id = `scene-${this.scenes.length + 1}`;
      this.scenes.push(scene);
    }
    return scene;
  }

  async delete(sceneId: string): Promise<void> {
    this.deleted.push(sceneId);
    this.scenes = this.scenes.filter((s) => s.id !== sceneId);
  }

  reorderedWith: string[][] = [];

  async reorder(propertyId: string, sceneIdsInOrder: string[]): Promise<void> {
    this.reorderedWith.push(sceneIdsInOrder);
    for (const [index, sceneId] of sceneIdsInOrder.entries()) {
      const scene = this.scenes.find((s) => s.id === sceneId && s.propertyId === propertyId);
      if (scene) scene.order = index;
    }
  }

  /**
   * Ordem importa: o use case precisa limpar os portais ANTES de apagar a cena,
   * senão o visitante clica num portal e cai numa cena inexistente. O fake
   * registra a chamada para que o teste possa provar a ordem.
   */
  async removeHotspotsTargeting(propertyId: string, targetSceneId: string): Promise<void> {
    this.hotspotsCleanedFor.push({ propertyId, targetSceneId });
    for (const scene of this.scenes) {
      if (scene.propertyId !== propertyId) continue;
      scene.hotspots = (scene.hotspots ?? []).filter((h) => h.targetSceneId !== targetSceneId);
    }
  }
}

class FakePropertyRepository {
  pdfCacheClearedFor: string[] = [];
  private properties = new Map<string, { id: string; realtorId: string }>([
    [PROPERTY_ID, { id: PROPERTY_ID, realtorId: OWNER_ID }],
    [OTHER_PROPERTY_ID, { id: OTHER_PROPERTY_ID, realtorId: OTHER_REALTOR_ID }],
  ]);

  async findById(id: string): Promise<any> {
    return this.properties.get(id) ?? null;
  }

  async clearAdPdfCache(id: string): Promise<void> {
    this.pdfCacheClearedFor.push(id);
  }
}

class FakeUserRepository {
  private users = new Map<string, { id: string; role: UserRole }>([
    [OWNER_ID, { id: OWNER_ID, role: UserRole.CORRETOR }],
    [OTHER_REALTOR_ID, { id: OTHER_REALTOR_ID, role: UserRole.CORRETOR }],
    [ADMIN_ID, { id: ADMIN_ID, role: UserRole.ADMIN }],
    [USER_ID, { id: USER_ID, role: UserRole.USER }],
  ]);

  async findById(id: string): Promise<any> {
    return this.users.get(id) ?? null;
  }
}

class FakeStorageService {
  uploaded: Array<{ fileName: string; folder?: string }> = [];
  deleted: string[] = [];
  failOnDelete = false;

  async uploadFile(_buffer: Buffer, fileName: string, folder?: string): Promise<string> {
    this.uploaded.push({ fileName, folder });
    return `${folder}/${fileName}`;
  }

  async deleteFile(filePath: string): Promise<boolean> {
    if (this.failOnDelete) {
      throw new Error('storage indisponível');
    }
    this.deleted.push(filePath);
    return true;
  }

  getFileUrl(filePath: string): string {
    return `https://storage.local/${filePath}`;
  }
}

class FakeLogger {
  entries: Array<{ level: string; message: string; context?: any }> = [];
  info(message: string, context?: any) {
    this.entries.push({ level: 'info', message, context });
  }
  warn(message: string, context?: any) {
    this.entries.push({ level: 'warn', message, context });
  }
  error(message: string, context?: any) {
    this.entries.push({ level: 'error', message, context });
  }
  debug(message: string, context?: any) {
    this.entries.push({ level: 'debug', message, context });
  }
}

describe('ManagePropertyTourUseCase', () => {
  let scenes: FakeSceneRepository;
  let properties: FakePropertyRepository;
  let users: FakeUserRepository;
  let storage: FakeStorageService;
  let logger: FakeLogger;
  let useCase: ManagePropertyTourUseCase;
  let auditoria: { record: jest.Mock };

  beforeEach(() => {
    scenes = new FakeSceneRepository();
    properties = new FakePropertyRepository();
    users = new FakeUserRepository();
    storage = new FakeStorageService();
    logger = new FakeLogger();
    // Auditoria (F19) é fire-and-forget e não afeta nenhuma invariante do tour;
    // o fake registra as chamadas para os testes que verificam o rastro.
    auditoria = { record: jest.fn() };
    useCase = new ManagePropertyTourUseCase(
      properties as any,
      scenes as any,
      users as any,
      storage as any,
      auditoria as any,
      logger as any,
    );
  });

  /** Cria uma cena já persistida, sem passar pelas validações de upload. */
  const seedScene = (
    overrides: Partial<PropertyTourScene> = {},
  ): PropertyTourScene => {
    const scene = new PropertyTourScene();
    scene.id = overrides.id ?? `scene-seed-${scenes.scenes.length + 1}`;
    scene.propertyId = overrides.propertyId ?? PROPERTY_ID;
    scene.name = overrides.name ?? 'Sala';
    scene.imagePath = overrides.imagePath ?? 'properties/prop-1/tour/sala.jpg';
    scene.imageUrl = overrides.imageUrl ?? 'https://storage.local/sala.jpg';
    scene.order = overrides.order ?? scenes.scenes.length;
    scene.initialYaw = overrides.initialYaw ?? 0;
    scene.hotspots = overrides.hotspots ?? [];
    scenes.scenes.push(scene);
    return scene;
  };

  const addScene = (input: Partial<Parameters<ManagePropertyTourUseCase['addScene']>[0]> = {}) =>
    useCase.addScene({
      propertyId: PROPERTY_ID,
      requesterId: OWNER_ID,
      name: 'Sala',
      buffer: Buffer.from('imagem'),
      fileName: 'sala.jpg',
      width: 4096,
      height: 2048,
      ...input,
    });

  // ---------------------------------------------------------------- proporção

  describe('proporção equirretangular', () => {
    it.each([
      ['exata 2:1', 4096, 2048],
      ['limite inferior da tolerância (1,85)', 3700, 2000],
      ['limite superior da tolerância (2,15)', 4300, 2000],
    ])('aceita panorâmica com proporção %s', async (_label, width, height) => {
      const scene = await addScene({ width, height });
      expect(scene.id).toBeDefined();
    });

    it.each([
      ['foto comum 16:9', 1920, 1080],
      ['acima da tolerância (2,17)', 4340, 2000],
    ])('recusa imagem com proporção %s', async (_label, width, height) => {
      await expect(addScene({ width, height })).rejects.toThrow(BadRequestException);
    });

    it('cita as dimensões enviadas e a proporção exigida na recusa', async () => {
      await expect(addScene({ width: 1920, height: 1080 })).rejects.toThrow(
        /1920x1080.*1\.78/s,
      );
    });

    // Travar aqui recusaria upload válido cujo encoder não expôs metadata.
    it('não valida proporção quando as dimensões são desconhecidas', async () => {
      const scene = await addScene({ width: undefined, height: undefined });
      expect(scene.id).toBeDefined();
    });
  });

  // -------------------------------------------------------------------- teto

  describe('teto de ambientes', () => {
    it('aceita a vigésima cena', async () => {
      for (let i = 0; i < 19; i++) seedScene({ id: `scene-${i}` });
      const scene = await addScene();
      expect(scene.id).toBeDefined();
      expect(await scenes.countByPropertyId(PROPERTY_ID)).toBe(20);
    });

    it('recusa a vigésima primeira', async () => {
      for (let i = 0; i < 20; i++) seedScene({ id: `scene-${i}` });
      await expect(addScene()).rejects.toThrow('Limite de 20 ambientes por tour atingido');
    });

    it('conta apenas as cenas do próprio imóvel', async () => {
      for (let i = 0; i < 20; i++) {
        seedScene({ id: `outro-${i}`, propertyId: OTHER_PROPERTY_ID });
      }
      const scene = await addScene();
      expect(scene.id).toBeDefined();
    });
  });

  // ------------------------------------------------------------------- nomes

  describe('nome do ambiente', () => {
    it('usa "Ambiente N" quando o nome vem vazio', async () => {
      const scene = await addScene({ name: '   ' });
      expect(scene.name).toBe('Ambiente 1');
    });

    it('trunca nome acima de 120 caracteres', async () => {
      const scene = await addScene({ name: 'x'.repeat(200) });
      expect(scene.name).toHaveLength(120);
    });

    it('recusa renomear para vazio', async () => {
      const scene = seedScene();
      await expect(
        useCase.renameScene({
          propertyId: PROPERTY_ID,
          sceneId: scene.id,
          requesterId: OWNER_ID,
          name: '   ',
        }),
      ).rejects.toThrow('O nome do ambiente não pode ser vazio');
    });
  });

  // ---------------------------------------------------------------- ordenação

  describe('ordem das cenas', () => {
    it('atribui a ordem pelo total existente, entrando no fim', async () => {
      const first = await addScene({ name: 'Sala' });
      const second = await addScene({ name: 'Varanda' });
      expect(first.order).toBe(0);
      expect(second.order).toBe(1);
    });
  });

  // ---------------------------------------------------------------- portais

  describe('portais (hotspots)', () => {
    let sala: PropertyTourScene;
    let varanda: PropertyTourScene;

    beforeEach(() => {
      sala = seedScene({ id: 'sala', name: 'Sala', order: 0 });
      varanda = seedScene({ id: 'varanda', name: 'Varanda', order: 1 });
    });

    const setHotspots = (hotspots: any[], sceneId = sala.id, requesterId = OWNER_ID) =>
      useCase.setHotspots({ propertyId: PROPERTY_ID, sceneId, requesterId, hotspots });

    it('grava portal para outra cena do mesmo imóvel', async () => {
      const updated = await setHotspots([
        { targetSceneId: varanda.id, yaw: 1, pitch: 0, label: 'Ir para a varanda' },
      ]);
      expect(updated.hotspots).toHaveLength(1);
      expect(updated.hotspots[0].targetSceneId).toBe(varanda.id);
      expect(updated.hotspots[0].id).toBeDefined();
    });

    it('recusa portal para a própria cena', async () => {
      await expect(setHotspots([{ targetSceneId: sala.id, yaw: 1, pitch: 0 }])).rejects.toThrow(
        'Um ambiente não pode ter um portal para ele mesmo',
      );
    });

    it('recusa portal para cena de outro imóvel', async () => {
      const alheia = seedScene({ id: 'alheia', propertyId: OTHER_PROPERTY_ID });
      await expect(setHotspots([{ targetSceneId: alheia.id, yaw: 1, pitch: 0 }])).rejects.toThrow(
        'A cena de destino não pertence a este imóvel',
      );
    });

    it('recusa portal para cena inexistente', async () => {
      await expect(
        setHotspots([{ targetSceneId: 'nao-existe', yaw: 1, pitch: 0 }]),
      ).rejects.toThrow('A cena de destino não pertence a este imóvel');
    });

    it.each([
      ['NaN em yaw', Number.NaN, 0],
      ['Infinity em yaw', Number.POSITIVE_INFINITY, 0],
      ['NaN em pitch', 0, Number.NaN],
    ])('recusa posição inválida: %s', async (_label, yaw, pitch) => {
      await expect(setHotspots([{ targetSceneId: varanda.id, yaw, pitch }])).rejects.toThrow(
        'Posição do portal inválida',
      );
    });

    it('normaliza yaw negativo para [0, 2π)', async () => {
      const updated = await setHotspots([{ targetSceneId: varanda.id, yaw: -1, pitch: 0 }]);
      expect(updated.hotspots[0].yaw).toBeCloseTo(Math.PI * 2 - 1, 10);
    });

    it('normaliza yaw acima de 2π', async () => {
      const updated = await setHotspots([{ targetSceneId: varanda.id, yaw: 7, pitch: 0 }]);
      expect(updated.hotspots[0].yaw).toBeCloseTo(7 - Math.PI * 2, 10);
    });

    it.each([
      ['acima do topo', 3, Math.PI / 2],
      ['abaixo do fundo', -3, -Math.PI / 2],
    ])('fixa pitch fora do intervalo (%s)', async (_label, pitch, expected) => {
      const updated = await setHotspots([{ targetSceneId: varanda.id, yaw: 0, pitch }]);
      expect(updated.hotspots[0].pitch).toBeCloseTo(expected, 10);
    });

    // A UI edita o conjunto inteiro, não o item: acumular geraria portal duplicado
    // a cada salvamento.
    it('substitui a lista inteira em vez de acumular', async () => {
      await setHotspots([{ targetSceneId: varanda.id, yaw: 1, pitch: 0 }]);
      const updated = await setHotspots([{ targetSceneId: varanda.id, yaw: 2, pitch: 0 }]);
      expect(updated.hotspots).toHaveLength(1);
      expect(updated.hotspots[0].yaw).toBeCloseTo(2, 10);
    });

    it('aceita lista vazia, removendo todos os portais', async () => {
      await setHotspots([{ targetSceneId: varanda.id, yaw: 1, pitch: 0 }]);
      const updated = await setHotspots([]);
      expect(updated.hotspots).toHaveLength(0);
    });

    it('trunca o rótulo em 60 caracteres', async () => {
      const updated = await setHotspots([
        { targetSceneId: varanda.id, yaw: 1, pitch: 0, label: 'x'.repeat(100) },
      ]);
      expect(updated.hotspots[0].label).toHaveLength(60);
    });

    it('converte rótulo vazio em null, para o visualizador usar o nome do destino', async () => {
      const updated = await setHotspots([
        { targetSceneId: varanda.id, yaw: 1, pitch: 0, label: '   ' },
      ]);
      expect(updated.hotspots[0].label).toBeNull();
    });

    it('não grava nada quando um portal da lista é inválido', async () => {
      await setHotspots([{ targetSceneId: varanda.id, yaw: 1, pitch: 0 }]);
      await expect(
        setHotspots([
          { targetSceneId: varanda.id, yaw: 2, pitch: 0 },
          { targetSceneId: sala.id, yaw: 3, pitch: 0 },
        ]),
      ).rejects.toThrow(BadRequestException);
      const persisted = await scenes.findById(sala.id);
      expect(persisted!.hotspots[0].yaw).toBeCloseTo(1, 10);
    });
  });

  // ------------------------------------------------------------ direção inicial

  describe('direção inicial', () => {
    it('normaliza o ângulo gravado', async () => {
      const scene = seedScene();
      const updated = await useCase.setInitialYaw({
        propertyId: PROPERTY_ID,
        sceneId: scene.id,
        requesterId: OWNER_ID,
        initialYaw: -1,
      });
      expect(updated.initialYaw).toBeCloseTo(Math.PI * 2 - 1, 10);
    });

    it('recusa ângulo não-finito', async () => {
      const scene = seedScene();
      await expect(
        useCase.setInitialYaw({
          propertyId: PROPERTY_ID,
          sceneId: scene.id,
          requesterId: OWNER_ID,
          initialYaw: Number.NaN,
        }),
      ).rejects.toThrow('Direção inicial inválida');
    });
  });

  // ---------------------------------------------------------------- remoção

  describe('remoção de cena', () => {
    it('limpa os portais que apontavam para a cena antes de apagá-la', async () => {
      const sala = seedScene({ id: 'sala', name: 'Sala' });
      const varanda = seedScene({ id: 'varanda', name: 'Varanda' });
      sala.hotspots = [
        { id: 'h1', targetSceneId: varanda.id, yaw: 1, pitch: 0, label: null } as TourHotspot,
      ];

      await useCase.deleteScene({
        propertyId: PROPERTY_ID,
        sceneId: varanda.id,
        requesterId: OWNER_ID,
      });

      expect(scenes.hotspotsCleanedFor).toEqual([
        { propertyId: PROPERTY_ID, targetSceneId: varanda.id },
      ]);
      const persisted = await scenes.findById(sala.id);
      expect(persisted!.hotspots).toHaveLength(0);
      expect(scenes.deleted).toContain(varanda.id);
    });

    it('apaga o arquivo do storage', async () => {
      const scene = seedScene({ imagePath: 'properties/prop-1/tour/sala.jpg' });
      await useCase.deleteScene({
        propertyId: PROPERTY_ID,
        sceneId: scene.id,
        requesterId: OWNER_ID,
      });
      expect(storage.deleted).toContain('properties/prop-1/tour/sala.jpg');
    });

    // O registro é a verdade; arquivo órfão é lixo, não inconsistência.
    it('remove a cena mesmo quando o storage falha, registrando warn', async () => {
      const scene = seedScene();
      storage.failOnDelete = true;

      await useCase.deleteScene({
        propertyId: PROPERTY_ID,
        sceneId: scene.id,
        requesterId: OWNER_ID,
      });

      expect(scenes.deleted).toContain(scene.id);
      expect(logger.entries.some((e) => e.level === 'warn')).toBe(true);
    });

    it('registra a remoção na trilha de auditoria', async () => {
      const scene = seedScene({ name: 'Varanda' });
      await useCase.deleteScene({
        propertyId: PROPERTY_ID,
        sceneId: scene.id,
        requesterId: OWNER_ID,
      });

      expect(auditoria.record).toHaveBeenCalledWith(
        expect.objectContaining({
          entityType: 'tour_scene',
          entityId: scene.id,
          actorId: OWNER_ID,
        }),
      );
    });

    it('recusa remover cena que não é do imóvel informado', async () => {
      const alheia = seedScene({ id: 'alheia', propertyId: OTHER_PROPERTY_ID });
      await expect(
        useCase.deleteScene({
          propertyId: PROPERTY_ID,
          sceneId: alheia.id,
          requesterId: OWNER_ID,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  // -------------------------------------------------------------- reordenar

  describe('reordenar ambientes', () => {
    let sala: PropertyTourScene;
    let varanda: PropertyTourScene;
    let suite: PropertyTourScene;

    beforeEach(() => {
      sala = seedScene({ id: 'sala', name: 'Sala', order: 0 });
      varanda = seedScene({ id: 'varanda', name: 'Varanda', order: 1 });
      suite = seedScene({ id: 'suite', name: 'Suíte', order: 2 });
    });

    const reorder = (sceneIds: string[], requesterId = OWNER_ID) =>
      useCase.reorderScenes({ propertyId: PROPERTY_ID, requesterId, sceneIds });

    it('a ordem passa a refletir a lista enviada', async () => {
      const result = await reorder([suite.id, sala.id, varanda.id]);
      expect(result.map((s) => s.name)).toEqual(['Suíte', 'Sala', 'Varanda']);
    });

    /**
     * A primeira posição é a porta de entrada do tour — é por ela que todo
     * visitante começa, e era isso que só se conseguia mudar apagando e
     * reenviando cenas (perdendo os portais junto).
     */
    it('a primeira posição vira a entrada do tour', async () => {
      await reorder([suite.id, sala.id, varanda.id]);
      const listed = await useCase.listScenes(PROPERTY_ID);
      expect(listed[0].name).toBe('Suíte');
      expect(listed[0].order).toBe(0);
    });

    it('preserva os portais — reordenar não é apagar e recriar', async () => {
      sala.hotspots = [
        { id: 'h1', targetSceneId: varanda.id, yaw: 1, pitch: 0, label: null } as TourHotspot,
      ];
      await reorder([varanda.id, sala.id, suite.id]);
      const persisted = await scenes.findById(sala.id);
      expect(persisted!.hotspots).toHaveLength(1);
    });

    describe('conjunto exato', () => {
      it('recusa lista incompleta', async () => {
        await expect(reorder([sala.id, varanda.id])).rejects.toThrow(BadRequestException);
      });

      it('a mensagem de lista incompleta diz quantos faltam', async () => {
        await expect(reorder([sala.id])).rejects.toThrow(/exatamente os 3 ambientes.*recebidos: 1/s);
      });

      it('recusa id repetido', async () => {
        await expect(reorder([sala.id, sala.id, varanda.id])).rejects.toThrow(
          'A lista tem ambientes repetidos',
        );
      });

      it('recusa cena de outro imóvel', async () => {
        const alheia = seedScene({ id: 'alheia', propertyId: OTHER_PROPERTY_ID });
        await expect(reorder([sala.id, varanda.id, alheia.id])).rejects.toThrow(
          'A lista contém um ambiente que não é deste imóvel',
        );
      });

      it('recusa id inexistente', async () => {
        await expect(reorder([sala.id, varanda.id, 'nao-existe'])).rejects.toThrow(
          BadRequestException,
        );
      });

      /**
       * Recusa é recusa: nada gravado. Meio caminho deixaria duas cenas na mesma
       * posição, e a posição 0 decide por onde o visitante entra.
       */
      it.each([
        ['lista incompleta', ['sala']],
        ['id repetido', ['sala', 'sala', 'varanda']],
        ['id inexistente', ['sala', 'varanda', 'fantasma']],
      ])('não grava nada quando a lista é inválida (%s)', async (_label, ids) => {
        await expect(reorder(ids as string[])).rejects.toThrow(BadRequestException);
        expect(scenes.reorderedWith).toHaveLength(0);
        const listed = await useCase.listScenes(PROPERTY_ID);
        expect(listed.map((s) => s.name)).toEqual(['Sala', 'Varanda', 'Suíte']);
      });
    });

    it('delega ao repositório em uma única chamada, para caber numa transação', async () => {
      await reorder([suite.id, sala.id, varanda.id]);
      expect(scenes.reorderedWith).toEqual([[suite.id, sala.id, varanda.id]]);
    });

    it('recusa corretor que não é dono', async () => {
      await expect(reorder([sala.id, varanda.id, suite.id], OTHER_REALTOR_ID)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('permite admin', async () => {
      const result = await reorder([suite.id, sala.id, varanda.id], ADMIN_ID);
      expect(result[0].name).toBe('Suíte');
    });

    it('invalida o cache do PDF', async () => {
      await reorder([suite.id, sala.id, varanda.id]);
      expect(properties.pdfCacheClearedFor).toContain(PROPERTY_ID);
    });
  });

  // -------------------------------------------------------------- ownership

  describe('ownership', () => {
    const escritas = (sceneId: string) => [
      [
        'addScene',
        (requesterId: string) => addScene({ requesterId }),
      ],
      [
        'renameScene',
        (requesterId: string) =>
          useCase.renameScene({ propertyId: PROPERTY_ID, sceneId, requesterId, name: 'Novo' }),
      ],
      [
        'deleteScene',
        (requesterId: string) =>
          useCase.deleteScene({ propertyId: PROPERTY_ID, sceneId, requesterId }),
      ],
      [
        'setHotspots',
        (requesterId: string) =>
          useCase.setHotspots({ propertyId: PROPERTY_ID, sceneId, requesterId, hotspots: [] }),
      ],
      [
        'setInitialYaw',
        (requesterId: string) =>
          useCase.setInitialYaw({ propertyId: PROPERTY_ID, sceneId, requesterId, initialYaw: 0 }),
      ],
    ] as Array<[string, (requesterId: string) => Promise<unknown>]>;

    it('recusa corretor que não é dono nas cinco operações de escrita', async () => {
      for (const [nome, operacao] of escritas(seedScene().id)) {
        await expect(operacao(OTHER_REALTOR_ID)).rejects.toThrow(ForbiddenException);
        expect(nome).toBeDefined();
      }
    });

    it('recusa usuário comum nas cinco operações de escrita', async () => {
      for (const [, operacao] of escritas(seedScene().id)) {
        await expect(operacao(USER_ID)).rejects.toThrow(ForbiddenException);
      }
    });

    it('permite que o admin edite imóvel de outro corretor', async () => {
      const scene = seedScene();
      const renamed = await useCase.renameScene({
        propertyId: PROPERTY_ID,
        sceneId: scene.id,
        requesterId: ADMIN_ID,
        name: 'Renomeado pelo admin',
      });
      expect(renamed.name).toBe('Renomeado pelo admin');
    });

    it('recusa requisitante inexistente', async () => {
      await expect(addScene({ requesterId: 'fantasma' })).rejects.toThrow(NotFoundException);
    });

    it('recusa escrita em imóvel inexistente', async () => {
      await expect(addScene({ propertyId: 'nao-existe' })).rejects.toThrow(NotFoundException);
    });
  });

  // -------------------------------------------------------- leitura pública

  describe('leitura pública', () => {
    it('lista as cenas em ordem, sem exigir autenticação', async () => {
      seedScene({ id: 'b', name: 'Varanda', order: 1 });
      seedScene({ id: 'a', name: 'Sala', order: 0 });

      const listed = await useCase.listScenes(PROPERTY_ID);

      expect(listed.map((s) => s.name)).toEqual(['Sala', 'Varanda']);
    });

    it('devolve lista vazia para imóvel sem tour', async () => {
      expect(await useCase.listScenes(PROPERTY_ID)).toEqual([]);
    });

    it('devolve 404 para imóvel inexistente', async () => {
      await expect(useCase.listScenes('nao-existe')).rejects.toThrow(NotFoundException);
    });
  });

  // ------------------------------------------------------------ cache do PDF

  describe('cache do anúncio em PDF', () => {
    it('é invalidado ao adicionar cena', async () => {
      await addScene();
      expect(properties.pdfCacheClearedFor).toContain(PROPERTY_ID);
    });

    it('é invalidado ao remover cena', async () => {
      const scene = seedScene();
      await useCase.deleteScene({
        propertyId: PROPERTY_ID,
        sceneId: scene.id,
        requesterId: OWNER_ID,
      });
      expect(properties.pdfCacheClearedFor).toContain(PROPERTY_ID);
    });
  });

  // ---------------------------------------------------------------- storage

  describe('upload', () => {
    it('envia sem processar a imagem, na pasta do tour do imóvel', async () => {
      await addScene({ fileName: 'sala.jpg' });
      expect(storage.uploaded).toEqual([
        { fileName: 'tour-sala.jpg', folder: `properties/${PROPERTY_ID}/tour` },
      ]);
    });
  });
});
