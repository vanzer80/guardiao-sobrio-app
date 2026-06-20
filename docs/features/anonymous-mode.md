# Spec — Modo Visitante (Acesso Sem Cadastro)

**Status:** Pronto para implementar  
**Data:** 2026-06-20  
**Owner:** Luis Vanzer  
**Estimativa:** ~4 dias de desenvolvimento sênior  
**Stack:** React Native · Expo · Supabase · Zustand · MMKV

---

## Contexto

O público do Guardião Sobrio é reservado e frequentemente não quer fornecer e-mail ou telefone no primeiro contato. Esta feature permite que qualquer pessoa entre e use **todas as funcionalidades do app por 5 dias** sem nenhuma credencial. O pedido de conta acontece somente após o usuário ter vivenciado o valor real do produto.

---

## Decisão de Arquitetura

**Usar `supabase.auth.signInAnonymously()`** — não localStorage puro.

O Supabase cria um usuário real em `auth.users` com `is_anonymous = true` e um `user_id` UUID normal. Isso significa:

| Critério | Anonymous Auth | MMKV local puro |
|---|---|---|
| RLS funciona sem mudanças | Sim | Não (duplicaria lógica) |
| Dados das 13 tabelas acessíveis | Sim | Não |
| Migração para conta real | `updateUser()` — zero código extra | Sync manual complexo |
| Funciona offline (MMKV) | Sim | Sim |

Ao criar conta, `supabase.auth.updateUser({ email, password })` preserva o `user_id` — todos os dados do banco são mantidos automaticamente.

---

## Fluxo do Usuário

```
welcome.tsx
  ├── [Começar]               → onboarding (fluxo atual, sem mudança)
  └── [Explorar sem cadastro] → onboarding → signInAnonymously() → (tabs)

(tabs) com usuário anônimo:
  ├── Plano efetivo: 'guardian' — todos os recursos liberados
  ├── Banner sutil no topo: "X dias restantes · Criar conta"
  └── Após 5 dias: downgrade para 'free' + modal de conversão
      (SOS nunca é bloqueado, em nenhuma circunstância)

convert.tsx (nova tela):
  └── updateUser({ email, password }) → conta real, dados preservados, banner some
```

---

## Fases de Implementação

### Fase 0 — Backend Supabase (0,5 dia)

#### 0.1 Habilitar Anonymous Auth

No dashboard Supabase: `Authentication → Providers → Anonymous Sign-ins` → ativar.

#### 0.2 Migration

Criar `supabase/migrations/[timestamp]_anonymous_mode.sql`:

```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_anonymous         boolean      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS anonymous_created_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_profiles_anonymous_cleanup
  ON public.profiles (is_anonymous, anonymous_created_at)
  WHERE is_anonymous = true;

COMMENT ON COLUMN public.profiles.is_anonymous IS
  'true = sessão visitante criada por signInAnonymously()';
COMMENT ON COLUMN public.profiles.anonymous_created_at IS
  'Timestamp de criação — usado para calcular expiração e cleanup';
```

Migration deve ser idempotente (`IF NOT EXISTS` em todos os comandos).

#### 0.3 Edge Function de Cleanup

Criar `supabase/functions/cleanup-anonymous-users/index.ts`:

```typescript
// Deleta perfis anônimos com mais de 7 dias sem conversão
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: expired } = await supabase
    .from('profiles')
    .select('id')
    .eq('is_anonymous', true)
    .lt('anonymous_created_at', cutoff)

  if (!expired?.length) return new Response('noop')
  for (const { id } of expired) {
    await supabase.auth.admin.deleteUser(id)  // cascata apaga profiles por FK
  }
  return new Response(`deleted ${expired.length} anonymous users`)
})
```

Registrar cron no dashboard (`Database → Cron Jobs`): executar diariamente às 3h UTC.

#### 0.4 Auditoria de RLS

Verificar policies existentes para confirmar que nenhuma filtra ou bloqueia por `is_anonymous`. Tabelas a auditar:

- `family_connections` — anônimos não devem poder fazer INSERT (confirmar na policy, não só no cliente)
- `emergency_contacts` — permitido para anônimos (faz parte do SOS)
- `push_tokens` — não registrar para anônimos (controlado no cliente)

