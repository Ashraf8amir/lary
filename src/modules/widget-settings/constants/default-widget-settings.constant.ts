import { WidgetPosition } from '../enums/widget-position.enum';
import { PublicWidgetSettings } from '../interfaces/public-widget-settings.interface';

export const DEFAULT_WIDGET_SETTINGS: PublicWidgetSettings = {
  primaryColor: '#1f9991',
  position: WidgetPosition.BottomRight,
  welcomeMessage: 'أهلاً! تقدر تسألني عن أي منتج في المتجر',
  botName: 'مساعد المتجر',
  avatarUrl: null,
  isEnabled: true,
};
