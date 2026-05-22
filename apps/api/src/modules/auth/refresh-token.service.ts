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
	 * Valida e rotaciona um refresh token.
	 * - Token nao encontrado: retorna null.
	 * - Token expirado: revoga e retorna null.
	 * - Token revogado/reusado: revoga TODOS os tokens do usuario (incidente
	 *   de seguranca) e retorna null. O caller deve auditar como
	 *   `refresh_reuse_detected`.
	 * - Token valido: revoga o antigo, emite novo, retorna o novo.
	 */
	async rotate(
		rawToken: string,
		meta: { ip?: string | null; userAgent?: string | null } = {},
	): Promise<{ userId: string; issued: IssuedRefreshToken } | { reuseDetectedFor: string } | null> {
		const tokenHash = this.hashToken(rawToken);
		const record = await this.prisma.refreshToken.findUnique({
			where: { tokenHash },
		});

		if (!record) return null;

		if (record.expiresAt < new Date()) {
			await this.prisma.refreshToken.update({
				where: { id: record.id },
				data: { revokedAt: new Date() },
			});
			return null;
		}

		if (record.revokedAt !== null) {
			// Reuse detectado — revoga todos os tokens do usuario.
			await this.revokeAllForUser(record.userId);
			return { reuseDetectedFor: record.userId };
		}

		const issued = await this.issue(record.userId, meta);

		await this.prisma.refreshToken.update({
			where: { id: record.id },
			data: { revokedAt: new Date(), replacedById: issued.id },
		});

		return { userId: record.userId, issued };
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
