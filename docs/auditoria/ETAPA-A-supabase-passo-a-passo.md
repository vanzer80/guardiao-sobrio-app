# Etapa A — Banco de Dados (Supabase) — passo a passo mastigado

Objetivo: diagnosticar e corrigir o Achado 1 ("Gerar código" do Módulo Familiar). Tudo aqui é feito por VOCÊ no painel do Supabase (o Claude Code não acessa o banco).

> Por que no SQL Editor? Porque ali o SQL roda como `postgres`, que **ignora a RLS** — então ele enxerga o estado REAL (não o filtrado pelo app). É isso que torna o diagnóstico confiável.

---

## PASSO 0 — Abrir o SQL Editor
1. Acesse https://supabase.com e entre no projeto (ref `huumwjwndsefdmgezohb`).
2. Menu lateral → **SQL Editor** → **New query**.
3. Tenha o arquivo `pacote-diagnostico-banco.sql` aberto ao lado (copia/cola de cada bloco).

---

## PASSO 1 — Rodar o BLOCO C.1 (diagnóstico — só leitura, 100% seguro)
Cole as 6 queries do bloco C.1 e rode. Veja o que olhar em cada uma:

**(1) RLS ligada por tabela**
- Olhe a coluna `rls_enabled`.
- ✅ ESPERADO: `true` em todas as tabelas de usuário (`profiles`, `checklist_items`, `checklist_completions`, `diary_entries`, `user_triggers`, `sobriety_records`, `emergency_contacts`, `family_connections`...).
- ⚠️ Se alguma estiver `false` → anote (essa tabela pode estar exposta).

**(2) Tabelas SEM RLS (sinal de vazamento)**
- ✅ ESPERADO: **nenhuma linha** (resultado vazio).
- 🔴 Se aparecer qualquer tabela → ela está sem proteção. É um problema de segurança a corrigir (ligar RLS), além do bug do convite.

**(3) RLS ligada mas SEM política**
- ✅ ESPERADO: **nenhuma linha**.
- 🔴 Se aparecer → a tabela fica inacessível ao app (RLS bloqueia tudo por falta de regra).

**(4) Dump de todas as políticas**
- É um panorama. Confira que cada tabela de usuário tem regras com `auth.uid() = user_id`. Só leitura/conferência.

**(5) Políticas de `family_connections` — O FOCO DO BUG** 👈
Olhe as linhas retornadas e responda 3 perguntas:
- Existe linha com `cmd = INSERT`? **Se NÃO existir** → é o bug (sem política de INSERT, nenhum convite é criado).
- Se existir INSERT, leia a coluna `with_check`: menciona `plan = 'guardian'` (ou algo de plano)? **Se sim** → o usuário em trial (`plan='free'`) é rejeitado = bug.
- Existe linha `cmd = SELECT` permitindo `auth.uid() = user_id`? **Se NÃO** → o app não consegue ler a linha recém-criada (`.select().single()`) = bug no retorno.

**(6) View `family_day_status`**
- ✅ IDEAL: existir (expondo só `{owner, date, completed}`).
- ⚠️ Se vier vazio → a view não existe (Achado AR-03); o familiar lê a tabela direto. Anote para criar depois.

---

## PASSO 2 — Rodar o BLOCO C.2 (a query DECISIVA)

**Query do `count`** (linhas reais de `family_connections` da conta de teste):
- `count = 0` → o **INSERT foi REJEITADO**. Culpado = política de INSERT (`with_check`).
- `count > 0` → o **INSERT passou**; o que quebrou foi o **SELECT** do retorno. Culpado = política de SELECT.
- 👉 Em **ambos os casos, a migração resolve** (ela corrige INSERT e SELECT). O `count` serve para você ENTENDER qual era o culpado.

**Query do `plan/trial`** (estado da conta de teste):
- ✅ ESPERADO: `plan = 'free'` e `trial_ativo = true` → comprova a causa-raiz (o trial não promove `plan`).
- Se `trial_ativo = false` → o trial expirou (normal, passou dos 5 dias). Não atrapalha o diagnóstico do `count`.

---

## PASSO 3 — Aplicar a MIGRAÇÃO (a correção)

> Decisão simples: **depois de rodar C.1 + C.2, aplique a migração** — ela cobre os dois cenários (INSERT e SELECT). Antes de aplicar, confira no resultado da query (5) se os nomes batem (`family_connections`, `user_id`, `family_user_id`); se forem diferentes, ajuste o arquivo da migração.

Escolha **uma** forma:

**Forma 1 — SQL Editor (mais simples):**
1. Abra `supabase/migrations/20260621090000_fix_family_connections_rls.sql`.
2. Copie TODO o conteúdo, cole numa **New query** no SQL Editor e clique **Run**.
3. Deve retornar **Success** (a migração é idempotente — pode rodar de novo sem medo).

**Forma 2 — CLI (versão profissional/versionada), no terminal do repo:**
```bash
supabase login
supabase link --project-ref huumwjwndsefdmgezohb
supabase db push
```

---

## PASSO 4 — Validar a correção
1. Re-rode a **query do `count`** (C.2) — referência para comparar.
2. No app, com uma conta de **plano efetivo guardian** (trial ativo OU pago), toque **"Gerar código"** → deve aparecer o **código de 6 dígitos** inline.
   - ⚠️ Se a conta de teste (`audit.guardiao.2026@mailinator.com`) estiver com trial expirado: o trial é **one-shot por conta**, então crie uma **conta nova** e ative o trial, ou use uma conta Guardião real, só para validar.
3. Graças ao log adicionado no código (`console.error('[createInvite]...')`), se ainda houver erro, ele aparecerá no console do navegador com a causa exata.

---

## PASSO 5 — (Recomendado) Versionar o schema + RLS
Resolve a causa de fundo "RLS fora do repositório":
```bash
supabase db pull        # gera migração com schema+RLS atuais
git add supabase/migrations/ && git commit -m "chore(db): versiona schema-base + RLS [auditoria AR-03/ET-07]"
```

---

## Cola rápida (decisão em 1 linha)
| Resultado | Significado | Ação |
|---|---|---|
| C.1 (2) ou (3) com linhas | Tabela sem RLS / sem policy | Corrigir RLS dessas tabelas |
| C.1 (5) sem INSERT, ou com `plan='guardian'` | INSERT bloqueia trial | Migração resolve |
| C.1 (5) sem SELECT do dono | Retorno bloqueado | Migração resolve |
| C.1 (6) vazio | View do familiar não existe | Criar depois (AR-03) |
| C.2 count = 0 | INSERT era o culpado | Aplicar migração |
| C.2 count > 0 | SELECT era o culpado | Aplicar migração |
| C.2 plan='free' + trial_ativo=true | Causa-raiz confirmada | Aplicar migração |
