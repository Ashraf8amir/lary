import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, type Model, Types } from 'mongoose';
import { PlanFeature, PlanSlug } from '../enums/plan.enums';
import { Plan, PlanDocument, PlanLimits } from '../schemas/plan.schema';

export interface PlanUpsertPayload {
  name: string;
  slug: PlanSlug;
  limits: PlanLimits;
  features: PlanFeature[];
}

@Injectable()
export class PlansRepository {
  constructor(
    @InjectModel(Plan.name)
    private readonly planModel: Model<PlanDocument>,
  ) {}

  async upsert(payload: PlanUpsertPayload): Promise<PlanDocument> {
    return this.planModel
      .findOneAndUpdate(
        { slug: payload.slug },
        { $set: payload },
        { upsert: true, returnDocument: 'after', runValidators: true },
      )
      .exec();
  }

  async findBySlug(slug: PlanSlug): Promise<PlanDocument | null> {
    return this.planModel.findOne({ slug }).exec();
  }

  async findById(planId: string): Promise<PlanDocument | null> {
    if (!isValidObjectId(planId)) return null;

    return this.planModel.findById(new Types.ObjectId(planId)).exec();
  }

  async findAll(): Promise<PlanDocument[]> {
    return this.planModel.find({}).exec();
  }
}
