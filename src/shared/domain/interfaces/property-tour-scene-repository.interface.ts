import { PropertyTourScene } from '../entities/property-tour-scene.entity';

export interface IPropertyTourSceneRepository {
  findByPropertyId(propertyId: string): Promise<PropertyTourScene[]>;
  findById(sceneId: string): Promise<PropertyTourScene | null>;
  countByPropertyId(propertyId: string): Promise<number>;
  save(scene: PropertyTourScene): Promise<PropertyTourScene>;
  delete(sceneId: string): Promise<void>;
  /**
   * Remove das demais cenas do imóvel qualquer hotspot que aponte para a cena
   * informada. Chamado ao excluir uma cena, para não deixar portal órfão.
   */
  removeHotspotsTargeting(propertyId: string, targetSceneId: string): Promise<void>;
}
