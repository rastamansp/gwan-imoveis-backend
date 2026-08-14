import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as sharp from 'sharp';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiConsumes,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CorretorOrAdminGuard } from '../auth/guards/corretor-or-admin.guard';
import { ManagePropertyTourUseCase } from '../shared/application/use-cases/manage-property-tour.use-case';
import {
  RenameTourSceneDto,
  SetInitialYawDto,
  SetTourHotspotsDto,
  TourSceneResponseDto,
} from './presentation/dtos/tour-scene.dto';

@ApiTags('Tour Virtual')
@Controller('properties/:id/tour/scenes')
export class PropertyTourController {
  constructor(private readonly manageTour: ManagePropertyTourUseCase) {}

  @Get()
  @ApiOperation({
    summary: 'Listar ambientes do tour virtual',
    description:
      'Retorna as cenas 360° do imóvel, em ordem, com os portais (hotspots) de navegação entre elas. ' +
      'Endpoint público — o tour aparece na página do imóvel para qualquer visitante.',
  })
  @ApiParam({ name: 'id', description: 'UUID do imóvel', type: String })
  @ApiResponse({ status: 200, type: [TourSceneResponseDto] })
  async list(@Param('id') propertyId: string): Promise<TourSceneResponseDto[]> {
    const scenes = await this.manageTour.listScenes(propertyId);
    return scenes.map(TourSceneResponseDto.fromEntity);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, CorretorOrAdminGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('scene'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Adicionar ambiente ao tour',
    description:
      'Envia uma foto panorâmica equirretangular (2:1) como novo ambiente do tour. ' +
      'Apenas o corretor dono do imóvel ou ADMIN.',
  })
  @ApiParam({ name: 'id', description: 'UUID do imóvel', type: String })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        scene: { type: 'string', format: 'binary', description: 'Foto 360° (JPEG, PNG ou WebP, até 25MB)' },
        name: { type: 'string', description: 'Nome do ambiente', example: 'Sala de estar' },
      },
    },
  })
  @ApiResponse({ status: 201, type: TourSceneResponseDto })
  @ApiResponse({ status: 400, description: 'Arquivo inválido, fora da proporção 2:1 ou limite de ambientes atingido' })
  async addScene(
    @Param('id') propertyId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 25 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpeg|jpg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('name') name: string,
    @Request() req: any,
  ): Promise<TourSceneResponseDto> {
    const metadata = await sharp(file.buffer).metadata();

    const scene = await this.manageTour.addScene({
      propertyId,
      requesterId: req.user.id,
      name: name ?? '',
      buffer: file.buffer,
      fileName: file.originalname,
      width: metadata.width,
      height: metadata.height,
    });

    return TourSceneResponseDto.fromEntity(scene);
  }

  @Put(':sceneId')
  @UseGuards(JwtAuthGuard, CorretorOrAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Renomear ambiente do tour' })
  @ApiParam({ name: 'id', description: 'UUID do imóvel', type: String })
  @ApiParam({ name: 'sceneId', description: 'UUID do ambiente', type: String })
  @ApiResponse({ status: 200, type: TourSceneResponseDto })
  async rename(
    @Param('id') propertyId: string,
    @Param('sceneId') sceneId: string,
    @Body() dto: RenameTourSceneDto,
    @Request() req: any,
  ): Promise<TourSceneResponseDto> {
    const scene = await this.manageTour.renameScene({
      propertyId,
      sceneId,
      requesterId: req.user.id,
      name: dto.name,
    });
    return TourSceneResponseDto.fromEntity(scene);
  }

  @Put(':sceneId/hotspots')
  @UseGuards(JwtAuthGuard, CorretorOrAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Definir os portais de navegação do ambiente',
    description:
      'Substitui a lista completa de portais da cena. Cada portal aponta para outra cena do mesmo ' +
      'imóvel e é posicionado em coordenadas esféricas (yaw/pitch em radianos).',
  })
  @ApiParam({ name: 'id', description: 'UUID do imóvel', type: String })
  @ApiParam({ name: 'sceneId', description: 'UUID do ambiente', type: String })
  @ApiResponse({ status: 200, type: TourSceneResponseDto })
  @ApiResponse({ status: 400, description: 'Destino fora do imóvel, portal para a própria cena ou posição inválida' })
  async setHotspots(
    @Param('id') propertyId: string,
    @Param('sceneId') sceneId: string,
    @Body() dto: SetTourHotspotsDto,
    @Request() req: any,
  ): Promise<TourSceneResponseDto> {
    const scene = await this.manageTour.setHotspots({
      propertyId,
      sceneId,
      requesterId: req.user.id,
      hotspots: dto.hotspots,
    });
    return TourSceneResponseDto.fromEntity(scene);
  }

  @Put(':sceneId/initial-view')
  @UseGuards(JwtAuthGuard, CorretorOrAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Definir a direção inicial do ambiente',
    description: 'Guarda para onde a câmera aponta ao entrar nesta cena.',
  })
  @ApiParam({ name: 'id', description: 'UUID do imóvel', type: String })
  @ApiParam({ name: 'sceneId', description: 'UUID do ambiente', type: String })
  @ApiResponse({ status: 200, type: TourSceneResponseDto })
  async setInitialView(
    @Param('id') propertyId: string,
    @Param('sceneId') sceneId: string,
    @Body() dto: SetInitialYawDto,
    @Request() req: any,
  ): Promise<TourSceneResponseDto> {
    const scene = await this.manageTour.setInitialYaw({
      propertyId,
      sceneId,
      requesterId: req.user.id,
      initialYaw: dto.initialYaw,
    });
    return TourSceneResponseDto.fromEntity(scene);
  }

  @Delete(':sceneId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, CorretorOrAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Remover ambiente do tour',
    description: 'Apaga a cena, seu arquivo no storage e todos os portais de outras cenas que apontavam para ela.',
  })
  @ApiParam({ name: 'id', description: 'UUID do imóvel', type: String })
  @ApiParam({ name: 'sceneId', description: 'UUID do ambiente', type: String })
  @ApiResponse({ status: 204, description: 'Removido' })
  async remove(
    @Param('id') propertyId: string,
    @Param('sceneId') sceneId: string,
    @Request() req: any,
  ): Promise<void> {
    await this.manageTour.deleteScene({ propertyId, sceneId, requesterId: req.user.id });
  }
}
