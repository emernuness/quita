# Quita — Fase 2 v2.1: Patch de Ajustes

> **Tipo:** patch incremental sobre `FASE_2_MODELAGEM_DE_DOMINIO_v2.md`
> **Data:** 16 de maio de 2026
> **Origem:** considerações operacionais do @product sobre cadastros
> **Status:** aprovado

---

## Sumário

Três ajustes pequenos, todos endereçando lacunas reais detectadas na auditoria operacional:

1. **`Debt`** ganha 2 campos: `installmentsPaid` e `installmentsOverdue` (granularidade de parcelas)
2. **`Income`** tem o enum de tipos clarificado: `IncomeType` → `IncomeFrequency` com semântica explícita
3. **UI/comunicação**: reforço de transparência sobre dados estimados (registrado para Fases 3 e 5)

**Impacto no schema:** +2 campos em `Debt`, 1 enum renomeado + estendido. Sem novas tabelas.

**Migrations afetadas:** uma nova migration `10`, isolada.

---

## Ajuste 1 — `Debt` ganha 2 campos

### Diff Prisma

```diff
model Debt {
  // ... campos existentes ...
  totalInstallments        Int?              @map("total_installments") @db.SmallInt
  currentInstallment       Int?              @map("current_installment") @db.SmallInt
+ installmentsPaid         Int?              @map("installments_paid") @db.SmallInt
+ installmentsOverdue      Int?              @default(0) @map("installments_overdue") @db.SmallInt
  daysOverdue              Int               @default(0) @map("days_overdue")
  // ... resto ...
}
```

### Distinção semântica entre os campos

| Campo | Significado | Exemplo |
|---|---|---|
| `totalInstallments` | Total contratado | 60 (parcelas do financiamento) |
| `currentInstallment` | Qual a parcela em foco/próxima | 25 (a 25ª está vencendo agora) |
| `installmentsPaid` | Quantas foram **efetivamente quitadas** | 22 (paguei 22; as 23 e 24 estão atrasadas) |
| `installmentsOverdue` | Quantas estão **em atraso** | 2 (23 e 24 não pagas) |
| `daysOverdue` | Há quantos dias a mais antiga está atrasada | 67 dias |

Para dívida não parcelada (`nature = recurring` ou `one_time`), os 4 primeiros ficam `null` ou `0`.

### Impacto no motor (Fase 3)

O `priority-engine` ganha um fator adicional: `installmentsOverdue * peso` pondera mais o risco quanto mais parcelas em atraso. Isso vai ser detalhado na Fase 3 com novo entry na tabela `ScoringWeight`:

```
factor_key: 'parcelas_em_atraso_normalizado'
weight: 12
isPositive: true
description: 'min(installmentsOverdue / 3, 1)'
```

---

## Ajuste 2 — `Income` clarifica tipos

### Diff Prisma

```diff
- enum IncomeType {
-   fixed
-   one_time
-   recurring
- }

+ enum IncomeFrequency {
+   recurring        // salário, aposentadoria — entra todo mês
+   installment      // indenização parcelada, 13º em 2x — N vezes em meses futuros
+   one_time         // bico avulso, presente, prêmio — uma única ocorrência
+   irregular        // freelas, comissões — entra, mas sem regularidade
+ }

model Income {
  // ...
- type                IncomeType
+ frequency           IncomeFrequency
  // ... mantém installments e installmentAmount para o caso 'installment'
}
```

### Mapeamento de migração

Como o MVP não tem usuários reais, a migration simplesmente:

```sql
UPDATE incomes
SET frequency = CASE
  WHEN type = 'fixed'     THEN 'recurring'::IncomeFrequency
  WHEN type = 'recurring' THEN 'recurring'::IncomeFrequency
  WHEN type = 'one_time'  THEN 'one_time'::IncomeFrequency
END;

ALTER TABLE incomes DROP COLUMN type;
DROP TYPE "IncomeType";
```

### Casos de uso cobertos

| Cenário do usuário | Frequency | Campos extras |
|---|---|---|
| Salário CLT mensal | `recurring` | `paymentDay`, `stabilityType=stable` |
| Aposentadoria | `recurring` | `paymentDay`, `stabilityType=stable` |
| Motorista de app | `recurring` | `stabilityType=variable`, `guaranteedAmount`, `upperBoundAmount` |
| 13º salário (em 2x: nov e dez) | `installment` | `installments=2`, `installmentAmount` |
| Indenização parcelada em 6x | `installment` | `installments=6`, `installmentAmount` |
| Restituição IR | `one_time` | sem extras |
| Bico de fim de semana ocasional | `irregular` | `historyMonths`, `confidenceLevel=low` |
| Freelance/comissão sem regularidade | `irregular` | `stabilityType=variable`, `confidenceLevel` |

