// Type Imports
import type { PricingPlanType } from '@/types/pages/pricingTypes'

export const db: PricingPlanType[] = [
  {
    title: 'pricingPlanBasic',
    monthlyPrice: 0,
    currentPlan: true,
    popularPlan: false,
    subtitle: 'pricingPlanBasicSubtitle',
    imgSrc: '/images/illustrations/objects/pricing-basic.png',
    imgHeight: 120,
    yearlyPlan: {
      monthly: 0,
      annually: 0
    },
    planBenefits: [
      'pricingBenefitResponses',
      'pricingBenefitForms',
      'pricingBenefitFields',
      'pricingBenefitTools',
      'pricingBenefitSubdomains'
    ]
  },
  {
    monthlyPrice: 49,
    title: 'pricingPlanStandard',
    popularPlan: true,
    currentPlan: false,
    subtitle: 'pricingPlanStandardSubtitle',
    imgSrc: '/images/illustrations/objects/pricing-standard.png',
    imgHeight: 120,
    yearlyPlan: {
      monthly: 40,
      annually: 480
    },
    planBenefits: [
      'pricingBenefitUnlimitedResponses',
      'pricingBenefitForms',
      'pricingBenefitInstagram',
      'pricingBenefitDocs',
      'pricingBenefitThankYou'
    ]
  },
  {
    monthlyPrice: 99,
    popularPlan: false,
    currentPlan: false,
    title: 'pricingPlanEnterprise',
    subtitle: 'pricingPlanEnterpriseSubtitle',
    imgSrc: '/images/illustrations/objects/pricing-enterprise.png',
    imgHeight: 120,
    yearlyPlan: {
      monthly: 80,
      annually: 960
    },
    planBenefits: [
      'pricingBenefitPayPal',
      'pricingBenefitLogic',
      'pricingBenefitStorage',
      'pricingBenefitDomain',
      'pricingBenefitStripe'
    ]
  }
]
