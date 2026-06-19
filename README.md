# O Guardião Sobrio — App

> **Sobriedade não é abstinência. É construção.**
>
> Aplicativo iOS + Android que digitaliza o método **O Guardião Sobrio** — uma estrutura diária de proteção da sobriedade baseada em três pilares: **ESPELHO · TÁTICA · ESCUDO**.

O app é o guardião no bolso. Não é o terapeuta, não é o médico. É o escudo no momento crítico.

---

## 📚 Documentação / fonte de verdade

| O quê | Onde |
|---|---|
| Método, conteúdo, protocolos, regras de negócio e marca | 👉 [`guardiao-sobrio-docs`](https://github.com/vanzer80/guardiao-sobrio-docs) (público) |
| Execução técnica, sprints e decisões abertas | [`ROADMAP.md`](./ROADMAP.md) |

### ⚠️ Regra para quem desenvolve

> **Consulte `guardiao-sobrio-docs` antes de implementar qualquer conteúdo.**
> Textos dos fundamentos, prompts diários, protocolos de emergência, regras de planos (free/pago), fluxos de telas e copy de marca vivem exclusivamente nesse repositório.
> Nunca improvise conteúdo ou regras de negócio sem verificar a fonte.

```bash
# Leitura rápida de qualquer arquivo do docs repo via CLI:
gh api repos/vanzer80/guardiao-sobrio-docs/contents/<caminho> --jq '.content' | base64 -d
```

Arquivos mais usados no desenvolvimento:

| Necessidade | Arquivo no docs repo |
|---|---|
| Textos dos 13 Fundamentos | `fundamentos/13-fundamentos.md` |
| Regras de planos e limites free/pago | `app/07-regras-de-negocio.md` |
| Fluxos de telas e navegação | `app/05-fluxos-e-telas.md` |
| Protocolos de emergência | `protocolos/` |
| Tom de voz e copy | `marca/manual-de-marca.md` |

> A landing page / web entra como **repositório separado** (`guardiao-sobrio-web`) numa fase futura.

---

## 🧭 O método

| Pilar | O que entrega |
|---|---|
| **ESPELHO** | Diário guiado com prompts de autoconsciência. Ver a verdade sem anestesia. |
| **TÁTICA** | Checklist diário (sono, água, alimentação, movimento, conexão) + protocolo de emergência em 1 toque. |
| **ESCUDO** | Mapa de gatilhos, plano de perímetro e módulo para familiares. |

---

## 🛠 Stack

- **Framework:** React Native (Expo) + TypeScript + Expo Router
- **UI:** NativeWind (tokens do design system noir)
- **Estado:** Zustand · **Forms:** React Hook Form + Zod
- **Backend:** Supabase (Postgres + Auth + Storage + Edge Functions + Realtime), RLS em todas as tabelas
- **Offline-first:** WatermelonDB / MMKV
- **Push:** Expo Notifications + OneSignal
- **Build/CI:** Expo EAS · GitHub Actions · Sentry

---

## 📁 Estrutura

```
guardiao-sobrio-app/
├── app/              # telas e rotas (Expo Router)
├── components/       # componentes de UI
├── lib/              # supabase, helpers, regras de negócio
├── hooks/            # hooks compartilhados (Zustand stores, etc.)
├── constants/        # design tokens (cores, tipografia, espaçamento)
├── assets/           # ícones, imagens, fontes
├── design/           # protótipo HTML (referência viva de UI)
├── ROADMAP.md
└── README.md
```

---

## 🚀 Começando

> Pré-requisitos: Node 20+, Expo CLI, conta Supabase. App Expo Go no celular (ou simulador iOS/Android).

```bash
# 1. Clonar
git clone https://github.com/vanzer80/guardiao-sobrio-app.git
cd guardiao-sobrio-app

# 2. Instalar dependências
npm install

# 3. Variáveis de ambiente
cp .env.example .env.local
# preencha as chaves do Supabase, OneSignal, etc.

# 4. Rodar
npx expo start
# pressione i (iOS), a (Android) ou escaneie o QR com o Expo Go
```

### Build para as lojas (Expo EAS)
```bash
npm install -g eas-cli
eas build --platform ios
eas build --platform android
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

🚧 Em desenvolvimento — Fase 1 (MVP). Progresso em [`ROADMAP.md`](./ROADMAP.md).

---

*© 2026 Luis Vanzer — O Guardião Sobrio. Todos os direitos reservados.*


.env.example


# ── Supabase ──────────────────────────────
# Prefixo EXPO_PUBLIC_ = exposto no app (seguro: URL + chave anônima)
EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=

# ── Push notifications ────────────────────
EXPO_PUBLIC_ONESIGNAL_APP_ID=

# ── Observabilidade ───────────────────────
EXPO_PUBLIC_SENTRY_DSN=

# ──────────────────────────────────────────
# ATENÇÃO: a SERVICE_ROLE_KEY do Supabase NÃO vai aqui.
# Ela é secreta e vive só nas Supabase Edge Functions (backend),
# nunca dentro do app mobile.

