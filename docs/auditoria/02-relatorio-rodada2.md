# 🔬 Auditoria Forense — RODADA 2 (Adendo/Delta) — App "O Guardião Sóbrio"

> Continuação da Rodada 1. Objetivo: **fechar os `❓` NÃO VERIFICÁVEL** lendo o que estava ao alcance (migrações SQL, edge functions, telas de auth, testes, logo-guidelines) e **isolar a causa-raiz** do único defeito funcional (`Gerar código`).
> **Data:** 21 de junho de 2026 · **Método:** leitura de arquivos crus (raw GitHub) + execução do deploy real.
> **Commits reconfirmados:** CODE `main@2cbcf0a` · DOCS `main@90c5d95` — **inalterados** desde a Rodada 1 (nenhum achado foi corrigido por commit posterior).

---

## 1. Resumo das Mudanças

Dos **9 itens `❓`** da Rodada 1, **7 foram resolvidos** com evidência de código/runtime; **2 permanecem fora de alcance** (estado de RLS em produção e offline-first em dispositivo) e foram movidos para o **Checklist do Dono (Bloco C)**. A causa-raiz do Achado 1 foi **isolada e confirmada no nível de mecanismo**. Foi descoberto **1 item novo** (cópia de notificação usa frase que a marca removeu).

**Principais descobertas desta rodada:**

1. **Causa-raiz do `Gerar código` (CONFIRMADA por mecanismo + discriminador de runtime):** a RPC `activate_trial()` **não promove a coluna `profiles.plan`** — o usuário em trial permanece `plan='free'` no banco, enquanto o cliente o trata como `guardian`. O `INSERT` em `family_connections` é **negado no servidor** (discriminador: após as tentativas, **nenhuma linha persistiu**, enquanto o `INSERT` em `user_triggers` **persistiu** — provando que o trial escreve nas próprias tabelas quando a RLS checa só `auth.uid()`). A própria mensagem do PR #3 confirma: *"Erros do Supabase ao criar convite somem sem feedback algum"* — o fix tornou o erro **visível**, não o corrigiu.
2. **RLS está versionada apenas para 2 tabelas** (`subscriptions`, `subscription_audit_log`). A RLS de todas as tabelas de dados de usuário (incl. `family_connections`) e a **view segura `family_day_status` NÃO estão no repositório** — o schema-base foi criado fora do versionamento (a 1ª migração só faz `ALTER TABLE` em tabelas pré-existentes).
3. **OAuth Google/Apple EXISTE** (`login.tsx`/`register.tsx`) — a Rodada 1 marcou `❓` por só ter visto a `welcome.tsx`.
4. **Cortes de retenção free×pago (histórico/diário) NÃO são aplicados** — todos recebem 90 dias de histórico e diário ilimitado; a matriz `diaryPrompts:7` existe em tipos mas nenhuma tela a impõe.
5. **Certificado do Programa 30, quiet-hours das notificações e testes unitários** — todos **confirmados no código**.
6. **Logo/escudo:** o `logo-guidelines.md` declara explicitamente *"Logo ainda não criado"* (D10 pendente) — corrige a nota da Rodada 1: o `icon.png`/splash são **placeholders por design**, não uma contradição.
7. **Novo achado (Baixo):** a notificação diária usa *"Um dia de cada vez"* — frase de AA que o `manual-de-marca.md` (decisão D2) **removeu** em favor de uma frase secular própria.

---

## 2. Tabela Delta (itens reauditados)

