import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, HttpCode, Inject, ParseUUIDPipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CreateProductUseCase } from '../shared/application/use-cases/create-product.use-case';
import { GetEventProductsUseCase } from '../shared/application/use-cases/get-event-products.use-case';
import { AddCreditUseCase } from '../shared/application/use-cases/add-credit.use-case';
import { GetUserBalanceUseCase } from '../shared/application/use-cases/get-user-balance.use-case';
import { PurchaseProductsUseCase } from '../shared/application/use-cases/purchase-products.use-case';
import { ValidateProductQRUseCase } from '../shared/application/use-cases/validate-product-qr.use-case';
import { CreateProductDto } from './dtos/create-product.dto';
import { UpdateProductDto } from './dtos/update-product.dto';
import { AddCreditDto } from './dtos/add-credit.dto';
import { PurchaseProductDto } from './dtos/purchase-product.dto';
import { ValidateProductQrDto } from './dtos/validate-product-qr.dto';
import { ProductResponseDto } from './dtos/product-response.dto';
import { OrderResponseDto } from './dtos/order-response.dto';
import { CreditBalanceResponseDto } from './dtos/credit-balance-response.dto';
import { IProductRepository } from '../shared/domain/interfaces/product-repository.interface';
import { IOrderRepository } from '../shared/domain/interfaces/order-repository.interface';
import { IEventRepository } from '../shared/domain/interfaces/event-repository.interface';
import { ILogger } from '../shared/application/interfaces/logger.interface';
import { Product } from '../shared/domain/entities/product.entity';
import { InvalidOperationException } from '../shared/domain/exceptions/invalid-operation.exception';

@ApiTags('Produtos e Créditos')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly getEventProductsUseCase: GetEventProductsUseCase,
    private readonly addCreditUseCase: AddCreditUseCase,
    private readonly getUserBalanceUseCase: GetUserBalanceUseCase,
    private readonly purchaseProductsUseCase: PurchaseProductsUseCase,
    private readonly validateProductQRUseCase: ValidateProductQRUseCase,
    @Inject('IProductRepository')
    private readonly productRepository: IProductRepository,
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
    @Inject('IEventRepository')
    private readonly eventRepository: IEventRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(201)
  @ApiOperation({ summary: 'Criar produto para evento' })
  @ApiResponse({ status: 201, description: 'Produto criado com sucesso', type: ProductResponseDto })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Apenas organizador do evento pode criar produtos' })
  async create(@Body() createProductDto: CreateProductDto, @Request() req: any): Promise<ProductResponseDto> {
    const organizerId = req.user.id;
    const command = {
      eventId: createProductDto.eventId,
      name: createProductDto.name,
      description: createProductDto.description,
      price: createProductDto.price,
      category: createProductDto.category,
      image: createProductDto.image,
      isActive: createProductDto.isActive !== undefined ? createProductDto.isActive : true,
    };
    const product = await this.createProductUseCase.execute(command, organizerId);
    return ProductResponseDto.fromEntity(product);
  }

  @Get('event/:eventId')
  @ApiOperation({ summary: 'Listar produtos do evento' })
  @ApiResponse({ status: 200, description: 'Lista de produtos obtida com sucesso', type: [ProductResponseDto] })
  @ApiResponse({ status: 400, description: 'ID do evento inválido (não é um UUID válido)' })
  @ApiQuery({ name: 'activeOnly', required: false, description: 'Apenas produtos ativos', type: Boolean })
  async getEventProducts(
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Query('activeOnly') activeOnly?: string,
  ): Promise<ProductResponseDto[]> {
    const activeOnlyBool = activeOnly !== 'false';
    const products = await this.getEventProductsUseCase.execute(eventId, activeOnlyBool);
    return products.map(product => ProductResponseDto.fromEntity(product));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter produto por ID' })
  @ApiResponse({ status: 200, description: 'Produto obtido com sucesso', type: ProductResponseDto })
  @ApiResponse({ status: 400, description: 'ID inválido (não é um UUID válido)' })
  @ApiResponse({ status: 404, description: 'Produto não encontrado' })
  async getById(@Param('id', ParseUUIDPipe) id: string): Promise<ProductResponseDto> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new InvalidOperationException('Get product', 'Product not found');
    }
    return ProductResponseDto.fromEntity(product);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar produto' })
  @ApiResponse({ status: 200, description: 'Produto atualizado com sucesso', type: ProductResponseDto })
  @ApiResponse({ status: 400, description: 'ID inválido (não é um UUID válido)' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Apenas organizador do evento pode atualizar produtos' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Request() req: any,
  ): Promise<ProductResponseDto> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new InvalidOperationException('Update product', 'Product not found');
    }

    // Verificar se o usuário é organizador do evento
    const event = await this.eventRepository.findById(product.eventId);
    if (!event || event.organizerId !== req.user.id) {
      throw new InvalidOperationException('Update product', 'Only event organizer can update products');
    }

    // Atualizar campos
    if (updateProductDto.name !== undefined) product.name = updateProductDto.name;
    if (updateProductDto.description !== undefined) product.description = updateProductDto.description;
    if (updateProductDto.price !== undefined) product.price = updateProductDto.price;
    if (updateProductDto.category !== undefined) product.category = updateProductDto.category;
    if (updateProductDto.image !== undefined) product.image = updateProductDto.image;
    if (updateProductDto.isActive !== undefined) {
      if (updateProductDto.isActive) {
        product.activate();
      } else {
        product.deactivate();
      }
    }

    const updatedProduct = await this.productRepository.save(product);
    return ProductResponseDto.fromEntity(updatedProduct);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(204)
  @ApiOperation({ summary: 'Deletar produto' })
  @ApiResponse({ status: 204, description: 'Produto deletado com sucesso' })
  @ApiResponse({ status: 400, description: 'ID inválido (não é um UUID válido)' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 403, description: 'Apenas organizador do evento pode deletar produtos' })
  async delete(@Param('id', ParseUUIDPipe) id: string, @Request() req: any): Promise<void> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new InvalidOperationException('Delete product', 'Product not found');
    }

    // Verificar se o usuário é organizador do evento
    const event = await this.eventRepository.findById(product.eventId);
    if (!event || event.organizerId !== req.user.id) {
      throw new InvalidOperationException('Delete product', 'Only event organizer can delete products');
    }

    await this.productRepository.delete(id);
  }
}

