# QUITA — Mapeamento Completo: Banco de Dados, Entidades e Backend

> Documento gerado a partir da análise de **25 telas** do protótipo `prototipo.pen`
> Data: 2026-03-12

---

## 1. ENTIDADES DO BANCO DE DADOS

### 1.1 `users` — Usuários

| Campo | Tipo | Obrigatório | Origem (Tela) | Observação |
|-------|------|-------------|---------------|------------|
| `id` | UUID | PK | — | Auto-gerado |
| `name` | VARCHAR(255) | Sim | 03 — Cadastro | "NOME COMPLETO" |
| `email` | VARCHAR(255) UNIQUE | Sim | 03 — Cadastro | Login + recuperação |
| `phone` | VARCHAR(20) | Sim | 03 — Cadastro | "CELULAR" — usado para alertas |
| `password_hash` | VARCHAR(255) | Sim | 03 — Cadastro | "CRIE UMA SENHA" — hash bcrypt |
| `avatar_initials` | VARCHAR(5) | Não | 14 — Perfil | Gerado a partir do nome ("MS") |
| `google_id` | VARCHAR(255) | Não | 02/03 | Para login social Google |
| `biometric_fingerprint` | BOOLEAN | Não | 20 — Segurança | Toggle "Desbloqueio com digital" |
| `biometric_face` | BOOLEAN | Não | 20 — Segurança | Toggle "Desbloqueio com rosto" |
| `discrete_mode` | BOOLEAN | Não | 21 — Modo Discreto | Toggle "Ativar modo discreto" |
| `onboarding_step` | SMALLINT | Não | 03-08 | Passo atual do onboarding (1-4) |
| `onboarding_completed` | BOOLEAN | Não | 08 | true quando termina passo 4 |
| `plan_type` | ENUM('free','premium') | Sim | 14 — Perfil | Default: 'free', upgrade R$9,90/mês |
| `plan_expires_at` | TIMESTAMP | Não | 14 | Data expiração do Premium |
| `last_sync_at` | TIMESTAMP | Não | 14 — Perfil | "Última sincronização: hoje, 09:12" |
| `created_at` | TIMESTAMP | Sim | — | Auto-gerado |
| `updated_at` | TIMESTAMP | Sim | — | Auto-atualizado |
| `deleted_at` | TIMESTAMP | Não | 22 — Exportar | Soft delete (LGPD) |

---

### 1.2 `incomes` — Receitas / Rendas

| Campo | Tipo | Obrigatório | Origem (Tela) | Observação |
|-------|------|-------------|---------------|------------|
| `id` | UUID | PK | — | |
| `user_id` | UUID FK→users | Sim | — | |
| `name` | VARCHAR(255) | Sim | 17 — Nova Receita | "NOME DA RECEITA" (Ex: Salário, Bico, Freelance) |
| `amount` | DECIMAL(12,2) | Sim | 17 / 05 | Valor em reais |
| `type` | ENUM('fixed','one_time','recurring') | Sim | 17 | Chips: FIXA / PONTUAL / RECORRENTE |
| `due_date` | DATE | Não | 17 | "DATA DE VENCIMENTO" |
| `installments` | SMALLINT | Não | 17 | Parcelamento (ex: 10x) |
| `installment_amount` | DECIMAL(12,2) | Não | 17 | Valor de cada parcela |
| `source_category` | ENUM('salary','extra','help','other') | Não | 05 | Tela 05: Salário, Bico, Ajuda |
| `is_active` | BOOLEAN | Sim | — | Default true |
| `created_at` | TIMESTAMP | Sim | — | |
| `updated_at` | TIMESTAMP | Sim | — | |

---

### 1.3 `expenses` — Despesas Fixas

