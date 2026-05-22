import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import type { JwtService } from "@nestjs/jwt";
import type { LoginInput, RegisterInput } from "@quita/shared";
import * as bcrypt from "bcryptjs";
import type { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class AuthService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly jwt: JwtService,
	) {}

	async register(data: RegisterInput) {
		const existing = await this.prisma.user.findUnique({
			where: { email: data.email },
		});

		if (existing) {
			throw new ConflictException("Esse e-mail já está cadastrado.");
		}

		const passwordHash = await bcrypt.hash(data.password, 10);

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

		const accessToken = this.generateToken(user.id, user.email);

		const { passwordHash: _, ...userWithoutPassword } = user;

		return { accessToken, user: userWithoutPassword };
	}

	async login(data: LoginInput) {
		const user = await this.prisma.user.findUnique({
			where: { email: data.email },
		});

		if (!user) {
			throw new UnauthorizedException("E-mail ou senha incorretos.");
		}

		const passwordValid = await bcrypt.compare(data.password, user.passwordHash);

		if (!passwordValid) {
			throw new UnauthorizedException("E-mail ou senha incorretos.");
		}

		const accessToken = this.generateToken(user.id, user.email);

		const { passwordHash: _, ...userWithoutPassword } = user;

		return { accessToken, user: userWithoutPassword };
	}

	async refresh(userId: string) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
		});

		if (!user) {
			throw new UnauthorizedException("Usuário não encontrado.");
		}

		const accessToken = this.generateToken(user.id, user.email);

		const { passwordHash: _, ...userWithoutPassword } = user;

		return { accessToken, user: userWithoutPassword };
	}

	async me(userId: string) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
		});

		if (!user) {
			throw new UnauthorizedException("Usuário não encontrado.");
		}

		const { passwordHash: _, ...userWithoutPassword } = user;

		return userWithoutPassword;
	}

	private generateToken(userId: string, email: string): string {
		return this.jwt.sign({ sub: userId, email });
	}
}
