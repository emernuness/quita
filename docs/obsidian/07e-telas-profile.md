---
title: 07e - Telas Perfil
tags: [mobile, telas, profile]
created: 2026-05-04
---

# 07e - Telas de Perfil

Stack interno em `apps/mobile/app/(tabs)/profile/_layout.tsx` — rotas: `index`, `notifications`, `security`, `discrete-mode`, `export-data`, `export-requested`. `headerShown: false` em todas.

## Profile (index)

- **Caminho:** `apps/mobile/app/(tabs)/profile/index.tsx`
- **Rota:** `/(tabs)/profile`
- **O que o usuário vê:**
  - Avatar circular com iniciais (`profile.avatarInitials` ou derivada de `displayName`), nome e telefone.
  - Seção **Configurações** com card de menu (5 itens):
    - Notificações → `/(tabs)/profile/notifications`
    - Segurança e biometria → `/(tabs)/profile/security`
    - Modo discreto → `/(tabs)/profile/discrete-mode`
    - Exportar meus dados → `/(tabs)/profile/export-data`
    - **Apagar minha conta** (danger, sem rota) → abre `Alert.alert` com confirmação destrutiva.
  - Botão **Sair** (border vermelha, ícone `log-out`).
  - **Premium card** (brand navy): badge "Premium", preço "R$ 9,90/mês", descrição e `Button` **Assinar agora** (no-op).
  - Disclaimer "QUITA v1.0 · Feito no Brasil…".
- **O que pode fazer:**
  - Tap em item de menu navega via `router.push(item.route)`.
  - "Apagar minha conta" abre `Alert.alert("Apagar minha conta", …, [Cancelar, Apagar destrutivo])` — handler vazio.
  - Botão **Sair** chama `useAuthStore.logout()` e `router.replace("/")`.
- **Estado local:** nenhum.
- **Chamadas de API:** `useProfile()` (query) → busca dados do perfil ([[04e-api-profile]]). `useAuthStore.logout` para encerrar sessão ([[05-stores]]).
- **Componentes:** [[06-componentes]] `Button`.

## Security

- **Caminho:** `apps/mobile/app/(tabs)/profile/security.tsx`
- **Rota:** `/(tabs)/profile/security`
- **O que o usuário vê:**
  - "Voltar", título "Segurança e biometria", subtítulo.
  - 2 toggles `Switch`:
    - "Desbloqueio com digital" (default `true`).
    - "Desbloqueio com rosto" (default `false`).
  - Linha clicável **Trocar senha** com chevron (handler `// TODO`).
  - **Info card** "Visibilidade da segurança" anunciando recurso futuro de último acesso, dispositivos conectados, alertas de login.
- **O que pode fazer:** alternar switches localmente; trocar senha é placeholder.
- **Estado local:** `fingerprint`, `faceUnlock` (`useState`).
- **Chamadas de API:** **nenhuma** — toggles são apenas UI local.
- **Componentes:** sem imports do design system.

## Notifications

- **Caminho:** `apps/mobile/app/(tabs)/profile/notifications.tsx`
- **Rota:** `/(tabs)/profile/notifications`
- **O que o usuário vê:**
  - "Voltar", título "Notificações", subtítulo "Escolha o que quer receber no celular."
  - 5 toggles `Switch` mapeados em `NOTIFICATION_SETTINGS`:
    - `dueDates` — Vencimento de contas (default true)
    - `weeklyProgress` — Progresso semanal (default true)
    - `paymentIncentive` — Incentivo no dia do pagamento (default true)
    - `riskAlert` — Alerta de risco no plano (default false)
    - `newsAndTips` — Novidades e dicas (default false)
  - Info card lembrando que "Notificações de vencimento são exclusivas para assinantes Premium."
- **O que pode fazer:** Toggle dispara `useUpdateNotificationPrefs.mutate({ [key]: !current })`. Erro mostra `Alert.alert("Erro", …)`. Switch fica disabled durante `isPending`.
- **Estado local:** nenhum — leitura via `useNotificationPrefs()`.
- **Chamadas de API:**
  - `useNotificationPrefs()` (query) → GET preferências em [[04e-api-profile]].
  - `useUpdateNotificationPrefs()` (mutation) → PATCH/PUT preferências.
- **Componentes:** sem imports do design system.

## Discrete Mode

- **Caminho:** `apps/mobile/app/(tabs)/profile/discrete-mode.tsx`
- **Rota:** `/(tabs)/profile/discrete-mode`
- **O que o usuário vê:**
  - "Voltar", título "Modo discreto", subtítulo.
  - **Preview card** mostrando como ficam os valores: `R$ •••••` quando ativo, `R$ 12.800,00` quando inativo, com link "Toque para revelar".
  - Toggle "Ativar modo discreto" / "Oculta todos os valores".
  - Info card "Quando usar".
- **O que pode fazer:** toggle dispara `useToggleDiscreteMode.mutate({ enabled: value })` ([[04e-api-profile]]). Em erro reverte estado local e mostra `Alert.alert`. Switch disabled durante `isPending`.
- **Estado local:** `enabled` (inicial vem de `useAuthStore().user.discreteMode`).
- **Chamadas de API:** `useToggleDiscreteMode` em [[04e-api-profile]].

## Export Data

- **Caminho:** `apps/mobile/app/(tabs)/profile/export-data.tsx`
- **Rota:** `/(tabs)/profile/export-data`
- **O que o usuário vê:**
  - "Voltar", título "Exportar meus dados", subtítulo.
  - 2 cartões clicáveis: **Relatório em PDF** e **Planilha CSV** (ambos com handler `// TODO`).
  - **Zona de perigo**: label vermelho, descrição, `Button variant="destructive"` **Excluir minha conta** (handler `// TODO`).
  - Disclaimer LGPD.
  - Info card "Como funciona a exportação".
- **O que pode fazer:** taps abrem placeholders; sem chamadas reais ainda.
- **Estado local:** nenhum.
- **Chamadas de API:** **nenhuma**.
- **Componentes:** [[06-componentes]] `Button`.

## Export Requested

- **Caminho:** `apps/mobile/app/(tabs)/profile/export-requested.tsx`
- **Rota:** `/(tabs)/profile/export-requested`
- **O que o usuário vê:**
  - Ícone `download` brand teal, título "Exportação solicitada", subtítulo.
  - Card com bullets `INFO_ITEMS`: formatos disponíveis, prazo, dados incluídos.
  - `Button` primário **Entendi** + secundário **Ver o que será exportado** — ambos chamam `router.back()`.
- **Estado local:** nenhum.
- **Chamadas de API:** **nenhuma** — tela puramente informativa (estado pós-solicitação).
- **Componentes:** [[06-componentes]] `Button`.

## Notas relacionadas

- [[07-telas-overview]]
- [[07a-telas-auth]]
- [[07b-telas-onboarding]]
- [[07c-telas-tabs]]
- [[07d-telas-financas]]
- [[07f-telas-modais]]
- [[04e-api-profile]]
- [[05-stores]]
- [[06-componentes]]
