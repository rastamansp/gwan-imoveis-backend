import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropertyTourScene } from '../../domain/entities/property-tour-scene.entity';
import { IPropertyTourSceneRepository } from '../../domain/interfaces/property-tour-scene-repository.interface';

@Injectable()
export class PropertyTourSceneTypeOrmRepository implements IPropertyTourSceneRepository {
  constructor(
    @InjectRepository(PropertyTourScene)
    private readonly repository: Repository<PropertyTourScene>,
  ) {}

  async findByPropertyId(propertyId: string): Promise<PropertyTourScene[]> {
    return this.repository.find({
      where: { propertyId },
      order: { order: 'ASC', createdAt: 'ASC' },
    });
  }

  async findById(sceneId: string): Promise<PropertyTourScene | null> {
    return this.repository.findOne({ where: { id: sceneId } });
  }

  async countByPropertyId(propertyId: string): Promise<number> {
    return this.repository.count({ where: { propertyId } });
  }

  async save(scene: PropertyTourScene): Promise<PropertyTourScene> {
    return this.repository.save(scene);
  }

  async delete(sceneId: string): Promise<void> {
    await this.repository.delete(sceneId);
  }

  async removeHotspotsTargeting(propertyId: string, targetSceneId: string): Promise<void> {
    // Filtra no banco: percorrer as cenas na aplicação abriria janela para
    // corrida entre a leitura e a escrita de outra edição simultânea.
    await this.repository.query(
      `
      UPDATE "property_tour_scenes"
      SET "hotspots" = COALESCE((
        SELECT jsonb_agg(hotspot)
        FROM jsonb_array_elements("hotspots") AS hotspot
        WHERE hotspot->>'targetSceneId' <> $2
      ), '[]'::jsonb)
      WHERE "propertyId" = $1
        AND "hotspots" @> jsonb_build_array(jsonb_build_object('targetSceneId', $2::text));
      `,
      [propertyId, targetSceneId],
    );
  }
}
