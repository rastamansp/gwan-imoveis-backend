import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { SharedModule } from '../shared/shared.module';

const jwtSecret = process.env.JWT_SECRET || 'pazdedeus';
console.log('🔧 AuthModule - JWT_SECRET configurado:', jwtSecret ? 'SIM' : 'NÃO');

@Module({
  imports: [
    SharedModule,
    PassportModule,
    JwtModule.register({
      secret: jwtSecret,
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, LocalStrategy],
})
export class AuthModule {}
