/**
 * Lógica de sobriedade compartilhada — fonte única do cálculo de dias.
 *
 * `sobriety_start_date` é uma data YYYY-MM-DD (sem hora). Ancoramos sempre na
 * meia-noite LOCAL para o contador não oscilar 1 dia por causa de fuso — o bug
 * que aparecia ao usar `new Date('YYYY-MM-DD')` (que o JS lê como UTC).
 */

/** Converte 'YYYY-MM-DD' em Date na meia-noite local. Rejeita datas inválidas
 *  (ex.: 2024-02-30, que o JS silenciosamente "rola" para 01/03). */
export function atLocalMidnight(dateStr: string): Date | null {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return null;
  }
  return date;
}

/** Data de hoje em 'YYYY-MM-DD' no fuso local. */
export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Dias-calendário decorridos desde a data de início (>= 0), ou null se não houver data. */
export function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const start = atLocalMidnight(dateStr);
  if (!start) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((today.getTime() - start.getTime()) / 86_400_000));
}
