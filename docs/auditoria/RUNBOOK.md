# 🛠️ RUNBOOK de Correções — App "O Guardião Sóbrio"

Guia de execução das correções da Auditoria Forense (Rodadas 1–3). Feito para ser seguido de cima para baixo, sem improviso. Cada passo tem **comando exato**, **resultado esperado** e **como validar**.

- **Repo:** `https://github.com/vanzer80/guardiao-sobrio-app` (público; você é o dono `vanzer80`)
- **Deploy:** Vercel auto-deploy no push para `main` (preview automático em PRs)
- **Banco:** Supabase (projeto ref `huumwjwndsefdmgezohb`)
- **Arquivos do kit:** este RUNBOOK · `pacote-diagnostico-banco.sql` · `20260621090000_fix_family_connections_rls.sql`

> **Como o código é entregue:** como **edições cirúrgicas** ("ache a linha → adicione/troque"), não como `git apply` diff. Motivo: a leitura de código da auditoria normaliza indentação, então um patch automático poderia falhar/bagunçar formatação. Aplicar a edição no arquivo real (no VS Code, ou via Claude Code) é mais seguro e é validado pelos testes.

---

## 0. Pré-requisitos (instale uma vez)

| Ferramenta | Versão | Para quê |
|---|---|---|
| Node.js | 20 LTS+ | rodar o app/testes (`npm`) |
| Git | qualquer recente | versionamento |
| VS Code | atual | editar + terminal integrado |
| Supabase CLI | atual (opcional) | versionar schema/RLS (`supabase db pull/push`) |
| Acesso ao Supabase Dashboard | — | rodar o SQL (logado como dono) |

Conferir no terminal: `node -v` (deve mostrar v20+), `git --version`, `npm -v`.

---

## 1. Setup do ambiente (uma vez)

```bash
# 1. Clonar e entrar
git clone https://github.com/vanzer80/guardiao-sobrio-app.git
cd guardiao-sobrio-app

# 2. Instalar dependências
npm install

# 3. Baseline de qualidade ANTES de mexer (registre o resultado)
npm run typecheck    # tsc --noEmit  -> deve passar sem erros
npm run lint         # expo lint
npm test             # jest (as 6 suítes do __tests__)

# 4. Guardar os relatórios da auditoria no repo (documentação)
mkdir -p docs/auditoria
# copie para docs/auditoria/: os 3 relatórios .md + os 2 .sql do kit
```

**Estratégia de branches:** uma branch por achado, um Pull Request por achado. Nunca commitar direto na `main`.

---

## 2. ETAPA A — Banco de dados (Achado 1: "Gerar código") · PRIMEIRO

> Faça esta etapa antes da de código: o resultado da query **C.2** decide o foco do patch.

### A.1 — Diagnóstico (read-only, seguro)
1. Supabase Dashboard → **SQL Editor**.
2. Abra `pacote-diagnostico-banco.sql` e rode o **bloco C.1** (queries 1–6).
   - **Esperado:** `rls_enabled = true` em todas as tabelas de usuário; nenhuma tabela "sem RLS" (query 2) nem "RLS sem policy" (query 3); políticas escopadas por `auth.uid()`; query 6 mostra se a view `family_day_status` existe.
3. Rode o **bloco C.2** (a query decisiva).
   - `count = 0` → o **INSERT** estava sendo rejeitado.
   - `count > 0` → o INSERT passava; o problema é o **SELECT** do retorno.
   - A 2ª query do C.2 deve mostrar `plan='free'` e `trial_ativo=true` (comprova a causa-raiz).

### A.2 — Aplicar o patch (escrita)
Opção recomendada (versionada):
```bash
# copie o arquivo do kit para o repo:
cp 20260621090000_fix_family_connections_rls.sql supabase/migrations/
supabase login                       # abre o navegador
supabase link --project-ref huumwjwndsefdmgezohb
supabase db push                     # aplica a migração no banco
```
Opção rápida (sem CLI): cole o conteúdo de `20260621090000_fix_family_connections_rls.sql` no **SQL Editor** e execute. (Mesmo assim, **commite** o arquivo em `supabase/migrations/` para versionar.)

### A.3 — Versionar o schema-base + RLS (corrige a causa de fundo "RLS fora do repo")
```bash
supabase db pull                     # gera migração com schema+RLS atuais
git add supabase/migrations/
git commit -m "chore(db): versiona schema-base + RLS (auditoria Achado AR-03/ET-07)"
```

### A.4 — Validar
Re-rode **C.2**; depois, no app com trial ativo, toque **"Gerar código"** → deve aparecer o código de 6 dígitos.

✅ **Ao final, commit/PR:** `fix(db): RLS de family_connections honra trial [Achado 1]`

---

## 3. ETAPA B — Código (edições cirúrgicas)

Para **cada** sub-etapa: criar a branch → aplicar a edição → `npm run typecheck && npm run lint && npm test` → commit → push → validar no preview do Vercel → PR.

### B.1 — Achado 2: paywall em cold-load — `app/(tabs)/escudo.tsx`
**Branch:** `git checkout -b fix/escudo-paywall-reatividade`

