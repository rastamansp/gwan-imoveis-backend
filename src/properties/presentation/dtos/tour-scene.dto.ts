import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, ValidateNested, IsUUID, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PropertyTourScene, TourHotspot } from '../../../shared/domain/entities/property-tour-scene.entity';

export class TourHotspotDto {
  @ApiProperty({ description: 'Cena de destino do portal' })
  @IsUUID()
  targetSceneId: string;

  @ApiProperty({ description: 'Ângulo horizontal em radianos', example: 1.57 })
  @IsNumber()
  yaw: number;

  @ApiProperty({ description: 'Ângulo vertical em radianos', example: -0.1 })
  @IsNumber()
  pitch: number;

  @ApiPropertyOptional({ description: 'Rótulo do marcador; vazio usa o nome da cena de destino' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  label?: string;
}

export class SetTourHotspotsDto {
  @ApiProperty({ type: [TourHotspotDto], description: 'Lista completa de portais da cena (substitui a anterior)' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TourHotspotDto)
  hotspots: TourHotspotDto[];
}

export class RenameTourSceneDto {
  @ApiProperty({ description: 'Nome do ambiente', example: 'Suíte máster' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;
}

export class SetInitialYawDto {
  @ApiProperty({ description: 'Direção em que a cena abre, em radianos', example: 0.8 })
  @IsNumber()
  initialYaw: number;
}

export class TourSceneResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  imageUrl: string;

  @ApiProperty()
  order: number;

  @ApiProperty({ description: 'Direção inicial da câmera, em radianos' })
  initialYaw: number;

  @ApiProperty({ type: [TourHotspotDto] })
  hotspots: TourHotspot[];

  static fromEntity(scene: PropertyTourScene): TourSceneResponseDto {
    const dto = new TourSceneResponseDto();
    dto.id = scene.id;
    dto.name = scene.name;
    dto.imageUrl = scene.imageUrl;
    dto.order = scene.order;
    dto.initialYaw = Number(scene.initialYaw) || 0;
    // `imagePath` fica de fora de propósito: é caminho interno do storage.
    dto.hotspots = scene.hotspots ?? [];
    return dto;
  }
}
