import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request, HttpCode, Inject } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ScannerAuthService } from '../shared/infrastructure/services/scanner-auth.service';
import { CreateScannerDto, UpdateScannerDto, ScannerResponseDto, ScannerAuthDto, ScannerAuthResponseDto } from '../shared/presentation/dtos/scanner.dto';
import { IScannerRepository } from '../shared/domain/interfaces/scanner-repository.interface';
import { ILogger } from '../shared/application/interfaces/logger.interface';
import { Scanner, ScannerRole } from '../shared/domain/entities/scanner.entity';

@ApiTags('Scanners')
@Controller('scanners')
export class ScannersController {
  constructor(
    @Inject('IScannerRepository')
    private readonly scannerRepository: IScannerRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
    private readonly scannerAuthService: ScannerAuthService,
  ) {}

  @Post('auth')
  @HttpCode(200)
  @ApiOperation({ summary: 'Autenticar scanner' })
  @ApiResponse({ status: 200, description: 'Scanner autenticado com sucesso' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async authenticate(@Body() authDto: ScannerAuthDto, @Request() req: any): Promise<ScannerAuthResponseDto> {
    const clientIp = req.ip || req.connection.remoteAddress;
    return await this.scannerAuthService.authenticate(authDto, clientIp);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(201)
  @ApiOperation({ summary: 'Criar novo scanner (ADMIN)' })
  @ApiResponse({ status: 201, description: 'Scanner criado com sucesso' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Permissão insuficiente' })
  async create(@Body() createScannerDto: CreateScannerDto, @Request() req: any): Promise<ScannerResponseDto> {
    // Verificar se o usuário é ADMIN
    if (req.user.role !== 'ADMIN') {
      throw new Error('Apenas administradores podem criar scanners');
    }

    this.logger.info('Criando novo scanner', {
      name: createScannerDto.name,
      location: createScannerDto.location,
      role: createScannerDto.role,
      adminId: req.user.sub,
    });

    const scanner = Scanner.create(
      createScannerDto.name,
      createScannerDto.location,
      createScannerDto.role || ScannerRole.VALIDATOR
    );

    const savedScanner = await this.scannerRepository.save(scanner);

    this.logger.info('Scanner criado com sucesso', {
      scannerId: savedScanner.id,
      name: savedScanner.name,
      apiKey: savedScanner.apiKey,
    });

    return ScannerResponseDto.fromEntity(savedScanner);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos os scanners (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Lista de scanners' })
  async findAll(@Request() req: any): Promise<ScannerResponseDto[]> {
    // Verificar se o usuário é ADMIN
    if (req.user.role !== 'ADMIN') {
      throw new Error('Apenas administradores podem listar scanners');
    }

    const scanners = await this.scannerRepository.findAll();
    return scanners.map(scanner => ScannerResponseDto.fromEntity(scanner));
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter scanner por ID (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Scanner encontrado' })
  @ApiResponse({ status: 404, description: 'Scanner não encontrado' })
  async findOne(@Param('id') id: string, @Request() req: any): Promise<ScannerResponseDto> {
    // Verificar se o usuário é ADMIN
    if (req.user.role !== 'ADMIN') {
      throw new Error('Apenas administradores podem visualizar scanners');
    }

    const scanner = await this.scannerRepository.findById(id);
    if (!scanner) {
      throw new Error('Scanner não encontrado');
    }

    return ScannerResponseDto.fromEntity(scanner);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar scanner (ADMIN)' })
  @ApiResponse({ status: 200, description: 'Scanner atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Scanner não encontrado' })
  async update(@Param('id') id: string, @Body() updateScannerDto: UpdateScannerDto, @Request() req: any): Promise<ScannerResponseDto> {
    // Verificar se o usuário é ADMIN
    if (req.user.role !== 'ADMIN') {
      throw new Error('Apenas administradores podem atualizar scanners');
    }

    const scanner = await this.scannerRepository.findById(id);
    if (!scanner) {
      throw new Error('Scanner não encontrado');
    }

    if (updateScannerDto.name) scanner.name = updateScannerDto.name;
    if (updateScannerDto.location) scanner.location = updateScannerDto.location;
    if (updateScannerDto.role) scanner.role = updateScannerDto.role;
    if (updateScannerDto.status) scanner.status = updateScannerDto.status;

    const updatedScanner = await this.scannerRepository.update(scanner);

    this.logger.info('Scanner atualizado', {
      scannerId: scanner.id,
      updates: updateScannerDto,
      adminId: req.user.sub,
    });

    return ScannerResponseDto.fromEntity(updatedScanner);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({ summary: 'Deletar scanner (ADMIN)' })
  @ApiResponse({ status: 204, description: 'Scanner deletado com sucesso' })
  @ApiResponse({ status: 404, description: 'Scanner não encontrado' })
  async remove(@Param('id') id: string, @Request() req: any): Promise<void> {
    // Verificar se o usuário é ADMIN
    if (req.user.role !== 'ADMIN') {
      throw new Error('Apenas administradores podem deletar scanners');
    }

    const scanner = await this.scannerRepository.findById(id);
    if (!scanner) {
      throw new Error('Scanner não encontrado');
    }

    await this.scannerRepository.delete(id);

    this.logger.info('Scanner deletado', {
      scannerId: id,
      adminId: req.user.sub,
    });
  }
}
