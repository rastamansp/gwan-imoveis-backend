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
    const jwtSecret = process.env.JWT_SECRET || 'pazdedeus';
    console.log('🔧 JWT Strategy - JWT_SECRET configurado:', jwtSecret ? 'SIM' : 'NÃO');
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true, // Aceitar tokens sem expiração para tokens de teste
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any) {
    const user = await this.userRepository.findById(payload.sub);
    
    if (!user) {
      return null;
    }
    
    return user;
  }
}
