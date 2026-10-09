import { CreateStoreDto } from '@/modules/stores/dtos/create-store.dto';
import { StorePlatform, StoreStatus } from '@/modules/stores/enums/stores.enums';
import { StoreSocialLinks } from '@/modules/stores/interfaces/stores.interfaces';
import { SALLA_DEFAULT_CURRENCY } from '../constants/salla.constants';
import { SallaStoreInfo, SallaUserInfo } from '../interfaces/salla-api.interface';
import { MappedMerchantUser, MappedSallaStore } from '../interfaces/salla-integration.interface';

export class SallaStoreMapper {
  static toMerchantUser(
    userInfo: SallaUserInfo,
    storeInfo: SallaStoreInfo,
    merchantId: string,
  ): MappedMerchantUser {
    const email = userInfo.email?.trim() || storeInfo.email?.trim();

    return {
      email: email ?? '',
      fullName: userInfo.name?.trim() || storeInfo.name?.trim() || `Merchant ${merchantId}`,
      mobile: userInfo.mobile?.trim() || undefined,
    };
  }

  static toStorePayload(storeInfo: SallaStoreInfo, merchantId: string): MappedSallaStore {
    const rawName = storeInfo.name?.trim();
    const validName = rawName && rawName.length >= 2 ? rawName : `Salla Store ${merchantId}`;

    return {
      merchantId: String(storeInfo.id || merchantId).trim(),
      name: validName,
      platform: StorePlatform.Salla,
      status: this.mapStoreStatus(storeInfo.status),
      plan: storeInfo.plan?.trim() || undefined,
      email: storeInfo.email?.trim() || undefined,
      description: this.cleanDescription(storeInfo.description),
      currency: storeInfo.currency?.trim().toUpperCase() || SALLA_DEFAULT_CURRENCY,
      domain: storeInfo.domain?.trim() || undefined,
      avatar: storeInfo.avatar?.trim() || undefined,
      social: this.mapSocialLinks(storeInfo.social),
    };
  }

  static toCreateStoreDto(
    ownerId: string,
    storeInfo: SallaStoreInfo,
    merchantId: string,
  ): CreateStoreDto {
    return {
      ownerId,
      ...this.toStorePayload(storeInfo, merchantId),
    };
  }

  private static mapStoreStatus(sallaStatus?: string): StoreStatus {
    if (!sallaStatus) return StoreStatus.Active;

    const normalized = sallaStatus.trim().toLowerCase();
    if (normalized === 'active') return StoreStatus.Active;
    if (normalized === 'suspended' || normalized === 'banned') return StoreStatus.Suspended;

    return StoreStatus.Inactive;
  }

  private static mapSocialLinks(social?: SallaStoreInfo['social']): StoreSocialLinks | undefined {
    if (!social || typeof social !== 'object') return undefined;

    const mapped: StoreSocialLinks = {
      ...(social.telegram && { telegram: social.telegram.trim() }),
      ...(social.twitter && { twitter: social.twitter.trim() }),
      ...(social.facebook && { facebook: social.facebook.trim() }),
      ...(social.maroof && { maroof: social.maroof.trim() }),
      ...(social.youtube && { youtube: social.youtube.trim() }),
      ...(social.snapchat && { snapchat: social.snapchat.trim() }),
      ...(social.whatsapp && { whatsapp: social.whatsapp.trim() }),
      ...(social.instagram && { instagram: social.instagram.trim() }),
      ...(social.appstore_link && { appstoreLink: social.appstore_link.trim() }),
      ...(social.googleplay_link && { googleplayLink: social.googleplay_link.trim() }),
    };

    return Object.keys(mapped).length > 0 ? mapped : undefined;
  }

  private static cleanDescription(description?: string): string | undefined {
    if (!description) return undefined;

    const cleaned = description.replace(/<[^>]*>/g, '').trim();
    return cleaned.length > 0 ? cleaned : undefined;
  }
}
