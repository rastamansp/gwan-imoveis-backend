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

  /**
   * Reatribui a ordem das cenas em UMA transação.
   *
   * Escrita em lote, e não um `save` por cena, porque durante a reordenação
   * existe um estado intermediário em que duas cenas ocupam a mesma posição — e
   * a primeira posição é a porta de entrada do tour. Meio caminho gravado
   * deixaria o visitante entrando pelo ambiente errado.
   */
  reorder(propertyId: string, sceneIdsInOrder: string[]): Promise<void>;
}
