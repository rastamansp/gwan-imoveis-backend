import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserRole } from '../../shared/domain/value-objects/user-role.enum';

@Injectable()
export class CorretorOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    const userRole = user.role;
    return userRole === UserRole.CORRETOR || userRole === UserRole.ADMIN;
  }
}

