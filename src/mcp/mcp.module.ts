import { Module } from '@nestjs/common';
import { McpBridgeController } from './mcp.controller';

@Module({
  imports: [],
  controllers: [McpBridgeController],
})
export class McpModule {}