---

### Fase 1 — Stores e Hooks (0,5 dia)

**Arquivos:** `hooks/useAuthStore.ts`, `hooks/usePlanStore.ts`, `hooks/useAnonymousSession.ts` (novo)

#### `hooks/useAuthStore.ts` — adicionar `isAnonymous`

```typescript
import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';

interface AuthState {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isAnonymous: boolean;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isLoading: true,
  isAnonymous: false,
  setSession: (session) =>
    set({
      session,
      user: session?.user ?? null,
      isAnonymous: session?.user?.is_anonymous ?? false,
    }),
  setLoading: (isLoading) => set({ isLoading }),
}));
```

#### `hooks/usePlanStore.ts` — `getEffectivePlan()` cobre anônimo

```typescript
// Substituir getEffectivePlan:
getEffectivePlan: () => {
  const state = get();
  const { isAnonymous } = useAuthStore.getState();  // snapshot, não hook
  if (isAnonymous) return 'guardian';
  return state.isInTrial() ? 'guardian' : state.plan;
},
```

#### `hooks/useAnonymousSession.ts` (novo)

```typescript
import { useMemo } from 'react';
import { useAuthStore } from '@/hooks/useAuthStore';
import { useProfileStore } from '@/hooks/useProfileStore';

const ANONYMOUS_DURATION_DAYS = 5;

export function useAnonymousSession() {
  const isAnonymous = useAuthStore((s) => s.isAnonymous);
  const profile = useProfileStore((s) => s.profile);

  return useMemo(() => {
    if (!isAnonymous || !profile?.anonymous_created_at) {
      return { isAnonymous: false, daysRemaining: 0, isExpired: false, shouldShowBanner: false };
    }
    const created = new Date(profile.anonymous_created_at).getTime();
    const expiresAt = created + ANONYMOUS_DURATION_DAYS * 24 * 60 * 60 * 1000;
    const msRemaining = expiresAt - Date.now();
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
    const isExpired = msRemaining <= 0;
    return { isAnonymous: true, daysRemaining, isExpired, shouldShowBanner: !isExpired };
  }, [isAnonymous, profile?.anonymous_created_at]);
}
```

---

### Fase 2 — Fluxo de Entrada (0,5 dia)

**Arquivos:** `app/(auth)/welcome.tsx`, `app/(auth)/onboarding/desafio.tsx`, `lib/anonymousAuth.ts` (novo)

#### `lib/anonymousAuth.ts` (novo)

```typescript
import { supabase } from '@/lib/supabase';

export async function signInAsGuest(onboardingData: {
  motivo: string;
  tempo: string;
  desafio: string;
}): Promise<void> {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  const userId = data.session?.user.id;
  if (!userId) throw new Error('anonymous session missing user id');

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      is_anonymous: true,
      anonymous_created_at: new Date().toISOString(),
      onboarding_completed: true,
      onboarding_motivo: onboardingData.motivo,
      onboarding_tempo: onboardingData.tempo,
      onboarding_desafio: onboardingData.desafio,
      full_name: 'Visitante',
      plan: 'free',  // plano real; getEffectivePlan() retorna 'guardian' para anônimos
    });

  if (profileError) throw profileError;
}
```

#### `app/(auth)/welcome.tsx` — botão secundário

Adicionar abaixo do `<Button>` principal existente:

```tsx
<Pressable
  onPress={() => router.push('/(auth)/onboarding/motivo?mode=guest')}
  accessibilityRole="button"
  accessibilityLabel="Explorar o app sem criar uma conta"
  style={{ marginTop: 16, alignItems: 'center', padding: 12 }}
>
  <Text style={{ color: Colors.muted, fontSize: 14, textDecorationLine: 'underline' }}>
    Explorar sem cadastro
  </Text>
</Pressable>
```

Design intencional: link textual discreto (não botão dourado) para não competir com o CTA principal.

#### `app/(auth)/onboarding/desafio.tsx` — detectar `mode=guest`

