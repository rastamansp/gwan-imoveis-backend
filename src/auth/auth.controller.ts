import { Controller, Post, Body, UseGuards, Request, Get, HttpCode, Inject, UseFilters } from '@nestjs/common';
// import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterUserUseCase } from '../shared/application/use-cases/register-user.use-case';
import { LoginUserUseCase } from '../shared/application/use-cases/login-user.use-case';
import { UserResponseDto } from '../shared/presentation/dtos/user-response.dto';
import { IUserRepository } from '../shared/domain/interfaces/user-repository.interface';
import { ILogger } from '../shared/application/interfaces/logger.interface';
import { UserAlreadyExistsFilter } from '../shared/presentation/filters/user-already-exists.filter';
// import { User } from '../shared/domain/entities/user.entity';
import { JwtService } from '@nestjs/jwt';

@ApiTags('Autenticação')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
    private readonly jwtService: JwtService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Fazer login' })
  @ApiResponse({ status: 200, description: 'Login realizado com sucesso' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() loginDto: LoginDto): Promise<{ access_token: string; user: UserResponseDto }> {
    const user = await this.loginUserUseCase.execute(loginDto.email, loginDto.password);
    const payload = { email: user.email, sub: user.id, role: user.role };
    const access_token = this.jwtService.sign(payload);
    
    return {
      access_token,
      user: UserResponseDto.fromEntity(user),
    };
  }

  @Post('register')
  @HttpCode(201)
  @UseFilters(UserAlreadyExistsFilter)
  @ApiOperation({ summary: 'Registrar novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  async register(@Body() registerDto: RegisterDto): Promise<UserResponseDto> {
    const user = await this.registerUserUseCase.execute(registerDto);
    return UserResponseDto.fromEntity(user);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter perfil do usuário' })
  @ApiResponse({ status: 200, description: 'Perfil obtido com sucesso' })
  async getProfile(@Request() req): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(req.user.sub);
    if (!user) {
      throw new Error('User not found');
    }
    return UserResponseDto.fromEntity(user);
  }
}
