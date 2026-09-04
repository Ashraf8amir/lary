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
} from '@nestjs/common';
import { SallaWebhookPayloadDto } from './dtos/salla-webhook.dto';
import { SallaIntegrationService } from './salla-integration.service';

@Controller('integrations/salla')
export class SallaIntegrationController {
  constructor(
    private readonly sallaIntegrationService: SallaIntegrationService,
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
}
