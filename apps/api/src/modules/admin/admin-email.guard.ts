import { CanActivate, type ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import type { Request } from "express";
import type { PrismaService } from "../../prisma/prisma.service";

interface AuthedRequest extends Request {
	user?: { id: string };
}

/**
 * Admin guard simples baseado em env ADMIN_EMAILS (lista CSV).
 * Lê email do usuário autenticado e compara.
 *
 * Alternativa pragmática a migration 0007 (User.role enum).
 * Vide issue #4: substituir por role real quando houver mais admins.
 */
@Injectable()
export class AdminEmailGuard implements CanActivate {
	private readonly adminEmails: Set<string>;

	constructor(private readonly prisma: PrismaService) {
		const raw = process.env.ADMIN_EMAILS ?? "";
		this.adminEmails = new Set(
			raw
				.split(",")
				.map((e) => e.trim().toLowerCase())
				.filter(Boolean),
		);
	}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		if (this.adminEmails.size === 0) {
			throw new ForbiddenException("Admin não configurado (ADMIN_EMAILS env vazio).");
		}
		const req = context.switchToHttp().getRequest<AuthedRequest>();
		const userId = req.user?.id;
		if (!userId) throw new ForbiddenException("Não autenticado.");

		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			select: { email: true },
		});
		if (!user || !this.adminEmails.has(user.email.toLowerCase())) {
			throw new ForbiddenException("Acesso restrito a administradores.");
		}
		return true;
	}
}
