import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../shared/domain/entities/user.entity';
import { Event } from '../shared/domain/entities/event.entity';
import { TicketCategory } from '../shared/domain/entities/ticket-category.entity';
import { UserRole } from '../shared/domain/value-objects/user-role.enum';
import { EventStatus } from '../shared/domain/value-objects/event-status.enum';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class DatabaseSeeder {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(TicketCategory)
    private readonly ticketCategoryRepository: Repository<TicketCategory>,
  ) {}

  async seed(): Promise<void> {
    console.log('🌱 Iniciando seed do banco de dados...');

    // Criar usuário admin
    await this.createAdminUser();
    
    // Criar usuário organizador
    await this.createOrganizerUser();
    
    // Criar usuário comum
    await this.createRegularUser();
    
    // Criar eventos
    await this.createEvents();
    
    // Criar categorias de ingressos
    await this.createTicketCategories();

    console.log('✅ Seed do banco de dados concluído!');
  }

  private async createAdminUser(): Promise<void> {
    const existingAdmin = await this.userRepository.findOne({ 
      where: { email: 'admin@gwanshop.com' } 
    });
    
    if (!existingAdmin) {
      const adminUser = User.create(
        'admin-user-id',
        'Administrador do Sistema',
        'admin@gwanshop.com',
        await bcrypt.hash('admin123', 10),
        '+5511999999999',
        UserRole.ADMIN,
      );
      
      await this.userRepository.save(adminUser);
      console.log('👤 Usuário admin criado');
    }
  }

  private async createOrganizerUser(): Promise<void> {
    const existingOrganizer = await this.userRepository.findOne({ 
      where: { email: 'organizador@gwanshop.com' } 
    });
    
    if (!existingOrganizer) {
      const organizerUser = User.create(
        'organizer-user-id',
        'João Silva Organizador',
        'organizador@gwanshop.com',
        await bcrypt.hash('organizador123', 10),
        '+5511888888888',
        UserRole.ORGANIZER,
      );
      
      await this.userRepository.save(organizerUser);
      console.log('👤 Usuário organizador criado');
    }
  }

  private async createRegularUser(): Promise<void> {
    const existingUser = await this.userRepository.findOne({ 
      where: { email: 'usuario@gwanshop.com' } 
    });
    
    if (!existingUser) {
      const regularUser = User.create(
        'regular-user-id',
        'Maria Santos',
        'usuario@gwanshop.com',
        await bcrypt.hash('usuario123', 10),
        '+5511777777777',
        UserRole.USER,
      );
      
      await this.userRepository.save(regularUser);
      console.log('👤 Usuário comum criado');
    }
  }

  private async createEvents(): Promise<void> {
    const organizer = await this.userRepository.findOne({ 
      where: { email: 'organizador@gwanshop.com' } 
    });
    
    if (!organizer) {
      console.log('⚠️ Organizador não encontrado, pulando criação de eventos');
      return;
    }

    // Evento 1: Festival de Música
    const existingEvent1 = await this.eventRepository.findOne({ 
      where: { title: 'Festival de Música Eletrônica' } 
    });
    
    if (!existingEvent1) {
      const event1 = Event.create(
        'event-1',
        'Festival de Música Eletrônica',
        'O maior festival de música eletrônica da cidade com os melhores DJs nacionais e internacionais.',
        new Date('2024-12-31T20:00:00Z'),
        'Parque da Cidade',
        'Av. das Flores, 123',
        'São Paulo',
        'SP',
        'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
        'Música',
        organizer.id,
        'João Silva Organizador',
        EventStatus.ACTIVE,
        5000,
        0,
      );
      
      await this.eventRepository.save(event1);
      console.log('🎵 Evento Festival de Música criado');
    }

    // Evento 2: Workshop de Programação
    const existingEvent2 = await this.eventRepository.findOne({ 
      where: { title: 'Workshop de Programação' } 
    });
    
    if (!existingEvent2) {
      const event2 = Event.create(
        'event-2',
        'Workshop de Programação',
        'Aprenda as melhores práticas de desenvolvimento web com especialistas da área.',
        new Date('2024-11-15T09:00:00Z'),
        'Centro de Convenções',
        'Rua da Tecnologia, 456',
        'Rio de Janeiro',
        'RJ',
        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
        'Educação',
        organizer.id,
        'João Silva Organizador',
        EventStatus.ACTIVE,
        200,
        0,
      );
      
      await this.eventRepository.save(event2);
      console.log('💻 Evento Workshop de Programação criado');
    }
  }

  private async createTicketCategories(): Promise<void> {
    const events = await this.eventRepository.find();
    
    for (const event of events) {
      const existingCategories = await this.ticketCategoryRepository.find({ 
        where: { eventId: event.id } 
      });
      
      if (existingCategories.length === 0) {
        // Criar categorias para cada evento
        const categories = [
          {
            name: 'Pista',
            description: 'Acesso à área principal do evento',
            price: 150.00,
            maxQuantity: event.maxCapacity * 0.7, // 70% da capacidade
            benefits: ['Acesso à área principal', 'Banheiros', 'Praça de alimentação'],
          },
          {
            name: 'VIP',
            description: 'Área VIP com comodidades exclusivas',
            price: 300.00,
            maxQuantity: event.maxCapacity * 0.2, // 20% da capacidade
            benefits: ['Área VIP', 'Open bar', 'Estacionamento', 'Banheiros exclusivos'],
          },
          {
            name: 'Gratuito',
            description: 'Ingresso gratuito com acesso limitado',
            price: 0.00,
            maxQuantity: event.maxCapacity * 0.1, // 10% da capacidade
            benefits: ['Acesso limitado', 'Banheiros'],
          },
        ];

        for (const categoryData of categories) {
          const category = TicketCategory.create(
            `category-${event.id}-${categoryData.name.toLowerCase()}`,
            event.id,
            categoryData.name,
            categoryData.description,
            categoryData.price,
            Math.floor(categoryData.maxQuantity),
            0,
            categoryData.benefits,
            true,
          );
          
          await this.ticketCategoryRepository.save(category);
        }
        
        console.log(`🎫 Categorias de ingressos criadas para: ${event.title}`);
      }
    }
  }
}
