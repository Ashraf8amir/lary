import { WidgetPosition } from '../enums/widget-position.enum';

export interface PublicWidgetSettings {
  primaryColor: string;
  position: WidgetPosition;
  welcomeMessage: string;
  botName: string;
  avatarUrl: string | null;
  isEnabled: boolean;
}
