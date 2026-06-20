import { PLAN_FEATURES, PRICING, type PlanType } from '../lib/types.monetization';
import { usePlanStore } from '../hooks/usePlanStore';

const PLANS: PlanType[] = ['free', 'essential', 'guardian'];

describe('PLAN_FEATURES', () => {
  it('todos os planos têm checklist e contador', () => {
    PLANS.forEach((plan) => {
      expect(PLAN_FEATURES[plan].dailyChecklist).toBe(true);
      expect(PLAN_FEATURES[plan].sobrietyCounter).toBe(true);
    });
  });

  it('plano free: SOS limitado a 3/mês', () => {
    expect(PLAN_FEATURES.free.emergencyProtocol).toBe(3);
  });

  it('planos pagos: SOS ilimitado', () => {
    expect(PLAN_FEATURES.essential.emergencyProtocol).toBe(-1);
    expect(PLAN_FEATURES.guardian.emergencyProtocol).toBe(-1);
  });

  it('plano free: diário limitado a 7 dias', () => {
    expect(PLAN_FEATURES.free.diaryPrompts).toBe(7);
  });

  it('planos pagos: diário ilimitado', () => {
    expect(PLAN_FEATURES.essential.diaryPrompts).toBe(-1);
    expect(PLAN_FEATURES.guardian.diaryPrompts).toBe(-1);
  });

  it('plano free: apenas 3 fundamentos', () => {
    expect(PLAN_FEATURES.free.foundamentals).toBe(3);
  });

  it('planos pagos: todos os 13 fundamentos', () => {
    expect(PLAN_FEATURES.essential.foundamentals).toBe(13);
    expect(PLAN_FEATURES.guardian.foundamentals).toBe(13);
  });

  it('mapa de gatilhos: apenas essential e guardian', () => {
    expect(PLAN_FEATURES.free.triggerMap).toBe(false);
    expect(PLAN_FEATURES.essential.triggerMap).toBe(true);
    expect(PLAN_FEATURES.guardian.triggerMap).toBe(true);
  });

  it('estatísticas: apenas essential e guardian', () => {
    expect(PLAN_FEATURES.free.statistics).toBe(false);
    expect(PLAN_FEATURES.essential.statistics).toBe(true);
    expect(PLAN_FEATURES.guardian.statistics).toBe(true);
  });

  it('módulo familiar: apenas guardian (hard rule: nunca expor dados sem consentimento)', () => {
    expect(PLAN_FEATURES.free.familyModule).toBe(false);
    expect(PLAN_FEATURES.essential.familyModule).toBe(false);
    expect(PLAN_FEATURES.guardian.familyModule).toBe(true);
  });

  it('programa 30 dias: apenas guardian', () => {
    expect(PLAN_FEATURES.free.program30Days).toBe(false);
    expect(PLAN_FEATURES.essential.program30Days).toBe(false);
    expect(PLAN_FEATURES.guardian.program30Days).toBe(true);
  });

  it('comunidade: apenas guardian', () => {
    expect(PLAN_FEATURES.free.community).toBe(false);
    expect(PLAN_FEATURES.essential.community).toBe(false);
    expect(PLAN_FEATURES.guardian.community).toBe(true);
  });
});

describe('PRICING', () => {
  it('Essential mensal é R$19,90', () => {
    expect(PRICING.essential.monthly).toBe(19.9);
  });

  it('Guardião mensal é R$39,90', () => {
    expect(PRICING.guardian.monthly).toBe(39.9);
  });

  it('plano anual é mais barato que 12x mensal (Essential)', () => {
    expect(PRICING.essential.annual).toBeLessThan(PRICING.essential.monthly * 12);
  });

  it('plano anual é mais barato que 12x mensal (Guardian)', () => {
    expect(PRICING.guardian.annual).toBeLessThan(PRICING.guardian.monthly * 12);
  });

  it('moeda é BRL', () => {
    expect(PRICING.essential.currency).toBe('BRL');
    expect(PRICING.guardian.currency).toBe('BRL');
  });
});

describe('Trial (usePlanStore)', () => {
  const future = new Date(Date.now() + 4 * 24 * 3600 * 1000).toISOString();
  const past = new Date(Date.now() - 1000).toISOString();

  beforeEach(() => {
    usePlanStore.setState({ plan: 'free', trialEnd: null, trialActivatedAt: null });
  });

  it('isInTrial() retorna false quando trialEnd é null', () => {
    expect(usePlanStore.getState().isInTrial()).toBe(false);
  });

  it('isInTrial() retorna true quando trialEnd é no futuro', () => {
    usePlanStore.setState({ trialEnd: future });
    expect(usePlanStore.getState().isInTrial()).toBe(true);
  });

  it('isInTrial() retorna false quando trialEnd está no passado', () => {
    usePlanStore.setState({ trialEnd: past });
    expect(usePlanStore.getState().isInTrial()).toBe(false);
  });

  it('getEffectivePlan() retorna guardian durante trial ativo', () => {
    usePlanStore.setState({ trialEnd: future });
    expect(usePlanStore.getState().getEffectivePlan()).toBe('guardian');
  });

  it('getEffectivePlan() retorna o plano real fora do trial', () => {
    usePlanStore.setState({ trialEnd: null });
    expect(usePlanStore.getState().getEffectivePlan()).toBe('free');
  });

  it('canAccessFeature(familyModule) retorna true durante trial (plano free)', () => {
    usePlanStore.setState({ plan: 'free', trialEnd: future });
    expect(usePlanStore.getState().canAccessFeature('familyModule')).toBe(true);
  });

  it('canAccessFeature(program30Days) retorna true durante trial (plano free)', () => {
    usePlanStore.setState({ plan: 'free', trialEnd: future });
    expect(usePlanStore.getState().canAccessFeature('program30Days')).toBe(true);
  });

  it('canAccessFeature(familyModule) retorna false após trial expirar', () => {
    usePlanStore.setState({ plan: 'free', trialEnd: past, trialActivatedAt: past });
    expect(usePlanStore.getState().canAccessFeature('familyModule')).toBe(false);
  });

  it('SOS (emergencyProtocol) acessível mesmo sem trial (hard rule)', () => {
    usePlanStore.setState({ plan: 'free', trialEnd: null });
    expect(usePlanStore.getState().canAccessFeature('emergencyProtocol')).toBe(true);
  });
});
