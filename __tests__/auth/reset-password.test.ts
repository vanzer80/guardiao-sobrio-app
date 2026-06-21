import { z } from 'zod';

// Mirrors the schema in app/(auth)/reset-password.tsx
const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Mínimo 8 caracteres'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'As senhas não conferem',
    path: ['confirmPassword'],
  });

describe('ResetPassword — validação de senha', () => {
  it('aceita senha válida com 8+ caracteres e confirmação', () => {
    expect(
      resetPasswordSchema.safeParse({ password: 'SenhaForte1', confirmPassword: 'SenhaForte1' })
        .success,
    ).toBe(true);
  });

  it('aceita senha com exatamente 8 caracteres', () => {
    expect(
      resetPasswordSchema.safeParse({ password: 'AbcDefg1', confirmPassword: 'AbcDefg1' }).success,
    ).toBe(true);
  });

  it('rejeita senha com menos de 8 caracteres', () => {
    const r = resetPasswordSchema.safeParse({ password: 'curta', confirmPassword: 'curta' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.message === 'Mínimo 8 caracteres')).toBe(true);
    }
  });

  it('rejeita senha com 7 caracteres', () => {
    const r = resetPasswordSchema.safeParse({ password: 'Abc1234', confirmPassword: 'Abc1234' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.message === 'Mínimo 8 caracteres')).toBe(true);
    }
  });

  it('rejeita senhas diferentes', () => {
    const r = resetPasswordSchema.safeParse({
      password: 'SenhaForte1',
      confirmPassword: 'SenhaDiferente1',
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some((i) => i.message === 'As senhas não conferem')).toBe(true);
    }
  });

  it('rejeita confirmação vazia mesmo com senha válida', () => {
    const r = resetPasswordSchema.safeParse({ password: 'SenhaForte1', confirmPassword: '' });
    expect(r.success).toBe(false);
  });

  it('rejeita ambos vazios', () => {
    expect(resetPasswordSchema.safeParse({ password: '', confirmPassword: '' }).success).toBe(false);
  });

  it('erro de confirmação aponta para path confirmPassword', () => {
    const r = resetPasswordSchema.safeParse({
      password: 'SenhaForte1',
      confirmPassword: 'Errada123',
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const issue = r.error.issues.find((i) => i.message === 'As senhas não conferem');
      expect(issue?.path).toEqual(['confirmPassword']);
    }
  });
});

describe('ResetPassword — validação de params do token', () => {
  // Lógica espelhada do useEffect em reset-password.tsx
  const isValidRecoveryParams = (token_hash?: string, type?: string): boolean =>
    Boolean(token_hash) && type === 'recovery';

  it('aceita token_hash válido com type=recovery', () => {
    expect(isValidRecoveryParams('abc123hash', 'recovery')).toBe(true);
  });

  it('rejeita token_hash undefined', () => {
    expect(isValidRecoveryParams(undefined, 'recovery')).toBe(false);
  });

  it('rejeita token_hash vazio', () => {
    expect(isValidRecoveryParams('', 'recovery')).toBe(false);
  });

  it('rejeita type errado', () => {
    expect(isValidRecoveryParams('abc123hash', 'signup')).toBe(false);
    expect(isValidRecoveryParams('abc123hash', 'magiclink')).toBe(false);
  });

  it('rejeita type undefined', () => {
    expect(isValidRecoveryParams('abc123hash', undefined)).toBe(false);
  });

  it('rejeita ambos undefined', () => {
    expect(isValidRecoveryParams(undefined, undefined)).toBe(false);
  });
});

describe('ResetPassword — mapeamento de mensagem de erro do token', () => {
  const mapTokenError = (errorMessage: string): string => {
    const isExpired = errorMessage.toLowerCase().includes('expired');
    return isExpired
      ? 'O link expirou. Links de recuperação são válidos por 1 hora.'
      : 'Link inválido. Solicite um novo link de recuperação.';
  };

  it('mensagem "expired" gera texto de expiração', () => {
    expect(mapTokenError('Token has expired')).toContain('expirou');
  });

  it('mensagem "Token expired" (case-insensitive) gera texto de expiração', () => {
    expect(mapTokenError('Token Expired')).toContain('expirou');
  });

  it('mensagem genérica gera texto de link inválido', () => {
    expect(mapTokenError('Invalid token')).toContain('Link inválido');
  });

  it('mensagem vazia gera texto de link inválido', () => {
    expect(mapTokenError('')).toContain('Link inválido');
  });
});
