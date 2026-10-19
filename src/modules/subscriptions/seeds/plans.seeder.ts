import { Injectable, OnModuleInit } from '@nestjs/common';
import { PlanFeature, PlanSlug } from '../enums/plan.enums';
import { PlansRepository, PlanUpsertPayload } from '../repositories/plans.repository';

@Injectable()
export class PlansSeeder implements OnModuleInit {
  constructor(private readonly plansRepository: PlansRepository) {}

  async onModuleInit() {
    const plans: PlanUpsertPayload[] = [
      {
        name: 'Basic',
        slug: PlanSlug.BASIC,
        limits: { messagesLimit: 500, productsLimit: 100, historyRetentionDays: 30 },
        features: [],
      },
      {
        name: 'Pro',
        slug: PlanSlug.PRO,
        limits: { messagesLimit: 3000, productsLimit: 1000, historyRetentionDays: 180 },
        features: [PlanFeature.CUSTOM_PERSONA, PlanFeature.SMART_RECOMMENDATIONS],
      },
      {
        name: 'Max',
        slug: PlanSlug.MAX,
        limits: { messagesLimit: -1, productsLimit: -1, historyRetentionDays: -1 },
        features: Object.values(PlanFeature),
      },
    ];

    for (const plan of plans) await this.plansRepository.upsert(plan);
  }
}
