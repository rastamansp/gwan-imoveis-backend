import { Injectable } from '@nestjs/common';

export interface PaginationOptions {
  page: number;
  pageSize: number;
  total: number;
}

@Injectable()
export class PaginationService {
  /**
   * Calcula informações de paginação
   */
  calculatePagination(page: number, pageSize: number, total: number) {
    const current = Math.max(1, page);
    const totalPages = Math.ceil(total / pageSize);
    const hasMore = current < totalPages;
    
    return {
      current,
      total: totalPages,
      pageSize,
      totalItems: total,
      hasMore,
    };
  }

  /**
   * Formata mensagem de paginação para WhatsApp
   */
  formatPaginationMessage(current: number, total: number, pageSize: number, totalItems: number): string {
    const start = (current - 1) * pageSize + 1;
    const end = Math.min(current * pageSize, totalItems);
    
    if (totalItems === 0) {
      return '';
    }
    
    if (totalItems <= pageSize) {
      return `Mostrando ${totalItems} de ${totalItems}`;
    }
    
    return `Mostrando ${start}-${end} de ${totalItems}`;
  }

  /**
   * Pagina um array de itens
   */
  paginateItems<T>(items: T[], page: number, pageSize: number): { items: T[]; pagination: ReturnType<typeof this.calculatePagination> } {
    const current = Math.max(1, page);
    const startIndex = (current - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedItems = items.slice(startIndex, endIndex);
    
    const pagination = this.calculatePagination(current, pageSize, items.length);
    
    return {
      items: paginatedItems,
      pagination,
    };
  }
}

