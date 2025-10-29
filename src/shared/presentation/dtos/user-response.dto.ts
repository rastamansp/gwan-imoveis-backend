import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { User } from '../../domain/entities/user.entity';

export class UserResponseDto {
  @ApiProperty({ 
    description: 'UUID único do usuário',
    example: 'd4da01e3-2f5a-4edf-8fa3-71f262e04eb5',
    format: 'uuid'
  })
  id: string;

  @ApiProperty({ 
    description: 'Nome completo do usuário',
    example: 'João Silva Santos',
    maxLength: 255
  })
  name: string;

  @ApiProperty({ 
    description: 'Endereço de email do usuário',
    example: 'joao.silva@email.com',
    format: 'email'
  })
  email: string;

  @ApiPropertyOptional({ 
    description: 'Telefone do usuário (opcional)',
    example: '11999999999',
    nullable: true
  })
  phone?: string;

  @ApiProperty({ 
    description: 'Role/permissão do usuário no sistema',
    enum: ['USER', 'ORGANIZER', 'ADMIN'],
    example: 'USER'
  })
  role: string;

  @ApiProperty({ 
    description: 'Data e hora de criação do usuário',
    example: '2024-01-15T10:30:00.000Z',
    format: 'date-time'
  })
  createdAt: Date;

  @ApiProperty({ 
    description: 'Data e hora da última atualização do usuário',
    example: '2024-01-29T14:45:00.000Z',
    format: 'date-time'
  })
  updatedAt: Date;

  static fromEntity(user: User): UserResponseDto {
    const dto = new UserResponseDto();
    dto.id = user.id;
    dto.name = user.name;
    dto.email = user.email;
    dto.phone = user.phone;
    dto.role = user.role;
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;
    return dto;
  }
}
