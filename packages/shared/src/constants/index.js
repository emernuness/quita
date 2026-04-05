"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INCOME_SOURCE_LABELS = exports.EXPENSE_CATEGORY_LABELS = exports.DEBT_CATEGORY_SEEDS = exports.EXPORT_EXPIRY_HOURS = exports.PAYMENT_UNDO_WINDOW_HOURS = exports.PREMIUM_PLAN_COOLDOWN_HOURS = exports.FREE_PLAN_GENERATIONS_PER_MONTH = exports.PREMIUM_PRICE = exports.FREE_DEBT_LIMIT = void 0;
exports.FREE_DEBT_LIMIT = 3;
exports.PREMIUM_PRICE = 9.9;
exports.FREE_PLAN_GENERATIONS_PER_MONTH = 2;
exports.PREMIUM_PLAN_COOLDOWN_HOURS = 1;
exports.PAYMENT_UNDO_WINDOW_HOURS = 24;
exports.EXPORT_EXPIRY_HOURS = 48;
exports.DEBT_CATEGORY_SEEDS = [
    { slug: "credit_card", name: "Cartão de crédito", icon: "credit-card" },
    { slug: "bank_loan", name: "Banco / Empréstimo", icon: "briefcase" },
    { slug: "overdue_bill", name: "Conta atrasada", icon: "alert-circle" },
    { slug: "housing", name: "Moradia", icon: "home" },
    { slug: "personal", name: "Pessoa conhecida", icon: "users" },
    { slug: "other", name: "Outra dívida", icon: "more-horizontal" },
];
exports.EXPENSE_CATEGORY_LABELS = {
    housing: "Moradia",
    bills: "Contas",
    food: "Alimentação",
    transport: "Transporte",
    telecom: "Internet e Celular",
    other: "Outros",
};
exports.INCOME_SOURCE_LABELS = {
    salary: "Salário",
    extra: "Bico / Extra",
    help: "Ajuda",
    other: "Outro",
};
//# sourceMappingURL=index.js.map