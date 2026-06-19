import { atLocalMidnight, daysSince, todayISO } from '../lib/sobriety';

describe('atLocalMidnight', () => {
  it('retorna Date correta para data válida', () => {
    const d = atLocalMidnight('2024-01-15');
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2024);
    expect(d!.getMonth()).toBe(0); // janeiro = 0
    expect(d!.getDate()).toBe(15);
    expect(d!.getHours()).toBe(0);
  });

  it('retorna null para string vazia', () => {
    expect(atLocalMidnight('')).toBeNull();
  });

  it('retorna null para data inválida (dia 30 em fevereiro)', () => {
    expect(atLocalMidnight('2023-02-30')).toBeNull();
  });

  it('retorna null para data com formato incorreto', () => {
    expect(atLocalMidnight('15-01-2024')).toBeNull();
  });

  it('aceita anos bissextos corretamente', () => {
    const d = atLocalMidnight('2024-02-29');
    expect(d).not.toBeNull();
    expect(d!.getDate()).toBe(29);
  });
});

describe('todayISO', () => {
  it('retorna string no formato YYYY-MM-DD', () => {
    const today = todayISO();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('retorna a data de hoje', () => {
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    expect(todayISO()).toBe(expected);
  });
});

describe('daysSince', () => {
  it('retorna null para null', () => {
    expect(daysSince(null)).toBeNull();
  });

  it('retorna null para string vazia', () => {
    expect(daysSince('')).toBeNull();
  });

  it('retorna 0 quando a data é hoje', () => {
    const today = todayISO();
    expect(daysSince(today)).toBe(0);
  });

  it('retorna 1 para ontem', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const str = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    expect(daysSince(str)).toBe(1);
  });

  it('retorna 7 para uma semana atrás', () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    expect(daysSince(str)).toBe(7);
  });

  it('retorna 365 para um ano atrás (não-bissexto)', () => {
    // Calcula a data exata de 365 dias atrás
    const d = new Date();
    d.setDate(d.getDate() - 365);
    const str = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    expect(daysSince(str)).toBe(365);
  });

  it('nunca retorna valor negativo para datas futuras', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const str = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
    expect(daysSince(str)).toBe(0);
  });

  it('retorna null para data de fevereiro inválida', () => {
    expect(daysSince('2023-02-30')).toBeNull();
  });
});
