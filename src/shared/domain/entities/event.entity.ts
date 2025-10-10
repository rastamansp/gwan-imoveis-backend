import { EventStatus } from '../value-objects/event-status.enum';

export class Event {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description: string,
    public readonly date: Date,
    public readonly location: string,
    public readonly address: string,
    public readonly city: string,
    public readonly state: string,
    public readonly image: string,
    public readonly category: string,
    public readonly organizerId: string,
    public readonly organizerName: string,
    public readonly status: EventStatus = EventStatus.ACTIVE,
    public readonly maxCapacity: number = 0,
    public readonly soldTickets: number = 0,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
  ) {}

  // Métodos de domínio
  public isActive(): boolean {
    return this.status === EventStatus.ACTIVE;
  }

  public isSoldOut(): boolean {
    return this.status === EventStatus.SOLD_OUT;
  }

  public isCancelled(): boolean {
    return this.status === EventStatus.CANCELLED;
  }

  public isInactive(): boolean {
    return this.status === EventStatus.INACTIVE;
  }

  public getAvailableTickets(): number {
    return Math.max(0, this.maxCapacity - this.soldTickets);
  }

  public canSellTickets(): boolean {
    return this.isActive() && this.getAvailableTickets() > 0;
  }

  public markAsSoldOut(): Event {
    return new Event(
      this.id,
      this.title,
      this.description,
      this.date,
      this.location,
      this.address,
      this.city,
      this.state,
      this.image,
      this.category,
      this.organizerId,
      this.organizerName,
      EventStatus.SOLD_OUT,
      this.maxCapacity,
      this.soldTickets,
      this.createdAt,
      new Date(),
    );
  }

  public addSoldTickets(quantity: number): Event {
    const newSoldTickets = this.soldTickets + quantity;
    const newStatus = newSoldTickets >= this.maxCapacity 
      ? EventStatus.SOLD_OUT 
      : this.status;

    return new Event(
      this.id,
      this.title,
      this.description,
      this.date,
      this.location,
      this.address,
      this.city,
      this.state,
      this.image,
      this.category,
      this.organizerId,
      this.organizerName,
      newStatus,
      this.maxCapacity,
      newSoldTickets,
      this.createdAt,
      new Date(),
    );
  }

  public cancel(): Event {
    return new Event(
      this.id,
      this.title,
      this.description,
      this.date,
      this.location,
      this.address,
      this.city,
      this.state,
      this.image,
      this.category,
      this.organizerId,
      this.organizerName,
      EventStatus.CANCELLED,
      this.maxCapacity,
      this.soldTickets,
      this.createdAt,
      new Date(),
    );
  }

  public updateDetails(
    title: string,
    description: string,
    date: Date,
    location: string,
    address: string,
    city: string,
    state: string,
    image: string,
    category: string,
    maxCapacity: number,
  ): Event {
    return new Event(
      this.id,
      title,
      description,
      date,
      location,
      address,
      city,
      state,
      image,
      category,
      this.organizerId,
      this.organizerName,
      this.status,
      maxCapacity,
      this.soldTickets,
      this.createdAt,
      new Date(),
    );
  }

  public belongsTo(organizerId: string): boolean {
    return this.organizerId === organizerId;
  }
}
