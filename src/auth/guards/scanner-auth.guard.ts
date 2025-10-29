import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ScannerAuthService } from '../../shared/infrastructure/services/scanner-auth.service';

@Injectable()
export class ScannerAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly scannerAuthService: ScannerAuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token de scanner não fornecido');
    }

    try {
      const scanner = await this.scannerAuthService.validateToken(token);
      request.scanner = scanner;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Token de scanner inválido');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