### Schema Zod afetado

```typescript
// packages/shared/src/schemas/income.schema.ts

export const incomeInputSchema = z.object({
  name: z.string().min(1).max(255),
  amount: z.number().nonnegative(),
  frequency: z.enum(['recurring', 'installment', 'one_time', 'irregular']),
  dueDate: z.string().date().optional(),
  installments: z.number().int().min(1).max(60).optional(),
  installmentAmount: z.number().nonnegative().optional(),
  sourceCategory: z.enum(['salary', 'extra', 'help', 'other']).optional(),
  paymentDay: z.number().int().min(1).max(31).optional(),
  confidenceLevel: z.enum(['high', 'medium', 'low']).optional(),
  historyMonths: z.number().int().min(1).max(12).optional(),
  guaranteedAmount: z.number().nonnegative().optional(),
  upperBoundAmount: z.number().nonnegative().optional(),
  stabilityType: z.enum(['stable', 'variable', 'seasonal']).default('stable'),
})
.refine(
  (d) => d.frequency !== 'installment' || (d.installments && d.installmentAmount),
  { message: 'Para renda parcelada, informe quantas parcelas e o valor de cada uma.' },
)
.refine(
  (d) => !d.upperBoundAmount || !d.guaranteedAmount || d.upperBoundAmount >= d.guaranteedAmount,
  { message: 'O teto deve ser maior ou igual ao piso garantido.' },
);
```

---

## Ajuste 3 — Comunicação de transparência (UI)

Não é mudança de schema, é orientação para Fase 3 (motor) e Fase 5 (telas). Registro aqui para não esquecer.

### Regras de exibição

Toda recomendação ou número derivado de dado estimado precisa **mostrar visualmente** que é estimativa, com texto claro do **porquê**:

| Condição | Indicador visual | Texto |
|---|---|---|
| `Debt.dataConfidence != 'high'` | Ícone "i" cinza ao lado do valor | "Valor estimado — atualize para mais precisão" |
| `Debt.interestRateSource = 'market_reference'` | Subtítulo na tela de detalhe | "Juros baseados em média de mercado para essa categoria" |
| `Debt.lastVerifiedAt > 90 dias` | Banner amarelo no topo do detalhe | "Esses dados estão desatualizados há X dias — confira o valor atual" |
| `RecommendedAction.dataConfidence != 'high'` | Ícone "i" ao lado da ação | "Recomendação baseada em dados estimados" |
| `User.diagnosisLevel = 'minimal'` | Banner azul na home | "Diagnóstico inicial — refine seus dados para um plano mais preciso" |

### Frase-âncora da comunicação

> "O Quita trabalha com estimativas quando o dado real não está disponível. Quanto mais precisos os dados que você informa, mais precisa fica a recomendação."

Essa frase aparece em pelo menos um lugar visível por sessão (home ou primeira interação).

---

## Migration adicional

```
10. 20260610_clarify_income_frequency_and_debt_installments
    - Cria enum IncomeFrequency
    - Migra Income.type → Income.frequency com mapeamento
    - Remove enum IncomeType
    - Adiciona Debt.installmentsPaid e Debt.installmentsOverdue
    - Adiciona linha em ScoringWeight: 'parcelas_em_atraso_normalizado' com peso 12
```

**Total acumulado:** 10 migrations (era 9 na v2).

---

## Confirmação de cobertura dos pontos do @product

| Ponto levantado | Resolução |
|---|---|
| Status da dívida (em dia / atrasada) | `Debt.status` (existente) + `Debt.daysOverdue` + `Debt.installmentsOverdue` (novo) |
| Quantas parcelas atrasadas | `Debt.installmentsOverdue` (NOVO em v2.1) |
| Não pedir juros ao usuário | `InterestRateReference` + `interestRateSource` + fallback automático |
| Valor aproximado, claro pro usuário | `dataConfidence` + UI da seção "Ajuste 3" |
| Tipo de receita (recorrente / pontual / intervalada) | `IncomeFrequency` com 4 valores claros (NOVO em v2.1) |
| Dívida parcelada: quantas pagas, quantas atrasadas | `installmentsPaid` + `installmentsOverdue` (NOVOS em v2.1) |
| Cadastro simples, inteligente | Onboarding Crítico + Refinamento Progressivo + defaults por categoria (já previsto) |

Todos os pontos estão cobertos sem inflar o cadastro.

---

*Fim do patch v2.1.*
