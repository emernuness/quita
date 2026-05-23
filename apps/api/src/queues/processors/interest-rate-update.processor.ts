import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { Job } from "bullmq";
import { PrismaService } from "../../prisma/prisma.service";
import { MOTOR_SCHEDULED_QUEUE } from "../queue.constants";

/**
 * Spec Fase 4 §12.5 — InterestRateUpdateProcessor.
 *
 * Cron mensal (todo dia 5, 02:00 UTC). Consulta BCB SGS para taxas
 * medias por categoria de divida e upsert em InterestRateReference.
 *
 * BCB SGS series:
 * - 20754 cartao rotativo
 * - 25467 cheque especial
 * - 20739 emprestimo pessoal
 * - 20741 consignado
 * - 20771 financiamento veiculo
 * - 20756 credito imobiliario
 */
const SERIES_MAP: Record<string, string> = {
	credit_card: "20754",
	overdraft: "25467",
	personal_loan: "20739",
	payroll_loan: "20741",
	vehicle_financing: "20771",
	mortgage: "20756",
};

@Processor(MOTOR_SCHEDULED_QUEUE, { name: "interest-rate-update" })
export class InterestRateUpdateProcessor extends WorkerHost {
	private readonly logger = new Logger(InterestRateUpdateProcessor.name);

	constructor(private readonly prisma: PrismaService) {
		super();
	}

	async process(job: Job): Promise<{ updated: number }> {
		if (job.name !== "interest-rate-update") return { updated: 0 };

		const now = new Date();
		const year = now.getUTCFullYear();
		const month = now.getUTCMonth(); // mes anterior (BCB atrasa 1)
		const effectiveDate = new Date(Date.UTC(year, month, 1));

		let updated = 0;
		for (const [slug, code] of Object.entries(SERIES_MAP)) {
			try {
				const rate = await this.fetchSeries(code, year, month + 1);
				if (rate === null) continue;
				const monthlyRate = annualToMonthly(rate);
				await this.prisma.interestRateReference.upsert({
					where: {
						debtCategorySlug_effectiveDate: {
							debtCategorySlug: slug,
							effectiveDate,
						},
					},
					update: {
						monthlyRateMedian: monthlyRate,
						monthlyRateMin: monthlyRate * 0.7,
						monthlyRateMax: monthlyRate * 1.3,
						source: "bcb_sgs",
						sourceSeriesCode: code,
					},
					create: {
						debtCategorySlug: slug,
						effectiveDate,
						monthlyRateMedian: monthlyRate,
						monthlyRateMin: monthlyRate * 0.7,
						monthlyRateMax: monthlyRate * 1.3,
						source: "bcb_sgs",
						sourceSeriesCode: code,
					},
				});
				updated += 1;
			} catch (err) {
				this.logger.warn({ msg: "interest_rate.fetch_failed", slug, code, err });
			}
		}

		this.logger.log({ msg: "interest_rate.done", updated });
		return { updated };
	}

	private async fetchSeries(code: string, year: number, month: number): Promise<number | null> {
		const mm = String(month).padStart(2, "0");
		const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados?formato=json&dataInicial=01/${mm}/${year}&dataFinal=28/${mm}/${year}`;
		const res = await fetch(url);
		if (!res.ok) return null;
		const data = (await res.json()) as Array<{ valor: string }>;
		if (data.length === 0) return null;
		return Number.parseFloat(data[0].valor) / 100;
	}
}

function annualToMonthly(annual: number): number {
	return (1 + annual) ** (1 / 12) - 1;
}
