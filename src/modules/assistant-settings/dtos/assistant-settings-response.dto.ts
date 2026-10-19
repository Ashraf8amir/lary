import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WidgetPosition } from '../enums/widget-position.enum';

export class SupportContactResponseDto {
  @ApiPropertyOptional({ example: '+966500000000', nullable: true })
  whatsapp?: string | null;

  @ApiPropertyOptional({ example: '+966110000000', nullable: true })
  phone?: string | null;

  @ApiPropertyOptional({ example: 'support@store.com', nullable: true })
  email?: string | null;
}

export class StorePoliciesResponseDto {
  @ApiPropertyOptional({ example: 'التوصيل خلال 2-4 أيام عمل', nullable: true })
  shippingPolicy?: string | null;

  @ApiPropertyOptional({ example: 'الاسترجاع متاح خلال 14 يوماً من الاستلام', nullable: true })
  returnPolicy?: string | null;

  @ApiPropertyOptional({ example: 'مدى، فيزا، ماستركارد، تابي، تمارا', nullable: true })
  paymentMethods?: string | null;

  @ApiPropertyOptional({ example: 'متجر متخصص في بيع أفضل المنتجات العصرية', nullable: true })
  aboutStore?: string | null;
}

export class StoreFaqItemResponseDto {
  @ApiProperty({ example: 'كيف يمكنني تتبع طلبي؟' })
  question!: string;

  @ApiProperty({ example: 'يمكنك تتبع الشحنة عبر رابط التتبع المرسل في رسالة نصية.' })
  answer!: string;
}

export class FullAssistantSettingsResponseDto {
  @ApiProperty({ example: '64f8b9b8b209a8a7c20a1122' })
  storeId!: string;

  @ApiProperty({ example: '#4F46E5' })
  primaryColor!: string;

  @ApiProperty({ enum: WidgetPosition, example: WidgetPosition.BottomRight })
  position!: WidgetPosition;

  @ApiProperty({ example: 'مرحباً بك! كيف يمكنني مساعدتك اليوم؟' })
  welcomeMessage!: string;

  @ApiProperty({ example: 'المساعد الذكي' })
  botName!: string;

  @ApiPropertyOptional({ example: 'https://cdn.store.com/avatar.png', nullable: true })
  avatarUrl?: string | null;

  @ApiProperty({ example: true })
  isEnabled!: boolean;

  @ApiProperty({ type: () => SupportContactResponseDto })
  supportContact!: SupportContactResponseDto;

  @ApiProperty({ type: () => StorePoliciesResponseDto })
  storePolicies!: StorePoliciesResponseDto;

  @ApiProperty({ type: () => [StoreFaqItemResponseDto] })
  faqs!: StoreFaqItemResponseDto[];

  @ApiPropertyOptional({
    example: 'تحدث بأسلوب ودود ومهني، وركز على مساعدة العملاء في التسوق.',
    nullable: true,
  })
  customPersona?: string | null;
}

export class PublicAssistantSettingsResponseDto {
  @ApiProperty({ example: '64f8b9b8b209a8a7c20a1122' })
  storeId!: string;

  @ApiProperty({ example: '#4F46E5' })
  primaryColor!: string;

  @ApiProperty({ enum: WidgetPosition, example: WidgetPosition.BottomRight })
  position!: WidgetPosition;

  @ApiProperty({ example: 'مرحباً بك! كيف يمكنني مساعدتك اليوم؟' })
  welcomeMessage!: string;

  @ApiProperty({ example: 'المساعد الذكي' })
  botName!: string;

  @ApiPropertyOptional({ example: 'https://cdn.store.com/avatar.png', nullable: true })
  avatarUrl?: string | null;

  @ApiProperty({ example: true })
  isEnabled!: boolean;
}
