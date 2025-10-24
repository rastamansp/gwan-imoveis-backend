import { Injectable, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { IUserRepository } from '../../shared/domain/interfaces/user-repository.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'gwan-shop-secret-key',
    });
  }

  async validate(payload: any) {
    console.log('🔍 JWT Strategy - Payload recebido:', payload);
    console.log('🔍 JWT Strategy - Buscando usuário com ID:', payload.sub);
    
    const user = await this.userRepository.findById(payload.sub);
    console.log('🔍 JWT Strategy - Usuário encontrado:', user ? { id: user.id, email: user.email } : 'null');
    
    return user;
  }
}
