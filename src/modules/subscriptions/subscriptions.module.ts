import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlansRepository } from './repositories/plans.repository';
import { SubscriptionsRepository } from './repositories/subscriptions.repository';
import { UsageRepository } from './repositories/usage.repository';
import { Plan, PlanSchema } from './schemas/plan.schema';
import { Subscription, SubscriptionSchema } from './schemas/subscription.schema';
import { Usage, UsageSchema } from './schemas/usage.schema';
import { PlansSeeder } from './seeds/plans.seeder';
import { PlansService } from './services/plans.service';
import { SubscriptionsService } from './services/subscriptions.service';
import { UsageService } from './services/usage.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Plan.name, schema: PlanSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Usage.name, schema: UsageSchema },
    ]),
  ],
  providers: [
    PlansRepository,
    SubscriptionsRepository,
    UsageRepository,
    PlansService,
    SubscriptionsService,
    UsageService,
    PlansSeeder,
  ],
  exports: [SubscriptionsService, PlansService, UsageService],
})
export class SubscriptionsModule {}