| Campo | Tipo | Obrigatório | Origem (Tela) | Observação |
|-------|------|-------------|---------------|------------|
| `id` | UUID | PK | — | |
| `user_id` | UUID FK→users | Sim | — | |
| `name` | VARCHAR(255) | Sim | 18 — Nova Despesa | "NOME DA DESPESA" (Ex: Aluguel, Luz, Mercado) |
| `amount` | DECIMAL(12,2) | Sim | 18 / 08 | Valor em reais |
| `type` | ENUM('fixed','one_time','recurring') | Sim | 18 | Chips: FIXA / PONTUAL / RECORRENTE |
| `category` | ENUM('housing','bills','food','transport','telecom','other') | Sim | 18 / 08 | Chips: MORADIA / CONTAS / ALIMENTAÇÃO / TRANSPORTE / INTERNET E CELULAR |
| `due_date` | DATE | Não | 18 | "DATA DE VENCIMENTO" |
| `installments` | SMALLINT | Não | 18 | Parcelamento opcional |
| `installment_amount` | DECIMAL(12,2) | Não | 18 | Valor parcela |
| `is_active` | BOOLEAN | Sim | — | Default true |
| `created_at` | TIMESTAMP | Sim | — | |
| `updated_at` | TIMESTAMP | Sim | — | |

> **Nota — Tela 08 (Onboarding):** Os campos do passo 4 (Aluguel, Luz/Água/Gás, Mercado, Transporte, Internet e Celular) são despesas pré-categorizadas que criam registros nesta tabela automaticamente.

---

### 1.4 `debt_categories` — Categorias de Dívida

| Campo | Tipo | Obrigatório | Origem (Tela) | Observação |
|-------|------|-------------|---------------|------------|
| `id` | UUID | PK | — | |
| `slug` | VARCHAR(50) UNIQUE | Sim | 06 | Identificador único |
| `name` | VARCHAR(100) | Sim | 06 | Nome display |
| `icon` | VARCHAR(50) | Sim | 06 | Nome do ícone Lucide |
| `created_at` | TIMESTAMP | Sim | — | |

**Dados seed (Tela 06 — Cadastro de Dívidas):**

| slug | name | icon |
|------|------|------|
| `credit_card` | Cartão de crédito | credit-card |
| `bank_loan` | Banco / Empréstimo | landmark |
| `overdue_bill` | Conta atrasada | alert-circle |
| `housing` | Moradia | home |
| `personal` | Pessoa conhecida | users |
| `other` | Outra dívida | more-horizontal |

---

### 1.5 `debts` — Dívidas

| Campo | Tipo | Obrigatório | Origem (Tela) | Observação |
|-------|------|-------------|---------------|------------|
| `id` | UUID | PK | — | |
| `user_id` | UUID FK→users | Sim | — | |
| `category_id` | UUID FK→debt_categories | Sim | 06/07 | Categoria selecionada no onboarding |
| `creditor` | VARCHAR(255) | Sim | 07 — Detalhe Dívida | "CREDOR" (Ex: Nubank) |
| `total_amount` | DECIMAL(12,2) | Sim | 07 | "VALOR TOTAL" |
| `amount_paid` | DECIMAL(12,2) | Sim | 15/16 | "Já pago" — atualizado a cada pagamento |
| `has_interest` | BOOLEAN | Não | 07 | "TEM JUROS OU MULTA?" |
| `due_date` | DATE | Não | 07 | "VENCIMENTO (SE SOUBER)" |
| `status` | ENUM('on_time','overdue','renegotiated','paid') | Sim | 07/15 | Situação da dívida |
| `overdue_months` | SMALLINT | Não | 15 | "Atrasada há X meses" |
| `total_installments` | SMALLINT | Não | 15 | Total de parcelas (ex: 10) |
| `current_installment` | SMALLINT | Não | 15 | Parcela atual (ex: 05) |
| `priority_order` | SMALLINT | Não | 13 — Plano | Ordem no plano de pagamento |
| `paid_at` | TIMESTAMP | Não | 16b/24 | Data da quitação |
| `interest_saved` | DECIMAL(12,2) | Não | 24 | "Economia em juros" (calculado) |
| `created_at` | TIMESTAMP | Sim | — | |
| `updated_at` | TIMESTAMP | Sim | — | |

