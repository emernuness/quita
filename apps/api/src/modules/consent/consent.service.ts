import { Injectable } from "@nestjs/common";
import type { ConsentType } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

/**
 * Spec Fase 1 §13 + LGPD Art. 7-8 — registro de consentimento.
 *
 * Versionamento manual: TOS_VERSION e PRIVACY_VERSION sao constantes
 * congeladas. Alterar a versao forca novo prompt de consent ao user
 * (frontend compara com ultima versao aceita).
 */
export const TOS_VERSION = "1.0.0";
export const PRIVACY_VERSION = "1.0.0";

export interface RecordConsentInput {
	userId: string;
	consentType: ConsentType;
	version: string;
	accepted?: boolean;
	ipAddress?: string;
	userAgent?: string;
}

@Injectable()
export class ConsentService {
	constructor(private readonly prisma: PrismaService) {}

	record(input: RecordConsentInput) {
		return this.prisma.consentLog.create({
			data: {
				userId: input.userId,
				consentType: input.consentType,
				version: input.version,
				accepted: input.accepted ?? true,
				ipAddress: input.ipAddress ?? null,
				userAgent: input.userAgent ?? null,
			},
		});
	}

	async latestByType(userId: string) {
		const rows = await this.prisma.consentLog.findMany({
			where: { userId },
			orderBy: { acceptedAt: "desc" },
		});
		// Reduz pela versao mais recente por tipo.
		const out: Partial<Record<ConsentType, { version: string; acceptedAt: Date }>> = {};
		for (const r of rows) {
			if (!out[r.consentType]) {
				out[r.consentType] = { version: r.version, acceptedAt: r.acceptedAt };
			}
		}
		return out;
	}

	async status(userId: string) {
		const latest = await this.latestByType(userId);
		return {
			tosAccepted: latest.terms_of_use?.version === TOS_VERSION,
			tosVersion: TOS_VERSION,
			privacyAccepted: latest.privacy_policy?.version === PRIVACY_VERSION,
			privacyVersion: PRIVACY_VERSION,
		};
	}
}