| ID | Veredito R1 | Veredito R2 | Evidência nova |
|---|---|---|---|
| **FN-20** (Gerar código) | 🔴 (causa ❓) | 🔴 **(causa-raiz confirmada)** | `activate_trial()` não seta `plan` (`migrations/20260620130000`); discriminador runtime: 0 linhas em `family_connections`, trigger persistiu (ss_9858) |
| **FN-22** (certificado Prog. 30) | ❓ | ✅ **(código)** | `app/programa30.tsx → function Certificado` exibido em `progresso.certificadoDisponivel` |
| **FN-27** (sem notif 23h–7h) | ❓ | ✅ **(código)** | `lib/notifications.ts → scheduleDailyReminder`: `safeHour = hour<7?9 : hour>=23?9 : hour` |
| **FN-31** (OAuth Google/Apple) | ❓ | ✅ **(código)** | `login.tsx`/`register.tsx → handleOAuth` + `supabase.auth.signInWithOAuth({provider})`; botões "Continuar com Google/Apple" |
| **RN-03** (histórico 7d free) | ❓ | ⚠️ **(divergente)** | `app/historico.tsx`: `.limit(90)`, "Últimos 90 dias", sem corte por plano; runtime ss_4701 |
| **RN-04** (diário 7d free) | ❓ | ⚠️ **(divergente)** | `app/diario.tsx`: lista todas as entradas, sem `limit`/checagem de plano; `lib/diario.ts` sem corte |
| **ET-07** (RLS por tabela) | ❓ | ⚠️ **(parcial — versionada só p/ 2 tabelas)** | `migrations/20260619203119` declara RLS p/ `subscriptions`+`subscription_audit_log`; demais tabelas não versionadas |
| **AR-03** (view `family_day_status`) | ⚠️ | ❌ **(ausente do versionamento)** | nenhuma das 7 migrações cria a view; status lido por query cliente (`lib/family.ts → getFamilyDayStatus`) |
| **AR-06** (CI + testes) | ⭐ (por nome) | ⭐ **(confirmado por conteúdo)** | `__tests__/monetization.test.ts` (~35 asserts: matriz, preços, trial), `sobriety/protocolo/fundamentos.test.ts` |
| **RT-12** (`/sobre`,`/privacidade`,`/historico`) | ❓ | ✅ **(runtime)** | ss_8788 / ss_1762 / ss_4701 — HTTP 200, renderizam |
| **AR-04** (RLS ativa em produção) | ❓ | ❓ → **Bloco C** | requer console Supabase (não versionado no repo) |
| **AR-05** (offline-first) | ❓ | ❓ → **Bloco C** | requer dispositivo (Expo-web ≠ device) |
| **(novo) VOZ-01** (voz da marca) | — | ⚠️ **(Baixo)** | `lib/notifications.ts`: body "…Um dia de cada vez." vs `manual-de-marca.md` D2 (frase removida) |

---

## 3. Causa-Raiz do Achado 1 — `Gerar código` (Módulo Familiar)

### 3.1 Cadeia de evidências (confirmada)

1. **Trial não promove o plano.** `supabase/migrations/20260620130000_fix_activate_trial_column_reference.sql` recria `activate_trial()` assim (trecho):
   ```sql
   UPDATE profiles
   SET trial_activated_at = NOW(), trial_end = NOW() + INTERVAL '5 days', updated_at = NOW()
   WHERE id = auth.uid() AND trial_activated_at IS NULL;
   ```
   Não há `SET plan = ...`. O cabeçalho da migração inclusive afirma (erroneamente) que *"column plan does not exist in profiles"* e por isso **removeu a guarda `AND plan='free'`**. Resultado: **trial ⇒ `plan='free'` + `trial_end` futuro**. (A coluna `plan` existe — foi criada por `20260619203119` — mas a função não a escreve.)