---

### 1.6 `payments` — Pagamentos Registrados

| Campo | Tipo | Obrigatório | Origem (Tela) | Observação |
|-------|------|-------------|---------------|------------|
| `id` | UUID | PK | — | |
| `user_id` | UUID FK→users | Sim | — | |
| `debt_id` | UUID FK→debts | Sim | 16 | Dívida associada |
| `amount` | DECIMAL(12,2) | Sim | 16 | "QUANTO VOCÊ PAGOU?" |
| `payment_type` | ENUM('full','partial','renegotiated') | Sim | 16 | Opções: Valor total / Valor menor / Acordo |
| `receipt_url` | VARCHAR(500) | Não | 16b | "ANEXAR COMPROVANTE" |
| `can_undo_until` | TIMESTAMP | Não | 16b | "desfazer nas próximas 24 horas" |
| `undone` | BOOLEAN | Sim | 16b | Default false |
| `paid_at` | TIMESTAMP | Sim | 16 | Data do pagamento |
| `created_at` | TIMESTAMP | Sim | — | |

---

### 1.7 `payment_plan` — Plano de Pagamento (IA)

| Campo | Tipo | Obrigatório | Origem (Tela) | Observação |
|-------|------|-------------|---------------|------------|
| `id` | UUID | PK | — | |
| `user_id` | UUID FK→users | Sim | — | |
| `strategy` | ENUM('smallest_first','highest_interest','custom') | Sim | 13 — Plano | "Estratégia: Começar pelo menor" |
| `monthly_available` | DECIMAL(12,2) | Sim | 09/23 | "SOBRA PRA DÍVIDAS" (renda - despesas) |
| `total_debts_count` | SMALLINT | Sim | 09/24 | "5 no total" |
| `paid_debts_count` | SMALLINT | Sim | 09/24 | "2 de 5 dívidas quitadas" |
| `progress_percent` | DECIMAL(5,2) | Sim | 09 | 40% (barra de progresso) |
| `is_critical` | BOOLEAN | Sim | 23 | true quando despesas >= renda |
| `all_paid` | BOOLEAN | Sim | 25 | true quando todas quitadas (Modo Azul) |
| `generated_at` | TIMESTAMP | Sim | 13 | "atualizado há 2 horas" |
| `created_at` | TIMESTAMP | Sim | — | |
| `updated_at` | TIMESTAMP | Sim | — | |

---

### 1.8 `plan_timeline_items` — Itens da Linha do Tempo do Plano

| Campo | Tipo | Obrigatório | Origem (Tela) | Observação |
|-------|------|-------------|---------------|------------|
| `id` | UUID | PK | — | |
| `plan_id` | UUID FK→payment_plan | Sim | — | |
| `debt_id` | UUID FK→debts | Sim | 13 | Dívida associada |
| `order` | SMALLINT | Sim | 13 | Ordem na timeline |
| `suggested_amount` | DECIMAL(12,2) | Sim | 13 | Valor sugerido para pagar |
| `suggested_date` | DATE | Sim | 13 | Data sugerida |
| `status` | ENUM('pending','completed','skipped') | Sim | — | |
| `created_at` | TIMESTAMP | Sim | — | |

---

### 1.9 `ai_insights` — Sugestões da IA

