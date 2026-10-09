import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, type Model, Types } from 'mongoose';
import { UpsertAssistantSettingsDto } from '../dtos/upsert-assistant-settings.dto';
import { AssistantSettings, AssistantSettingsDocument } from '../schemas/assistant-settings.schema';

@Injectable()
export class AssistantSettingsRepository {
  constructor(
    @InjectModel(AssistantSettings.name)
    private readonly assistantSettingsModel: Model<AssistantSettingsDocument>,
  ) {}

  async findByStoreId(storeId: string): Promise<AssistantSettings | null> {
    if (!isValidObjectId(storeId)) return null;

    return this.assistantSettingsModel
      .findOne({ storeId: new Types.ObjectId(storeId) })
      .lean<AssistantSettings>()
      .exec();
  }

  async upsert(
    storeId: string,
    dto: UpsertAssistantSettingsDto,
  ): Promise<AssistantSettingsDocument> {
    if (!isValidObjectId(storeId)) {
      throw new BadRequestException(`Invalid storeId: ${storeId}`);
    }

    const storeObjectId = new Types.ObjectId(storeId);
    const updatePayload = this.buildUpdatePayload(dto);

    const updatedDocument = await this.assistantSettingsModel
      .findOneAndUpdate(
        { storeId: storeObjectId },
        {
          $set: updatePayload,
          $setOnInsert: { storeId: storeObjectId },
        },
        { upsert: true, returnDocument: 'after', runValidators: true },
      )
      .exec();

    return updatedDocument!;
  }

  private buildUpdatePayload(dto: UpsertAssistantSettingsDto): Record<string, unknown> {
    const payload: Record<string, unknown> = {};

    const topLevelKeys: Array<keyof UpsertAssistantSettingsDto> = [
      'primaryColor',
      'position',
      'welcomeMessage',
      'botName',
      'avatarUrl',
      'isEnabled',
      'faqs',
    ];

    for (const key of topLevelKeys) {
      if (dto[key] !== undefined) {
        payload[key] = dto[key];
      }
    }

    if (dto.supportContact) {
      for (const [k, v] of Object.entries(dto.supportContact)) {
        if (v !== undefined) {
          payload[`supportContact.${k}`] = v;
        }
      }
    }

    if (dto.storePolicies) {
      for (const [k, v] of Object.entries(dto.storePolicies)) {
        if (v !== undefined) {
          payload[`storePolicies.${k}`] = v;
        }
      }
    }

    return payload;
  }
}
