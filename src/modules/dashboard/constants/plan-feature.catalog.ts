import { PlanFeature } from '@modules/subscriptions/enums/plan.enums';

export interface PlanFeatureInfo {
  key: PlanFeature;
  label: string;
  description: string;
}

export const PLAN_FEATURE_CATALOG: PlanFeatureInfo[] = [
  {
    key: PlanFeature.REMOVE_BRANDING,
    label: 'Remove Lary branding',
    description: 'Hide the "Powered by Lary" badge from the chat widget.',
  },
  {
    key: PlanFeature.CUSTOM_PERSONA,
    label: 'Custom assistant persona',
    description: 'Define a custom persona/tone for the assistant.',
  },
  {
    key: PlanFeature.SMART_RECOMMENDATIONS,
    label: 'Smart product recommendations',
    description: 'AI-driven product suggestions based on conversation context.',
  },
  {
    key: PlanFeature.MULTI_LANGUAGE,
    label: 'Multi-language support',
    description: 'Serve customers in multiple languages.',
  },
  {
    key: PlanFeature.ADVANCED_ANALYTICS,
    label: 'Advanced analytics',
    description: 'Access detailed demand and conversion analytics.',
  },
];

export function getFeatureInfo(feature: PlanFeature): PlanFeatureInfo {
  return (
    PLAN_FEATURE_CATALOG.find((item) => item.key === feature) ?? {
      key: feature,
      label: feature,
      description: '',
    }
  );
}

export function getAllPlanFeatures(): PlanFeature[] {
  return Object.values(PlanFeature);
}