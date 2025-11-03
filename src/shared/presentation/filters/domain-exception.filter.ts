import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { DomainException } from '../../domain/exceptions/domain.exception';

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = this.getHttpStatus(exception);
    
    response.status(status).json({
      statusCode: status,
      message: exception.message,
      code: exception.code,
      timestamp: new Date().toISOString(),
    });
  }

  private getHttpStatus(exception: DomainException): HttpStatus {
    // Mapear códigos de exceção para status HTTP
    switch (exception.code) {
      case 'USER_NOT_FOUND':
      case 'EVENT_NOT_FOUND':
      case 'TICKET_NOT_FOUND':
      case 'PAYMENT_NOT_FOUND':
      case 'ARTIST_NOT_FOUND':
      case 'SPOTIFY_ARTIST_NOT_FOUND':
        return HttpStatus.NOT_FOUND;
      case 'INVALID_OPERATION':
      case 'SPOTIFY_INVALID_URL':
      case 'SPOTIFY_INTEGRATION_ERROR':
      case 'SPOTIFY_AUTH_FAILED':
      case 'SPOTIFY_API_ERROR':
      case 'INVALID_UUID':
        return HttpStatus.BAD_REQUEST;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }
}
