/**
 * Estatísticas — queries e computações
 *
 * Princípio: foco em presença e progresso, nunca em falha.
 * Sem "sequências perdidas", sem destaque negativo.
 * Disponível para planos Essential e Guardião.
 */

import { supabase } from './supabase';
import { atLocalMidnight, daysSince } from './sobriety';

// ── Types ───────────────────────────────────────────────────────────────────

export interface DayStatus {
  date: string; // YYYY-MM-DD
  hasChecklist: boolean;
  hasDiary: boolean;
}

export interface WeeklyStats {
  days: DayStatus[];
  checklistCount: number;
  diaryCount: number;
}

export interface OverallStats {
  sobrietyDays: number;
  checklistDays28: number;
  diaryDays30: number;
  sosUsageThisMonth: number;
  checklistRate28: number; // 0–100
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return isoDate(d);
}

// ── Queries ──────────────────────────────────────────────────────────────────

/** Últimos N dias com checklist (pelo menos 1 item marcado) */
async function getChecklistDates(userId: string, since: string): Promise<Set<string>> {
  const { data } = await supabase
    .from('checklist_completions')
    .select('completed_date')
    .eq('user_id', userId)
    .gte('completed_date', since);

  const dates = new Set<string>();
  data?.forEach((r) => dates.add(r.completed_date));
  return dates;
}

/** Últimos N dias com entrada no diário */
async function getDiaryDates(userId: string, since: string): Promise<Set<string>> {
  const { data } = await supabase
    .from('diary_entries')
    .select('entry_date')
    .eq('user_id', userId)
    .gte('entry_date', since);

  const dates = new Set<string>();
  data?.forEach((r) => dates.add(r.entry_date));
  return dates;
}

/** Usos do protocolo SOS neste mês-calendário */
async function getSosThisMonth(userId: string): Promise<number> {
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  const { count } = await supabase
    .from('sos_activations')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('triggered_at', monthStart);

  return count ?? 0;
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Estatísticas gerais do usuário.
 * Nunca retorna "sequências" ou métricas punitivas.
 */
export async function getOverallStats(
  userId: string,
  sobrietyStartDate: string | null,
): Promise<OverallStats> {
  const since28 = daysAgo(27); // últimos 28 dias
  const since30 = daysAgo(29); // últimos 30 dias

  const [checklistDates, diaryDates, sosCount] = await Promise.all([
    getChecklistDates(userId, since28),
    getDiaryDates(userId, since30),
    getSosThisMonth(userId),
  ]);

  const sobrietyDays = daysSince(sobrietyStartDate) ?? 0;
  const checklistDays28 = checklistDates.size;
  const diaryDays30 = diaryDates.size;
  const checklistRate28 = Math.round((checklistDays28 / 28) * 100);

  return {
    sobrietyDays,
    checklistDays28,
    diaryDays30,
    sosUsageThisMonth: sosCount,
    checklistRate28,
  };
}

/**
 * Últimos 28 dias dia a dia (para grid de calendário).
 * Retorna array de 28 entradas, mais recente por último.
 */
export async function get28DayGrid(userId: string): Promise<DayStatus[]> {
  const since = daysAgo(27);
  const [checklistDates, diaryDates] = await Promise.all([
    getChecklistDates(userId, since),
    getDiaryDates(userId, since),
  ]);

  const grid: DayStatus[] = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = isoDate(d);
    grid.push({
      date,
      hasChecklist: checklistDates.has(date),
      hasDiary: diaryDates.has(date),
    });
  }
  return grid;
}

// ── PDF export ───────────────────────────────────────────────────────────────

/**
 * Gera HTML do relatório para compartilhar com terapeuta.
 * Sem dados de identificação além do nome (privacidade).
 */
export function buildReportHtml(
  stats: OverallStats,
  grid: DayStatus[],
  userName: string,
): string {
  const today = isoDate(new Date());
  const checklistDots = grid
    .map((d) => `<span class="dot ${d.hasChecklist ? 'on' : 'off'}" title="${d.date}"></span>`)
    .join('');
  const diaryDots = grid
    .map((d) => `<span class="dot ${d.hasDiary ? 'diary' : 'off'}" title="${d.date}"></span>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8"/>
<style>
  body { font-family: Georgia, serif; background: #fff; color: #222; padding: 40px; max-width: 640px; margin: auto; }
  h1 { font-size: 28px; color: #c8a84b; margin-bottom: 4px; }
  h2 { font-size: 16px; color: #555; font-weight: normal; margin-top: 0; }
  .section { margin: 32px 0; }
  .section-title { font-size: 11px; letter-spacing: 1px; color: #888; text-transform: uppercase; margin-bottom: 12px; }
  .cards { display: flex; gap: 16px; flex-wrap: wrap; }
  .card { background: #f9f6f0; border-radius: 10px; padding: 16px 20px; min-width: 120px; }
  .card-value { font-size: 32px; font-weight: bold; color: #c8a84b; }
  .card-label { font-size: 12px; color: #666; margin-top: 4px; }
  .dots { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }
  .dot { display: inline-block; width: 16px; height: 16px; border-radius: 3px; }
  .dot.on  { background: #4a7c59; }
  .dot.diary { background: #c8a84b; }
  .dot.off { background: #e0ddd8; }
  .legend { display: flex; gap: 16px; margin-top: 10px; font-size: 12px; color: #666; }
  .legend span { display: flex; align-items: center; gap: 5px; }
  .leg-dot { display: inline-block; width: 12px; height: 12px; border-radius: 2px; }
  .disclaimer { font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 16px; margin-top: 40px; line-height: 1.8; }
</style>
</head>
<body>
<h1>O Guardião Sóbrio</h1>
<h2>Relatório de progresso · ${userName} · ${today}</h2>

<div class="section">
  <div class="section-title">Resumo geral</div>
  <div class="cards">
    <div class="card">
      <div class="card-value">${stats.sobrietyDays}</div>
      <div class="card-label">Dias em jornada</div>
    </div>
    <div class="card">
      <div class="card-value">${stats.checklistDays28}</div>
      <div class="card-label">Dias com checklist<br/>(últimas 4 semanas)</div>
    </div>
    <div class="card">
      <div class="card-value">${stats.diaryDays30}</div>
      <div class="card-label">Entradas no diário<br/>(últimos 30 dias)</div>
    </div>
    <div class="card">
      <div class="card-value">${stats.checklistRate28}%</div>
      <div class="card-label">Presença no checklist<br/>(28 dias)</div>
    </div>
  </div>
</div>

<div class="section">
  <div class="section-title">Checklist — últimos 28 dias</div>
  <div class="dots">${checklistDots}</div>
</div>

<div class="section">
  <div class="section-title">Diário — últimos 28 dias</div>
  <div class="dots">${diaryDots}</div>
</div>

<div class="legend">
  <span><span class="leg-dot" style="background:#4a7c59"></span> Checklist realizado</span>
  <span><span class="leg-dot" style="background:#c8a84b"></span> Entrada no diário</span>
  <span><span class="leg-dot" style="background:#e0ddd8"></span> Sem registro</span>
</div>

<div class="disclaimer">
  Este relatório é gerado pelo app O Guardião Sóbrio e pode ser compartilhado com seu profissional de saúde.<br/>
  Este app não substitui psiquiatra, psicólogo ou grupos de apoio.<br/>
  Em crise aguda: CVV 188 (24h, sigiloso) · CAPS mais próximo.
</div>
</body>
</html>`;
}
