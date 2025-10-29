import { ApiProperty } from '@nestjs/swagger';
import { Event } from '../../domain/entities/event.entity';

export class EventResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ description: 'Código amigável do evento', example: 'EVT-A1B2C3' })
  code?: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  date: Date;

  @ApiProperty()
  location: string;

  @ApiProperty()
  address: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  state: string;

  @ApiProperty()
  image: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  organizerId: string;

  @ApiProperty()
  organizerName: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  maxCapacity: number;

  @ApiProperty()
  soldTickets: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  static fromEntity(event: Event): EventResponseDto {
    const dto = new EventResponseDto();
    dto.id = event.id;
    dto.code = event.code || undefined;
    dto.title = event.title;
    dto.description = event.description;
    dto.date = event.date;
    dto.location = event.location;
    dto.address = event.address;
    dto.city = event.city;
    dto.state = event.state;
    dto.image = event.image;
    dto.category = event.category;
    dto.organizerId = event.organizerId;
    dto.organizerName = event.organizerName;
    dto.status = event.status;
    dto.maxCapacity = event.maxCapacity;
    dto.soldTickets = event.soldTickets;
    dto.createdAt = event.createdAt;
    dto.updatedAt = event.updatedAt;
    return dto;
  }
}
