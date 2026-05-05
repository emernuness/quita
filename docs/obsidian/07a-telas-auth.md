---
title: 07a - Telas Auth
tags: [mobile, telas, auth]
created: 2026-05-04
---

# 07a - Telas de Autenticação

Telas do grupo `(auth)` mais o `splash` e o `index` raiz que decidem o fluxo inicial.

## Index raiz (router gate)

- **Caminho:** `apps/mobile/app/index.tsx`
- **Rota:** `/`
- **O que faz:** Não renderiza UI propria. Lê `useAuthStore` e decide:
  - `isLoading` → `ActivityIndicator` em fundo `colors.background`.
  - `!isAuthenticated` → `<Redirect href="/splash" />`.
  - `!user.onboardingCompleted` → manda para o passo de onboarding correspondente a `user.onboardingStep` (0 → income, ≥1 → categories, ≥3 → expenses).
  - Caso contrário → `<Redirect href="/(tabs)" />`.
- **Estado:** somente leitura do store global [[05-stores]] (`useAuthStore`).
- **Navegação:** sempre redireciona, não acumula histórico.

## Splash

- **Caminho:** `apps/mobile/app/splash.tsx`
- **Rota:** `/splash`
- **O que o usuário vê:**
  - Carrossel de 5 imagens Unsplash com cross-fade animado (1400 ms fade, 4200 ms hold) usando `Animated.Value` e `Image.prefetch`.
  - Overlays com `LinearGradient` (verde-teal vertical + escurecimento horizontal) e `tealOverlay` rgba.
  - Logo `assets/brand/logo-04.png` centralizado, subtítulo "Saia das dívidas sem adiar. Monte seu plano com clareza."
  - `StatusBar` light.
- **O que o usuário pode fazer:**
  - Botão primário **Começar agora** → `router.push("/(auth)/register")`.
  - Link **Já tenho conta** → `router.push("/(auth)/login")`.
- **Estado local:** `useRef` com array de `Animated.Value` para opacidades, `activeIdx` ref, `useEffect` com `setInterval` que alterna o índice.
- **Componentes compartilhados:** Pressables nativos com tokens locais (`colors.accentGreen`, `radius.sm`). Não usa `Button` do design system.

## Login

- **Caminho:** `apps/mobile/app/(auth)/login.tsx`
- **Rota:** `/(auth)/login`
- **O que o usuário vê:**
  - Botão "Voltar" com seta.
  - Logo + subtítulo "Organize suas dívidas com segurança."
  - Título "Entrar na sua conta".
  - Campos `Input` ([[06-componentes]]): E-MAIL, SENHA.
  - Linha com checkbox **Lembrar de mim** + link **Esqueci minha senha**.
  - Divider "Ou entre com" + botão Google (mostra `Alert` "Em breve").
  - Botão **Entrar** ([[06-componentes]] `Button`).
  - Rodape: "Nao tem conta? Cadastre-se".
- **O que pode fazer:**
  - Submit valida via `validateWithZod(loginSchema, …)` ([[09-shared]]).
  - Em sucesso, persiste `rememberMe` e `rememberedEmail` em `expo-secure-store`. Se desmarcado, também limpa `accessToken`.
  - Em erro lança `Alert.alert("Erro ao entrar", …)`.
- **Estado local:** `email`, `password`, `rememberMe` (default `true`), `loading`, `errors`. `useEffect` carrega valores salvos no SecureStore na montagem.
- **Chamadas de API:** `useAuthStore.login(email, password)` → `POST /auth/login` em [[04a-api-auth]] (cookie / token salvo via store).
- **Stores/queries:** [[05-stores]] `useAuthStore.login`.
- **Navegação:**
  - Sucesso → `router.replace("/")` (gate raiz decide próxima tela).
  - "Esqueci minha senha" → `/(auth)/forgot-password`.
  - "Cadastre-se" → `/(auth)/register`.
  - Voltar → `router.back()`.

## Register

- **Caminho:** `apps/mobile/app/(auth)/register.tsx`
- **Rota:** `/(auth)/register`
- **O que o usuário vê:**
  - "Voltar", step label "Crie sua conta", título "Vamos começar com seus dados".
  - 5 `Input`: NOME COMPLETO, E-MAIL, CELULAR (com máscara `maskPhone`/`unmaskPhone`), CRIE UMA SENHA, CONFIRME A SENHA.
  - Botão Google (Alert "Em breve").
  - `Button` **Criar conta**.
  - Rodapé: "Já tem conta? Entrar".
- **O que pode fazer:**
  - `validate()` checa confirmação de senha + `validateWithZod(registerSchema, …)` ([[09-shared]]).
  - `useAuthStore.register(name, email, phone, password)` em [[05-stores]].
  - Em erro 409 → `Alert.alert("Conta já existe", …)` com botão "Fazer login" → `router.replace("/(auth)/login")`.
  - Outros erros → `Alert.alert("Erro ao criar conta", message)`.
- **Estado local:** `name`, `email`, `phone`, `password`, `confirmPassword`, `loading`, `errors`.
- **Chamadas de API:** `POST /auth/register` em [[04a-api-auth]] via `useAuthStore.register`. Payload usa email lowercase e phone sem máscara.
- **Componentes:** [[06-componentes]] `Input`, `Button`. Utilitários `maskPhone`, `unmaskPhone`, `validateWithZod`.
- **Navegação:** sucesso → `router.replace("/")` (gate vai para `(onboarding)/income`).

## Forgot Password

- **Caminho:** `apps/mobile/app/(auth)/forgot-password.tsx`
- **Rota:** `/(auth)/forgot-password`
- **O que o usuário vê:**
  - "Voltar", step label "Recuperação segura", indicador de 3 passos textual.
  - Título "Esqueceu a senha?" + descrição.
  - `Input` único TELEFONE OU E-MAIL.
  - Caixa de info explicando o porquê da confirmação.
  - `Button` **Enviar código** + botão secundário **Voltar ao login**.
- **O que pode fazer:**
  - Click em "Enviar código" valida com `forgotPasswordSchema` ([[09-shared]]). Se válido, `// TODO: call forgot password API` (não há chamada real implementada).
  - "Voltar ao login" → `router.push("/(auth)/login")`.
- **Estado local:** `contact`, `loading`, `errors`.
- **Chamadas de API:** ainda não conectada — placeholder `// TODO`.
- **Componentes:** [[06-componentes]] `Input`, `Button`.

## Notas relacionadas

- [[07-telas-overview]]
- [[07b-telas-onboarding]]
- [[07c-telas-tabs]]
- [[07d-telas-financas]]
- [[07e-telas-profile]]
- [[07f-telas-modais]]
- [[04a-api-auth]]
- [[05-stores]]
- [[06-componentes]]
- [[09-shared]]
