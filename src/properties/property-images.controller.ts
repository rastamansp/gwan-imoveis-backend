import {
  Controller,
  Get,
  Post,
  Delete,
  Put,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
import { PropertyImageResponseDto } from './presentation/dtos/property-image-response.dto';
import { ReorderImagesDto } from './presentation/dtos/reorder-images.dto';
import { CreatePropertyImageUseCase } from '../shared/application/use-cases/create-property-image.use-case';
import { SetCoverImageUseCase } from '../shared/application/use-cases/set-cover-image.use-case';
import { DeletePropertyImageUseCase } from '../shared/application/use-cases/delete-property-image.use-case';
import { ListPropertyImagesUseCase } from '../shared/application/use-cases/list-property-images.use-case';
import { ReorderPropertyImagesUseCase } from '../shared/application/use-cases/reorder-property-images.use-case';

@ApiTags('Imagens de Imóveis')
@Controller('properties/:id/images')
export class PropertyImagesController {
  constructor(
    private readonly createPropertyImageUseCase: CreatePropertyImageUseCase,
    private readonly setCoverImageUseCase: SetCoverImageUseCase,
    private readonly deletePropertyImageUseCase: DeletePropertyImageUseCase,
    private readonly listPropertyImagesUseCase: ListPropertyImagesUseCase,
    private readonly reorderPropertyImagesUseCase: ReorderPropertyImagesUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, CorretorOrAdminGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('image'))
  @ApiOperation({
    summary: 'Upload de imagem para propriedade',
    description:
      'Faz upload de uma imagem para a propriedade. A imagem será processada automaticamente (redimensionada e otimizada). Máximo de 10 imagens por propriedade. Requer autenticação JWT e role CORRETOR ou ADMIN.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'id',
    description: 'UUID da propriedade',
    example: 'd4da01e3-2f5a-4edf-8fa3-71f262e04eb5',
    type: String,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo de imagem (JPEG, PNG ou WebP, máximo 10MB)',
        },
        isCover: {
          type: 'boolean',
          description: 'Definir como imagem de capa',
          example: false,
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Imagem enviada com sucesso',
    type: PropertyImageResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Arquivo inválido ou limite de imagens atingido' })
  @ApiResponse({ status: 401, description: 'Não autorizado - Token JWT inválido ou ausente' })
  @ApiResponse({ status: 403, description: 'Permissão negada - Apenas CORRETOR ou ADMIN podem fazer upload' })
  @ApiResponse({ status: 404, description: 'Propriedade não encontrada' })
  async uploadImage(
    @Param('id') propertyId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /(jpeg|jpg|png|webp)$/ }),
        ],
      }),
    )
    file: any,
    @Request() req: any,
    @Body('isCover') isCover?: string,
  ): Promise<PropertyImageResponseDto> {
    const realtorId = req.user?.id || req.user?.sub;
    if (!realtorId) {
      throw new Error('User not authenticated correctly');
    }

    if (!file) {
      throw new Error('Image file is required');
    }

    const isCoverBoolean = isCover === 'true' || isCover === '1';
    const image = await this.createPropertyImageUseCase.execute(
      propertyId,
      file.buffer,
      file.originalname,
      realtorId,
      isCoverBoolean,
    );

    return PropertyImageResponseDto.fromEntity(image);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar imagens da propriedade',
    description: 'Retorna todas as imagens de uma propriedade ordenadas. Endpoint público, não requer autenticação.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da propriedade',
    example: 'd4da01e3-2f5a-4edf-8fa3-71f262e04eb5',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de imagens obtida com sucesso',
    type: [PropertyImageResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Propriedade não encontrada' })
  async listImages(@Param('id') propertyId: string): Promise<PropertyImageResponseDto[]> {
    const images = await this.listPropertyImagesUseCase.execute(propertyId);
    return images.map((image) => PropertyImageResponseDto.fromEntity(image));
  }

  @Post(':imageId/set-cover')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, CorretorOrAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Definir imagem como capa',
    description:
      'Define uma imagem específica como imagem de capa da propriedade. A imagem de capa anterior será removida automaticamente. Requer autenticação JWT e role CORRETOR ou ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da propriedade',
    example: 'd4da01e3-2f5a-4edf-8fa3-71f262e04eb5',
    type: String,
  })
  @ApiParam({
    name: 'imageId',
    description: 'UUID da imagem',
    example: 'e5eb12f4-3g6b-5feg-9gb4-82g373f15fc6',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Imagem definida como capa com sucesso',
    type: PropertyImageResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Não autorizado - Token JWT inválido ou ausente' })
  @ApiResponse({ status: 403, description: 'Permissão negada - Apenas CORRETOR ou ADMIN podem definir capa' })
  @ApiResponse({ status: 404, description: 'Propriedade ou imagem não encontrada' })
  async setCover(
    @Param('id') propertyId: string,
    @Param('imageId') imageId: string,
    @Request() req: any,
  ): Promise<PropertyImageResponseDto> {
    const realtorId = req.user?.id || req.user?.sub;
    if (!realtorId) {
      throw new Error('User not authenticated correctly');
    }

    const image = await this.setCoverImageUseCase.execute(propertyId, imageId, realtorId);
    return PropertyImageResponseDto.fromEntity(image);
  }

  @Delete(':imageId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, CorretorOrAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Deletar imagem da propriedade',
    description:
      'Remove uma imagem da propriedade permanentemente. Se for a imagem de capa, o campo coverImageUrl será limpo. Requer autenticação JWT e role CORRETOR ou ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da propriedade',
    example: 'd4da01e3-2f5a-4edf-8fa3-71f262e04eb5',
    type: String,
  })
  @ApiParam({
    name: 'imageId',
    description: 'UUID da imagem a ser deletada',
    example: 'e5eb12f4-3g6b-5feg-9gb4-82g373f15fc6',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Imagem deletada com sucesso',
    schema: {
      example: {
        message: 'Imagem deletada com sucesso',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado - Token JWT inválido ou ausente' })
  @ApiResponse({ status: 403, description: 'Permissão negada - Apenas CORRETOR ou ADMIN podem deletar imagens' })
  @ApiResponse({ status: 404, description: 'Propriedade ou imagem não encontrada' })
  async deleteImage(
    @Param('id') propertyId: string,
    @Param('imageId') imageId: string,
    @Request() req: any,
  ): Promise<{ message: string }> {
    const realtorId = req.user?.id || req.user?.sub;
    if (!realtorId) {
      throw new Error('User not authenticated correctly');
    }

    await this.deletePropertyImageUseCase.execute(propertyId, imageId, realtorId);
    return { message: 'Imagem deletada com sucesso' };
  }

  @Put('reorder')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, CorretorOrAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reordenar imagens da propriedade',
    description:
      'Reordena as imagens da propriedade. Requer autenticação JWT e role CORRETOR ou ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID da propriedade',
    example: 'd4da01e3-2f5a-4edf-8fa3-71f262e04eb5',
    type: String,
  })
  @ApiBody({
    type: ReorderImagesDto,
    description: 'Array com IDs das imagens e suas novas ordens',
  })
  @ApiResponse({
    status: 200,
    description: 'Imagens reordenadas com sucesso',
    type: [PropertyImageResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos - Validação falhou' })
  @ApiResponse({ status: 401, description: 'Não autorizado - Token JWT inválido ou ausente' })
  @ApiResponse({ status: 403, description: 'Permissão negada - Apenas CORRETOR ou ADMIN podem reordenar imagens' })
  @ApiResponse({ status: 404, description: 'Propriedade não encontrada' })
  async reorderImages(
    @Param('id') propertyId: string,
    @Body() reorderDto: ReorderImagesDto,
    @Request() req: any,
  ): Promise<PropertyImageResponseDto[]> {
    const realtorId = req.user?.id || req.user?.sub;
    if (!realtorId) {
      throw new Error('User not authenticated correctly');
    }

    const imageOrders = reorderDto.images.map((item) => ({
      imageId: item.imageId,
      order: item.order,
    }));

    const images = await this.reorderPropertyImagesUseCase.execute(propertyId, imageOrders, realtorId);
    return images.map((image) => PropertyImageResponseDto.fromEntity(image));
  }
}

