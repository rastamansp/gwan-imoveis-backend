import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { InsufficientPermissionsException } from '../../domain/exceptions/insufficient-permissions.exception';

@Catch(InsufficientPermissionsException)
export class InsufficientPermissionsFilter implements ExceptionFilter {
  catch(exception: InsufficientPermissionsException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    console.log('🚫 InsufficientPermissionsFilter - Capturando exceção:', {
      message: exception.message,
      timestamp: new Date().toISOString(),
    });

    response.status(HttpStatus.FORBIDDEN).json({
      statusCode: HttpStatus.FORBIDDEN,
      message: exception.message,
      error: 'Forbidden',
      timestamp: new Date().toISOString(),
    });
  }
}
