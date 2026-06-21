# Achado 6 — Módulo Familiar incompleto (lado do familiar sem UI) + spec de correção

> Auditoria · 2026-06-21 · descoberto ao validar o e2e do convite. Severidade: **ALTA**
> (recurso do plano Guardião que não se completa ponta a ponta).

---

## 1. O achado

O lado do **dono** funciona (convidar/gerar código/revogar — `escudo.tsx → FamiliarSection`).
O lado do **familiar não existe na interface**: os helpers `acceptInvite()` e
`getFamilyDayStatus()` existem em `lib/family.ts`, mas **nenhuma tela os chama** (código órfão).

**Evidência (inventário completo de telas em `main@8001203`):** `app/(auth)/{welcome,
login, register, setup, convert, ativacao, callback, onboarding}`, `app/(tabs)/{index,
metodo, protocolo, escudo, perfil, plans}`, `app/{contatos, diario, historico, stats,
programa30, sobre, privacidade}`. Nenhuma é tela de "aceitar convite" nem renderiza a
vista "dia guardado". `escudo.tsx` importa apenas `createInvite/getActiveConnection/
revokeAccess` (dono).

## 2. Resultado do e2e (previsto por código)
| Passo | Resultado |
|---|---|
| Dono gera código (6 díg.) | ✅ (já confirmado) |
| Familiar aceita o convite | ❌ não há tela para inserir o código |
| Vista do familiar (dia guardado) | ❌ não há UI |
| Dono vê "CONECTADO" | ❌ fica em "AGUARDANDO" (status nunca vira `accepted`) |
| Revogar | ✅ (lado do dono) |

## 3. Por que não basta criar a tela (há trabalho de banco junto)
Dois bloqueios no banco impedem o lado do familiar mesmo com UI:
1. **Aceitar:** as policies atuais de `family_connections` têm `UPDATE` só para o dono
   (`fc_owner_update: auth.uid() = user_id`). O familiar precisa marcar
   `family_user_id = auth.uid()` ao aceitar → seria bloqueado. Resolver com **RPC
   `SECURITY DEFINER`** (não com policy de UPDATE aberta, que seria abusável).
2. **Ler o status:** `getFamilyDayStatus` lê `checklist_completions` do dono; a RLS
   do dono bloqueia leitura por terceiros → sempre voltaria "Em jornada". Resolver
   expondo **apenas o booleano do dia** via RPC/`SECURITY DEFINER` (alinha com o
   achado AR-03 — view segura `family_day_status` ausente).

## 4. Spec de correção

### 4.1 Banco — 2 RPCs `SECURITY DEFINER` (migração versionada; aplicar via Supabase)
```sql
-- Familiar reivindica um convite pendente pelo código de 6 dígitos
create or replace function public.accept_family_invite(p_token text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_exp timestamptz;
begin
  select id, invitation_expires_at into v_id, v_exp
  from family_connections
  where invitation_token = p_token and invitation_status = 'pending'
  limit 1;
  if v_id is null then
    return jsonb_build_object('ok', false, 'reason', 'Código inválido ou já utilizado.');
  end if;
  if v_exp is not null and v_exp < now() then
    return jsonb_build_object('ok', false, 'reason', 'Código expirado. Peça um novo convite.');
  end if;
  update family_connections
    set family_user_id = auth.uid(), invitation_status = 'accepted',
        invitation_token = null, updated_at = now()
  where id = v_id;
  return jsonb_build_object('ok', true);
end; $$;
grant execute on function public.accept_family_invite(text) to authenticated;

-- Familiar vinculado lê APENAS o booleano do dia do dono
create or replace function public.get_family_day_status()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_owner uuid; v_guarded boolean;
begin
  select user_id into v_owner from family_connections
   where family_user_id = auth.uid() and invitation_status = 'accepted' limit 1;
  if v_owner is null then return jsonb_build_object('linked', false); end if;
  select exists(
    select 1 from checklist_completions
    where user_id = v_owner and completed_date = current_date
  ) into v_guarded;
  return jsonb_build_object('linked', true, 'dayGuarded', v_guarded,
    'label', case when v_guarded then 'Dia guardado' else 'Em jornada' end);
end; $$;
grant execute on function public.get_family_day_status() to authenticated;
```
> Arquivo: `supabase/migrations/<timestamp>_family_accept_and_status_rpcs.sql`. **Versionar no PR; aplicar no banco é passo do dono** (`supabase db push` / SQL Editor).

### 4.2 App — UI (chama as RPCs, não os helpers órfãos)
- **Tela de aceitar convite** (ex.: `app/aceitar-convite.tsx`, ou seção em `escudo.tsx`):
  campo de 6 dígitos → `supabase.rpc('accept_family_invite', { p_token })` → sucesso/erro
  conforme `ok/reason`. Ponto de entrada: link "Recebi um convite de familiar" na
  `welcome.tsx` (encaminha por login/registro e volta) **e** em `perfil.tsx`.
- **Vista do familiar:** ao abrir o app, chamar `supabase.rpc('get_family_day_status')`;
  se `linked=true`, mostrar só o `label` ("Dia guardado / Em jornada"). Respeitar
  `can_see_diary/sos/triggers = false` — **não** expor diário, contador, gatilhos.
- (Opcional) Atualizar `lib/family.ts` para usar as RPCs em vez do `acceptInvite`/
  `getFamilyDayStatus` atuais (que esbarram na RLS).

### 4.3 Validação e2e (após app + RPCs aplicadas)
Rodar o roteiro de 2 contas: dono gera → familiar aceita → familiar vê só o dia →
dono vê "CONECTADO" → revogar.

## 5. ⚠️ Documentação/roadmap (regra permanente)
No mesmo PR: registrar este achado como resolvido em `docs/auditoria/`, abrir item no
`ROADMAP.md` ("Módulo Familiar — lado do familiar"), linha no `CHANGELOG.md`, e ADR se
mudar contrato de RLS. Manter `database.types.ts` e migrations sincronizados.
