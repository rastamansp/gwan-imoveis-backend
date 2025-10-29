import { IsString, IsOptional, IsEmail, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../domain/value-objects/user-role.enum';

export class UpdateUserDto {
  @ApiProperty({ example: 'Nome do Usuário', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'usuario@email.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '11999999999', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: UserRole.USER, enum: UserRole, required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
