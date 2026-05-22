import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import type { JwtService } from "@nestjs/jwt";
import type { LoginInput, RegisterInput } from "@quita/shared";
import * as bcrypt from "bcryptjs";
import type { PrismaService } from "../../prisma/prisma.service";
import type { AuthAuditService } from "./auth-audit.service";
import { ACCESS_TOKEN_TTL_SECONDS, BCRYPT_ROUNDS } from "./constants";
import type { IssuedRefreshToken, RefreshTokenService } from "./refresh-token.service";

export interface RequestMeta {
	ip?: string | null;
	userAgent?: string | null;
}

export interface AuthOk {
	user: {
		id: string;
		email: string;
		name: string;
		[k: string]: unknown;
	};
	accessToken: string;
	refreshToken: IssuedRefreshToken;
}

@Injectable()
export class AuthService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly jwt: JwtService,
		private readonly refreshTokens: RefreshTokenService,
		private readonly audit: AuthAuditService,
	) {}

	async register(data: RegisterInput, meta: RequestMeta = {}): Promise<AuthOk> {
		const existing = await this.prisma.user.findUnique({
			where: { email: data.email },
		});

		if (existing) {
			throw new ConflictException("Esse e-mail já está cadastrado.");
		}

		const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

		const user = await this.prisma.user.create({
			data: {
				name: data.name,
				email: data.email,
				phone: data.phone,
				passwordHash,
				avatarInitials: data.name
					.split(" ")
					.map((n) => n[0])
					.join("")
					.toUpperCase()
					.slice(0, 2),
			},
		});

		const accessToken = this.signAccessToken(user.id, user.email);
		const refreshToken = await this.refreshTokens.issue(user.id, meta);

		await this.audit.log({
			eventType: "login_success",
			userId: user.id,
			email: user.email,
			ip: meta.ip,
			userAgent: meta.userAgent,
			metadata: { reason: "register" },
		});

		const { passwordHash: _ph, ...userPublic } = user;
		return { user: userPublic, accessToken, refreshToken };
	}

	async login(data: LoginInput, meta: RequestMeta = {}): Promise<AuthOk> {
		const user = await this.prisma.user.findUnique({
			where: { email: data.email },
		});

		if (!user) {
			await this.audit.log({
				eventType: "login_failure",
				email: data.email,
				ip: meta.ip,
				userAgent: meta.userAgent,
				metadata: { reason: "user_not_found" },
			});
			throw new UnauthorizedException("E-mail ou senha incorretos.");
		}

		const passwordValid = await bcrypt.compare(data.password, user.passwordHash);

		if (!passwordValid) {
			await this.audit.log({
				eventType: "login_failure",
				userId: user.id,
				email: user.email,
				ip: meta.ip,
				userAgent: meta.userAgent,
				metadata: { reason: "bad_password" },
			});
			throw new UnauthorizedException("E-mail ou senha incorretos.");
		}

		const accessToken = this.signAccessToken(user.id, user.email);
		const refreshToken = await this.refreshTokens.issue(user.id, meta);

		await this.audit.log({
			eventType: "login_success",
			userId: user.id,
			email: user.email,
			ip: meta.ip,
			userAgent: meta.userAgent,
		});

		const { passwordHash: _ph, ...userPublic } = user;
		return { user: userPublic, accessToken, refreshToken };
	}

	/**
	 * Rotaciona refresh token e gera novo access token.
	 * Lanca 401 em token invalido, expirado ou reusado.
	 */
	async refresh(rawRefreshToken: string, meta: RequestMeta = {}): Promise<AuthOk> {
		const result = await this.refreshTokens.rotate(rawRefreshToken, meta);

		if (result === null) {
			throw new UnauthorizedException("Sessão expirada. Faça login novamente.");
		}

		if ("reuseDetectedFor" in result) {
			await this.audit.log({
				eventType: "refresh_reuse_detected",
				userId: result.reuseDetectedFor,
				ip: meta.ip,
				userAgent: meta.userAgent,
			});
			throw new UnauthorizedException("Sessão comprometida. Faça login novamente.");
		}

		const user = await this.prisma.user.findUnique({ where: { id: result.userId } });
		if (!user) {
			throw new UnauthorizedException("Usuário não encontrado.");
		}

		const accessToken = this.signAccessToken(user.id, user.email);

		await this.audit.log({
			eventType: "refresh_success",
			userId: user.id,
			email: user.email,
			ip: meta.ip,
			userAgent: meta.userAgent,
		});

		const { passwordHash: _ph, ...userPublic } = user;
		return { user: userPublic, accessToken, refreshToken: result.issued };
	}

	async logout(rawRefreshToken: string | null, meta: RequestMeta = {}): Promise<void> {
		if (rawRefreshToken) {
			await this.refreshTokens.revoke(rawRefreshToken);
		}
		await this.audit.log({
			eventType: "logout",
			ip: meta.ip,
			userAgent: meta.userAgent,
		});
	}

	async logoutAll(userId: string, meta: RequestMeta = {}): Promise<void> {
		await this.refreshTokens.revokeAllForUser(userId);
		await this.audit.log({
			eventType: "logout_all",
			userId,
			ip: meta.ip,
			userAgent: meta.userAgent,
		});
	}

	async me(userId: string) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
		});

		if (!user) {
			throw new UnauthorizedException("Usuário não encontrado.");
		}

		const { passwordHash: _ph, ...userPublic } = user;
		return userPublic;
	}

	private signAccessToken(userId: string, email: string): string {
		return this.jwt.sign({ sub: userId, email }, { expiresIn: `${ACCESS_TOKEN_TTL_SECONDS}s` });
	}
}
