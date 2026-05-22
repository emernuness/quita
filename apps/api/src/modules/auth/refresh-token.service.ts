import { createHmac, randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";
import type { PrismaService } from "../../prisma/prisma.service";
import { REFRESH_TOKEN_BYTES, REFRESH_TOKEN_TTL_SECONDS } from "./constants";

export interface IssuedRefreshToken {
	id: string;
	rawToken: string;
	expiresAt: Date;
}

@Injectable()
export class RefreshTokenService {
	constructor(private readonly prisma: PrismaService) {}

	private get hmacSecret(): string {
		const secret = process.env.REFRESH_TOKEN_HMAC_SECRET;
		if (!secret) {
			throw new Error(
				"REFRESH_TOKEN_HMAC_SECRET nao configurado — defina no .env antes de iniciar a API.",
			);
		}
		return secret;
	}

	private hashToken(rawToken: string): string {
		return createHmac("sha256", this.hmacSecret).update(rawToken).digest("hex");
	}

	private generateRawToken(): string {
		return randomBytes(REFRESH_TOKEN_BYTES).toString("hex");
	}

	async issue(
		userId: string,
		meta: { ip?: string | null; userAgent?: string | null } = {},
	): Promise<IssuedRefreshToken> {
		const rawToken = this.generateRawToken();
		const tokenHash = this.hashToken(rawToken);
		const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000);

		const record = await this.prisma.refreshToken.create({
			data: {
				userId,
				tokenHash,
				expiresAt,
				createdIp: meta.ip ?? null,
				userAgent: meta.userAgent ?? null,
			},
		});

		return { id: record.id, rawToken, expiresAt };
	}

	/**
	 * Valida e rotaciona refresh token de forma ATOMICA.
	 *
	 * Estrategia (corrige C-01 da revisao):
	 * 1. Tenta `updateMany` com filtro `revokedAt: null` + `expiresAt > now`.
	 *    Postgres garante atomicidade nesta operacao (linha trava durante update).
	 * 2. Se `count === 0`: token nao existe, ja foi revogado (reuse) ou expirou.
	 *    Apenas neste caso fazemos findUnique para diferenciar:
	 *    - record sem revokedAt: nao existe ou expirou -> retorna null
	 *    - record com revokedAt: REUSE detectado -> revoga todos do user
	 * 3. Se `count === 1`: revogacao atomica bem-sucedida, emite novo token
	 *    com replacedById apontando para o anterior.
	 */
	async rotate(
		rawToken: string,
		meta: { ip?: string | null; userAgent?: string | null } = {},
	): Promise<{ userId: string; issued: IssuedRefreshToken } | { reuseDetectedFor: string } | null> {
		const tokenHash = this.hashToken(rawToken);
		const now = new Date();

		const revoked = await this.prisma.refreshToken.updateMany({
			where: { tokenHash, revokedAt: null, expiresAt: { gt: now } },
			data: { revokedAt: now },
		});

		if (revoked.count === 0) {
			const record = await this.prisma.refreshToken.findUnique({
				where: { tokenHash },
			});
			if (record && record.revokedAt !== null) {
				// Reuse detectado: token ja revogado sendo apresentado novamente
				await this.revokeAllForUser(record.userId);
				return { reuseDetectedFor: record.userId };
			}
			return null;
		}

		// Recuperamos o registro recem-revogado para descobrir userId e
		// encadear replacedById.
		const oldRecord = await this.prisma.refreshToken.findUnique({
			where: { tokenHash },
		});
		if (!oldRecord) return null; // race extrema — defensivo

		const issued = await this.issue(oldRecord.userId, meta);

		await this.prisma.refreshToken.update({
			where: { id: oldRecord.id },
			data: { replacedById: issued.id },
		});

		return { userId: oldRecord.userId, issued };
	}

	async revoke(rawToken: string): Promise<void> {
		const tokenHash = this.hashToken(rawToken);
		await this.prisma.refreshToken.updateMany({
			where: { tokenHash, revokedAt: null },
			data: { revokedAt: new Date() },
		});
	}

	async revokeAllForUser(userId: string): Promise<void> {
		await this.prisma.refreshToken.updateMany({
			where: { userId, revokedAt: null },
			data: { revokedAt: new Date() },
		});
	}
}
