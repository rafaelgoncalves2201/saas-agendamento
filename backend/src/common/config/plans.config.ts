export enum PlanTier {
  BASIC = 'BASIC',
  PROFESSIONAL = 'PROFESSIONAL',
  PREMIUM = 'PREMIUM',
}

export interface PlanFeatures {
  scheduling: boolean;
  publicBookingPage: boolean;
  whatsappNotifications: boolean;
  whatsappAppointmentMessages: boolean;
  mercadopago: boolean;
  onlinePayment: boolean;
  pixSignal: boolean;
  inventory: boolean;
  inventoryControl: boolean;
  products: boolean;
  customBranding: boolean;
  advancedReports: boolean;
}

export interface PlanDefinition {
  tier: PlanTier;
  name: string;
  slug: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  currency: string;
  maxProfessionals: number;
  maxAppointmentsPerMonth: number; // 999999 = unlimited
  maxWhatsappMessages: number;
  features: PlanFeatures;
}

export const PLAN_CONFIGS: Record<PlanTier, PlanDefinition> = {
  [PlanTier.BASIC]: {
    tier: PlanTier.BASIC,
    name: 'Básico',
    slug: 'basic',
    description: 'Ideal para profissionais autônomos que buscam praticidade e presença digital.',
    priceMonthly: 29.90,
    priceYearly: 299.00,
    currency: 'BRL',
    maxProfessionals: 1,
    maxAppointmentsPerMonth: 50,
    maxWhatsappMessages: 999999,
    features: {
      scheduling: true,
      publicBookingPage: true,
      whatsappNotifications: true,
      whatsappAppointmentMessages: true,
      mercadopago: false,
      onlinePayment: false,
      pixSignal: false,
      inventory: false,
      inventoryControl: false,
      products: false,
      customBranding: false,
      advancedReports: false,
    },
  },
  [PlanTier.PROFESSIONAL]: {
    tier: PlanTier.PROFESSIONAL,
    name: 'Profissional',
    slug: 'professional',
    description: 'Para estúdios e profissionais que desejam receber pagamentos online e gerenciar estoque.',
    priceMonthly: 59.90,
    priceYearly: 599.00,
    currency: 'BRL',
    maxProfessionals: 5,
    maxAppointmentsPerMonth: 100,
    maxWhatsappMessages: 999999,
    features: {
      scheduling: true,
      publicBookingPage: true,
      whatsappNotifications: true,
      whatsappAppointmentMessages: true,
      mercadopago: true,
      onlinePayment: true,
      pixSignal: true,
      inventory: true,
      inventoryControl: true,
      products: true,
      customBranding: true,
      advancedReports: false,
    },
  },
  [PlanTier.PREMIUM]: {
    tier: PlanTier.PREMIUM,
    name: 'Premium',
    slug: 'premium',
    description: 'Para equipes e clínicas com alto fluxo de clientes, sem limite de agendamentos e com todos os recursos.',
    priceMonthly: 99.90,
    priceYearly: 999.00,
    currency: 'BRL',
    maxProfessionals: 15,
    maxAppointmentsPerMonth: 999999,
    maxWhatsappMessages: 999999,
    features: {
      scheduling: true,
      publicBookingPage: true,
      whatsappNotifications: true,
      whatsappAppointmentMessages: true,
      mercadopago: true,
      onlinePayment: true,
      pixSignal: true,
      inventory: true,
      inventoryControl: true,
      products: true,
      customBranding: true,
      advancedReports: true,
    },
  },
};

/**
 * Normaliza qualquer slug ou identificador de plano para o PlanTier canônico
 */
export function normalizePlanTier(slugOrName?: string | null): PlanTier {
  if (!slugOrName) return PlanTier.BASIC;

  const normalized = slugOrName.toLowerCase().trim();

  if (['basic', 'basico', 'básico', 'starter'].includes(normalized)) {
    return PlanTier.BASIC;
  }

  if (['professional', 'profissional', 'pro'].includes(normalized)) {
    return PlanTier.PROFESSIONAL;
  }

  if (['premium', 'business', 'enterprise', 'ultra'].includes(normalized)) {
    return PlanTier.PREMIUM;
  }

  return PlanTier.BASIC;
}

/**
 * Retorna a configuração completa baseada no slug ou nome
 */
export function getPlanConfig(slugOrName?: string | null): PlanDefinition {
  const tier = normalizePlanTier(slugOrName);
  return PLAN_CONFIGS[tier];
}

/**
 * Verifica se um recurso está liberado para o plano
 */
export function isPlanFeatureAllowed(
  slugOrName: string | null | undefined,
  feature: keyof PlanFeatures,
): boolean {
  const config = getPlanConfig(slugOrName);
  return Boolean(config.features[feature]);
}

/**
 * Retorna o limite mensal de agendamentos
 */
export function getPlanAppointmentLimit(slugOrName?: string | null): number {
  const config = getPlanConfig(slugOrName);
  return config.maxAppointmentsPerMonth;
}

/**
 * Retorna o limite de profissionais permitidos
 */
export function getPlanProfessionalLimit(slugOrName?: string | null): number {
  const config = getPlanConfig(slugOrName);
  return config.maxProfessionals;
}

