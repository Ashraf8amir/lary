import { ApiErr } from '@/common/decorators/swagger/api-err.decorator';
import { ApiRes } from '@/common/decorators/swagger/api-res.decorator';
import { ResponseMessage } from '@common';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Public } from '@common/decorators/public.decorator';
import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  RawBody,
} from '@nestjs/common';
import { ApiBearerAuth, ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { EmbeddedSessionDto } from './dtos/embedded-session.dto';
import { embeddedSessionResponseDto, StatusResponseDto } from './dtos/salla-response.dto';
import { SallaWebhookPayloadDto } from './dtos/salla-webhook.dto';
import { SallaEmbeddedAuthService } from './services/salla-embedded-auth.service';
import { SallaIntegrationService } from './services/salla-integration.service';
import { SallaWebhookService } from './services/salla-webhook.service';

@ApiTags('Salla Integration')
@ApiErr(['INTERNAL_SERVER_ERROR'])
@Controller('integrations/salla')
export class SallaIntegrationController {
  constructor(
    private readonly sallaIntegrationService: SallaIntegrationService,
    private readonly sallaWebhookService: SallaWebhookService,
    private readonly sallaEmbeddedAuthService: SallaEmbeddedAuthService,
  ) {}

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Salla webhook processed')
  @ApiExcludeEndpoint()
  async handleWebhook(
    @Body() payload: SallaWebhookPayloadDto,
    @RawBody() rawBody: Buffer,
    @Headers('x-salla-signature') signature?: string,
  ) {
    await this.sallaWebhookService.handleWebhook(payload, rawBody, signature);
    return { success: true };
  }

  @Get('status')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Integration status retrieved')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get Salla integration status for a specific store',
    description: 'Retrieves the Salla integration status for a given store ID.',
  })
  @ApiRes(StatusResponseDto, {
    status: HttpStatus.OK,
    description: 'Integration status retrieved successfully',
  })
  @ApiErr(['BAD_REQUEST', 'NOT_FOUND', 'FORBIDDEN'])
  async status(@CurrentUser('storeId') storeId: string) {
    return this.sallaIntegrationService.getIntegrationStatus(storeId);
  }

  @Public()
  @Throttle({ long: { limit: 5, ttl: 60000 } })
  @Post('embedded/session')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Embedded session created')
  @ApiOperation({
    summary: 'Create an embedded session for Salla integration',
    description: 'Creates an embedded session using the provided token.',
  })
  @ApiRes(embeddedSessionResponseDto, {
    status: HttpStatus.OK,
    description: 'Embedded session created successfully',
  })
  @ApiErr(['BAD_REQUEST', 'UNAUTHORIZED'])
  async createEmbeddedSession(@Body() dto: EmbeddedSessionDto) {
    return this.sallaEmbeddedAuthService.createSession(dto.token);
  }
}
