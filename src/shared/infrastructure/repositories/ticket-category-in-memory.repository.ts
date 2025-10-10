import { Injectable } from '@nestjs/common';
import { TicketCategory } from '../../domain/entities/ticket-category.entity';
import { ITicketCategoryRepository } from '../../domain/interfaces/ticket-category-repository.interface';

@Injectable()
export class TicketCategoryInMemoryRepository implements ITicketCategoryRepository {
  private categories: TicketCategory[] = [
    new TicketCategory(
      '1',
      '1',
      'Pista',
      'Acesso à área principal do evento',
      150.00,
      3000,
      800,
      ['Acesso à pista principal', 'Banheiros', 'Área de alimentação'],
      true,
    ),
    new TicketCategory(
      '2',
      '1',
      'VIP',
      'Área VIP com vista privilegiada',
      300.00,
      500,
      200,
      ['Área VIP', 'Open bar', 'Banheiros exclusivos', 'Estacionamento'],
      true,
    ),
    new TicketCategory(
      '3',
      '2',
      'Estudante',
      'Ingresso com desconto para estudantes',
      50.00,
      100,
      25,
      ['Material didático', 'Certificado', 'Coffee break'],
      true,
    ),
    new TicketCategory(
      '4',
      '2',
      'Profissional',
      'Ingresso completo para profissionais',
      100.00,
      100,
      20,
      ['Material didático', 'Certificado', 'Almoço', 'Networking'],
      true,
    ),
  ];

  async save(category: TicketCategory): Promise<TicketCategory> {
    this.categories.push(category);
    return category;
  }

  async findById(id: string): Promise<TicketCategory | null> {
    return this.categories.find(category => category.id === id) || null;
  }

  async findAll(): Promise<TicketCategory[]> {
    return [...this.categories];
  }

  async findByEventId(eventId: string): Promise<TicketCategory[]> {
    return this.categories.filter(category => category.eventId === eventId);
  }

  async update(id: string, updatedCategory: TicketCategory): Promise<TicketCategory | null> {
    const index = this.categories.findIndex(category => category.id === id);
    if (index === -1) return null;

    this.categories[index] = updatedCategory;
    return updatedCategory;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.categories.findIndex(category => category.id === id);
    if (index === -1) return false;

    this.categories.splice(index, 1);
    return true;
  }
}