| Campo | Tipo | Obrigatório | Origem (Tela) | Observação |
|-------|------|-------------|---------------|------------|
| `id` | UUID | PK | — | |
| `user_id` | UUID FK→users | Sim | — | |
| `debt_id` | UUID FK→debts | Não | 15 | Pode ser específica de uma dívida |
| `type` | ENUM('tip','action','warning','negotiation','expense_cut') | Sim | — | Tipo da sugestão |
| `title` | VARCHAR(255) | Não | 09/15/23 | Ex: "DICA DA IA", "SUGESTÃO DA IA" |
| `content` | TEXT | Sim | 09/15/23 | Conteúdo da sugestão |
| `action_label` | VARCHAR(100) | Não | 15 | Ex: "Ver acordo no Serasa" |
| `action_url` | VARCHAR(500) | Não | 15 | Link externo (ex: Serasa) |
| `impact_label` | VARCHAR(50) | Não | 09 | "Impacto alto" |
| `savings_amount` | DECIMAL(12,2) | Não | 15 | "R$ 480 em juros" |
| `is_read` | BOOLEAN | Sim | — | Default false |
| `created_at` | TIMESTAMP | Sim | — | |

---

### 1.10 `notification_preferences` — Preferências de Notificação

| Campo | Tipo | Obrigatório | Origem (Tela) | Observação |
|-------|------|-------------|---------------|------------|
| `id` | UUID | PK | — | |
| `user_id` | UUID FK→users UNIQUE | Sim | — | 1:1 com user |
| `due_dates` | BOOLEAN | Sim | 19 | "Vencimento de contas" (Premium) |
| `weekly_progress` | BOOLEAN | Sim | 19 | "Progresso semanal" |
| `payment_incentive` | BOOLEAN | Sim | 19 | "Incentivo no dia do pagamento" |
| `risk_alert` | BOOLEAN | Sim | 19 | "Alerta de risco no plano" |
| `news_and_tips` | BOOLEAN | Sim | 19 | "Novidades e dicas" |
| `created_at` | TIMESTAMP | Sim | — | |
| `updated_at` | TIMESTAMP | Sim | — | |

---

### 1.11 `data_exports` — Exportações de Dados

| Campo | Tipo | Obrigatório | Origem (Tela) | Observação |
|-------|------|-------------|---------------|------------|
| `id` | UUID | PK | — | |
| `user_id` | UUID FK→users | Sim | — | |
| `format` | ENUM('pdf','csv') | Sim | 22 | Relatório em PDF / Planilha CSV |
| `status` | ENUM('processing','ready','expired') | Sim | 22b | Status do arquivo |
| `file_url` | VARCHAR(500) | Não | 22b | URL para download |
| `requested_at` | TIMESTAMP | Sim | 22 | |
| `ready_at` | TIMESTAMP | Não | 22b | |
| `expires_at` | TIMESTAMP | Não | — | Expiração do link |

---

### 1.12 `user_journey_stats` — Estatísticas da Jornada (Tela 25)

| Campo | Tipo | Obrigatório | Origem (Tela) | Observação |
|-------|------|-------------|---------------|------------|
| `id` | UUID | PK | — | |
| `user_id` | UUID FK→users UNIQUE | Sim | — | 1:1 |
| `total_debts_cleared` | SMALLINT | Sim | 25 | "5 dívidas quitadas" |
| `journey_months` | SMALLINT | Sim | 25 | "8 meses de jornada" |
| `total_interest_saved` | DECIMAL(12,2) | Sim | 25 | "R$1.2k economia em juros" |
| `updated_at` | TIMESTAMP | Sim | — | |

---

## 2. DIAGRAMA DE RELACIONAMENTOS (ERD)

```
users (1) ─────────── (N) incomes
  │
  ├──────────────────── (N) expenses
  │
  ├──────────────────── (N) debts ──── (N:1) debt_categories
  │                       │
  │                       ├────────── (N) payments
  │                       │
  │                       └────────── (N) ai_insights
  │
  ├──────────────────── (1) payment_plan ── (N) plan_timeline_items
  │
  ├──────────────────── (1) notification_preferences
  │
  ├──────────────────── (1) user_journey_stats
  │
  ├──────────────────── (N) data_exports
  │
  └──────────────────── (N) ai_insights (globais, sem debt_id)
```

