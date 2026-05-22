/**
 * Seed das tabelas de referência do QUITA MVP v3.
 *
 * Cobre 5 tabelas de referência fundamentais para o motor operar:
 * - DebtCategory (12 categorias com classes de risco e flags default)
 * - RegionalMinimumVital (placeholder nacional + 5 estados maiores)
 * - InterestRateReference (faixas conservadoras por categoria — BCB SGS substitui em prod via cron)
 * - SupportChannel (4 canais federais)
 * - ScoringWeight (10 fatores do priority-engine + 1 da Fase 2 v2.1)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEBT_CATEGORIES = [
	{
		slug: "essential_arrears",
		name: "Atrasos em essenciais",
		icon: "alert-triangle",
		defaultRiskClass: "critical" as const,
		affectsSurvivalDefault: true,
		affectsIncomeDefault: true,
		hasLegalRiskDefault: false,
		displayOrder: 1,
	},
	{
		slug: "mortgage",
		name: "Financiamento imobiliário",
		icon: "home",
		defaultRiskClass: "critical" as const,
		affectsSurvivalDefault: true,
		affectsIncomeDefault: false,
		hasLegalRiskDefault: true,
		displayOrder: 2,
	},
	{
		slug: "vehicle_financing",
		name: "Financiamento de veículo",
		icon: "truck",
		defaultRiskClass: "high" as const,
		affectsSurvivalDefault: false,
		affectsIncomeDefault: false,
		hasLegalRiskDefault: true,
		displayOrder: 3,
	},
	{
		slug: "legal_debt",
		name: "Pensão / Multa / Dívida judicial",
		icon: "gavel",
		defaultRiskClass: "critical" as const,
		affectsSurvivalDefault: false,
		affectsIncomeDefault: true,
		hasLegalRiskDefault: true,
		displayOrder: 4,
	},
	{
		slug: "credit_card",
		name: "Cartão de crédito",
		icon: "credit-card",
		defaultRiskClass: "high" as const,
		affectsSurvivalDefault: false,
		affectsIncomeDefault: false,
		hasLegalRiskDefault: false,
		displayOrder: 5,
	},
	{
		slug: "overdraft",
		name: "Cheque especial",
		icon: "minus-circle",
		defaultRiskClass: "high" as const,
		affectsSurvivalDefault: false,
		affectsIncomeDefault: false,
		hasLegalRiskDefault: false,
		displayOrder: 6,
	},
	{
		slug: "payroll_loan",
		name: "Empréstimo consignado",
		icon: "briefcase",
		defaultRiskClass: "medium" as const,
		affectsSurvivalDefault: false,
		affectsIncomeDefault: true,
		hasLegalRiskDefault: false,
		displayOrder: 7,
	},
	{
		slug: "personal_loan",
		name: "Empréstimo pessoal",
		icon: "dollar-sign",
		defaultRiskClass: "medium" as const,
		affectsSurvivalDefault: false,
		affectsIncomeDefault: false,
		hasLegalRiskDefault: false,
		displayOrder: 8,
	},
	{
		slug: "negotiated_old",
		name: "Acordo antigo / Negativado",
		icon: "archive",
		defaultRiskClass: "low" as const,
		affectsSurvivalDefault: false,
		affectsIncomeDefault: false,
		hasLegalRiskDefault: false,
		displayOrder: 9,
	},
	{
		slug: "informal_debt",
		name: "Família / Amigos",
		icon: "users",
		defaultRiskClass: "low" as const,
		affectsSurvivalDefault: false,
		affectsIncomeDefault: false,
		hasLegalRiskDefault: false,
		displayOrder: 10,
	},
	{
		slug: "overdue_bill",
		name: "Conta atrasada",
		icon: "alert-circle",
		defaultRiskClass: "high" as const,
		affectsSurvivalDefault: true,
		affectsIncomeDefault: false,
		hasLegalRiskDefault: false,
		displayOrder: 11,
	},
	{
		slug: "other",
		name: "Outra dívida",
		icon: "more-horizontal",
		defaultRiskClass: "medium" as const,
		affectsSurvivalDefault: false,
		affectsIncomeDefault: false,
		hasLegalRiskDefault: false,
		displayOrder: 99,
	},
];

const REGIONAL_MIN_VITAL = [
	{
		stateCode: "BR",
		regionType: "metro" as const,
		baseAmountSingle: 1320,
		basePerDependent: 400,
		source: "salario_minimo_federal_2024",
	},
	{
		stateCode: "SP",
		regionType: "capital" as const,
		baseAmountSingle: 1900,
		basePerDependent: 550,
		source: "dieese_sp_2024",
	},
	{
		stateCode: "RJ",
		regionType: "capital" as const,
		baseAmountSingle: 1750,
		basePerDependent: 500,
		source: "dieese_rj_2024",
	},
	{
		stateCode: "MG",
		regionType: "capital" as const,
		baseAmountSingle: 1500,
		basePerDependent: 450,
		source: "dieese_mg_2024",
	},
	{
		stateCode: "RS",
		regionType: "capital" as const,
		baseAmountSingle: 1550,
		basePerDependent: 450,
		source: "dieese_rs_2024",
	},
	{
		stateCode: "DF",
		regionType: "capital" as const,
		baseAmountSingle: 1800,
		basePerDependent: 500,
		source: "dieese_df_2024",
	},
];

const INTEREST_RATE_REFS = [
	{
		debtCategorySlug: "credit_card",
		monthlyRateMin: 0.1,
		monthlyRateMax: 0.16,
		monthlyRateMedian: 0.13,
	},
	{
		debtCategorySlug: "overdraft",
		monthlyRateMin: 0.11,
		monthlyRateMax: 0.17,
		monthlyRateMedian: 0.14,
	},
	{
		debtCategorySlug: "personal_loan",
		monthlyRateMin: 0.04,
		monthlyRateMax: 0.09,
		monthlyRateMedian: 0.065,
	},
	{
		debtCategorySlug: "payroll_loan",
		monthlyRateMin: 0.015,
		monthlyRateMax: 0.025,
		monthlyRateMedian: 0.02,
	},
	{
		debtCategorySlug: "vehicle_financing",
		monthlyRateMin: 0.02,
		monthlyRateMax: 0.035,
		monthlyRateMedian: 0.027,
	},
	{
		debtCategorySlug: "mortgage",
		monthlyRateMin: 0.008,
		monthlyRateMax: 0.012,
		monthlyRateMedian: 0.01,
	},
];

const SUPPORT_CHANNELS = [
	{
		slug: "consumidor_gov_br",
		name: "Consumidor.gov.br",
		channelType: "federal_gov" as const,
		scope: "federal" as const,
		url: "https://consumidor.gov.br",
		description:
			"Plataforma oficial do governo federal para mediação de conflitos com empresas cadastradas.",
		displayOrder: 1,
	},
	{
		slug: "procon_federal",
		name: "PROCON (Senacon)",
		channelType: "procon" as const,
		scope: "federal" as const,
		phone: "151",
		url: "https://www.gov.br/mj/pt-br/assuntos/seus-direitos/consumidor",
		description: "Defesa do consumidor — atendimento estadual via 151 ou unidade local.",
		displayOrder: 2,
	},
	{
		slug: "mutirao_renegociacao_febraban",
		name: "Mutirão de renegociação (Febraban)",
		channelType: "bank_mediation" as const,
		scope: "federal" as const,
		url: "https://www.febraban.org.br/",
		description: "Renegociação coletiva com bancos em mutirões periódicos.",
		displayOrder: 3,
	},
	{
		slug: "serasa_limpa_nome",
		name: "Serasa Limpa Nome",
		channelType: "serasa" as const,
		scope: "federal" as const,
		url: "https://www.serasa.com.br/limpa-nome-online/",
		description: "Renegociação com descontos para dívidas registradas na Serasa.",
		displayOrder: 4,
	},
];

const SCORING_WEIGHTS = [
	{
		factorKey: "risco_moradia",
		weight: 30,
		isPositive: true,
		description: "Divida pode causar perda da moradia",
	},
	{
		factorKey: "risco_renda",
		weight: 25,
		isPositive: true,
		description: "Divida pode causar perda da fonte de renda",
	},
	{
		factorKey: "risco_legal",
		weight: 25,
		isPositive: true,
		description: "Divida tem risco de acao judicial",
	},
	{
		factorKey: "risco_servico_essencial",
		weight: 20,
		isPositive: true,
		description: "Divida vincula a servico essencial",
	},
	{
		factorKey: "juros_mensal_normalizado",
		weight: 15,
		isPositive: true,
		description: "Juros mensais (cap em 15% a.m.)",
	},
	{
		factorKey: "dias_atraso_normalizado",
		weight: 10,
		isPositive: true,
		description: "Dias em atraso (cap em 90)",
	},
	{
		factorKey: "parcelas_em_atraso_normalizado",
		weight: 12,
		isPositive: true,
		description: "Parcelas em atraso (cap em 3)",
	},
	{
		factorKey: "desconto_disponivel_sustentavel",
		weight: 10,
		isPositive: true,
		description: "Acordo com desconto sustentavel",
	},
	{
		factorKey: "valor_pequeno_quitavel",
		weight: 8,
		isPositive: true,
		description: "Divida cabe em ate 2x a capacidade",
	},
	{
		factorKey: "parcela_insustentavel",
		weight: 30,
		isPositive: false,
		description: "Parcela compromete > 30% da capacidade",
	},
	{
		factorKey: "acordo_sem_folga",
		weight: 20,
		isPositive: false,
		description: "Parcela do acordo > 50% da capacidade",
	},
];

const REFERENCE_DATE = new Date(2024, 0, 1);

async function main() {
	console.log("Seeding QUITA MVP v3 reference tables...");

	for (const cat of DEBT_CATEGORIES) {
		await prisma.debtCategory.upsert({
			where: { slug: cat.slug },
			update: {
				name: cat.name,
				icon: cat.icon,
				defaultRiskClass: cat.defaultRiskClass,
				affectsSurvivalDefault: cat.affectsSurvivalDefault,
				affectsIncomeDefault: cat.affectsIncomeDefault,
				hasLegalRiskDefault: cat.hasLegalRiskDefault,
				displayOrder: cat.displayOrder,
			},
			create: cat,
		});
	}
	console.log(`  + DebtCategory: ${DEBT_CATEGORIES.length}`);

	for (const region of REGIONAL_MIN_VITAL) {
		await prisma.regionalMinimumVital.upsert({
			where: {
				stateCode_regionType_effectiveDate: {
					stateCode: region.stateCode,
					regionType: region.regionType,
					effectiveDate: REFERENCE_DATE,
				},
			},
			update: {
				baseAmountSingle: region.baseAmountSingle,
				basePerDependent: region.basePerDependent,
				source: region.source,
			},
			create: { ...region, effectiveDate: REFERENCE_DATE },
		});
	}
	console.log(`  + RegionalMinimumVital: ${REGIONAL_MIN_VITAL.length}`);

	for (const ref of INTEREST_RATE_REFS) {
		await prisma.interestRateReference.upsert({
			where: {
				debtCategorySlug_effectiveDate: {
					debtCategorySlug: ref.debtCategorySlug,
					effectiveDate: REFERENCE_DATE,
				},
			},
			update: {
				monthlyRateMin: ref.monthlyRateMin,
				monthlyRateMax: ref.monthlyRateMax,
				monthlyRateMedian: ref.monthlyRateMedian,
			},
			create: { ...ref, effectiveDate: REFERENCE_DATE, source: "placeholder_v1" },
		});
	}
	console.log(`  + InterestRateReference: ${INTEREST_RATE_REFS.length}`);

	for (const ch of SUPPORT_CHANNELS) {
		await prisma.supportChannel.upsert({
			where: { slug: ch.slug },
			update: ch,
			create: ch,
		});
	}
	console.log(`  + SupportChannel: ${SUPPORT_CHANNELS.length}`);

	for (const w of SCORING_WEIGHTS) {
		await prisma.scoringWeight.upsert({
			where: { factorKey: w.factorKey },
			update: { weight: w.weight, isPositive: w.isPositive, description: w.description },
			create: { ...w, effectiveDate: REFERENCE_DATE },
		});
	}
	console.log(`  + ScoringWeight: ${SCORING_WEIGHTS.length}`);

	console.log("Seed completed.");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