**Ache** a linha (dentro de `export default function EscudoScreen() {`):
```ts
  const canAccessFeature = usePlanStore((s) => s.canAccessFeature);
```
**Adicione logo abaixo dela:**
```ts
  // Reatividade de plano (Achado 2): assina plan e trialEnd (valores) para
  // re-renderizar quando o perfil/trial carregar de forma assíncrona. Sem isto,
  // o seletor de método é estável e a tela fica presa no paywall em cold-load.
  usePlanStore((s) => s.plan);
  usePlanStore((s) => s.trialEnd);
```
**Validar:** `npm run typecheck && npm test`. **Commit:** `fix(escudo): reatividade de plano evita paywall indevido em cold-load [Achado 2]`

### B.2 — Achado 2: mesma correção — `app/programa30.tsx`
(pode ir no mesmo PR do B.1)

**Ache:**
```ts
  const canAccessFeature = usePlanStore((s) => s.canAccessFeature);
```
**Adicione logo abaixo:**
```ts
  // Reatividade de plano (Achado 2): re-renderiza quando plan/trial carregar.
  usePlanStore((s) => s.plan);
  usePlanStore((s) => s.trialEnd);
```

### B.3 — Diagnóstico do convite (visibilidade do erro) — `app/(tabs)/escudo.tsx`
Mesmo PR do Achado 1 ou separado. Dentro de `FamiliarSection → handleInvite`,
**ache:**
```ts
      showAlert('Erro', err instanceof Error ? err.message : 'Não foi possível gerar o convite.');
```
**Adicione a linha ACIMA dela:**
```ts
      console.error('[createInvite] falha ao gerar convite:', err);
```
Isso registra `code/message/details` do Supabase no console — nunca mais um erro opaco. **Commit:** `chore(escudo): loga erro real de createInvite p/ diagnóstico [Achado 1]`

### B.4 — Achado 4 (Médio): fonte de corpo General Sans — `app/_layout.tsx`
> Requer **adicionar o arquivo da fonte** (a General Sans é da Fontshare, não do `@expo-google-fonts`).

1. Baixe a General Sans (https://www.fontshare.com/fonts/general-sans) e coloque o arquivo em `assets/fonts/GeneralSans-Regular.otf` (e `-Medium`, `-Semibold` se quiser os pesos).
2. Em `app/_layout.tsx`, dentro do `useFonts({ ... })`, **adicione a entrada**:
```ts
    GeneralSans: require('@/assets/fonts/GeneralSans-Regular.otf'),
```
3. Validar: `npm run typecheck && npm start` (a tela deve renderizar o corpo na fonte certa). **Commit:** `fix(fonts): carrega General Sans (corpo) [Achado IV-07]`

---

## 4. ETAPA C — Validação e merge (para cada PR)

```bash
npm run typecheck && npm run lint && npm test   # tudo verde
git push -u origin <sua-branch>
```
Abra o **Pull Request** no GitHub. O Vercel publica um **Preview** — abra a URL do preview e confirme o comportamento corrigido (ex.: abrir `/escudo` direto com trial → sem paywall). Só então **Merge** na `main` (o deploy de produção sai automático).

---

## 5. ETAPA D — Achados maiores (PRs próprios, fora deste kit rápido)

Estes são features/itens maiores — planeje como PRs dedicados, usando os relatórios como spec:

| Achado | Ação | Esforço |
|---|---|---|
| FN-25 / FN-12 | Construir **Contatos de Confiança** (CRUD em `emergency_contacts`, que já existe no banco) + religar à etapa CONTATO do SOS e ao Perfil | Médio |
| AR-03 | Criar **view segura `family_day_status`** (`SECURITY DEFINER`) e fazer o familiar ler por ela | Médio |
| FN-23 | **Comunidade O Escudo** (ou marcar explicitamente como Fase 3 no roadmap) | Grande |
| RN-03/04 | Aplicar **cortes free×pago** (histórico/diário 7 dias) ou remover a regra do spec | Baixo |
| MO-02 / VOZ-01 / visuais | Preço anual (R$299×R$399), trocar "Um dia de cada vez" na notificação, hover/ícones/modo claro | Baixo |

---

## 6. Ordem recomendada (paralelizável)

1. **ETAPA A (banco)** — independente; faça primeiro (C.2 decide o foco).
2. **B.1+B.2 (reatividade)** e **B.4 (fonte)** — independentes entre si; podem ir em paralelo.
3. **B.3 (logging)** — junto do Achado 1.
4. **ETAPA D** — depois, um PR por item.

---

## 7. Registro de Execução (preencha conforme aplica — documentação)

| Data | Achado | Branch / PR | Commit | Validação (typecheck/lint/test) | Resultado C.2 | Status |
|---|---|---|---|---|---|---|
| | Achado 1 (RLS convite) | | | | count = ___ | |
| | Achado 2 (reatividade) | fix/escudo-paywall-reatividade | | | n/a | |
| | IV-07 (General Sans) | | | | n/a | |
| | … | | | | | |

> Boa prática: cole este RUNBOOK e os relatórios em `docs/auditoria/` no repo, e referencie o **ID do achado** em cada commit/PR. Assim a rastreabilidade fica completa e auditável.

---

## 8. Dica de execução assistida (recomendado)

Para a parte de **código**, abra o repositório no VS Code e rode o **Claude Code** no terminal integrado, apontando os relatórios + este RUNBOOK como especificação. Ele lê os arquivos reais, aplica as edições, roda `typecheck`/`test` e commita — reduzindo erro e documentando o processo. O SQL (Etapa A) continua sendo executado por você no Supabase, pois exige sua autenticação.
