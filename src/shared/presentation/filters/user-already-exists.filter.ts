import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { UserAlreadyExistsException } from '../../domain/exceptions/user-already-exists.exception';

@Catch(UserAlreadyExistsException)
export class UserAlreadyExistsFilter implements ExceptionFilter {
  catch(exception: UserAlreadyExistsException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    console.log('=== FILTRO CAPTUROU EXCEÇÃO ===');
    console.log('Exception:', exception);
    console.log('Message:', exception.message);
    console.log('=== FIM DO FILTRO ===');
    
    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message: exception.message,
      error: 'Bad Request',
      timestamp: new Date().toISOString(),
    });
  }
}
