export const FREE_DEBT_LIMIT = 3;
export const PREMIUM_PRICE = 9.9;
export const FREE_PLAN_GENERATIONS_PER_MONTH = 2;
export const PREMIUM_PLAN_COOLDOWN_HOURS = 1;
export const PAYMENT_UNDO_WINDOW_HOURS = 24;
export const EXPORT_EXPIRY_HOURS = 48;

export const DEBT_CATEGORY_SEEDS = [
	{ slug: "credit_card", name: "Cartão de crédito", icon: "credit-card" },
	{ slug: "bank_loan", name: "Banco / Empréstimo", icon: "landmark" },
	{ slug: "overdue_bill", name: "Conta atrasada", icon: "alert-circle" },
	{ slug: "housing", name: "Moradia", icon: "home" },
	{ slug: "personal", name: "Pessoa conhecida", icon: "users" },
	{ slug: "other", name: "Outra dívida", icon: "more-horizontal" },
] as const;

export const EXPENSE_CATEGORY_LABELS: Record<string, string> = {
	housing: "Moradia",
	bills: "Contas",
	food: "Alimentação",
	transport: "Transporte",
	telecom: "Internet e Celular",
	other: "Outros",
};

export const INCOME_SOURCE_LABELS: Record<string, string> = {
	salary: "Salário",
	extra: "Bico / Extra",
	help: "Ajuda",
	other: "Outro",
};