**Cardinalidades:**
- `users` 1:N `incomes` — Um usuário tem várias receitas
- `users` 1:N `expenses` — Um usuário tem várias despesas
- `users` 1:N `debts` — Um usuário tem várias dívidas
- `debt_categories` 1:N `debts` — Uma categoria tem várias dívidas
- `debts` 1:N `payments` — Uma dívida tem vários pagamentos
- `users` 1:1 `payment_plan` — Um plano ativo por vez
- `payment_plan` 1:N `plan_timeline_items` — Um plano tem vários itens
- `users` 1:1 `notification_preferences` — Preferências únicas
- `users` 1:1 `user_journey_stats` — Estatísticas únicas
- `users` 1:N `data_exports` — Várias exportações
- `users` 1:N `ai_insights` — Várias sugestões
- `debts` 1:N `ai_insights` — Sugestões por dívida

---

## 3. VALORES CALCULADOS (NÃO ARMAZENADOS)

Estes valores são exibidos nas telas mas devem ser **calculados em runtime**, não armazenados:

| Valor | Tela | Cálculo |
|-------|------|---------|
| Total de dívidas (R$) | 09 Home | `SUM(debts.total_amount - debts.amount_paid) WHERE status != 'paid'` |
| Contas em atraso | 09 Home | `COUNT(debts) WHERE status = 'overdue'` |
| Saldo do mês | 09 Home | `SUM(incomes.amount) - SUM(expenses.amount)` |
| Sobra pra dívidas | 09/11/23 | `SUM(incomes.amount) - SUM(expenses.amount)` |
| Entrou (mês) | 12 Histórico | `SUM(incomes.amount) WHERE month = X` |
| Saiu (mês) | 12 Histórico | `SUM(expenses.amount) WHERE month = X` |
| Progresso (%) | 09 Home | `paid_debts_count / total_debts_count * 100` |
| Situação crítica | 23 | `SUM(expenses) >= SUM(incomes)` |
| Modo Azul | 25 | `COUNT(debts WHERE status != 'paid') = 0` |

---

## 4. ENUMERAÇÕES (ENUMS)

```sql
-- Tipo de plano do usuário
CREATE TYPE plan_type AS ENUM ('free', 'premium');

-- Tipo de receita/despesa
CREATE TYPE financial_type AS ENUM ('fixed', 'one_time', 'recurring');

-- Categoria de despesa
CREATE TYPE expense_category AS ENUM ('housing', 'bills', 'food', 'transport', 'telecom', 'other');

-- Fonte de receita (onboarding)
CREATE TYPE income_source AS ENUM ('salary', 'extra', 'help', 'other');

-- Status da dívida
CREATE TYPE debt_status AS ENUM ('on_time', 'overdue', 'renegotiated', 'paid');

-- Tipo de pagamento
CREATE TYPE payment_type AS ENUM ('full', 'partial', 'renegotiated');

-- Estratégia do plano
CREATE TYPE plan_strategy AS ENUM ('smallest_first', 'highest_interest', 'custom');

-- Tipo de insight da IA
CREATE TYPE insight_type AS ENUM ('tip', 'action', 'warning', 'negotiation', 'expense_cut');

-- Formato de exportação
CREATE TYPE export_format AS ENUM ('pdf', 'csv');

-- Status da exportação
CREATE TYPE export_status AS ENUM ('processing', 'ready', 'expired');
```

---

## 5. MAPEAMENTO TELA → API ENDPOINTS

### 5.1 Autenticação (Telas 01-04)

| Método | Endpoint | Tela | Descrição |
|--------|----------|------|-----------|
| POST | `/auth/register` | 03 | Criar conta (name, email, phone, password) |
| POST | `/auth/login` | 02 | Login (email, password) |
| POST | `/auth/google` | 02/03 | Login/cadastro com Google |
| POST | `/auth/forgot-password` | 04 | Enviar código de recuperação |
| POST | `/auth/reset-password` | 04 | Resetar senha com código |
| POST | `/auth/refresh` | — | Renovar token JWT |

