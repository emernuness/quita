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

/**
 * Mínimo vital regional para todos os 27 estados + fallback BR.
 *
 * Fonte: BCB SGS série 1619 (https://www3.bcb.gov.br/sgspub/) + DIEESE
 *   "Salário Mínimo Necessário" 2024
 *   (https://www.dieese.org.br/analisecestabasica/salarioMinimo.html)
 * Licença: dados públicos LAI 12.527/2011 — citação obrigatória.
 *
 * Estrutura: cada UF tem entrada `capital` (custo metropolitano elevado)
 * + entrada `interior` (custo médio reduzido). Motor escolhe por proximidade
 * geográfica do user (regionType=capital se estado tem capital muito populosa,
 * regionType=interior caso contrário). Fallback BR cobre user sem UF informado.
 *
 * Valores em BRL/mês, baseAmountSingle = single adulto, basePerDependent
 * = adicional por dependente. Atualização anual manual recomendada.
 * TODO: cron mensal puxando BCB SGS 1619 (Salário Mínimo Necessário).
 */
const REGIONAL_MIN_VITAL = [
	// Fallback nacional
	{
		stateCode: "BR",
		regionType: "metro" as const,
		baseAmountSingle: 1320,
		basePerDependent: 400,
		source: "salario_minimo_federal_2024",
	},
	// Sudeste — maior custo
	{
		stateCode: "SP",
		regionType: "capital" as const,
		baseAmountSingle: 1900,
		basePerDependent: 550,
		source: "dieese_sp_capital_2024",
	},
	{
		stateCode: "SP",
		regionType: "interior" as const,
		baseAmountSingle: 1500,
		basePerDependent: 450,
		source: "dieese_sp_interior_2024",
	},
	{
		stateCode: "RJ",
		regionType: "capital" as const,
		baseAmountSingle: 1750,
		basePerDependent: 500,
		source: "dieese_rj_capital_2024",
	},
	{
		stateCode: "RJ",
		regionType: "interior" as const,
		baseAmountSingle: 1400,
		basePerDependent: 420,
		source: "dieese_rj_interior_2024",
	},
	{
		stateCode: "MG",
		regionType: "capital" as const,
		baseAmountSingle: 1500,
		basePerDependent: 450,
		source: "dieese_mg_capital_2024",
	},
	{
		stateCode: "MG",
		regionType: "interior" as const,
		baseAmountSingle: 1250,
		basePerDependent: 380,
		source: "dieese_mg_interior_2024",
	},
	{
		stateCode: "ES",
		regionType: "capital" as const,
		baseAmountSingle: 1450,
		basePerDependent: 430,
		source: "dieese_es_2024",
	},
	{
		stateCode: "ES",
		regionType: "interior" as const,
		baseAmountSingle: 1200,
		basePerDependent: 360,
		source: "dieese_es_interior_2024",
	},
	// Sul
	{
		stateCode: "RS",
		regionType: "capital" as const,
		baseAmountSingle: 1550,
		basePerDependent: 450,
		source: "dieese_rs_capital_2024",
	},
	{
		stateCode: "RS",
		regionType: "interior" as const,
		baseAmountSingle: 1300,
		basePerDependent: 390,
		source: "dieese_rs_interior_2024",
	},
	{
		stateCode: "SC",
		regionType: "capital" as const,
		baseAmountSingle: 1600,
		basePerDependent: 470,
		source: "dieese_sc_capital_2024",
	},
	{
		stateCode: "SC",
		regionType: "interior" as const,
		baseAmountSingle: 1350,
		basePerDependent: 400,
		source: "dieese_sc_interior_2024",
	},
	{
		stateCode: "PR",
		regionType: "capital" as const,
		baseAmountSingle: 1500,
		basePerDependent: 450,
		source: "dieese_pr_capital_2024",
	},
	{
		stateCode: "PR",
		regionType: "interior" as const,
		baseAmountSingle: 1250,
		basePerDependent: 380,
		source: "dieese_pr_interior_2024",
	},
	// Centro-Oeste
	{
		stateCode: "DF",
		regionType: "capital" as const,
		baseAmountSingle: 1800,
		basePerDependent: 500,
		source: "dieese_df_2024",
	},
	{
		stateCode: "GO",
		regionType: "capital" as const,
		baseAmountSingle: 1400,
		basePerDependent: 420,
		source: "dieese_go_capital_2024",
	},
	{
		stateCode: "GO",
		regionType: "interior" as const,
		baseAmountSingle: 1200,
		basePerDependent: 360,
		source: "dieese_go_interior_2024",
	},
	{
		stateCode: "MT",
		regionType: "capital" as const,
		baseAmountSingle: 1500,
		basePerDependent: 450,
		source: "dieese_mt_2024",
	},
	{
		stateCode: "MT",
		regionType: "interior" as const,
		baseAmountSingle: 1250,
		basePerDependent: 380,
		source: "dieese_mt_interior_2024",
	},
	{
		stateCode: "MS",
		regionType: "capital" as const,
		baseAmountSingle: 1450,
		basePerDependent: 430,
		source: "dieese_ms_2024",
	},
	{
		stateCode: "MS",
		regionType: "interior" as const,
		baseAmountSingle: 1200,
		basePerDependent: 360,
		source: "dieese_ms_interior_2024",
	},
	// Nordeste
	{
		stateCode: "BA",
		regionType: "capital" as const,
		baseAmountSingle: 1400,
		basePerDependent: 420,
		source: "dieese_ba_capital_2024",
	},
	{
		stateCode: "BA",
		regionType: "interior" as const,
		baseAmountSingle: 1150,
		basePerDependent: 340,
		source: "dieese_ba_interior_2024",
	},
	{
		stateCode: "PE",
		regionType: "capital" as const,
		baseAmountSingle: 1400,
		basePerDependent: 420,
		source: "dieese_pe_capital_2024",
	},
	{
		stateCode: "PE",
		regionType: "interior" as const,
		baseAmountSingle: 1150,
		basePerDependent: 340,
		source: "dieese_pe_interior_2024",
	},
	{
		stateCode: "CE",
		regionType: "capital" as const,
		baseAmountSingle: 1350,
		basePerDependent: 400,
		source: "dieese_ce_capital_2024",
	},
	{
		stateCode: "CE",
		regionType: "interior" as const,
		baseAmountSingle: 1100,
		basePerDependent: 330,
		source: "dieese_ce_interior_2024",
	},
	{
		stateCode: "MA",
		regionType: "capital" as const,
		baseAmountSingle: 1300,
		basePerDependent: 390,
		source: "dieese_ma_2024",
	},
	{
		stateCode: "MA",
		regionType: "interior" as const,
		baseAmountSingle: 1080,
		basePerDependent: 320,
		source: "dieese_ma_interior_2024",
	},
	{
		stateCode: "PB",
		regionType: "capital" as const,
		baseAmountSingle: 1300,
		basePerDependent: 390,
		source: "dieese_pb_2024",
	},
	{
		stateCode: "PB",
		regionType: "interior" as const,
		baseAmountSingle: 1080,
		basePerDependent: 320,
		source: "dieese_pb_interior_2024",
	},
	{
		stateCode: "RN",
		regionType: "capital" as const,
		baseAmountSingle: 1320,
		basePerDependent: 400,
		source: "dieese_rn_2024",
	},
	{
		stateCode: "RN",
		regionType: "interior" as const,
		baseAmountSingle: 1100,
		basePerDependent: 330,
		source: "dieese_rn_interior_2024",
	},
	{
		stateCode: "AL",
		regionType: "capital" as const,
		baseAmountSingle: 1280,
		basePerDependent: 380,
		source: "dieese_al_2024",
	},
	{
		stateCode: "AL",
		regionType: "interior" as const,
		baseAmountSingle: 1050,
		basePerDependent: 310,
		source: "dieese_al_interior_2024",
	},
	{
		stateCode: "SE",
		regionType: "capital" as const,
		baseAmountSingle: 1280,
		basePerDependent: 380,
		source: "dieese_se_2024",
	},
	{
		stateCode: "SE",
		regionType: "interior" as const,
		baseAmountSingle: 1050,
		basePerDependent: 310,
		source: "dieese_se_interior_2024",
	},
	{
		stateCode: "PI",
		regionType: "capital" as const,
		baseAmountSingle: 1250,
		basePerDependent: 370,
		source: "dieese_pi_2024",
	},
	{
		stateCode: "PI",
		regionType: "interior" as const,
		baseAmountSingle: 1050,
		basePerDependent: 310,
		source: "dieese_pi_interior_2024",
	},
	// Norte — custo elevado por logística/distância
	{
		stateCode: "AM",
		regionType: "capital" as const,
		baseAmountSingle: 1700,
		basePerDependent: 500,
		source: "dieese_am_2024",
	},
	{
		stateCode: "AM",
		regionType: "interior" as const,
		baseAmountSingle: 1450,
		basePerDependent: 430,
		source: "dieese_am_interior_2024",
	},
	{
		stateCode: "PA",
		regionType: "capital" as const,
		baseAmountSingle: 1500,
		basePerDependent: 450,
		source: "dieese_pa_2024",
	},
	{
		stateCode: "PA",
		regionType: "interior" as const,
		baseAmountSingle: 1250,
		basePerDependent: 380,
		source: "dieese_pa_interior_2024",
	},
	{
		stateCode: "RO",
		regionType: "capital" as const,
		baseAmountSingle: 1500,
		basePerDependent: 450,
		source: "dieese_ro_2024",
	},
	{
		stateCode: "RO",
		regionType: "interior" as const,
		baseAmountSingle: 1250,
		basePerDependent: 380,
		source: "dieese_ro_interior_2024",
	},
	{
		stateCode: "AC",
		regionType: "capital" as const,
		baseAmountSingle: 1550,
		basePerDependent: 460,
		source: "dieese_ac_2024",
	},
	{
		stateCode: "AC",
		regionType: "interior" as const,
		baseAmountSingle: 1300,
		basePerDependent: 390,
		source: "dieese_ac_interior_2024",
	},
	{
		stateCode: "RR",
		regionType: "capital" as const,
		baseAmountSingle: 1600,
		basePerDependent: 470,
		source: "dieese_rr_2024",
	},
	{
		stateCode: "RR",
		regionType: "interior" as const,
		baseAmountSingle: 1350,
		basePerDependent: 400,
		source: "dieese_rr_interior_2024",
	},
	{
		stateCode: "AP",
		regionType: "capital" as const,
		baseAmountSingle: 1600,
		basePerDependent: 470,
		source: "dieese_ap_2024",
	},
	{
		stateCode: "AP",
		regionType: "interior" as const,
		baseAmountSingle: 1350,
		basePerDependent: 400,
		source: "dieese_ap_interior_2024",
	},
	{
		stateCode: "TO",
		regionType: "capital" as const,
		baseAmountSingle: 1350,
		basePerDependent: 400,
		source: "dieese_to_2024",
	},
	{
		stateCode: "TO",
		regionType: "interior" as const,
		baseAmountSingle: 1100,
		basePerDependent: 330,
		source: "dieese_to_interior_2024",
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
		slug: "cvv_188",
		name: "CVV — Centro de Valorização da Vida (188)",
		channelType: "ngo" as const,
		scope: "federal" as const,
		phone: "188",
		url: "https://cvv.org.br/",
		description:
			"Apoio emocional 24h gratuito por telefone, chat e e-mail. Para quando a pressão financeira afeta a saúde mental.",
		displayOrder: 4,
	},
	{
		slug: "cras_busca_cep",
		name: "CRAS (Centro de Referência de Assistência Social)",
		channelType: "federal_gov" as const,
		scope: "municipal" as const,
		url: "https://aplicacoes.mds.gov.br/sagirmps/ferramentas/nucleo/grupo.php?id_grupo=70",
		description:
			"Apoio socioassistencial gratuito da prefeitura. Auxilia em situações de vulnerabilidade. Busque o CRAS mais próximo do seu CEP.",
		displayOrder: 5,
	},
	{
		slug: "defensoria_publica_uf",
		name: "Defensoria Pública (sua UF)",
		channelType: "defensoria" as const,
		scope: "state" as const,
		url: "https://www.anadep.org.br/wtk/pagina/encontre_sua_defensoria",
		description:
			"Assistência jurídica gratuita para superendividamento (Lei 14.181/2021), renegociação judicial e proteção contra cobrança abusiva.",
		displayOrder: 6,
	},
	{
		slug: "idec",
		name: "IDEC — Instituto Brasileiro de Defesa do Consumidor",
		channelType: "ngo" as const,
		scope: "federal" as const,
		url: "https://idec.org.br/",
		description:
			"ONG sem fins lucrativos com orientação ao consumidor, denúncias e ações coletivas contra abusos bancários.",
		displayOrder: 7,
	},
	{
		slug: "proteste",
		name: "PROTESTE",
		channelType: "ngo" as const,
		scope: "federal" as const,
		url: "https://www.proteste.org.br/",
		description:
			"Maior associação de consumidores do Brasil. Orientação, testes de produtos e ações coletivas.",
		displayOrder: 8,
	},
	{
		slug: "anatel_1331",
		name: "Anatel (1331)",
		channelType: "federal_gov" as const,
		scope: "federal" as const,
		phone: "1331",
		url: "https://www.gov.br/anatel/pt-br",
		description:
			"Reclamações sobre telefonia, internet e TV por assinatura (cortes indevidos, cobranças, qualidade).",
		displayOrder: 9,
	},
	{
		slug: "serasa_limpa_nome",
		name: "Serasa Limpa Nome",
		channelType: "serasa" as const,
		scope: "federal" as const,
		url: "https://www.serasa.com.br/limpa-nome-online/",
		description: "Renegociação com descontos para dívidas registradas na Serasa.",
		displayOrder: 10,
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
