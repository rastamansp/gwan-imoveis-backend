import { Controller, Get, Post, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateUserWhatsappInstanceUseCase } from '../shared/application/use-cases/create-user-whatsapp-instance.use-case';
import { GetUserWhatsappStatusUseCase, UserWhatsappStatus } from '../shared/application/use-cases/get-user-whatsapp-status.use-case';
import { ConnectUserWhatsappUseCase, ConnectUserWhatsappResult } from '../shared/application/use-cases/connect-user-whatsapp.use-case';
import { DisconnectUserWhatsappUseCase } from '../shared/application/use-cases/disconnect-user-whatsapp.use-case';

/**
 * Endpoints de gerenciamento da instância WhatsApp do usuário autenticado.
 * Sempre operam sobre `req.user.id` — o cliente nunca passa userId.
 */
@ApiTags('WhatsApp do usuário')
@Controller('users/me/whatsapp')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserWhatsappController {
  constructor(
    private readonly getStatus: GetUserWhatsappStatusUseCase,
    private readonly createInstance: CreateUserWhatsappInstanceUseCase,
    private readonly connect: ConnectUserWhatsappUseCase,
    private readonly disconnect: DisconnectUserWhatsappUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Status da integração WhatsApp do usuário',
    description:
      'Retorna `hasInstance: false` se o usuário ainda não tem instância no Evolution. ' +
      'Caso tenha, busca dados live no Evolution (status de conexão, perfil, número, foto).',
  })
  @ApiOkResponse({
    description: 'Status obtido com sucesso',
    schema: {
      examples: [
        { hasInstance: false },
        {
          hasInstance: true,
          instance: {
            id: 'b1c2d3e4-...',
            name: 'joao_silva',
            connectionStatus: 'open',
            profileName: 'João Silva',
            profilePicUrl: 'https://...',
            number: '5511999999999',
            ownerJid: '5511999999999@s.whatsapp.net',
          },
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 503, description: 'Evolution API indisponível' })
  async status(@Request() req: any): Promise<UserWhatsappStatus> {
    return this.getStatus.execute(req.user.id);
  }

  @Post('instance')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Cria a instância Evolution para o usuário',
    description:
      'Idempotente. Se o usuário já tem instância, retorna a existente sem chamar o Evolution. ' +
      'O nome é derivado do nome do usuário (slug), com fallback de prefixo do email em caso de colisão.',
  })
  @ApiCreatedResponse({
    description: 'Instância criada (ou já existente)',
    schema: {
      example: {
        id: 'b1c2d3e4-...',
        name: 'joao_silva',
        connectionStatus: 'close',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 503, description: 'Evolution API indisponível' })
  async create(@Request() req: any) {
    const config = await this.createInstance.execute(req.user.id);
    return {
      id: config.evolutionInstanceId,
      name: config.evolutionInstanceName,
      connectionStatus: 'close',
    };
  }

  @Post('connect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Solicita o QR code para parear o WhatsApp do usuário',
    description:
      'Retorna o QR em base64 (com prefixo data:image/png;base64,) e o pairing code. ' +
      'O QR expira em 30 segundos — depois disso o cliente deve solicitar de novo.',
  })
  @ApiOkResponse({
    description: 'QR gerado com sucesso',
    schema: {
      example: {
        qrcodeBase64: 'data:image/png;base64,iVBORw0KGgoAAAANS...',
        pairingCode: '12345678',
        expiresInSeconds: 30,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Instância não criada — chame POST /instance antes' })
  @ApiResponse({ status: 503, description: 'Evolution API indisponível' })
  async connectInstance(@Request() req: any): Promise<ConnectUserWhatsappResult> {
    return this.connect.execute(req.user.id);
  }

  @Post('disconnect')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Desconecta a instância (logout) sem apagá-la',
    description:
      'Endpoint preparado para uso futuro — sem botão visível na UI nesta entrega. ' +
      'Faz logout no Evolution mantendo a config local.',
  })
  @ApiOkResponse({ description: 'Logout efetuado', schema: { example: { success: true } } })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Instância não criada' })
  @ApiResponse({ status: 503, description: 'Evolution API indisponível' })
  async disconnectInstance(@Request() req: any) {
    return this.disconnect.execute(req.user.id);
  }
}
