import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { Job } from "bullmq";
import { R2StorageService } from "../../modules/storage/r2-storage.service";
import { PrismaService } from "../../prisma/prisma.service";
import { MOTOR_SCHEDULED_QUEUE } from "../queue.constants";

const OCR_RETENTION_DAYS = 30;

/**
 * Bridge OCR §3.4 — apaga imagens de OCR mais antigas que 30 dias.
 * Cron diario (05:00 UTC). Apaga arquivo no R2 + nulifica ocrImageUrl em DB.
 */
@Processor(MOTOR_SCHEDULED_QUEUE, { name: "ocr-cleanup" })
export class OcrCleanupProcessor extends WorkerHost {
	private readonly logger = new Logger(OcrCleanupProcessor.name);

	constructor(
		private readonly prisma: PrismaService,
		private readonly storage: R2StorageService,
	) {
		super();
	}

	async process(job: Job): Promise<{ deleted: number }> {
		if (job.name !== "ocr-cleanup") return { deleted: 0 };

		const threshold = new Date(Date.now() - OCR_RETENTION_DAYS * 24 * 60 * 60 * 1000);
		const stale = await this.prisma.settlementEvaluation.findMany({
			where: { usedOcr: true, ocrImageUrl: { not: null }, evaluatedAt: { lt: threshold } },
			select: { id: true, ocrImageUrl: true },
		});

		let deleted = 0;
		for (const row of stale) {
			if (!row.ocrImageUrl) continue;
			const key = this.extractKey(row.ocrImageUrl);
			if (!key) continue;
			try {
				await this.storage.delete(key);
				await this.prisma.settlementEvaluation.update({
					where: { id: row.id },
					data: { ocrImageUrl: null },
				});
				deleted += 1;
			} catch (err) {
				this.logger.warn({ msg: "ocr_cleanup.failed", id: row.id, err });
			}
		}

		this.logger.log({ msg: "ocr_cleanup.done", deleted, candidates: stale.length });
		return { deleted };
	}

	private extractKey(urlOrKey: string): string | null {
		// Se eh URL publica, extrai o key apos o dominio.
		if (urlOrKey.startsWith("http")) {
			try {
				const url = new URL(urlOrKey);
				return url.pathname.replace(/^\//, "");
			} catch {
				return null;
			}
		}
		return urlOrKey;
	}
}