@ApiTags('Créditos')
@Controller('credits')
export class CreditsController {
  constructor(
    private readonly addCreditUseCase: AddCreditUseCase,
    private readonly getUserBalanceUseCase: GetUserBalanceUseCase,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  @Post('add')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(200)
  @ApiOperation({ summary: 'Adicionar créditos ao saldo do usuário' })
  @ApiResponse({ status: 200, description: 'Créditos adicionados com sucesso', type: CreditBalanceResponseDto })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async addCredit(@Body() addCreditDto: AddCreditDto, @Request() req: any): Promise<CreditBalanceResponseDto> {
    const userId = req.user.id;
    const userCredit = await this.addCreditUseCase.execute(userId, addCreditDto.amount);
    return {
      balance: userCredit.getBalance(),
      updatedAt: userCredit.updatedAt,
    };
  }

  @Get('balance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Consultar saldo de créditos' })
  @ApiResponse({ status: 200, description: 'Saldo obtido com sucesso', type: CreditBalanceResponseDto })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async getBalance(@Request() req: any): Promise<CreditBalanceResponseDto> {
    const userId = req.user.id;
    const { balance, userCredit } = await this.getUserBalanceUseCase.execute(userId);
    return {
      balance,
      updatedAt: userCredit?.updatedAt || new Date(),
    };
  }
}

