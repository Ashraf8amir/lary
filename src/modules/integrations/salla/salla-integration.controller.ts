import { ResponseMessage } from '@common';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { Public } from '@modules/auth/decorators/public.decorator';
import { StoresService } from '@modules/stores/stores.service';
import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  RawBody,
  UseGuards,
} from '@nestjs/common';
import { EmbeddedSessionDto } from './dtos/embedded-session.dto';
import { SallaWebhookPayloadDto } from './dtos/salla-webhook.dto';
import { EmbeddedSessionThrottlerGuard } from './guards/embedded-session-throttler.guard';
import { SallaIntegrationService } from './salla-integration.service';
import { SallaEmbeddedAuthService } from './services/salla-embedded-auth.service';

@Controller('integrations/salla')
export class SallaIntegrationController {
  constructor(
    private readonly sallaIntegrationService: SallaIntegrationService,
    private readonly sallaEmbeddedAuthService: SallaEmbeddedAuthService,
    private readonly storesService: StoresService,
  ) {}

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Salla webhook processed')
  async handleWebhook(
    @Body() payload: SallaWebhookPayloadDto,
    @RawBody() rawBody: Buffer,
    @Headers('x-salla-signature') signature?: string,
  ) {
    await this.sallaIntegrationService.handleWebhook(payload, rawBody, signature);
    return { success: true };
  }

  @Get('status/:storeId')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Integration status retrieved')
  async status(@CurrentUser('userId') userId: string, @Param('storeId') storeId: string) {
    await this.storesService.assertOwnership(storeId, userId);
    return this.sallaIntegrationService.getIntegrationStatus(storeId);
  }

  @Public()
  @UseGuards(EmbeddedSessionThrottlerGuard)
  @Post('embedded/session')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Embedded session created')
  async createEmbeddedSession(@Body() dto: EmbeddedSessionDto) {
    return this.sallaEmbeddedAuthService.createSession(dto.token);
  }
}
