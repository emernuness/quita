import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import type { Request } from "express";
import { Strategy } from "passport-jwt";
import type { PrismaService } from "../../prisma/prisma.service";
import { ACCESS_TOKEN_COOKIE } from "./constants";

interface JwtPayload {
	sub: string;
	email: string;
}

function extractFromCookie(req: Request): string | null {
	const fromCookie = req.cookies?.[ACCESS_TOKEN_COOKIE];
	if (typeof fromCookie === "string" && fromCookie.length > 0) return fromCookie;
	// Fallback Authorization Bearer (compat com testes/curl)
	const auth = req.headers.authorization;
	if (typeof auth === "string" && auth.startsWith("Bearer ")) {
		return auth.slice("Bearer ".length);
	}
	return null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(private readonly prisma: PrismaService) {
		super({
			jwtFromRequest: extractFromCookie,
			ignoreExpiration: false,
			secretOrKey: (() => {
				const s = process.env.JWT_SECRET;
				if (!s) throw new Error("JWT_SECRET nao configurado.");
				return s;
			})(),
		});
	}

	async validate(payload: JwtPayload) {
		const user = await this.prisma.user.findUnique({
			where: { id: payload.sub },
		});

		if (!user) {
			throw new UnauthorizedException("User not found");
		}

		const { passwordHash: _ph, ...userPublic } = user;
		return userPublic;
	}
}
