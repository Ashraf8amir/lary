import { CacheService } from '@infrastructure/cache/cache.service';
import { Injectable } from '@nestjs/common';
import { PlanSlug } from '../enums/plan.enums';
import { PlansRepository } from '../repositories/plans.repository';
import { PlanDocument } from '../schemas/plan.schema';

const PLAN_CACHE_PREFIX = 'plan:';
const PLAN_CACHE_TTL_SECONDS = 86400;
const ALL_PLANS_CACHE_KEY = 'plans:all';

@Injectable()
export class PlansService {
  constructor(
    private readonly plansRepository: PlansRepository,
    private readonly cacheService: CacheService,
  ) {}

  async getBySlug(slug: PlanSlug): Promise<PlanDocument | null> {
    return this.cached(`${PLAN_CACHE_PREFIX}slug:${slug}`, () =>
      this.plansRepository.findBySlug(slug),
    );
  }

  async getById(planId: string): Promise<PlanDocument | null> {
    return this.cached(`${PLAN_CACHE_PREFIX}id:${planId}`, () =>
      this.plansRepository.findById(planId),
    );
  }

  async getAll(): Promise<PlanDocument[]> {
    const cached = await this.cacheService.get<PlanDocument[]>(ALL_PLANS_CACHE_KEY);
    if (cached) return cached;

    const plans = await this.plansRepository.findAll();
    await this.cacheService.set(ALL_PLANS_CACHE_KEY, plans, PLAN_CACHE_TTL_SECONDS);
    return plans;
  }

  async upsert(payload: Parameters<PlansRepository['upsert']>[0]): Promise<PlanDocument> {
    const plan = await this.plansRepository.upsert(payload);
    await this.invalidateCache();
    return plan;
  }

  async invalidateCache(): Promise<void> {
    await Promise.all([
      this.cacheService.del(ALL_PLANS_CACHE_KEY),
      this.cacheService.delByPattern(`${PLAN_CACHE_PREFIX}*`),
    ]);
  }

  private async cached(
    key: string,
    fetch: () => Promise<PlanDocument | null>,
  ): Promise<PlanDocument | null> {
    const hit = await this.cacheService.get<PlanDocument>(key);
    if (hit) return hit;

    const plan = await fetch();
    if (plan) await this.cacheService.set(key, plan, PLAN_CACHE_TTL_SECONDS);
    return plan;
  }
}
