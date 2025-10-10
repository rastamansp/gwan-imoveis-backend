import { DomainException } from './domain.exception';

export class PaymentNotFoundException extends DomainException {
  constructor(paymentId: string) {
    super(`Payment with ID ${paymentId} not found`, 'PAYMENT_NOT_FOUND');
  }
}
