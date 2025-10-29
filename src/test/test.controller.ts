import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Teste')
@Controller('test')
export class TestController {
  @Get()
  @ApiOperation({ summary: 'Teste simples' })
  async test(): Promise<{ message: string }> {
    return { message: 'Teste funcionando' };
  }
}
