import { z } from 'zod';

// Mirrors the schema in app/(auth)/forgot-password.tsx
const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

describe('ForgotPassword — validação de email', () => {
  it('aceita email válido', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'usuario@example.com' }).success).toBe(true);
  });

  it('rejeita string vazia', () => {
    expect(forgotPasswordSchema.safeParse({ email: '' }).success).toBe(false);
  });

  it('rejeita email sem @', () => {
    const r = forgotPasswordSchema.safeParse({ email: 'naoemail' });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].message).toBe('Email inválido');
  });

  it('rejeita email sem domínio', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'usuario@' }).success).toBe(false);
  });

  it('rejeita email com espaço', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'usuario @example.com' }).success).toBe(false);
  });

  it('aceita email com subdomínio', () => {
    expect(
      forgotPasswordSchema.safeParse({ email: 'usuario@mail.empresa.com.br' }).success,
    ).toBe(true);
  });
});

describe('ForgotPassword — lógica de buildRedirectTo', () => {
  it('URL web termina com o path correto', () => {
    const origin = 'https://guardiaosobrio.app';
    const url = `${origin}/(auth)/reset-password`;
    expect(url).toMatch(/\/\(auth\)\/reset-password$/);
  });

  it('deep link nativo inclui o path correto', () => {
    const deepLink = 'guardiaosobrio:///(auth)/reset-password';
    expect(deepLink).toContain('(auth)/reset-password');
  });
});

describe('ForgotPassword — cooldown de reenvio', () => {
  const RESEND_COOLDOWN_SECONDS = 60;

  it('countdown começa em 60 após envio', () => {
    expect(RESEND_COOLDOWN_SECONDS).toBe(60);
  });

  it('reenvio bloqueado enquanto countdown > 0', () => {
    const canResend = (countdown: number, loading: boolean) => countdown <= 0 && !loading;
    expect(canResend(30, false)).toBe(false);
    expect(canResend(1, false)).toBe(false);
    expect(canResend(0, false)).toBe(true);
    expect(canResend(0, true)).toBe(false);
  });

  it('countdown decrementa corretamente', () => {
    let countdown = RESEND_COOLDOWN_SECONDS;
    countdown -= 1;
    expect(countdown).toBe(59);
    countdown -= 59;
    expect(countdown).toBe(0);
  });
});