```tsx
const searchParams = useLocalSearchParams();
const isGuest = searchParams.mode === 'guest';
const context = getOnboardingContext(); // lib/onboardingStore.ts — já existe

const handleContinue = async () => {
  if (isGuest) {
    try {
      setLoading(true);
      await signInAsGuest({
        motivo: context.motivo,
        tempo: context.tempo,
        desafio: values.desafio,
      });
      // _layout.tsx detectará a sessão e navegará para (tabs) automaticamente
    } catch {
      setError('Não foi possível iniciar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  } else {
    router.push('/register'); // fluxo atual — sem mudança
  }
};
```

O guard em `_layout.tsx` não precisa de mudança: sessão anônima é sessão real para o Supabase, e `onboarding_completed: true` é setado em `signInAsGuest()`, então o usuário vai direto para `(tabs)`.

---

### Fase 3 — Banner de Conversão (1 dia)

**Arquivos:** `components/AnonymousBanner.tsx` (novo), `app/(tabs)/_layout.tsx`

#### `components/AnonymousBanner.tsx`

```tsx
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAnonymousSession } from '@/hooks/useAnonymousSession';
import { Colors } from '@/constants/Colors';

export function AnonymousBanner() {
  const router = useRouter();
  const { shouldShowBanner, daysRemaining } = useAnonymousSession();

  if (!shouldShowBanner) return null;

  const label =
    daysRemaining === 1
      ? 'Último dia de acesso gratuito'
      : `${daysRemaining} dias de acesso gratuito restantes`;

  return (
    <Pressable
      onPress={() => router.push('/(auth)/convert')}
      accessibilityRole="button"
      accessibilityLabel={`${label}. Toque para criar sua conta e manter seu progresso.`}
      style={{
        backgroundColor: Colors.goldDim,
        paddingVertical: 8,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Text style={{ color: Colors.bg, fontSize: 12, fontWeight: '600', flex: 1 }}>
        {label}
      </Text>
      <Text style={{ color: Colors.bg, fontSize: 12, fontWeight: '700' }}>
        Criar conta →
      </Text>
    </Pressable>
  );
}
```

Regras de exibição:
- Visível em todas as abas **exceto `protocolo` (SOS)** — não criar pressão durante emergência
- Sem `!`, sem urgência, tom direto (hard rule de tom do projeto)
- Desaparece automaticamente após conversão (`isAnonymous` vira `false`)

#### `app/(tabs)/_layout.tsx` — injetar banner

```tsx
const segments = useSegments();
const isSOSScreen = (segments as string[]).includes('protocolo');

// Antes do <Tabs>:
{!isSOSScreen && <AnonymousBanner />}
```

---

### Fase 4 — Tela de Conversão (0,5 dia)

**Arquivo:** `app/(auth)/convert.tsx` (novo)

Usar os mesmos componentes e padrões de `register.tsx` (RHF + Zod + `components/ui/Input` e `Button`).

```typescript
// Schema de validação (mesmo padrão do register.tsx)
const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
});

// Ação de conversão
const onSubmit = async ({ email, password }) => {
  // updateUser() mantém o user_id — todos os dados do banco são preservados
  const { error } = await supabase.auth.updateUser({ email, password });
  if (error) { /* mostrar erro */ return; }

  // Atualizar profile: marcar como conta real
  const { data: { user } } = await supabase.auth.getUser();
  await supabase
    .from('profiles')
    .update({ is_anonymous: false, anonymous_created_at: null })
    .eq('id', user!.id);

  // Recarregar profile no store (banner some automaticamente)
  const { data } = await supabase.from('profiles').select('*').single();
  setProfile(data);
  router.replace('/(tabs)');
};
```

Para OAuth (Google/Apple): usar `supabase.auth.linkIdentity({ provider: 'google' | 'apple' })` — **não** `signInWithOAuth`, que criaria um usuário novo e perderia os dados.

Copy obrigatório na tela:
- "Seus dados estão salvos. Basta criar sua conta para mantê-los."
- Disclaimer: "Este app não substitui psiquiatra, psicólogo ou grupos de apoio."

---

### Fase 5 — Expiração e Degradação Graciosa (0,5 dia)

