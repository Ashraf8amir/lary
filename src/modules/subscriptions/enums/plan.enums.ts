export enum PlanFeature {
  REMOVE_BRANDING = 'REMOVE_BRANDING',
  CUSTOM_PERSONA = 'CUSTOM_PERSONA',
  SMART_RECOMMENDATIONS = 'SMART_RECOMMENDATIONS',
  MULTI_LANGUAGE = 'MULTI_LANGUAGE',
  ADVANCED_ANALYTICS = 'ADVANCED_ANALYTICS',
}

export enum PlanSlug {
  BASIC = 'basic',
  PRO = 'pro',
  MAX = 'max',
}

export const TRIAL_PLAN_SLUG = PlanSlug.PRO;

export function resolvePlanSlug(planName?: string | null): PlanSlug | null {
  const name = planName?.trim().toLowerCase();

  if (!name) return null;
  if (name.includes('basic')) return PlanSlug.BASIC;
  if (name.includes('pro')) return PlanSlug.PRO;
  if (name.includes('max')) return PlanSlug.MAX;
  return null;
}
