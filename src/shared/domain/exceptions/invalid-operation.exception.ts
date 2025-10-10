import { DomainException } from './domain.exception';

export class InvalidOperationException extends DomainException {
  constructor(operation: string, reason: string) {
    super(`Invalid operation: ${operation}. Reason: ${reason}`, 'INVALID_OPERATION');
  }
}