### 5.2 Onboarding (Telas 05-08)

| Método | Endpoint | Tela | Descrição |
|--------|----------|------|-----------|
| PUT | `/onboarding/income` | 05 | Salvar renda mensal (salary, extra, help) |
| PUT | `/onboarding/debt-categories` | 06 | Selecionar categorias de dívida |
| POST | `/onboarding/debts` | 07 | Adicionar dívida detalhada |
| PUT | `/onboarding/expenses` | 08 | Salvar despesas fixas do onboarding |
| POST | `/onboarding/complete` | 08 | Finalizar onboarding → gera plano |

### 5.3 Dashboard / Home (Tela 09)

| Método | Endpoint | Tela | Descrição |
|--------|----------|------|-----------|
| GET | `/dashboard` | 09 | Retorna resumo: total dívidas, saldo mês, sobra, progresso, ação recomendada |
| GET | `/dashboard/recommended-action` | 09 | Ação recomendada pela IA |

### 5.4 Dívidas (Telas 10, 15)

| Método | Endpoint | Tela | Descrição |
|--------|----------|------|-----------|
| GET | `/debts` | 10 | Listar dívidas (filtro: ?status=overdue) |
| GET | `/debts/:id` | 15 | Detalhe da dívida + dica da IA |
| POST | `/debts` | — | Criar nova dívida (pós-onboarding) |
| PUT | `/debts/:id` | 15 | Editar dívida |
| DELETE | `/debts/:id` | — | Remover dívida |

### 5.5 Pagamentos (Telas 16, 16b)

| Método | Endpoint | Tela | Descrição |
|--------|----------|------|-----------|
| POST | `/debts/:id/payments` | 16 | Registrar pagamento (amount, type) |
| POST | `/payments/:id/undo` | 16b | Desfazer pagamento (24h) |
| POST | `/payments/:id/receipt` | 16b | Anexar comprovante (upload) |

### 5.6 Receitas (Tela 17)

| Método | Endpoint | Tela | Descrição |
|--------|----------|------|-----------|
| GET | `/incomes` | 11 | Listar receitas |
| POST | `/incomes` | 17 | Criar receita |
| PUT | `/incomes/:id` | 11 | Editar receita |
| DELETE | `/incomes/:id` | — | Remover receita |

### 5.7 Despesas (Tela 18)

| Método | Endpoint | Tela | Descrição |
|--------|----------|------|-----------|
| GET | `/expenses` | 11 | Listar despesas |
| POST | `/expenses` | 18 | Criar despesa |
| PUT | `/expenses/:id` | 11 | Editar despesa |
| DELETE | `/expenses/:id` | — | Remover despesa |

### 5.8 Finanças / Extrato / Histórico (Telas 11, 12, 12b)

| Método | Endpoint | Tela | Descrição |
|--------|----------|------|-----------|
| GET | `/finances/summary` | 11 | Resumo: receitas, despesas, sobra |
| GET | `/finances/history?month=2024-11` | 12 | Histórico mensal: entrou, saiu, sobrou |
| GET | `/finances/charts` | 12b | Dados para gráficos (despesas por categoria, evolução dívidas) |

### 5.9 Plano de Pagamento (Tela 13)

| Método | Endpoint | Tela | Descrição |
|--------|----------|------|-----------|
| GET | `/plan` | 13 | Plano atual com timeline |
| POST | `/plan/generate` | 08/13 | Gerar/recalcular plano (IA) |
| PUT | `/plan/strategy` | 13 | Alterar estratégia |

### 5.10 IA / Insights (Telas 09, 15, 23)

| Método | Endpoint | Tela | Descrição |
|--------|----------|------|-----------|
| GET | `/insights` | 09/15 | Listar insights ativos |
| GET | `/insights/debt/:id` | 15 | Insight específico da dívida |
| PUT | `/insights/:id/read` | — | Marcar como lido |
| GET | `/insights/critical-check` | 23 | Verificar situação crítica |
| GET | `/insights/expense-cuts` | 23 | Sugestões de corte de despesas |

