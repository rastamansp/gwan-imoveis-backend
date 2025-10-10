import { DomainException } from './domain.exception';

export class EventNotFoundException extends DomainException {
  constructor(eventId: string) {
    super(`Event with ID ${eventId} not found`, 'EVENT_NOT_FOUND');
  }
}
