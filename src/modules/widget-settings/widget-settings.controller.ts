import { ResponseMessage } from '@common';
import { CurrentUser } from '@modules/auth/decorators/current-user.decorator';
import { Public } from '@modules/auth/decorators/public.decorator';
import { StoresService } from '@modules/stores/stores.service';
import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch } from '@nestjs/common';
import { UpsertWidgetSettingsDto } from './dtos/upsert-widget-settings.dto';
import { WidgetSettingsService } from './widget-settings.service';

@Controller('widget-settings')
export class WidgetSettingsController {
  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly storesService: StoresService,
  ) {}

  @Patch(':storeId')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Widget settings updated')
  async update(
    @CurrentUser('userId') userId: string,
    @Param('storeId') storeId: string,
    @Body() dto: UpsertWidgetSettingsDto,
  ) {
    await this.storesService.assertOwnership(storeId, userId);

    const settings = await this.widgetSettingsService.upsert(storeId, dto);

    await this.storesService.markOnboardingCompleted(storeId);

    return settings;
  }

  @Public()
  @Get('public/:storeId')
  @HttpCode(HttpStatus.OK)
  @ResponseMessage('Widget settings retrieved')
  async getPublic(@Param('storeId') storeId: string) {
    return this.widgetSettingsService.getPublicSettings(storeId);
  }
}
