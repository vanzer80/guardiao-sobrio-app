# O Guardião Sobrio — App

> **Sobriedade não é abstinência. É construção.**
>
> Aplicativo (iOS, Android e web) que digitaliza o método **O Guardião Sobrio** — uma estrutura diária de proteção da sobriedade baseada em três pilares: **ESPELHO · TÁTICA · ESCUDO**.

O app é o guardião no bolso. Não é o terapeuta, não é o médico. É o escudo no momento crítico.

---

## 📚 Documentação / fonte de verdade

Toda a estratégia, método, protocolos, fundamentos e regras de negócio vivem no repositório de conhecimento:
👉 **[`guardiao-sobrio-docs`](https://github.com/vanzer80/guardiao-sobrio-docs)**

O planejamento de execução técnica está em **[`ROADMAP.md`](./ROADMAP.md)**.

---

## 🧭 O método

| Pilar | O que entrega |
|---|---|
| **ESPELHO** | Diário guiado com prompts de autoconsciência. Ver a verdade sem anestesia. |
| **TÁTICA** | Checklist diário (sono, água, alimentação, movimento, conexão) + protocolo de emergência em 1 toque. |
| **ESCUDO** | Mapa de gatilhos, plano de perímetro e módulo para familiares. |

---

## 🛠 Stack

- **Mobile:** React Native (Expo) + TypeScript + Expo Router
- **UI:** NativeWind (tokens do design system noir)
- **Estado:** Zustand · **Forms:** React Hook Form + Zod
- **Backend:** Supabase (Postgres + Auth + Storage + Edge Functions + Realtime), RLS em todas as tabelas
- **Offline-first:** WatermelonDB / MMKV
- **Push:** Expo Notifications + OneSignal
- **Web:** Next.js 15 + Tailwind v4 (landing/PWA) · Deploy Vercel
- **Build/CI:** Expo EAS · GitHub Actions · Sentry

---

## 📁 Estrutura

```
guardiao-sobrio-app/
├── apps/
│   ├── mobile/        # App Expo (iOS + Android)
│   └── web/           # Next.js (landing / PWA)
├── packages/          # design-tokens, types compartilhados
├── design/            # protótipo HTML (referência viva de UI)
├── ROADMAP.md         # roadmap de execução
└── README.md
```

---

## 🚀 Começando

> Pré-requisitos: Node 20+, pnpm (ou npm), Expo CLI, conta Supabase.

```bash
# 1. Clonar
git clone https://github.com/vanzer80/guardiao-sobrio-app.git
cd guardiao-sobrio-app

# 2. Instalar dependências
pnpm install

# 3. Variáveis de ambiente
cp .env.example .env.local
# preencha as chaves do Supabase, OneSignal, etc.

# 4. Rodar o app mobile
pnpm --filter mobile start

# 5. Rodar a web
pnpm --filter web dev
```

### Variáveis de ambiente (`.env.local`)
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ONESIGNAL_APP_ID=
SENTRY_DSN=
```

---

## 🎨 Design System (noir)

| Token | Valor |
|---|---|
| Background | `#0e0d0c` |
| Surface | `#141312` / `#1a1917` |
| Texto | `#e8e6e2` · muted `#8a8782` |
| Acento (ouro fosco) | `#c8a84b` |
| Emergência (âmbar) | `#e07b2a` |
| Tipografia | Cormorant Garamond (display) · General Sans (texto) · JetBrains Mono (números) |

Estética: **Noir Realista** — escuro, contraste, sem filtros "cheerful". Protótipo navegável em `design/`.

---

## 🛡 Limites éticos (Hard Rules)

Não podem ser quebrados por nenhuma demanda de negócio:

- Nenhuma promessa de **cura** ou resultado garantido.
- Nunca pressionar o usuário a **não** procurar ajuda profissional.
- Protocolo de emergência **nunca** é bloqueado no meio de uma sessão ativa.
- Link para **CVV (188)** e **CAPS** sempre acessível.
- Aviso em todos os protocolos: *"Este app não substitui psiquiatra, psicólogo ou grupos de apoio."*
- **Exclusão de conta e dados em 2 toques** (LGPD).
- Sem notificações entre **23h e 7h**.

---

## 🔒 Privacidade

Dados de sobriedade nunca são usados para publicidade nem expostos a outros usuários sem consentimento. RLS obrigatória, JWT com rotação de refresh token, conformidade com a LGPD.

**Em crise aguda, procure ajuda imediata:** CVV — **188** (24h, sigiloso) · CAPS mais próximo.

---

## 📌 Status

🚧 Em desenvolvimento — Fase 1 (MVP). Veja o progresso em [`ROADMAP.md`](./ROADMAP.md).

---

*© 2026 Luis Vanzer — O Guardião Sobrio. Todos os direitos reservados.*
