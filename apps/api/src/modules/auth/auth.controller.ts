import { Body, Controller, Get, Headers, Ip, Post, Req, Res, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { type LoginInput, type RegisterInput, loginSchema, registerSchema } from "@quita/shared";
import type { Request, Response } from "express";
import { CurrentUser, ZodValidationPipe } from "../../common";
import type { AuthService } from "./auth.service";
import {
	ACCESS_TOKEN_COOKIE,
	ACCESS_TOKEN_TTL_SECONDS,
	REFRESH_TOKEN_COOKIE,
	REFRESH_TOKEN_PATH,
	REFRESH_TOKEN_TTL_SECONDS,
} from "./constants";
import { JwtAuthGuard } from "./jwt-auth.guard";

const IS_PROD = process.env.NODE_ENV === "production";

function setAuthCookies(
	res: Response,
	accessToken: string,
	refreshToken: { rawToken: string; expiresAt: Date },
) {
	res.cookie(ACCESS_TOKEN_COOKIE, accessToken, {
		httpOnly: true,
		secure: IS_PROD,
		sameSite: "lax",
		path: "/",
		maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
	});
	res.cookie(REFRESH_TOKEN_COOKIE, refreshToken.rawToken, {
		httpOnly: true,
		secure: IS_PROD,
		sameSite: "lax",
		path: REFRESH_TOKEN_PATH,
		maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
	});
}

function clearAuthCookies(res: Response) {
	res.clearCookie(ACCESS_TOKEN_COOKIE, { path: "/" });
	res.clearCookie(REFRESH_TOKEN_COOKIE, { path: REFRESH_TOKEN_PATH });
}

@Controller("auth")
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post("register")
	@Throttle({ auth: { limit: 10, ttl: 60_000 } })
	async register(
		@Body(new ZodValidationPipe(registerSchema)) body: RegisterInput,
		@Ip() ip: string,
		@Headers("user-agent") userAgent: string | undefined,
		@Res({ passthrough: true }) res: Response,
	) {
		const result = await this.authService.register(body, { ip, userAgent });
		setAuthCookies(res, result.accessToken, result.refreshToken);
		return { user: result.user };
	}

	@Post("login")
	@Throttle({ auth: { limit: 10, ttl: 60_000 } })
	async login(
		@Body(new ZodValidationPipe(loginSchema)) body: LoginInput,
		@Ip() ip: string,
		@Headers("user-agent") userAgent: string | undefined,
		@Res({ passthrough: true }) res: Response,
	) {
		const result = await this.authService.login(body, { ip, userAgent });
		setAuthCookies(res, result.accessToken, result.refreshToken);
		return { user: result.user };
	}

	@Post("refresh")
	@Throttle({ auth: { limit: 10, ttl: 60_000 } })
	async refresh(
		@Req() req: Request,
		@Ip() ip: string,
		@Headers("user-agent") userAgent: string | undefined,
		@Res({ passthrough: true }) res: Response,
	) {
		const rawRefresh = req.cookies?.[REFRESH_TOKEN_COOKIE];
		if (!rawRefresh) {
			clearAuthCookies(res);
			return { user: null };
		}
		const result = await this.authService.refresh(rawRefresh, { ip, userAgent });
		setAuthCookies(res, result.accessToken, result.refreshToken);
		return { user: result.user };
	}

	@Post("logout")
	@Throttle({ auth: { limit: 10, ttl: 60_000 } })
	async logout(
		@Req() req: Request,
		@Ip() ip: string,
		@Headers("user-agent") userAgent: string | undefined,
		@Res({ passthrough: true }) res: Response,
	) {
		const rawRefresh = req.cookies?.[REFRESH_TOKEN_COOKIE] ?? null;
		await this.authService.logout(rawRefresh, { ip, userAgent });
		clearAuthCookies(res);
		return { ok: true };
	}

	@Post("logout-all")
	@UseGuards(JwtAuthGuard)
	async logoutAll(
		@CurrentUser("id") userId: string,
		@Ip() ip: string,
		@Headers("user-agent") userAgent: string | undefined,
		@Res({ passthrough: true }) res: Response,
	) {
		await this.authService.logoutAll(userId, { ip, userAgent });
		clearAuthCookies(res);
		return { ok: true };
	}

	@Get("me")
	@UseGuards(JwtAuthGuard)
	me(@CurrentUser("id") userId: string) {
		return this.authService.me(userId);
	}
}