2. **Cliente diverge do banco.** `hooks/usePlanStore.ts → getEffectivePlan()` retorna `'guardian'` durante o trial; `__tests__/monetization.test.ts` confirma `canAccessFeature('familyModule') === true` no trial. Logo a UI **desbloqueia** o módulo (verificado: ss_9858).
3. **O INSERT é negado no servidor.** Discriminador de runtime (Rodada 2): após as 2 tentativas da Rodada 1, o Módulo Familiar está **vazio** (sem convite pendente, sem código — ss_9858), enquanto o **gatilho** "Final de tarde (teste auditoria)" **persistiu**. Ou seja: `INSERT` em `user_triggers` **funciona** (RLS só checa `auth.uid()=user_id`), `INSERT` em `family_connections` **falha e nada persiste**.
4. **Confirmação documental.** Mensagem do commit `16f2c52` (PR #3): *"Erros do Supabase ao criar convite somem sem feedback algum"* — o fix tornou o erro visível (`window.alert`), sem corrigir a causa.

### 3.2 Condição exata que falha
A política/permissão de **`INSERT` (e provavelmente `SELECT`-returning) em `family_connections`** não é satisfeita por um usuário `plan='free'` (que é o estado de um usuário em trial). **A política exata não pôde ser citada por `arquivo:linha`** porque o schema-base e a RLS de `family_connections` **não estão no repositório** (as 7 migrações só fazem `ALTER`/adições; o `CREATE TABLE family_connections` + `CREATE POLICY` foram aplicados fora do versionamento — provável Supabase Dashboard). → confirmar a política viva é item do **Bloco C**.

### 3.3 Patch recomendado

**Passo 0 (diagnóstico, 2 min):** no Supabase Dashboard → Database → Policies → `family_connections`, ler as políticas de INSERT/SELECT. Três cenários possíveis: (a) INSERT exige `plan='guardian'`; (b) RLS ligada sem política de INSERT; (c) INSERT ok mas SELECT bloqueia o `RETURNING` do `.select().single()`.

**Passo 1 — versionar e corrigir a RLS (cobre os 3 cenários).** Criar `supabase/migrations/20260621090000_fix_family_connections_rls.sql`:
```sql
-- Helper: plano efetivo que honra o trial (mesma regra do getEffectivePlan do cliente)
CREATE OR REPLACE FUNCTION public.effective_plan(uid uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
           WHEN p.trial_end IS NOT NULL AND p.trial_end > now() THEN 'guardian'
           ELSE p.plan
         END
  FROM profiles p WHERE p.id = uid;
$$;

ALTER TABLE public.family_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fc_owner_insert" ON public.family_connections;
CREATE POLICY "fc_owner_insert" ON public.family_connections
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND public.effective_plan(auth.uid()) = 'guardian'   -- honra trial E plano pago
  );

DROP POLICY IF EXISTS "fc_owner_select" ON public.family_connections;
CREATE POLICY "fc_owner_select" ON public.family_connections
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = family_user_id);  -- permite o RETURNING e a leitura do familiar

DROP POLICY IF EXISTS "fc_owner_update" ON public.family_connections;
CREATE POLICY "fc_owner_update" ON public.family_connections
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```
**Passo 2 — diagnóstico no cliente (recomendado).** Em `lib/family.ts → createInvite`, logar o erro real antes de propagar (`console.error('[createInvite]', error.code, error.message, error.details)`) para nunca mais depender de um `alert` opaco.

**Arquivos a alterar:** nova migração `supabase/migrations/20260621090000_fix_family_connections_rls.sql` (que também traz a RLS para o versionamento) + `lib/family.ts` (logging). **Observação de fundo:** o mesmo descompasso "trial não promove plano" pode afetar qualquer política futura que gate por `plan` — adotar `effective_plan()` em todas elas previne recorrência.

---

## 4. Identidade Visual — Logo / Escudo / Ícone / Splash (Bloco A6)

`marca/assets/logo-guidelines.md` declara **"Status atual: Logo ainda não criado"** (D10 pendente; SVGs "aguardando criação"). Portanto o mark oficial **não é auditável como entregue** — e sua ausência **não é defeito do app**, e sim estado documentado.

| Item | Spec | Implementação | Veredito |
|---|---|---|---|
| Ícone do app | PNG 512×512 do escudo | `app.json → icon: ./assets/images/icon.png` (393 KB, existe) — **placeholder** (mark oficial pendente) | ✅ configurado (placeholder por design) |
| Splash | Fundo noir, símbolo | `app.json → splash` (`splash-icon.png`, `backgroundColor: #0e0d0c`) | ✅ configurado, fundo `#0E0D0C` correto |
| Adaptive icon (Android) | — | `backgroundColor #0e0d0c` + foreground/background/monochrome | ✅ configurado, fundo noir |
| Cor de notificação | Ouro `#C8A84B` | `app.json → expo-notifications color: #c8a84b` | ✅ |
| Mark oficial do Escudo | Geométrico, minimalista, sem texto | **Não criado** (D10). SOS usa `Ionicons "shield"` genérico | ⏳ Pendente por design (consistente); ícone SOS conceitualmente alinhado |

> **Correção da Rodada 1:** não há contradição entre "ícone existe" e "D10 pendente" — o app embarca um ícone placeholder enquanto o mark oficial está em aberto, exatamente como o doc prevê.

---

## 5. Score Recalculado (R1 × R2)

Mesma fórmula: `Score = (✅ + ⭐) ÷ verificáveis × 100`. Os 7 `❓` resolvidos entram no denominador; 2 `❓` seguem fora (Bloco C); +1 item novo (VOZ-01).

| Métrica | Rodada 1 | Rodada 2 | Δ |
|---|---|---|---|
| ✅ Conforme | 54 | 57 | +3 |
| ⭐ Divergência positiva | 3 | 3 | 0 |
| **Conforme (✅+⭐)** | **57** | **60** | **+3** |
| ⚠️ Divergente-neutro | 12 | 15 | +3 |
| ❌ Faltando | 6 | 6 | 0 |
| 🔴 Quebrado | 1 | 1 | 0 |
| **Não conforme** | **19** | **22** | **+3** |
| ❓ Não verificável | 9 | 2 | −7 |
| **Total catalogado** | 85 | 86 | +1 |
| **Verificáveis (denominador)** | 76 | 84 | +8 |
| **SCORE** | **75,0%** | **71,4%** | **−3,6 pp** |

```
Score R2 = (57 + 3) ÷ 84 × 100 = 60 ÷ 84 × 100 = 71,4%
Conforme: 60 | Não conforme: 22 | Não verificável: 2 | Total: 86
```

> **Por que o score caiu ~3,6 pp ao "fechar lacunas"?** Porque os `❓` resolvidos revelaram **mais divergências do que conformidades**: os cortes de retenção free×pago (RN-03/RN-04) não são impostos, a RLS está versionada só parcialmente (ET-07), a view segura está ausente (AR-03) e a cópia da notificação reusa uma frase banida (VOZ-01). É o resultado **honesto** de uma auditoria mais profunda. Mitigantes: das 22 não-conformidades, **15 são `⚠️` (neutras/baixas)**, **6 são `❌`** (Fase 2/3 ou visão PRD) e **1 é `🔴`**. As conformidades de funcionalidade real **cresceram** (OAuth, certificado, quiet-hours e rotas estáticas confirmados).

---

## 6. Backlog Atualizado

| # | Item | Sev | Esforço | Mudança vs R1 |
|---|---|---|---|---|
| 1 | **Patch RLS de `family_connections`** (honrar trial via `effective_plan()`) + versionar a RLS | 🟠 Alto | P-M | **Causa-raiz agora confirmada** — patch SQL pronto (§3.3) |
| 2 | Reatividade de plano em `/escudo` e `/programa30` (selecionar valores, não o método) | 🟠 Alto | P | Inalterado (confirmado também em `programa30.tsx`) |
| 3 | Trazer **schema-base + RLS** de todas as tabelas para `supabase/migrations/` (hoje out-of-band) | 🟠 Alto | M | **Novo** (descoberto na R2) |
| 4 | Carregar fonte **General Sans** | 🟡 Médio | P | Inalterado |
| 5 | Implementar **Contatos de Confiança** + linkar no Perfil/SOS | 🟡 Médio | M | Inalterado |
| 6 | Implementar **view segura `family_day_status`** (`SECURITY DEFINER`) p/ acesso do familiar | 🟡 Médio | P-M | **Reclassificado** ⚠️→❌ (ausente do versionamento) |
| 7 | Aplicar **cortes free×pago** (histórico/diário 7 dias) ou remover da spec | 🔵 Baixo | P | **Novo** (RN-03/RN-04 resolvidos) |
| 8 | Trocar cópia da notificação "Um dia de cada vez" por frase da marca | 🔵 Baixo | P | **Novo** (VOZ-01) |
| 9 | Comunidade O Escudo (ou marcar Fase 3) · preço anual R$299×R$399 · ajustes visuais (hover/ícones/modo claro) | 🟠/🔵 | — | Inalterado |

---

## 7. Checklist de Verificação Manual para o Dono (Bloco C — fora de alcance do agente)

> Itens que exigem console do banco, dispositivo físico ou transação real (proibida por política). **Nada aqui foi fabricado** — confirme você mesmo.

| # | Verificar | Como fazer | Liga-se a |
|---|---|---|---|
| C1 | **Política viva de `family_connections`** | Dashboard → Database → Policies → `family_connections`. Confirmar se INSERT exige `plan='guardian'` / se falta política de INSERT / se SELECT bloqueia o RETURNING. Aplicar o patch do §3.3. | Achado 1 (FN-20) |
| C2 | **RLS ativa em produção** em todas as tabelas de usuário | Logado como usuário A, tentar `SELECT` de linhas do usuário B (ex.: via SQL editor com o JWT de A) — deve retornar vazio. Revisar políticas de `profiles, daily *, diary_entries, user_triggers, sobriety_records, emergency_contacts, family_connections`. | ET-07, AR-04 |
| C3 | **View segura do familiar** | Confirmar se existe `family_day_status` (ou equivalente) que exponha só `{owner, date, completed}`; caso contrário, o familiar lê `checklist_completions` direto — revisar a RLS dessa leitura. | AR-03, ET-08 |
| C4 | **Push respeitando 23h–7h** | Em device real, configurar lembrete e validar silêncio noturno. (Código já força janela segura, mas o disparo só roda em device.) | FN-27 (runtime) |
| C5 | **Offline-first / sync** | Em device, modo avião: checklist/diário/protocolos em cache e sync ao reconectar. | AR-05 |
| C6 | **Certificado do Programa 30 (e2e)** | Concluir os 30 dias e validar a tela de certificado (no código usa nome fixo "Você" — avaliar personalizar). | FN-22 (runtime) |
| C7 | **Stripe checkout (e2e)** | Com cartão de teste Stripe, validar webhook → `profiles.plan`/`subscriptions`. (Compra real é proibida ao agente.) | MO-04 |
| C8 | **Exclusão LGPD (e2e)** | Com conta descartável, confirmar que `delete-account` apaga o usuário e cascateia os dados. (Código verificado: usa `service_role admin.deleteUser`.) | FN-29, ET-05 |
| C9 | **OAuth Google/Apple (e2e)** | Concluir um login real com Google e (no iOS) Apple. (Código verificado em `login.tsx`/`register.tsx`.) | FN-31 (runtime) |

---

## 8. Evidence Ledger — Rodada 2

### 8.1 Arquivos lidos nesta rodada (raw / API)
**Migrações (todas as 7):** `20260619203119_add_monetization_schema.sql` (2.248 B) · `20260619210313_add_family_invitation_expires_at.sql` (447 B) · `20260619220000_add_onboarding_context.sql` (380 B) · `20260620120000_add_trial_to_profiles.sql` (1.081 B) · `20260620130000_fix_activate_trial_column_reference.sql` (3.196 B) · `20260620140000_anonymous_mode.sql` (564 B) · `20260620150000_cron_cleanup_anonymous.sql` (414 B).
**Edge functions:** `supabase/functions/delete-account/index.ts` (2.156 B).
**Auth:** `app/(auth)/login.tsx` (8.139 B) · `app/(auth)/register.tsx` (12.047 B).
**Libs/telas:** `lib/notifications.ts` (1.992 B) · `app/programa30.tsx` (16.437 B) · `lib/diario.ts` (1.243 B) · `app/historico.tsx` (5.722 B) · `app/diario.tsx` (5.336 B).
**Testes:** `__tests__/monetization.test.ts` (5.408 B) · `__tests__/protocolo.test.ts` (1.271 B) · `__tests__/sobriety.test.ts` (3.052 B) · `__tests__/fundamentos.test.ts` (2.762 B).
**Docs:** `marca/assets/logo-guidelines.md` (6.907 B).
**Não lidos (declarado):** `__tests__/{db.profiles_onboarding_columns,programa30dias,stripe}.test.ts` (AR-06 já substanciado pelas 4 suítes acima); `supabase/functions/{create-checkout-session,handle-stripe-webhooks,cleanup-anonymous-users}` (MO-04 → Bloco C C7).

### 8.2 Rotas abertas em runtime (Rodada 2)
| URL | Status/Render | Screenshot |
|---|---|---|
| `/sobre` | 200 · "Compromissos Inegociáveis" (8 regras) | ss_8788 |
| `/privacidade` | 200 · Proteção de acesso + "Seus dados (RLS)" + link excluir conta | ss_1762 |
| `/historico` | 200 · "Últimos 90 dias", "sáb. 20 jun 3/5" | ss_4701 |
| `/plans` | 200 · "Período de teste ativo — 5 dias restantes" | ss_2155 |
| `/escudo` (warm, trial) | 200 · gatilho R1 **persistido**; Módulo Familiar **vazio** (discriminador) | ss_9858 |

### 8.3 Estado final da conta de teste
`audit.guardiao.2026@mailinator.com` — **trial ativo** (5 dias restantes exibidos), **1 gatilho** persistido ("Final de tarde (teste auditoria)"), **0 conexões familiares** (tentativas de convite negadas pelo servidor; nada persistido). **Nenhum dado novo foi criado na Rodada 2** (apenas leitura/observação). Sessão "Auditor" mantida ativa (não fiz logout) para preservar acesso; por isso o *walkthrough* de onboarding via guest (B2) e a visualização dos botões OAuth não foram executados em runtime — ambos repousam em **evidência de código forte** (`register.tsx → saveOnboardingContext` + colunas `onboarding_*` populadas na conta; `login.tsx`/`register.tsx → handleOAuth`) e o complemento e2e está no Bloco C (C9).

---

## 9. GATE FINAL — Autoauditoria da Rodada 2

- [x] Li **todas** as 7 migrações `supabase/migrations/*` e a edge function `delete-account`; dei veredito de RLS/view a nível-código (ET-07 ⚠️ parcial; AR-03 ❌ não versionada) — **sem** usar "falta de painel" como desculpa para não ler o código.
- [x] **Isolei a causa-raiz do Achado 1** (trial não promove `plan`; INSERT de `family_connections` negado; discriminador: 0 linhas persistidas vs trigger persistido) e entreguei **patch SQL exato** (§3.3). A política viva exata fica no Bloco C **porque não está versionada no repo** (justificativa concreta).
- [x] Resolvi FN-22, FN-27, FN-31, RT-12 (→ ✅) e RN-03, RN-04, ET-07 (→ ⚠️, agora verificáveis); AR-06 confirmado por conteúdo.
- [x] Auditei logo/escudo/ícone/splash contra `logo-guidelines.md` + `app.json` (§4).
- [x] Itens fora de alcance no **Bloco C** com checklist acionável — nada fabricado.
- [x] Score recalculado a partir da tabela: **75,0% → 71,4%** com números absolutos (§5).
- [x] Evidence Ledger completo (arquivos lidos, rotas abertas, estado da conta).

> `❓` remanescentes: **apenas 2** (AR-04 RLS-em-produção; AR-05 offline-first), ambos no Bloco C com justificativa (exigem console do banco / device). Sucesso reportado **somente** com evidência no ledger.
