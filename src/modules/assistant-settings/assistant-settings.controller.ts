import { ResponseMessage } from '@common';
import { Public } from '@modules/auth/decorators/public.decorator';
import { StoresService } from '@modules/stores/stores.service';
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch } from '@nestjs/common';
import { AssistantSettingsService } from './assistant-settings.service';
import { UpsertAssistantSettingsDto } from './dtos/upsert-assistant-settings.dto';

@Controller('assistant-settings')
export class AssistantSettingsController {
  constructor(
    private readonly assistantSettingsService: AssistantSettingsService,
    private readonly storesService: StoresService,
  ) {}

  @Public()
  @Get(':storeId')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Assistant settings retrieved')
  async getForDashboard(
    // @CurrentUser('userId') userId: string,
    @Param('storeId') storeId: string,
  ) {
    // await this.storesService.assertOwnership(storeId, userId);

    return this.assistantSettingsService.getSettingsForDashboard(storeId);
  }

  @Public()
  @Patch(':storeId')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Assistant settings updated')
  async update(
    // @CurrentUser('userId') userId: string,
    @Param('storeId') storeId: string,
    @Body() dto: UpsertAssistantSettingsDto,
  ) {
    // await this.storesService.assertOwnership(storeId, userId);

    const settings = await this.assistantSettingsService.upsert(storeId, dto);

    await this.storesService.markOnboardingCompleted(storeId);

    return settings;
  }

  @Public()
  @Get('public/:storeId')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Public assistant settings retrieved')
  async getPublic(@Param('storeId') storeId: string) {
    return this.assistantSettingsService.getPublicSettings(storeId);
  }
}