@ApiTags('Pedidos')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly purchaseProductsUseCase: PurchaseProductsUseCase,
    @Inject('IOrderRepository')
    private readonly orderRepository: IOrderRepository,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(201)
  @ApiOperation({ summary: 'Criar pedido (comprar produtos)' })
  @ApiResponse({ status: 201, description: 'Pedido criado com sucesso', type: OrderResponseDto })
  @ApiResponse({ status: 400, description: 'Saldo insuficiente ou dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async create(@Body() purchaseProductDto: PurchaseProductDto, @Request() req: any): Promise<OrderResponseDto> {
    const userId = req.user.id;
    const command = {
      eventId: purchaseProductDto.eventId,
      items: purchaseProductDto.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      ticketId: purchaseProductDto.ticketId,
    };
    const order = await this.purchaseProductsUseCase.execute(command, userId);
    return OrderResponseDto.fromEntity(order);
  }

  @Get('event/:eventId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter comanda do evento (pedidos do usuário no evento)' })
  @ApiResponse({ status: 200, description: 'Comanda obtida com sucesso', type: [OrderResponseDto] })
  @ApiResponse({ status: 400, description: 'ID do evento inválido (não é um UUID válido)' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  async getEventOrders(@Param('eventId', ParseUUIDPipe) eventId: string, @Request() req: any): Promise<OrderResponseDto[]> {
    const userId = req.user.id;
    const orders = await this.orderRepository.findByUserIdAndEventId(userId, eventId);
    return orders.map(order => OrderResponseDto.fromEntity(order));
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter detalhes do pedido' })
  @ApiResponse({ status: 200, description: 'Pedido obtido com sucesso', type: OrderResponseDto })
  @ApiResponse({ status: 400, description: 'ID inválido (não é um UUID válido)' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 404, description: 'Pedido não encontrado' })
  async getById(@Param('id', ParseUUIDPipe) id: string, @Request() req: any): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new InvalidOperationException('Get order', 'Order not found');
    }

    // Verificar se o pedido pertence ao usuário
    if (order.userId !== req.user.id) {
      throw new InvalidOperationException('Get order', 'Order does not belong to this user');
    }

    return OrderResponseDto.fromEntity(order);
  }
}

@ApiTags('Validação')
@Controller('products')
export class ProductValidationController {
  constructor(
    private readonly validateProductQRUseCase: ValidateProductQRUseCase,
    @Inject('ILogger')
    private readonly logger: ILogger,
  ) {}

  @Get('validate')
  @ApiOperation({ summary: 'Validar QR code de produto (para atendente)' })
  @ApiResponse({ status: 200, description: 'QR code validado com sucesso' })
  @ApiResponse({ status: 400, description: 'QR code inválido ou já validado' })
  @ApiQuery({ name: 'code', required: true, description: 'Código do QR code do produto' })
  @ApiQuery({ name: 'validatedBy', required: false, description: 'ID do atendente/scanner' })
  async validateByCode(
    @Query('code') code: string,
    @Query('validatedBy') validatedBy?: string,
  ): Promise<{ valid: boolean; message: string; orderItem?: any }> {
    try {
      const validatedByValue = validatedBy || 'system';
      const orderItem = await this.validateProductQRUseCase.execute(code, validatedByValue);
      return {
        valid: true,
        message: 'Produto validado com sucesso',
        orderItem: {
          id: orderItem.id,
          productId: orderItem.productId,
          quantity: orderItem.quantity,
          validatedAt: orderItem.validatedAt,
          validatedBy: orderItem.validatedBy,
        },
      };
    } catch (error) {
      return {
        valid: false,
        message: error.message || 'Erro ao validar QR code',
      };
    }
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validar QR code de produto (POST)' })
  @ApiResponse({ status: 200, description: 'QR code validado com sucesso' })
  @ApiResponse({ status: 400, description: 'QR code inválido ou já validado' })
  async validate(@Body() validateProductQrDto: ValidateProductQrDto): Promise<{ valid: boolean; message: string; orderItem?: any }> {
    try {
      const validatedBy = validateProductQrDto.validatedBy || 'system';
      const orderItem = await this.validateProductQRUseCase.execute(validateProductQrDto.code, validatedBy);
      return {
        valid: true,
        message: 'Produto validado com sucesso',
        orderItem: {
          id: orderItem.id,
          productId: orderItem.productId,
          quantity: orderItem.quantity,
          validatedAt: orderItem.validatedAt,
          validatedBy: orderItem.validatedBy,
        },
      };
    } catch (error) {
      return {
        valid: false,
        message: error.message || 'Erro ao validar QR code',
      };
    }
  }
}

