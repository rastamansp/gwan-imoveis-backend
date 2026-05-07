import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../../shared/domain/value-objects/user-role.enum';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return user?.role === UserRole.ADMIN;
  }
}
