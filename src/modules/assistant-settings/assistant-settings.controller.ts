import { ApiRes } from '@/common/decorators/swagger';
import { ApiErr } from '@/common/decorators/swagger/api-err.decorator';
import { ResponseMessage } from '@common';
import { CurrentUser } from '@common/decorators/current-user.decorator';
import { Public } from '@common/decorators/public.decorator';
import { StoresService } from '@modules/stores/stores.service';
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AssistantSettingsService } from './assistant-settings.service';
import {
  FullAssistantSettingsResponseDto,
  PublicAssistantSettingsResponseDto,
} from './dtos/assistant-settings-response.dto';
import { UpsertAssistantSettingsDto } from './dtos/upsert-assistant-settings.dto';

@ApiTags('Assistant Settings')
@ApiErr(['INTERNAL_SERVER_ERROR'])
@Controller('assistant-settings')
export class AssistantSettingsController {
  constructor(
    private readonly assistantSettingsService: AssistantSettingsService,
    private readonly storesService: StoresService,
  ) {}

  @Public()
  @Get('public/:merchantId')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Public assistant settings retrieved')
  @ApiOperation({
    summary: 'Get public assistant settings for a specific merchant',
    description: 'Retrieves the public assistant settings for a given merchant ID.',
  })
  @ApiParam({
    name: 'merchantId',
    description: 'The ID of the merchant for which to retrieve public assistant settings.',
    required: true,
    example: '1355819592',
  })
  @ApiRes(PublicAssistantSettingsResponseDto, {
    status: HttpStatus.OK,
    description: 'Public assistant settings retrieved successfully',
  })
  @ApiErr(['BAD_REQUEST', 'NOT_FOUND', 'FORBIDDEN'])
  async getPublic(@Param('merchantId') merchantId: string) {
    const storeId = await this.storesService.getActiveStoreIdByMerchantId(merchantId);

    return this.assistantSettingsService.getPublicSettings(storeId);
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Assistant settings retrieved')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get assistant settings for a specific store',
    description: 'Retrieves the assistant settings for a given store ID.',
  })
  @ApiRes(FullAssistantSettingsResponseDto, {
    status: HttpStatus.OK,
    description: 'Assistant settings retrieved successfully',
  })
  @ApiErr(['BAD_REQUEST', 'NOT_FOUND'])
  async getForDashboard(@CurrentUser('storeId') storeId: string) {
    return this.assistantSettingsService.getSettingsForDashboard(storeId);
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Assistant settings updated')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Update assistant settings for a specific store',
    description: 'Updates the assistant settings for a given store ID.',
  })
  @ApiRes(FullAssistantSettingsResponseDto, {
    status: HttpStatus.OK,
    description: 'Assistant settings updated successfully',
  })
  @ApiErr(['BAD_REQUEST', 'NOT_FOUND', 'FORBIDDEN'])
  async update(@CurrentUser('storeId') storeId: string, @Body() dto: UpsertAssistantSettingsDto) {
    const settings = await this.assistantSettingsService.upsert(storeId, dto);

    await this.storesService.markOnboardingCompleted(storeId);

    return settings;
  }
}
