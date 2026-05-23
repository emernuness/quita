import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import type {
	ChangePasswordInput,
	UpdateDiscreteModeInput,
	UpdateNotificationPrefsInput,
	UpdateProfileInput,
	UpdateSecurityInput,
} from "@quita/shared";
import * as bcrypt from "bcryptjs";
import type { PrismaService } from "../../prisma/prisma.service";
import { BCRYPT_ROUNDS } from "../auth/constants";

@Injectable()
export class ProfileService {
	constructor(private readonly prisma: PrismaService) {}

	async getProfile(userId: string) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
		});

		if (!user) throw new NotFoundException("User not found");

		const { passwordHash: _, ...profile } = user;
		return profile;
	}

	async updateProfile(userId: string, data: UpdateProfileInput) {
		const updated = await this.prisma.user.update({
			where: { id: userId },
			data: {
				...(data.name !== undefined && {
					name: data.name,
					avatarInitials: data.name
						.split(" ")
						.map((n) => n[0])
						.join("")
						.toUpperCase()
						.slice(0, 2),
				}),
				...(data.phone !== undefined && { phone: data.phone }),
			},
		});

		const { passwordHash: _, ...profile } = updated;
		return profile;
	}

	async changePassword(userId: string, data: ChangePasswordInput) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
		});

		if (!user) throw new NotFoundException("User not found");

		const valid = await bcrypt.compare(data.currentPassword, user.passwordHash);

		if (!valid) {
			throw new UnauthorizedException("Current password is incorrect");
		}

		const passwordHash = await bcrypt.hash(data.newPassword, BCRYPT_ROUNDS);

		await this.prisma.user.update({
			where: { id: userId },
			data: { passwordHash },
		});

		return { updated: true };
	}

	async updateSecurity(userId: string, data: UpdateSecurityInput) {
		const updated = await this.prisma.user.update({
			where: { id: userId },
			data: {
				...(data.biometricFingerprint !== undefined && {
					biometricFingerprint: data.biometricFingerprint,
				}),
				...(data.biometricFace !== undefined && {
					biometricFace: data.biometricFace,
				}),
			},
		});

		const { passwordHash: _, ...profile } = updated;
		return profile;
	}

	async toggleDiscreteMode(userId: string, data: UpdateDiscreteModeInput) {
		const updated = await this.prisma.user.update({
			where: { id: userId },
			data: { discreteMode: data.enabled },
		});

		const { passwordHash: _, ...profile } = updated;
		return profile;
	}

	async getNotificationPrefs(userId: string) {
		let prefs = await this.prisma.notificationPreference.findUnique({
			where: { userId },
		});

		if (!prefs) {
			prefs = await this.prisma.notificationPreference.create({
				data: { userId },
			});
		}

		return prefs;
	}

	async updateNotificationPrefs(userId: string, data: UpdateNotificationPrefsInput) {
		const prefs = await this.prisma.notificationPreference.upsert({
			where: { userId },
			create: {
				userId,
				...data,
			},
			update: data,
		});

		return prefs;
	}
}
