export class TicketCategory {
  constructor(
    public readonly id: string,
    public readonly eventId: string,
    public readonly name: string,
    public readonly description: string,
    public readonly price: number,
    public readonly maxQuantity: number,
    public readonly soldQuantity: number = 0,
    public readonly benefits: string[] = [],
    public readonly isActive: boolean = true,
  ) {}

  // Métodos de domínio
  public getAvailableQuantity(): number {
    return Math.max(0, this.maxQuantity - this.soldQuantity);
  }

  public canSell(quantity: number): boolean {
    return this.isActive && this.getAvailableQuantity() >= quantity;
  }

  public isSoldOut(): boolean {
    return this.getAvailableQuantity() === 0;
  }

  public sell(quantity: number): TicketCategory {
    if (!this.canSell(quantity)) {
      throw new Error('Cannot sell this quantity of tickets');
    }

    return new TicketCategory(
      this.id,
      this.eventId,
      this.name,
      this.description,
      this.price,
      this.maxQuantity,
      this.soldQuantity + quantity,
      this.benefits,
      this.isActive,
    );
  }

  public updateDetails(
    name: string,
    description: string,
    price: number,
    maxQuantity: number,
    benefits: string[],
  ): TicketCategory {
    return new TicketCategory(
      this.id,
      this.eventId,
      name,
      description,
      price,
      maxQuantity,
      this.soldQuantity,
      benefits,
      this.isActive,
    );
  }

  public deactivate(): TicketCategory {
    return new TicketCategory(
      this.id,
      this.eventId,
      this.name,
      this.description,
      this.price,
      this.maxQuantity,
      this.soldQuantity,
      this.benefits,
      false,
    );
  }

  public activate(): TicketCategory {
    return new TicketCategory(
      this.id,
      this.eventId,
      this.name,
      this.description,
      this.price,
      this.maxQuantity,
      this.soldQuantity,
      this.benefits,
      true,
    );
  }

  public belongsToEvent(eventId: string): boolean {
    return this.eventId === eventId;
  }
}
