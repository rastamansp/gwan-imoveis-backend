import { TicketStatus } from '../value-objects/ticket-status.enum';

export class Ticket {
  constructor(
    public readonly id: string,
    public readonly eventId: string,
    public readonly eventTitle: string,
    public readonly eventDate: Date,
    public readonly eventLocation: string,
    public readonly categoryId: string,
    public readonly categoryName: string,
    public readonly userId: string,
    public readonly userName: string,
    public readonly userEmail: string,
    public readonly price: number,
    public readonly qrCode: string,
    public readonly qrCodeData: string,
    public readonly status: TicketStatus = TicketStatus.ACTIVE,
    public readonly purchaseDate: Date = new Date(),
    public readonly usedDate?: Date,
    public readonly transferDate?: Date,
    public readonly transferredTo?: string,
  ) {}

  // Métodos de domínio
  public isActive(): boolean {
    return this.status === TicketStatus.ACTIVE;
  }

  public isUsed(): boolean {
    return this.status === TicketStatus.USED;
  }

  public isCancelled(): boolean {
    return this.status === TicketStatus.CANCELLED;
  }

  public isTransferred(): boolean {
    return this.status === TicketStatus.TRANSFERRED;
  }

  public canBeUsed(): boolean {
    return this.isActive() && new Date() >= this.eventDate;
  }

  public canBeTransferred(): boolean {
    return this.isActive() && new Date() < this.eventDate;
  }

  public canBeCancelled(): boolean {
    return this.isActive() && new Date() < this.eventDate;
  }

  public markAsUsed(): Ticket {
    if (!this.canBeUsed()) {
      throw new Error('Ticket cannot be used');
    }

    return new Ticket(
      this.id,
      this.eventId,
      this.eventTitle,
      this.eventDate,
      this.eventLocation,
      this.categoryId,
      this.categoryName,
      this.userId,
      this.userName,
      this.userEmail,
      this.price,
      this.qrCode,
      this.qrCodeData,
      TicketStatus.USED,
      this.purchaseDate,
      new Date(),
      this.transferDate,
      this.transferredTo,
    );
  }

  public markAsTransferred(newUserId: string, newUserName: string, newUserEmail: string): Ticket {
    if (!this.canBeTransferred()) {
      throw new Error('Ticket cannot be transferred');
    }

    return new Ticket(
      this.id,
      this.eventId,
      this.eventTitle,
      this.eventDate,
      this.eventLocation,
      this.categoryId,
      this.categoryName,
      newUserId,
      newUserName,
      newUserEmail,
      this.price,
      this.qrCode,
      this.qrCodeData,
      TicketStatus.TRANSFERRED,
      this.purchaseDate,
      this.usedDate,
      new Date(),
      newUserId,
    );
  }

  public markAsCancelled(): Ticket {
    if (!this.canBeCancelled()) {
      throw new Error('Ticket cannot be cancelled');
    }

    return new Ticket(
      this.id,
      this.eventId,
      this.eventTitle,
      this.eventDate,
      this.eventLocation,
      this.categoryId,
      this.categoryName,
      this.userId,
      this.userName,
      this.userEmail,
      this.price,
      this.qrCode,
      this.qrCodeData,
      TicketStatus.CANCELLED,
      this.purchaseDate,
      this.usedDate,
      this.transferDate,
      this.transferredTo,
    );
  }

  public belongsTo(userId: string): boolean {
    return this.userId === userId;
  }

  public isForEvent(eventId: string): boolean {
    return this.eventId === eventId;
  }
}