### 5.11 Perfil / Configurações (Telas 14, 19, 20, 21)

| Método | Endpoint | Tela | Descrição |
|--------|----------|------|-----------|
| GET | `/profile` | 14 | Dados do perfil |
| PUT | `/profile` | 14 | Atualizar nome, telefone |
| PUT | `/profile/password` | 20 | Trocar senha |
| GET | `/profile/notifications` | 19 | Preferências de notificação |
| PUT | `/profile/notifications` | 19 | Atualizar preferências |
| PUT | `/profile/security` | 20 | Biometria (digital, rosto) |
| PUT | `/profile/discrete-mode` | 21 | Ativar/desativar modo discreto |

### 5.12 Exportação / LGPD (Telas 22, 22b)

| Método | Endpoint | Tela | Descrição |
|--------|----------|------|-----------|
| POST | `/exports` | 22 | Solicitar exportação (format: pdf/csv) |
| GET | `/exports/:id` | 22b | Status e download da exportação |
| DELETE | `/account` | 22 | Excluir conta (LGPD) |

### 5.13 Jornada / Celebração (Telas 24, 25)

| Método | Endpoint | Tela | Descrição |
|--------|----------|------|-----------|
| GET | `/journey/stats` | 25 | Estatísticas da jornada |
| GET | `/journey/celebration/:debtId` | 24 | Dados da celebração de quitação |
| POST | `/journey/share` | 24 | Compartilhar conquista |

### 5.14 Assinatura Premium (Tela 14)

| Método | Endpoint | Tela | Descrição |
|--------|----------|------|-----------|
| POST | `/subscription/checkout` | 14 | Iniciar assinatura Premium |
| GET | `/subscription` | 14 | Status da assinatura |
| DELETE | `/subscription` | — | Cancelar assinatura |

---

## 6. FUNCIONALIDADES DO BACKEND POR MÓDULO

### 6.1 Módulo de Autenticação
- Registro com email/senha + validação de campos
- Login com JWT (access + refresh tokens)
- OAuth2 com Google
- Recuperação de senha via email/SMS (código)
- Hash de senha com bcrypt
- Rate limiting em endpoints de auth

### 6.2 Módulo de Onboarding
- Fluxo sequencial de 4 passos com estado persistido
- Passo 1: Criar conta (users)
- Passo 2: Renda mensal → cria 3 registros em `incomes` (salary, extra, help)
- Passo 3: Seleção de categorias → salva no contexto
- Passo 4: Despesas fixas → cria 5 registros em `expenses`
- Ao completar: dispara geração do plano pela IA

### 6.3 Módulo Financeiro
- CRUD de receitas e despesas
- Cálculo automático de parcelas quando parcelamento ativado
- Cálculo de saldo mensal (receitas - despesas)
- Histórico mensal com agregação
- Dados para gráficos (despesas por categoria, evolução temporal)

### 6.4 Módulo de Dívidas
- CRUD de dívidas com categorização
- Registro de pagamentos (total, parcial, renegociado)
- Upload de comprovante (S3/Supabase Storage)
- Desfazer pagamento dentro de 24h
- Atualização automática de `amount_paid` e `status`
- Detecção automática de atraso (cron job)

### 6.5 Módulo de IA / Plano
- **Geração de plano de pagamento** com base em:
  - Renda disponível (receitas - despesas)
  - Lista de dívidas (valor, juros, atraso)
  - Estratégia selecionada (menor primeiro, maior juros primeiro)
- **Insights contextuais:**
  - Dica de economia em juros (por dívida)
  - Sugestão de negociação (links externos como Serasa)
  - Ação recomendada na Home
  - Alertas de situação crítica
  - Sugestões de corte de despesas
