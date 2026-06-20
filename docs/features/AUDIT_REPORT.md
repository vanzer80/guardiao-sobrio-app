# Relatório de Auditoria Completa — Guardião Sóbrio App

**Data:** 2026-06-20  
**Auditor:** Claude (IA / Cowork)  
**Conta de teste:** `audit.guardiao.2026@mailinator.com` — conta nova/limpa, plano Gratuito  
**App auditado:** https://guardiao-sobrio-app.vercel.app (Web / Vercel)  
**Documentação de referência:** https://github.com/vanzer80/guardiao-sobrio-docs  
**Destino:** Time de desenvolvedores — `vanzer80/guardiao-sobrio-app`

> **Metodologia:** Todos os achados foram verificados diretamente no app via browser (Claude in Chrome). Os itens foram cruzados com os arquivos-chave do docs repo: `app/07-regras-de-negocio.md`, `app/05-fluxos-e-telas.md`, `app/03-funcionalidades.md` e `protocolos/*.md`. Telas não ligadas à navegação principal foram acessadas via URL direta.

---

## Índice

1. [Resumo Executivo](#1-resumo-executivo)
2. [Tela Hoje (Home `/`)](#2-tela-hoje-home-)
3. [Tela Método `/metodo`](#3-tela-método-metodo)
4. [Protocolo SOS `/protocolo`](#4-protocolo-sos-protocolo)
5. [Tela Escudo `/escudo`](#5-tela-escudo-escudo)
6. [Tela Planos `/plans`](#6-tela-planos-plans)
7. [Tela Perfil `/perfil`](#7-tela-perfil-perfil)
8. [Navegação e Estrutura de Rotas](#8-navegação-e-estrutura-de-rotas)
9. [Onboarding e Registro](#9-onboarding-e-registro)
10. [Features Definidas Ausentes (Docs vs. App)](#10-features-definidas-ausentes-docs-vs-app)
11. [Bugs Previamente Corrigidos](#11-bugs-previamente-corrigidos)
12. [Resumo Consolidado](#12-resumo-consolidado)
13. [Prioridades de Correção](#13-prioridades-de-correção)
14. [Apêndice — Ambiente de Teste](#14-apêndice--ambiente-de-teste)

---

## 1. Resumo Executivo

A auditoria cobriu **todas as telas navegáveis**, **todos os fluxos funcionais** e cruzou os achados com os arquivos de documentação de referência (`guardiao-sobrio-docs`). Foram identificados:

- **1 bug crítico** — violação de LGPD (exclusão de conta inoperante)
- **1 bug de conformidade com App Store** — ausência de Sign in with Apple
- **1 bug de implementação incorreta** — Passo 3 do SOS implementa técnica diferente da especificada
- **7 telas/rotas 404** — funcionalidades prometidas e documentadas sem implementação
- **4 bugs funcionais** — DT6, DT7, DT8 + SOS sem botão flutuante
- **1 discrepância de navegação** — tab PROTOCOLO ausente; estrutura de tabs diverge da spec
- **9 avisos de UX e inconsistências de produto**

O núcleo funcional (contador de sobriedade, checklist diário, Protocolo SOS básico, paywall de planos) opera corretamente. Os problemas críticos envolvem conformidade legal, conformidade com App Store e features prometidas na tela de planos que não existem no app.

---

## 2. Tela Hoje (Home `/`)

### ✅ Funciona corretamente

| Elemento | Observação |
|---|---|
| Header "Olá, [Nome]" + data/dia da semana | Correto |
| Contador de sobriedade ("0 Dias construindo") | Correto para conta nova |
| "Próximo marco em 1 dia. Sem streak punitiva." | Correto — linguagem não punitiva conforme spec |
| Âncora do dia (frase inspiradora) | Presente e correta |
| Checklist diário — 5 itens | Itens: "Dormi bem", "Me hidratei", "Me alimentei bem", "Me movimentei", "Tive contato positivo" — compatíveis com os 5 definidos nos docs |
| Checklist — itens marcáveis, tachados após check | Funciona |
| Barra de progresso do checklist | Atualiza ao marcar itens |
| Reflexão do Dia (Prompt do Dia) | Exibe prompt do dia; textarea com mínimo 50 chars; "✓ salvo"; botão "Atualizar"; persistido entre recargas |
| Reflexão não excluível | Conforme spec: "editável mas não excluível" |
| Disclaimer no rodapé | "Este app não substitui psiquiatra, psicólogo ou grupos de apoio." — presente |

### ⚠️ Problemas

**AVISO-01 — Ícone de sino (notificações) decorativo**  
O sino no header não abre dropdown, modal nem navega. Elemento sem função visível ao usuário.  
**Ação:** Implementar painel de notificações ou remover o ícone até estar pronto.

**AVISO-02 — Card do contador de dias não é navegável**  
Clicar no card não faz nada. Sem acesso a histórico de marcos ou timeline.  
**Ação:** Tornar clicável (navegar para `/stats` ou tela de marcos quando implementada).

**AVISO-03 — Label "0/50 mín." ambíguo**  
"mín." pode ser lido como "mínimo de caracteres" ou "minutos".  
**Ação:** Substituir por "0/50 caracteres mín."

**AVISO-04 — Checklist: animação de conclusão não verificável na web**  
A spec define "confetti discreto + mensagem de reforço + botão 'Registrar no diário'" ao completar os 5 itens. Não foi possível verificar animação na versão web; o botão "Registrar no diário" não foi observado.  
**Ação:** Verificar implementação nativa (iOS/Android) e garantir conformidade com spec.

**AVISO-05 — Checklist: bloqueio após meia-noite não verificado**  
A spec define que o checklist do dia anterior deve ser bloqueado após meia-noite. Não testado.  
**Ação:** Testar em ambiente com controle de data/hora.

---

## 3. Tela Método `/metodo`

### ✅ Funciona corretamente

| Elemento | Observação |
|---|---|
| 3 Pilares rotativos (ESPELHO, TÁTICA, ESCUDO) | Dias corretos por pilar |
| Fundamento do dia expandível | Citação, descrição, ação mínima, âncora, "Aplicar hoje" |
| Fundamentos 1–3 acessíveis (free) | Conteúdo visível e interativo |
| Fundamentos 4–13 com 🔒 | Cadeado visível |
| Banner "10 fundamentos bloqueados" | Informativo, presente |
| Programa 30 Dias → paywall correto | Redireciona para `/programa30` |

### 🐛 Bug

**BUG-DT6 — Fundamentos 4–13: sem ação nem paywall ao clicar**  
Clicar em fundamentos bloqueados não abre modal de paywall, não exibe mensagem, não navega. Zero feedback ao usuário.  
**Causa raiz:** `metodo.tsx` usa verificação direta `plan === 'free'` em vez de `canAccessFeature()`. Usuários em período de trial também são bloqueados indevidamente.  
**Ação:** Substituir por `canAccessFeature('fundamentos_avancados')` e exibir modal de paywall/upgrade no `onPress` dos itens bloqueados.

### ⚠️ Avisos

**AVISO-06 — `/diario` retorna "Tela não encontrada"**  
O Diário de Prompts é acessível como prompt embutido na Home, mas a tela dedicada `/diario` (definida nos fluxos: "Tab Método → Diário de Prompts") retorna 404. O histórico de entradas anteriores não é acessível.  
**Ação:** Implementar `/diario` com histórico de entradas organizadas por data e pilar. (Ver também seção 10.)

---

## 4. Protocolo SOS `/protocolo`

### ✅ Funciona corretamente

| Elemento | Observação |
|---|---|
| Escala de fissura 1–10 | Interativa e funcional |
| CVV 188 + CAPS na tela inicial | Presentes com link "Ligar agora para o CVV" |
| Passo 1 PARE | "Interrompa o que está fazendo agora. Sente ou deite em um lugar seguro." — auto-avanço |
| Passo 2 RESPIRE | Timer 4s-4s-6s, ciclos 1/3 a 3/3, "Pular esta etapa" funcional |
| Disclaimer em todos os passos | "Este app não substitui profissional de saúde." |
| Passo 4 MOVIMENTO | 4 opções físicas |
| Passo 5 ESTRUTURA 72h | Tabela das 72h presente com 5 ações + CVV/CAPS |

### 🐛 Bugs

**BUG-SOS-01 — Passo 3 CONTATO implementado de forma diferente da spec**  
**Spec define:** "Ligue ou mande mensagem para 1 pessoa que sabe da sua sobriedade. Lista de contatos de confiança cadastrados. Botão [Ligar agora] [Mandar mensagem]."  
**App implementa:** Técnica de aterramento 5-4-3-2-1 sensorial ("Nomeie 5 coisas que você VEJA... 4 coisas que você SINTA... etc.")  
A técnica 5-4-3-2-1 é clinicamente válida, mas é uma escolha de produto diferente da especificada. Adicionalmente, **os contatos de confiança não existem no app** (ver BUG-PERFIL-02), então a spec original não poderia ser cumprida de qualquer forma.  
**Ação:** Decisão de produto — (a) manter a técnica 5-4-3-2-1 e atualizar a spec, ou (b) implementar contatos de confiança e restaurar o fluxo original de CONTATO.

**BUG-SOS-02 — Botão SOS não é flutuante (não está fixo em todas as telas)**  
**Spec define:** "Botão SOS (flutuante, todas as telas) → Tela de Emergência. Acessível em 2 toques de qualquer tela."  
**App implementa:** Botão SOS existe (aria-label: "Protocolo de Emergência SOS") mas com `position: relative` — não é um overlay fixo. Na versão web, o botão só aparece na tab bar ou na Home; não é visível em telas como `/metodo` ou `/perfil` enquanto o usuário rola a página.  
**Ação:** Converter para `position: fixed` com z-index alto, visível em todas as telas.

### ⚠️ Avisos

**AVISO-07 — Conclusão do protocolo: sem tela de encerramento**  
Após completar todos os 5 passos, o app retorna à tela inicial do protocolo sem tela de conclusão, mensagem de reforço ou confirmação de que o protocolo foi concluído.  
**Spec define:** "[Concluir] → Home com mensagem de reforço"  
**Ação:** Implementar tela/modal de conclusão com mensagem positiva + CTA para Home.

**AVISO-08 — Contador de usos do SOS ausente (free = 3/mês)**  
A tela de planos informa que o free tem 3 usos/mês, mas o app não exibe quantos usos restam. O usuário não sabe quando será bloqueado, e a spec define que ao atingir 3 usos deve exibir mensagem específica (não um bloqueio abrupto).  
**Ação:** Exibir "X de 3 usos este mês" para usuários free. Implementar mensagem amigável ao atingir o limite.

---

## 5. Tela Escudo `/escudo`

### ✅ Funciona corretamente

| Elemento | Observação |
|---|---|
| Mapa de Gatilhos — paywall (Essential/Guardião) | Paywall correto |
| Módulo Familiar — paywall (Guardião) | Paywall correto |
| "Ver planos" → `/plans` | Navegação correta |
| CVV 188 no rodapé | Presente |

### ⚠️ Avisos

**AVISO-09 — Escudo não inclui lista de protocolos adicionais**  
**Spec define para a Tab PROTOCOLO:** "Lista de Protocolos disponíveis", "(Pago) Protocolo Perímetro 24h", "(Pago) Protocolo Segurança e Respeito 24h". A tela Escudo existe no lugar da tab Protocolo, mas não lista nenhum protocolo adicional além do SOS.  
**Ação:** Ver BUG-NAV-01 e seção 10.

---

## 6. Tela Planos `/plans`

### ✅ Funciona corretamente

| Elemento | Observação |
|---|---|
| Banner trial 5 dias grátis sem cartão | Presente e visível |
| 3 planos: GRATUITO / ESSENTIAL / GUARDIÃO | Preços: Grátis / R$19,90/mês / R$39,90/mês |
| Matriz de features completa | Comparação visível |
| Footer com CVV, disclaimer | Presente |

### ⚠️ Avisos

**AVISO-10 — Contradição textual: "sem limites" vs. matriz de features**  
Texto promocional menciona "sem limites", mas a matriz mostra SOS = 3 usos no free.  
**Ação:** Alinhar todos os textos promocionais com a tabela de features real.

**AVISO-11 — Features listadas sem implementação**  
Diário de Prompts (7 free/∞ paid), Comunidade (Guardião), Histórico completo — todas estão na matriz mas não implementadas.  
**Ação:** Ver seção 10.

**BUG-DT8 — `/planos` → 404; `/plans` sem link na navegação principal**  
A rota em português `/planos` retorna 404. Não há botão/ícone para `/plans` na bottom tab bar.  
**Ação:** Adicionar redirect `/planos` → `/plans` e incluir acesso à tela de planos na navegação (ex: badge no perfil ou ícone na tab bar).

---

## 7. Tela Perfil `/perfil`

### ✅ Funciona corretamente

| Elemento | Observação |
|---|---|
| Avatar com inicial, nome editável inline | Funciona |
| Email, plano, foco, data sobriedade | Exibidos corretamente |
| "Ver estatísticas" → paywall (Essential/Guardião) | Correto |
| "Programa 30 Dias" → paywall (Guardião) | Correto |
| Toggle lembrete diário (ON/OFF) | Funcional |
| "Precisa de ajuda agora?" CVV + CAPS | Presente |
| "Sair da conta" | Funcional |

### 🐛 Bugs

**BUG-CRÍTICO-LGPD — "Excluir minha conta e todos os dados" não funciona**  
**Severidade: CRÍTICA**  
Ao clicar no botão, nenhum diálogo de confirmação é exibido e nenhuma ação ocorre.  
**Erro confirmado via JavaScript:**
```
TypeError: t.stopPropagation is not a function
```
O handler React falha ao ser disparado sem um SyntheticEvent válido.  
**Impacto legal:** A LGPD (Lei 13.709/2018, Art. 18, VI) exige que o titular possa solicitar a exclusão de dados a qualquer momento. O README do próprio app define "Exclusão de conta e dados em 2 toques (LGPD)" como Hard Rule. A Apple também exige exclusão de conta funcional para aprovação na App Store.  
**Ação:** Corrigir o event handler; implementar fluxo completo (confirmação → exclusão completa no Supabase → logout → redirect para onboarding).

**BUG-PERFIL-02 — Contatos de confiança ausentes no Perfil**  
**Spec define:** "Contatos de confianca" como seção do Perfil para cadastro de pessoas que o usuário pode acionar no SOS. Não existe nenhuma seção, botão ou tela de contatos no Perfil atual.  
**Impacto:** O Passo 3 (CONTATO) do SOS não pode funcionar conforme spec sem contatos cadastrados.  
**Ação:** Implementar seção "Contatos de confiança" no Perfil (CRUD de contatos) e usar no Passo 3 do SOS.

**BUG-PERFIL-03 — Configurações de Privacidade ausentes (PIN/biometria)**  
**Spec define (Feature Transversal):** "Biometria para abrir o app" e "PIN de acesso". Não há nenhuma opção de privacidade no Perfil. `/privacidade` → 404.  
**Ação:** Implementar tela de configurações de privacidade com PIN e biometria.

### ⚠️ Avisos

**AVISO-12 — Horário do lembrete fixo em 09:00 (não configurável)**  
Toggle ativa/desativa o lembrete, mas o horário é fixo. Spec define "horário customizável".  
**Ação:** Adicionar TimePicker junto ao toggle.

**AVISO-13 — Tela "Sobre" ausente**  
Spec define "Sobre (créditos, limite ético)" como item do Perfil. `/sobre` → 404. Nenhum acesso a esta tela.  
**Ação:** Implementar tela `/sobre` com créditos e Hard Rules éticas do app.

---

## 8. Navegação e Estrutura de Rotas

### Tabs de Navegação — Divergência com Spec

| Spec (`app/05-fluxos-e-telas.md`) | App (implementado) |
|---|---|
| Tab 1: HOJE | ✅ Hoje |
| Tab 2: PROTOCOLO | ❌ Ausente — substituído por "Escudo" |
| Tab 3: MÉTODO | ✅ Método |
| Tab 4: PERFIL | ✅ Perfil |

**BUG-NAV-01 — Tab PROTOCOLO ausente na navegação**  
**Spec define:** Tab 2 como "PROTOCOLO" com: Protocolo Emergência, Lista de Protocolos, (Pago) Protocolo Perímetro 24h, (Pago) Protocolo Segurança e Respeito.  
**App implementa:** Tab "Escudo" com apenas Mapa de Gatilhos e Módulo Familiar (ambos paywall). O SOS está em `/protocolo` mas não há uma tab dedicada.  
**Ação:** Decisão de arquitetura — (a) restaurar tab PROTOCOLO com lista de protocolos disponíveis, ou (b) mover o acesso ao SOS para a tab bar e atualizar a spec.

### Rotas 404 (telas esperadas, não implementadas)

| Rota | Status | Definida em |
|---|---|---|
| `/diario` | ❌ 404 | `app/05-fluxos-e-telas.md` §5, `app/03-funcionalidades.md` F2.1 |
| `/contatos` | ❌ 404 | `app/05-fluxos-e-telas.md` §7, fluxo do SOS §3 |
| `/privacidade` | ❌ 404 | `app/03-funcionalidades.md` (Features Transversais) |
| `/sobre` | ❌ 404 | `app/05-fluxos-e-telas.md` §1 (Tab 4 Perfil) |
| `/historico` | ❌ 404 | `app/07-regras-de-negocio.md` §2 (checklist histórico) |
| `/protocolo-perimetro` | ❌ 404 | `protocolos/protocolo-perimetro-24h.md`, `app/03-funcionalidades.md` F2.x (pago) |
| `/protocolo-seguranca` | ❌ 404 | `protocolos/seguranca-e-respeito-24h.md`, `app/03-funcionalidades.md` F2.x (pago) |
| `/planos` | ❌ 404 | Rota em português (deve redirecionar para `/plans`) |

---

## 9. Onboarding e Registro

### ✅ Funciona corretamente

| Etapa | Observação |
|---|---|
| Tela de boas-vindas + slides (3 etapas) | Funcional |
| Cadastro (email + senha) | Funcional; conta criada no Supabase |
| Setup pós-cadastro (nome, data sobriedade, foco) | Funcional; dados persistidos |
| Tela de ativação de trial | Exibida; "Ativar trial" navegável |
| Redirecionamento para Home após setup | Funcional |

### 🐛 Bug

**BUG-AUTH-01 — "Continuar com Apple" ausente no /register**  
**Spec define:** "[Continuar com Google] [Continuar com Apple]" na tela de cadastro.  
**App implementa:** Apenas email + senha.  
**Impacto:** Apple exige que qualquer app com login via terceiros (Google, Facebook) também ofereça Sign in with Apple. Ausência implica **risco de rejeição na App Store**.  
**Ação:** Implementar Sign in with Apple via Supabase Auth + `expo-apple-authentication`.

### ⚠️ Aviso

**AVISO-14 — Perguntas do onboarding não verificadas contra spec**  
A spec define 3 perguntas específicas antes do cadastro ("Qual é o seu objetivo hoje?", "Há quanto tempo você está nesta jornada?", "Qual é o seu maior desafio agora?"). Não foi possível re-auditar o onboarding com a conta já criada. Verificar se as perguntas implementadas correspondem exatamente às definidas.

---

## 10. Features Definidas Ausentes (Docs vs. App)

Funcionalidades presentes na documentação e/ou na tela de planos, mas não implementadas no app:

| Feature | Definida em | Status no App | Impacto |
|---|---|---|---|
| Diário de Prompts (tela dedicada `/diario`) | `app/03-funcionalidades.md` F2.1 | ❌ 404 | Feature prometida e cobrada nos planos inexistente |
| Histórico de entradas do diário | `app/07-regras-de-negocio.md` §4 | ❌ 404 | Free vê 7 dias, pago vê tudo — mas nenhum histórico existe |
| Contatos de confiança (`/contatos`) | `app/05-fluxos-e-telas.md` §3 (SOS) | ❌ 404 | Passo CONTATO do SOS depende disso |
| Protocolo Perímetro 24h (`/protocolo-perimetro`) | `protocolos/protocolo-perimetro-24h.md` | ❌ 404 | Feature paga listada no Tab PROTOCOLO |
| Protocolo Segurança e Respeito (`/protocolo-seguranca`) | `protocolos/seguranca-e-respeito-24h.md` | ❌ 404 | Feature paga listada no Tab PROTOCOLO |
| Configurações de Privacidade (`/privacidade`) | `app/03-funcionalidades.md` (Transversais) | ❌ 404 | PIN/biometria para abrir o app |
| Tela "Sobre" (`/sobre`) | `app/05-fluxos-e-telas.md` §1 | ❌ 404 | Créditos + Hard Rules éticas |
| Tela de Marco de Dias | `app/05-fluxos-e-telas.md` §6 | ❓ Não verificado | Modal especial ao atingir 7/14/30/60/90/180/365 dias |
| Comunidade O Escudo | `app/03-funcionalidades.md` F3.2 | ❌ Não implementada | Feature do plano Guardião inexistente |
| Lista de protocolos na Tab PROTOCOLO | `app/05-fluxos-e-telas.md` §1 | ❌ Tab ausente | Ver BUG-NAV-01 |
| Exportar estatísticas como PDF | `app/03-funcionalidades.md` F3.3 | ❓ Paywall — não verificado | Para compartilhar com terapeuta |
| Acessibilidade (fonte ajustável, VoiceOver, alto contraste) | `app/03-funcionalidades.md` (Transversais) | ❓ Não verificado | Requisito legal em mercados-alvo |
| Modo claro (tema light opcional) | `app/03-funcionalidades.md` (Transversais) | ❓ Não verificado | Spec: "Tema escuro padrão, claro opcional" |

---

## 11. Bugs Previamente Corrigidos

| ID | Descrição | Status |
|---|---|---|
| BUG-001 | `activate_trial()` com cláusula WHERE errada (`plan = 'free'`) | ✅ Corrigido — migration `20260620130000_fix_activate_trial_column_reference.sql` (commit `062d0ab`) |
| RLS-01 | Usuários anônimos podiam criar `family_connections` | ✅ Corrigido — Policy RESTRICTIVE aplicada no Supabase |

**Pendente de correção (identificado em sessão anterior):**

**BUG-DT7 — Alert genérico para erro `trial_already_used`**  
Quando `activate_trial()` lança `trial_already_used`, o frontend exibe Alert genérico de erro. Deve exibir: "Você já utilizou seu período de trial. Escolha um plano para continuar." com CTA para `/plans`.

---

## 12. Resumo Consolidado

### Bugs que requerem correção de código

| ID | Tela | Descrição | Severidade |
|---|---|---|---|
| BUG-CRÍTICO-LGPD | Perfil | "Excluir minha conta" inoperante — violação LGPD + App Store | **CRÍTICA** |
| BUG-AUTH-01 | Registro | Sign in with Apple ausente — risco de rejeição App Store | **ALTA** |
| BUG-SOS-01 | SOS Passo 3 | CONTATO implementa técnica diferente da spec; contatos de confiança inexistentes | **ALTA** |
| BUG-PERFIL-02 | Perfil | Contatos de confiança ausentes (sem tela, sem CRUD) | **ALTA** |
| BUG-NAV-01 | Navegação | Tab PROTOCOLO ausente; SOS sem acesso fixo na nav | **ALTA** |
| BUG-SOS-02 | Global | Botão SOS não é flutuante fixo em todas as telas | **MÉDIA** |
| BUG-DT6 | Método | Fundamentos 4–13 sem feedback/paywall ao clicar; trial não desbloqueia | **MÉDIA** |
| BUG-PERFIL-03 | Perfil | PIN/biometria ausentes (`/privacidade` → 404) | **MÉDIA** |
| BUG-DT8 | Planos | `/planos` → 404; `/plans` sem link na nav | **BAIXA** |
| BUG-DT7 | Global | Alert genérico para `trial_already_used` | **BAIXA** |

### Telas/rotas 404 (implementação ausente)

| Rota | Prioridade |
|---|---|
| `/diario` | Alta |
| `/contatos` | Alta |
| `/protocolo-perimetro` | Média |
| `/protocolo-seguranca` | Média |
| `/privacidade` | Média |
| `/sobre` | Baixa |
| `/historico` | Baixa |

### Avisos de UX e Produto

| ID | Tela | Descrição | Prioridade |
|---|---|---|---|
| AVISO-07 | SOS | Sem tela de conclusão após protocolo completo | Média |
| AVISO-08 | SOS | Contador de usos restantes do SOS ausente (free = 3/mês) | Média |
| AVISO-09 | Escudo | Sem lista de protocolos adicionais na aba Escudo | Alta |
| AVISO-10 | Planos | "Sem limites" contradiz matriz de features (SOS = 3/mês) | Média |
| AVISO-11 | Planos | Comunidade e Diário sem implementação mas listados no plano | Alta |
| AVISO-12 | Perfil | Horário do lembrete fixo em 09:00 (spec: customizável) | Baixa |
| AVISO-13 | Perfil | Tela "Sobre" ausente | Baixa |
| AVISO-14 | Onboarding | Perguntas do onboarding não verificadas contra spec | Média |
| AVISO-01 | Hoje | Sino de notificações sem função | Baixa |
| AVISO-02 | Hoje | Card do contador não navegável | Baixa |
| AVISO-03 | Hoje | Label "0/50 mín." ambíguo | Baixa |
| AVISO-04 | Hoje | Animação de conclusão do checklist não verificada | Média |
| AVISO-05 | Hoje | Bloqueio do checklist após meia-noite não verificado | Média |
| AVISO-06 | Método | `/diario` → 404 (sem histórico de prompts) | Alta |

---

## 13. Prioridades de Correção

### 🔴 Imediato — Bloqueadores Legais e de Loja

1. **BUG-CRÍTICO-LGPD** — Corrigir handler de exclusão de conta (LGPD obrigatório)
2. **BUG-AUTH-01** — Implementar Sign in with Apple

### 🟠 Alta Prioridade — Features Prometidas e Segurança

3. **BUG-PERFIL-02** — Implementar contatos de confiança (base para BUG-SOS-01)
4. **BUG-SOS-01** — Definir e implementar Passo 3 CONTATO com contatos cadastrados
5. **BUG-SOS-02** — Tornar botão SOS flutuante fixo em todas as telas
6. **BUG-NAV-01** — Resolver estrutura de navegação (Tab PROTOCOLO vs. Escudo)
7. **`/diario`** — Implementar tela do Diário de Prompts com histórico
8. **`/contatos`** — Implementar CRUD de contatos de confiança

### 🟡 Média Prioridade — Completude do Produto

9. **BUG-DT6** — Corrigir acesso em `metodo.tsx` (`canAccessFeature()` + paywall modal)
10. **BUG-PERFIL-03** — Implementar `/privacidade` (PIN + biometria)
11. **`/protocolo-perimetro` e `/protocolo-seguranca`** — Implementar protocolos adicionais pagos
12. **AVISO-07** — Tela de conclusão do SOS
13. **AVISO-08** — Contador de usos restantes do SOS
14. **BUG-DT8** — Redirect `/planos` → `/plans`; link de acesso na nav
15. **BUG-DT7** — Mensagem amigável para `trial_already_used`
16. **AVISO-14** — Verificar perguntas do onboarding contra spec

### 🟢 Baixa Prioridade — Polimento de UX

17. **AVISO-12** — TimePicker para horário do lembrete
18. **`/sobre`** — Tela de créditos e Hard Rules
19. **AVISO-01** — Implementar ou remover ícone de sino
20. **AVISO-02** — Tornar card do contador de dias clicável
21. **AVISO-03** — Corrigir label "0/50 mín."
22. **AVISO-04/05** — Verificar animação de conclusão do checklist e bloqueio após meia-noite

---

## 14. Apêndice — Ambiente de Teste

| Item | Valor |
|---|---|
| URL auditada | https://guardiao-sobrio-app.vercel.app |
| Conta de teste | audit.guardiao.2026@mailinator.com |
| Plano no teste | GRATUITO (free) |
| Foco configurado | Drogas |
| Data de sobriedade | 2026-06-20 |
| Documentação cruzada | `app/07-regras-de-negocio.md`, `app/05-fluxos-e-telas.md`, `app/03-funcionalidades.md`, `protocolos/*.md` |
| Stack | Expo Router + React Native Web + Supabase |
| Navegador | Chrome (via Claude in Chrome MCP) |
| Data da auditoria | 2026-06-20 |

---

*Relatório gerado por auditoria completa — app + documentação cruzada. Para dúvidas: suporte.vidafelizoficial@gmail.com*
