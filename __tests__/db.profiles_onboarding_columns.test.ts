/**
 * @jest-environment node
 *
 * Integration test — migration 20260619220000_add_onboarding_context
 *
 * Verifica se as 3 colunas de contexto de onboarding existem na tabela profiles.
 *
 * Usa node:https diretamente (evita o fetch global sobrescrito pelo jest-expo/winter).
 * Estratégia: um SELECT com LIMIT 0 retorna HTTP 200 + [] quando a coluna existe.
 * Uma coluna inexistente retorna HTTP 400 com "column does not exist".
 */

import https from 'node:https';

const SUPABASE_HOST = 'huumwjwndsefdmgezohb.supabase.co';
const ANON_KEY = 'sb_publishable_lou-sQALDLotLdctoospew_DnzCQwny';

function postgrestSelect(columns: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: SUPABASE_HOST,
        path: `/rest/v1/profiles?select=${encodeURIComponent(columns)}&limit=0`,
        method: 'GET',
        headers: {
          apikey: ANON_KEY,
          Authorization: `Bearer ${ANON_KEY}`,
          Accept: 'application/json',
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
      },
    );
    req.on('error', reject);
    req.end();
  });
}

const ONBOARDING_COLUMNS = [
  'onboarding_motivo',
  'onboarding_tempo',
  'onboarding_desafio',
] as const;

describe('Migration: add_onboarding_context', () => {
  it.each(ONBOARDING_COLUMNS)(
    'profiles.%s existe (HTTP 200 via PostgREST)',
    async (column) => {
      const { status, body } = await postgrestSelect(column);
      expect(status).toBe(200);
      expect(JSON.parse(body)).toEqual([]);
    },
    10000,
  );

  it('todas as 3 colunas existem em uma única query', async () => {
    const { status, body } = await postgrestSelect(
      'onboarding_motivo,onboarding_tempo,onboarding_desafio',
    );
    expect(status).toBe(200);
    expect(JSON.parse(body)).toEqual([]);
  }, 10000);
});