- **Recálculo automático** após cada pagamento
- **Detecção de situação crítica** (despesas >= renda)
- **Celebração** quando dívida é quitada

### 6.6 Módulo de Notificações
- Push notifications configuráveis por tipo
- Alertas de vencimento (Premium only)
- Progresso semanal
- Incentivo no dia do pagamento
- Alerta de risco no plano
- Novidades e dicas

### 6.7 Módulo de Segurança / Privacidade
- Biometria (flag no perfil, implementação no app)
- Modo discreto (flag que oculta valores no frontend)
- Exportação de dados (LGPD) com geração async de PDF/CSV
- Exclusão de conta com soft delete e prazo legal de retenção
- Backup e sincronização

### 6.8 Módulo de Assinatura
- Integração com gateway de pagamento (Stripe/RevenueCat)
- Plano free vs Premium (R$9,90/mês)
- Features Premium: alertas de vencimento, chat com IA, sugestões de acordo
- Gerenciamento de assinatura (criar, verificar, cancelar)

---

## 7. JOBS ASSÍNCRONOS / CRON

| Job | Frequência | Descrição |
|-----|-----------|-----------|
| `check-overdue-debts` | Diário | Atualiza status de dívidas vencidas |
| `generate-weekly-progress` | Semanal | Calcula e envia progresso semanal |
| `send-due-date-alerts` | Diário | Envia alerta de vencimento (Premium) |
| `process-exports` | Sob demanda | Gera PDF/CSV de exportação |
| `expire-exports` | Diário | Remove exportações expiradas |
| `cleanup-undone-payments` | Diário | Limpa pagamentos desfeitos > 24h |
| `recalculate-plans` | Sob evento | Recalcula plano após mudança financeira |
| `detect-critical-state` | Diário | Verifica se despesas >= renda |

---

## 8. ÍNDICES RECOMENDADOS

```sql
-- Busca de dívidas por usuário e status
CREATE INDEX idx_debts_user_status ON debts(user_id, status);

-- Busca de pagamentos por dívida
CREATE INDEX idx_payments_debt ON payments(debt_id);

-- Busca de receitas/despesas por usuário e mês
CREATE INDEX idx_incomes_user ON incomes(user_id, is_active);
CREATE INDEX idx_expenses_user ON expenses(user_id, is_active);

-- Busca de insights não lidos
CREATE INDEX idx_insights_user_unread ON ai_insights(user_id, is_read) WHERE is_read = false;

-- Plano ativo por usuário
CREATE INDEX idx_plan_user ON payment_plan(user_id);

-- Exportações por usuário
CREATE INDEX idx_exports_user ON data_exports(user_id, status);
```

---

## 9. STACK RECOMENDADA

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| **Backend** | NestJS (TypeScript) | Modular, type-safe, bom para API REST |
| **Banco de Dados** | PostgreSQL (Supabase) | Relacional, JSONB para dados flexíveis, RLS |
| **ORM** | Prisma | Type-safe, migrations, bom DX |
| **Auth** | Supabase Auth + JWT | Social login, recuperação de senha |
| **Storage** | Supabase Storage | Upload de comprovantes |
| **Queue/Jobs** | BullMQ + Redis | Jobs assíncronos (exportação, plano) |
| **Push Notifications** | Expo Notifications | Integração nativa com React Native |
| **Pagamentos** | Stripe / RevenueCat | Assinatura Premium |
| **IA** | Claude API (Anthropic) | Geração de planos e insights |
| **Validação** | Zod | Schema validation em runtime |
| **Cache** | Redis | Cache de dashboard e plano |

---

## 10. RESUMO QUANTITATIVO

| Métrica | Quantidade |
|---------|-----------|
| **Tabelas** | 12 |
| **Campos totais** | ~120 |
| **Enums** | 11 |
| **Endpoints API** | ~45 |
| **Jobs assíncronos** | 8 |
| **Módulos backend** | 8 |
| **Telas mapeadas** | 25 |
