import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  address: string;
  city: string;
  state: string;
  image: string;
  category: string;
  organizerId: string;
  organizerName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'SOLD_OUT';
  maxCapacity: number;
  soldTickets: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketCategory {
  id: string;
  eventId: string;
  name: string;
  description: string;
  price: number;
  maxQuantity: number;
  soldQuantity: number;
  benefits: string[];
  isActive: boolean;
}

@Injectable()
export class EventsService {
  private events: Event[] = [
    {
      id: '1',
      title: 'Festival de Música Eletrônica',
      description: 'O maior festival de música eletrônica da cidade com os melhores DJs nacionais e internacionais.',
      date: new Date('2024-06-15T20:00:00Z'),
      location: 'Parque da Cidade',
      address: 'Av. das Flores, 123',
      city: 'São Paulo',
      state: 'SP',
      image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
      category: 'Música',
      organizerId: '2',
      organizerName: 'João Silva',
      status: 'ACTIVE',
      maxCapacity: 5000,
      soldTickets: 1200,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      title: 'Workshop de Programação',
      description: 'Aprenda as melhores práticas de desenvolvimento web com especialistas da área.',
      date: new Date('2024-05-20T09:00:00Z'),
      location: 'Centro de Convenções',
      address: 'Rua da Tecnologia, 456',
      city: 'Rio de Janeiro',
      state: 'RJ',
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800',
      category: 'Educação',
      organizerId: '2',
      organizerName: 'João Silva',
      status: 'ACTIVE',
      maxCapacity: 200,
      soldTickets: 45,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  private ticketCategories: TicketCategory[] = [
    {
      id: '1',
      eventId: '1',
      name: 'Pista',
      description: 'Acesso à área principal do evento',
      price: 150.00,
      maxQuantity: 3000,
      soldQuantity: 800,
      benefits: ['Acesso à pista principal', 'Banheiros', 'Área de alimentação'],
      isActive: true,
    },
    {
      id: '2',
      eventId: '1',
      name: 'VIP',
      description: 'Área VIP com vista privilegiada',
      price: 300.00,
      maxQuantity: 500,
      soldQuantity: 200,
      benefits: ['Área VIP', 'Open bar', 'Banheiros exclusivos', 'Estacionamento'],
      isActive: true,
    },
    {
      id: '3',
      eventId: '2',
      name: 'Estudante',
      description: 'Ingresso com desconto para estudantes',
      price: 50.00,
      maxQuantity: 100,
      soldQuantity: 25,
      benefits: ['Material didático', 'Certificado', 'Coffee break'],
      isActive: true,
    },
    {
      id: '4',
      eventId: '2',
      name: 'Profissional',
      description: 'Ingresso completo para profissionais',
      price: 100.00,
      maxQuantity: 100,
      soldQuantity: 20,
      benefits: ['Material didático', 'Certificado', 'Almoço', 'Networking'],
      isActive: true,
    },
  ];

  async findAll(): Promise<Event[]> {
    return this.events;
  }

  async findById(id: string): Promise<Event | undefined> {
    return this.events.find(event => event.id === id);
  }

  async findByCategory(category: string): Promise<Event[]> {
    return this.events.filter(event => 
      event.category.toLowerCase().includes(category.toLowerCase())
    );
  }

  async findByCity(city: string): Promise<Event[]> {
    return this.events.filter(event => 
      event.city.toLowerCase().includes(city.toLowerCase())
    );
  }

  async create(eventData: Partial<Event>): Promise<Event> {
    const event: Event = {
      id: uuidv4(),
      title: eventData.title,
      description: eventData.description,
      date: eventData.date,
      location: eventData.location,
      address: eventData.address,
      city: eventData.city,
      state: eventData.state,
      image: eventData.image,
      category: eventData.category,
      organizerId: eventData.organizerId,
      organizerName: eventData.organizerName,
      status: eventData.status || 'ACTIVE',
      maxCapacity: eventData.maxCapacity,
      soldTickets: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.events.push(event);
    return event;
  }

  async update(id: string, eventData: Partial<Event>): Promise<Event | undefined> {
    const eventIndex = this.events.findIndex(event => event.id === id);
    if (eventIndex === -1) return undefined;

    this.events[eventIndex] = {
      ...this.events[eventIndex],
      ...eventData,
      updatedAt: new Date(),
    };

    return this.events[eventIndex];
  }

  async delete(id: string): Promise<boolean> {
    const eventIndex = this.events.findIndex(event => event.id === id);
    if (eventIndex === -1) return false;

    this.events.splice(eventIndex, 1);
    return true;
  }

  async getTicketCategories(eventId: string): Promise<TicketCategory[]> {
    return this.ticketCategories.filter(category => category.eventId === eventId);
  }

  async createTicketCategory(categoryData: Partial<TicketCategory>): Promise<TicketCategory> {
    const category: TicketCategory = {
      id: uuidv4(),
      eventId: categoryData.eventId,
      name: categoryData.name,
      description: categoryData.description,
      price: categoryData.price,
      maxQuantity: categoryData.maxQuantity,
      soldQuantity: 0,
      benefits: categoryData.benefits || [],
      isActive: true,
    };

    this.ticketCategories.push(category);
    return category;
  }

  async updateTicketCategory(id: string, categoryData: Partial<TicketCategory>): Promise<TicketCategory | undefined> {
    const categoryIndex = this.ticketCategories.findIndex(category => category.id === id);
    if (categoryIndex === -1) return undefined;

    this.ticketCategories[categoryIndex] = {
      ...this.ticketCategories[categoryIndex],
      ...categoryData,
    };

    return this.ticketCategories[categoryIndex];
  }
}
