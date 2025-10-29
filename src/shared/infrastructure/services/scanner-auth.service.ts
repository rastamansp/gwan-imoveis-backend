import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Scanner } from '../../domain/entities/scanner.entity';
import { IScannerRepository } from '../../domain/interfaces/scanner-repository.interface';
import { ILogger } from '../../application/interfaces/logger.interface';
import { ScannerAuthDto, ScannerAuthResponseDto, ScannerResponseDto } from '../../presentation/dtos/scanner.dto';

@Injectable()
export class ScannerAuthService {
  constructor(
    @Inject('IScannerRepository')
    private readonly scannerRepository: IScannerRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
    private readonly jwtService: JwtService,
  ) {}

  async authenticate(authDto: ScannerAuthDto, clientIp?: string): Promise<ScannerAuthResponseDto> {
    const startTime = Date.now();
    
    this.logger.info('Iniciando autenticação de scanner', {
      apiKey: authDto.apiKey,
      clientIp,
      timestamp: new Date().toISOString(),
    });

    try {
      // Buscar scanner pela API Key
      const scanner = await this.scannerRepository.findByApiKey(authDto.apiKey);
      
      if (!scanner) {
        const duration = Date.now() - startTime;
        this.logger.warn('Scanner não encontrado', {
          apiKey: authDto.apiKey,
          clientIp,
          duration,
        });
        throw new UnauthorizedException('Credenciais inválidas');
      }

      // Verificar se o scanner está ativo
      if (!scanner.isActive()) {
        const duration = Date.now() - startTime;
        this.logger.warn('Scanner inativo', {
          scannerId: scanner.id,
          apiKey: authDto.apiKey,
          status: scanner.status,
          clientIp,
          duration,
        });
        throw new UnauthorizedException('Scanner inativo');
      }

      // Verificar secret key
      if (scanner.secretKey !== authDto.secretKey) {
        const duration = Date.now() - startTime;
        this.logger.warn('Secret key inválida', {
          scannerId: scanner.id,
          apiKey: authDto.apiKey,
          clientIp,
          duration,
        });
        throw new UnauthorizedException('Credenciais inválidas');
      }

      // Atualizar último uso
      scanner.updateLastUsed(clientIp);
      await this.scannerRepository.update(scanner);

      // Gerar token JWT
      const payload = {
        sub: scanner.id,
        apiKey: scanner.apiKey,
        name: scanner.name,
        role: scanner.role,
        location: scanner.location,
      };

      const accessToken = this.jwtService.sign(payload, {
        expiresIn: '24h', // Tokens de scanner expiram em 24h
      });

      // Determinar permissões
      const permissions = this.getPermissions(scanner);

      const duration = Date.now() - startTime;
      this.logger.info('Scanner autenticado com sucesso', {
        scannerId: scanner.id,
        apiKey: authDto.apiKey,
        role: scanner.role,
        permissions,
        clientIp,
        duration,
      });

      return {
        accessToken,
        scanner: ScannerResponseDto.fromEntity(scanner),
        permissions,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro na autenticação de scanner', {
        apiKey: authDto.apiKey,
        clientIp,
        error: error.message,
        duration,
      });
      throw error;
    }
  }

  async validateToken(token: string): Promise<Scanner> {
    try {
      const payload = this.jwtService.verify(token);
      const scanner = await this.scannerRepository.findById(payload.sub);
      
      if (!scanner || !scanner.isActive()) {
        throw new UnauthorizedException('Scanner inválido ou inativo');
      }

      return scanner;
    } catch (error) {
      this.logger.warn('Token de scanner inválido', {
        error: error.message,
      });
      throw new UnauthorizedException('Token inválido');
    }
  }

  private getPermissions(scanner: Scanner): string[] {
    const permissions = ['validate_tickets'];
    
    if (scanner.canCheckIn()) {
      permissions.push('check_in_tickets');
    }
    
    if (scanner.canManage()) {
      permissions.push('manage_scanners');
    }
    
    return permissions;
  }
}
