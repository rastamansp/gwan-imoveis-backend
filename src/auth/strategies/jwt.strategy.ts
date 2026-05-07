import { Injectable, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { IUserRepository } from '../../shared/domain/interfaces/user-repository.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly configService: ConfigService,
  ) {
    const secret = configService.get<string>('JWT_SECRET') || 'pazdedeus';
    console.log('🔧 JWT Strategy - JWT_SECRET configurado:', secret ? 'SIM' : 'NÃO');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: secret,
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