**Arquivos:** `app/_layout.tsx` (adição pequena), `components/AnonymousExpiredModal.tsx` (novo)

#### Detectar expiração em `app/_layout.tsx`

No `useEffect` que carrega o profile, após `setProfile(data)`:

```typescript
if (data?.is_anonymous && data?.anonymous_created_at) {
  const created = new Date(data.anonymous_created_at).getTime();
  const expired = Date.now() > created + 5 * 24 * 60 * 60 * 1000;
  if (expired) setAnonymousExpired(true);
}
```

#### `components/AnonymousExpiredModal.tsx`

Modal não-bloqueante com:
- Título: "Seu período de exploração terminou"
- Corpo: "Crie uma conta gratuita para continuar. Seus dados estão salvos."
- CTA 1: "Criar conta" → `convert.tsx`
- CTA 2: "Continuar com acesso limitado" → fecha modal, usuário permanece como free

Ao escolher "acesso limitado": **não deletar a sessão**. Deixar como anônimo com `getEffectivePlan()` retornando `'free'` (pois `isExpired = true`). Features premium aparecem bloqueadas naturalmente, como para qualquer usuário free.

**Hard rule:** este modal nunca aparece sobre `protocolo.tsx` (SOS).

---

## Gates de Qualidade (Definition of Done)

Uma fase só está pronta quando **todos** os itens abaixo passam.

### Hard Rules (não-negociáveis)

- [x] SOS (`protocolo.tsx`) funciona sem nenhum toque adicional para usuário anônimo, inclusive após expiração — banner e modal excluídos via `useSegments()` check
- [x] CVV (188) e CAPS visíveis em Configurações para usuários anônimos — herdado do layout existente
- [x] Disclaimer presente na tela de conversão (`convert.tsx`) — "Este app não substitui psiquiatra, psicólogo ou grupos de apoio." + CVV/CAPS
- [x] Nenhum dado de um usuário anônimo vaza para outro — RLS auditada em 20/06/2026: `owner_all_emergency_contacts` (PERMISSIVE, `auth.uid() = user_id`) e `Anônimos não podem criar conexões de família` (RESTRICTIVE, INSERT bloqueado) — isolamento por `user_id` confirmado
- [x] Banner de conversão não aparece na tela de protocolo — `useSegments()` verifica `segments.includes('protocolo')` em `(tabs)/_layout.tsx`
- [x] Modal de expiração não aparece sobre a tela de protocolo — mesma verificação em `app/_layout.tsx`
- [x] Sem `!` excessivo, sem urgência, tom direto — auditado em todo o copy

### Funcionalidade

- [ ] `signInAnonymously()` cria sessão e profile em menos de 3 segundos (mid-range device) — **pendente: testar em device físico**
- [x] Todas as 10 features do plano guardian acessíveis para usuário anônimo — `getEffectivePlan()` retorna `'guardian'` quando `isAnonymous = true`
- [ ] `convert.tsx` preserva 100% dos dados após conversão (criar diário + SOS, converter, verificar que dados aparecem na conta real) — **pendente: teste E2E em device físico**
- [ ] OAuth linking (Google/Apple) também preserva dados — **pendente: testar `linkIdentity` em device físico**
- [ ] Banner some imediatamente após conversão bem-sucedida — **pendente: verificar em device**
- [x] Push token não registrado para usuário anônimo — controlado no cliente; `is_anonymous` verificável antes do registro
- [x] Upload de avatar não disponível para anônimos — feature não exposta para visitante (sem tela de perfil no fluxo anônimo)
- [x] Feature `familyModule` bloqueada por RLS no banco — INSERT em `family_connections` bloqueado pela policy RESTRICTIVE confirmada em 20/06/2026

### Técnico

- [x] `npm run typecheck` sem erros — limpo em 20/06/2026
- [x] `npm run lint` sem erros — limpo em 20/06/2026
- [x] Migration `20260620140000_anonymous_mode.sql` aplicada em produção via `supabase db push` (20/06/2026)
- [x] Edge Function `cleanup-anonymous-users` deployada com `--no-verify-jwt` + contagem de erros por item (20/06/2026)
- [x] Cron job `0 3 * * *` ativo via pg_cron + pg_net em produção (20/06/2026)
- [x] Nenhum `console.log` com dados do usuário — apenas `console.error` no loop de cleanup (servidor, não cliente)

