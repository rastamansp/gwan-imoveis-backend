import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { IPropertyRepository } from '../../domain/interfaces/property-repository.interface';
import { IPropertyTourSceneRepository } from '../../domain/interfaces/property-tour-scene-repository.interface';
import { IUserRepository } from '../../domain/interfaces/user-repository.interface';
import { IStorageService } from '../interfaces/storage-service.interface';
import { ILogger } from '../interfaces/logger.interface';
import { UserRole } from '../../domain/value-objects/user-role.enum';
import { PropertyTourScene, TourHotspot } from '../../domain/entities/property-tour-scene.entity';

/**
 * Equirretangular tem proporção 2:1 (360° na horizontal, 180° na vertical).
 * Tolerância folgada porque encoders variam alguns pixels; o alvo é barrar a
 * foto comum enviada por engano, que viraria um borrão esticado.
 */
const EQUIRECTANGULAR_RATIO = 2;
const RATIO_TOLERANCE = 0.15;
const MAX_SCENES_PER_PROPERTY = 20;

interface HotspotInput {
  targetSceneId: string;
  yaw: number;
  pitch: number;
  label?: string | null;
}

@Injectable()
export class ManagePropertyTourUseCase {
  constructor(
    @Inject('IPropertyRepository')
    private readonly propertyRepository: IPropertyRepository,
    @Inject('IPropertyTourSceneRepository')
    private readonly sceneRepository: IPropertyTourSceneRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IStorageService')
    private readonly storageService: IStorageService,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  /** Leitura pública: o tour aparece na página do imóvel para qualquer visitante. */
  async listScenes(propertyId: string): Promise<PropertyTourScene[]> {
    const property = await this.propertyRepository.findById(propertyId);
    if (!property) {
      throw new NotFoundException('Imóvel não encontrado');
    }
    return this.sceneRepository.findByPropertyId(propertyId);
  }

  async addScene(input: {
    propertyId: string;
    requesterId: string;
    name: string;
    buffer: Buffer;
    fileName: string;
    width?: number;
    height?: number;
  }): Promise<PropertyTourScene> {
    const { propertyId, requesterId, name, buffer, fileName, width, height } = input;

    await this.assertCanEdit(propertyId, requesterId);
    this.assertEquirectangular(width, height);

    const existingCount = await this.sceneRepository.countByPropertyId(propertyId);
    if (existingCount >= MAX_SCENES_PER_PROPERTY) {
      throw new BadRequestException(`Limite de ${MAX_SCENES_PER_PROPERTY} ambientes por tour atingido`);
    }

    // Sobe sem processamento: redimensionar quebraria a projeção equirretangular.
    const imagePath = await this.storageService.uploadFile(
      buffer,
      `tour-${fileName}`,
      `properties/${propertyId}/tour`,
    );

    const scene = new PropertyTourScene();
    scene.propertyId = propertyId;
    scene.name = name.trim().slice(0, 120) || `Ambiente ${existingCount + 1}`;
    scene.imagePath = imagePath;
    scene.imageUrl = this.storageService.getFileUrl(imagePath);
    scene.order = existingCount;
    scene.initialYaw = 0;
    scene.hotspots = [];

    const saved = await this.sceneRepository.save(scene);
    await this.propertyRepository.clearAdPdfCache(propertyId);

    this.logger.info('[Tour] Cena adicionada', { propertyId, sceneId: saved.id, name: saved.name });

    return saved;
  }

  async renameScene(input: {
    propertyId: string;
    sceneId: string;
    requesterId: string;
    name: string;
  }): Promise<PropertyTourScene> {
    const { propertyId, sceneId, requesterId, name } = input;

    await this.assertCanEdit(propertyId, requesterId);
    const scene = await this.getSceneOfProperty(propertyId, sceneId);

    const trimmed = name.trim();
    if (!trimmed) {
      throw new BadRequestException('O nome do ambiente não pode ser vazio');
    }

    scene.name = trimmed.slice(0, 120);
    return this.sceneRepository.save(scene);
  }

  async deleteScene(input: { propertyId: string; sceneId: string; requesterId: string }): Promise<void> {
    const { propertyId, sceneId, requesterId } = input;

    await this.assertCanEdit(propertyId, requesterId);
    const scene = await this.getSceneOfProperty(propertyId, sceneId);

    // Primeiro os hotspots que apontam para ela: um portal para cena inexistente
    // levaria o visitante a uma tela vazia.
    await this.sceneRepository.removeHotspotsTargeting(propertyId, sceneId);
    await this.sceneRepository.delete(sceneId);

    if (scene.imagePath) {
      try {
        await this.storageService.deleteFile(scene.imagePath);
      } catch (error) {
        this.logger.warn('[Tour] Não foi possível remover o arquivo da cena no storage', {
          propertyId,
          sceneId,
          reason: error instanceof Error ? error.message : String(error),
        });
      }
    }

    await this.propertyRepository.clearAdPdfCache(propertyId);
    this.logger.info('[Tour] Cena removida', { propertyId, sceneId });
  }

  /** Substitui a lista inteira de hotspots da cena (a UI edita o conjunto). */
  async setHotspots(input: {
    propertyId: string;
    sceneId: string;
    requesterId: string;
    hotspots: HotspotInput[];
  }): Promise<PropertyTourScene> {
    const { propertyId, sceneId, requesterId, hotspots } = input;

    await this.assertCanEdit(propertyId, requesterId);
    const scene = await this.getSceneOfProperty(propertyId, sceneId);

    const scenes = await this.sceneRepository.findByPropertyId(propertyId);
    const validTargets = new Set(scenes.map((s) => s.id));

    const normalized: TourHotspot[] = hotspots.map((hotspot) => {
      if (!validTargets.has(hotspot.targetSceneId)) {
        throw new BadRequestException('A cena de destino não pertence a este imóvel');
      }
      if (hotspot.targetSceneId === sceneId) {
        throw new BadRequestException('Um ambiente não pode ter um portal para ele mesmo');
      }
      if (!Number.isFinite(hotspot.yaw) || !Number.isFinite(hotspot.pitch)) {
        throw new BadRequestException('Posição do portal inválida');
      }

      return {
        id: uuidv4(),
        targetSceneId: hotspot.targetSceneId,
        // Normaliza para os intervalos que o visualizador entende.
        yaw: this.wrapAngle(hotspot.yaw),
        pitch: Math.max(-Math.PI / 2, Math.min(Math.PI / 2, hotspot.pitch)),
        label: hotspot.label?.trim().slice(0, 60) || null,
      };
    });

    scene.hotspots = normalized;
    const saved = await this.sceneRepository.save(scene);

    this.logger.info('[Tour] Portais atualizados', {
      propertyId,
      sceneId,
      total: normalized.length,
    });

    return saved;
  }

  /** Guarda a direção em que a cena abre (o "olhar inicial"). */
  async setInitialYaw(input: {
    propertyId: string;
    sceneId: string;
    requesterId: string;
    initialYaw: number;
  }): Promise<PropertyTourScene> {
    const { propertyId, sceneId, requesterId, initialYaw } = input;

    await this.assertCanEdit(propertyId, requesterId);
    const scene = await this.getSceneOfProperty(propertyId, sceneId);

    if (!Number.isFinite(initialYaw)) {
      throw new BadRequestException('Direção inicial inválida');
    }

    scene.initialYaw = this.wrapAngle(initialYaw);
    return this.sceneRepository.save(scene);
  }

  private wrapAngle(angle: number): number {
    const twoPi = Math.PI * 2;
    return ((angle % twoPi) + twoPi) % twoPi;
  }

  private assertEquirectangular(width?: number, height?: number): void {
    if (!width || !height) return;

    const ratio = width / height;
    if (Math.abs(ratio - EQUIRECTANGULAR_RATIO) > RATIO_TOLERANCE) {
      throw new BadRequestException(
        `A imagem precisa ser panorâmica equirretangular (proporção 2:1). ` +
          `A enviada tem ${width}x${height} (proporção ${ratio.toFixed(2)}:1).`,
      );
    }
  }

  private async getSceneOfProperty(propertyId: string, sceneId: string): Promise<PropertyTourScene> {
    const scene = await this.sceneRepository.findById(sceneId);
    if (!scene || !scene.belongsToProperty(propertyId)) {
      throw new NotFoundException('Ambiente do tour não encontrado neste imóvel');
    }
    return scene;
  }

  private async assertCanEdit(propertyId: string, requesterId: string): Promise<void> {
    const property = await this.propertyRepository.findById(propertyId);
    if (!property) {
      throw new NotFoundException('Imóvel não encontrado');
    }

    const requester = await this.userRepository.findById(requesterId);
    if (!requester) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (requester.role !== UserRole.CORRETOR && requester.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Apenas corretores e administradores podem editar imóveis');
    }

    if (property.realtorId !== requesterId && requester.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Apenas o corretor dono do imóvel ou um administrador podem editá-lo');
    }
  }
}
