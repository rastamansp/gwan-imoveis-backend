import { IsString, IsNotEmpty, IsArray, ValidateNested, IsNumber, Min, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PurchaseItemDto {
  @ApiProperty({ example: '89a91565-38eb-4dea-8166-ac251617fa72', description: 'ID do produto' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 2, description: 'Quantidade do produto' })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class PurchaseProductDto {
  @ApiProperty({ example: '89a91565-38eb-4dea-8166-ac251617fa72', description: 'ID do evento' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  eventId: string;

  @ApiProperty({ type: [PurchaseItemDto], description: 'Lista de itens a comprar' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items: PurchaseItemDto[];

  @ApiProperty({ example: '89a91565-38eb-4dea-8166-ac251617fa72', description: 'ID do ticket (opcional)', required: false })
  @IsOptional()
  @IsString()
  @IsUUID()
  ticketId?: string;
}