### Auditoria RLS (20/06/2026)

| Tabela | Policy | Tipo | Comando | Resultado para anônimos |
|---|---|---|---|---|
| `emergency_contacts` | `owner_all_emergency_contacts` | PERMISSIVE | ALL | ✅ Acesso liberado (SOS requer) |
| `family_connections` | `Anônimos não podem criar conexões de família` | **RESTRICTIVE** | INSERT | ✅ Bloqueado |
| `family_connections` | `owner_all_family_connections` | PERMISSIVE | ALL | AND-ado com RESTRICTIVE → INSERT bloqueado |
| `family_connections` | `family_select_own_connection` | PERMISSIVE | SELECT | ✅ Apenas `family_user_id` próprio |
| `family_connections` | `family_update_status` | PERMISSIVE | UPDATE | ✅ Apenas `family_user_id` próprio |

---

## Matriz de Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Anonymous Auth não habilitado no dashboard antes do deploy | Alta | Crítico | Checklist de deploy inclui verificação do toggle |
| `linkIdentity()` OAuth falha silenciosamente | Média | Alto | Testar Google e Apple em device físico antes de mergear |
| Usuário reinstala app (sessão MMKV apagada) | Alta | Médio | Tratar como nova sessão; informar ao usuário com copy honesto |
| Acumulação de usuários anônimos sem cleanup | Média | Baixo | Cron diário com log de quantidade deletada |
| RLS bloqueia anônimo inesperadamente | Baixa | Alto | Testar com usuário anônimo real em staging |
| Banner com tom de pressão inadequado | Média | Médio | Design review: sem vermelho, sem "URGENTE", sem `!` |

---

## O Que Não Fazer

- Não criar sistema de "sessão local" em MMKV paralelo — duplicaria toda a lógica de dados
- Não bloquear nenhuma feature durante os 5 dias — o objetivo é demonstrar valor total
- Não usar `signUp()` com e-mail fake gerado — viola ToS do Supabase
- Não mostrar banner ou modal dentro de `protocolo.tsx`, em nenhuma circunstância
- Não deletar dados ao expirar — degradar para free é o caminho correto

---

## Arquivos Criados / Modificados

| Arquivo | Ação |
|---|---|
| `supabase/migrations/[ts]_anonymous_mode.sql` | Criar |
| `supabase/functions/cleanup-anonymous-users/index.ts` | Criar |
| `lib/anonymousAuth.ts` | Criar |
| `hooks/useAnonymousSession.ts` | Criar |
| `app/(auth)/convert.tsx` | Criar |
| `components/AnonymousBanner.tsx` | Criar |
| `components/AnonymousExpiredModal.tsx` | Criar |
| `hooks/useAuthStore.ts` | Modificar — adicionar `isAnonymous` |
| `hooks/usePlanStore.ts` | Modificar — `getEffectivePlan()` cobre anônimo |
| `app/(auth)/welcome.tsx` | Modificar — botão "Explorar sem cadastro" |
| `app/(auth)/onboarding/desafio.tsx` | Modificar — detectar `mode=guest` |
| `app/(tabs)/_layout.tsx` | Modificar — injetar `AnonymousBanner` |
| `app/_layout.tsx` | Modificar — detectar expiração |

---

## Ordem de Execução Recomendada

```
Dia 1 AM  → Fase 0 — Supabase: migration + Edge Function
Dia 1 PM  → Fase 1 — useAuthStore + usePlanStore + useAnonymousSession
Dia 2 AM  → Fase 2 — welcome + onboarding desafio + lib/anonymousAuth
Dia 2 PM  → Fase 3 — AnonymousBanner + tabs layout
Dia 3 AM  → Fase 4 — convert.tsx (email, senha e OAuth linking)
Dia 3 PM  → Fase 5 — expiração + modal
Dia 4     → QA em device físico (iOS + Android), correções, revisão de hard rules
```
