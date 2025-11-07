import { DomainException } from './domain.exception';

export class ProductNotFoundException extends DomainException {
  constructor(productId: string) {
    super(`Product with ID ${productId} not found`, 'PRODUCT_NOT_FOUND');
  }
}

