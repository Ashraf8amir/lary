import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, type Model, Types } from 'mongoose';
import { UpsertWidgetSettingsDto } from '../dtos/upsert-widget-settings.dto';
import { WidgetSettings, WidgetSettingsDocument } from '../schemas/widget-settings.schema';

@Injectable()
export class WidgetSettingsRepository {
  constructor(
    @InjectModel(WidgetSettings.name)
    private readonly widgetSettingsModel: Model<WidgetSettingsDocument>,
  ) {}

  async findByStoreId(storeId: string): Promise<WidgetSettings | null> {
    if (!isValidObjectId(storeId)) return null;

    return this.widgetSettingsModel
      .findOne({ storeId: new Types.ObjectId(storeId) })
      .lean<WidgetSettings>()
      .exec();
  }

  async upsert(storeId: string, dto: UpsertWidgetSettingsDto): Promise<WidgetSettingsDocument> {
    if (!isValidObjectId(storeId)) {
      throw new BadRequestException(`Invalid storeId: ${storeId}`);
    }

    const storeObjectId = new Types.ObjectId(storeId);

    const updatedDocument = await this.widgetSettingsModel
      .findOneAndUpdate(
        { storeId: storeObjectId },
        { $set: dto, $setOnInsert: { storeId: storeObjectId } },
        { upsert: true, returnDocument: 'after', runValidators: true },
      )
      .exec();

    return updatedDocument!;
  }
}
