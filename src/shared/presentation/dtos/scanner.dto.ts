import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ScannerRole, ScannerStatus } from '../../domain/entities/scanner.entity';

export class ScannerAuthDto {
  @ApiProperty({ description: 'API Key do scanner' })
  @IsString()
  @IsNotEmpty()
  apiKey: string;

  @ApiProperty({ description: 'Secret Key do scanner' })
  @IsString()
  @IsNotEmpty()
  secretKey: string;
}

export class CreateScannerDto {
  @ApiProperty({ description: 'Nome do scanner' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Localização do scanner' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({ description: 'Papel do scanner', enum: ScannerRole, default: ScannerRole.VALIDATOR })
  @IsEnum(ScannerRole)
  @IsOptional()
  role?: ScannerRole;
}

export class UpdateScannerDto {
  @ApiProperty({ description: 'Nome do scanner', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Localização do scanner', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ description: 'Papel do scanner', enum: ScannerRole, required: false })
  @IsEnum(ScannerRole)
  @IsOptional()
  role?: ScannerRole;

  @ApiProperty({ description: 'Status do scanner', enum: ScannerStatus, required: false })
  @IsEnum(ScannerStatus)
  @IsOptional()
  status?: ScannerStatus;
}

export class ScannerResponseDto {
  @ApiProperty({ description: 'ID do scanner' })
  id: string;

  @ApiProperty({ description: 'Nome do scanner' })
  name: string;

  @ApiProperty({ description: 'API Key do scanner' })
  apiKey: string;

  @ApiProperty({ description: 'Localização do scanner' })
  location: string;

  @ApiProperty({ description: 'Papel do scanner', enum: ScannerRole })
  role: ScannerRole;

  @ApiProperty({ description: 'Status do scanner', enum: ScannerStatus })
  status: ScannerStatus;

  @ApiProperty({ description: 'Data da última utilização' })
  lastUsedAt: Date;

  @ApiProperty({ description: 'IP da última utilização' })
  lastUsedIp: string;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;

  static fromEntity(scanner: any): ScannerResponseDto {
    const dto = new ScannerResponseDto();
    dto.id = scanner.id;
    dto.name = scanner.name;
    dto.apiKey = scanner.apiKey;
    dto.location = scanner.location;
    dto.role = scanner.role;
    dto.status = scanner.status;
    dto.lastUsedAt = scanner.lastUsedAt;
    dto.lastUsedIp = scanner.lastUsedIp;
    dto.createdAt = scanner.createdAt;
    dto.updatedAt = scanner.updatedAt;
    return dto;
  }
}

export class ScannerAuthResponseDto {
  @ApiProperty({ description: 'Token de acesso do scanner' })
  accessToken: string;

  @ApiProperty({ description: 'Informações do scanner' })
  scanner: ScannerResponseDto;

  @ApiProperty({ description: 'Permissões do scanner' })
  permissions: string[];
}
