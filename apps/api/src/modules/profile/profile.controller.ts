import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	Patch,
	Post,
	Res,
	UseGuards,
} from "@nestjs/common";
import {
	type ChangePasswordInput,
	type UpdateDiscreteModeInput,
	type UpdateNotificationPrefsInput,
	type UpdateProfileInput,
	type UpdateSecurityInput,
	changePasswordSchema,
	updateDiscreteModeSchema,
	updateNotificationPrefsSchema,
	updateProfileSchema,
	updateSecuritySchema,
} from "@quita/shared";
import type { Response } from "express";
import { CurrentUser, ZodValidationPipe } from "../../common";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, REFRESH_TOKEN_PATH } from "../auth/constants";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { UserDeletionService } from "../user/user-deletion.service";
import { ProfileService } from "./profile.service";

@Controller("profile")
@UseGuards(JwtAuthGuard)
export class ProfileController {
	constructor(
		private readonly profileService: ProfileService,
		private readonly userDeletion: UserDeletionService,
	) {}

	@Get()
	getProfile(@CurrentUser("id") userId: string) {
		return this.profileService.getProfile(userId);
	}

	@Patch()
	updateProfile(
		@CurrentUser("id") userId: string,
		@Body(new ZodValidationPipe(updateProfileSchema)) body: UpdateProfileInput,
	) {
		return this.profileService.updateProfile(userId, body);
	}

	@Patch("password")
	changePassword(
		@CurrentUser("id") userId: string,
		@Body(new ZodValidationPipe(changePasswordSchema)) body: ChangePasswordInput,
	) {
		return this.profileService.changePassword(userId, body);
	}

	@Patch("security")
	updateSecurity(
		@CurrentUser("id") userId: string,
		@Body(new ZodValidationPipe(updateSecuritySchema)) body: UpdateSecurityInput,
	) {
		return this.profileService.updateSecurity(userId, body);
	}

	@Patch("discrete-mode")
	toggleDiscreteMode(
		@CurrentUser("id") userId: string,
		@Body(new ZodValidationPipe(updateDiscreteModeSchema)) body: UpdateDiscreteModeInput,
	) {
		return this.profileService.toggleDiscreteMode(userId, body);
	}

	@Get("notifications")
	getNotificationPrefs(@CurrentUser("id") userId: string) {
		return this.profileService.getNotificationPrefs(userId);
	}

	@Patch("notifications")
	updateNotificationPrefs(
		@CurrentUser("id") userId: string,
		@Body(new ZodValidationPipe(updateNotificationPrefsSchema)) body: UpdateNotificationPrefsInput,
	) {
		return this.profileService.updateNotificationPrefs(userId, body);
	}

	/**
	 * LGPD art. 18, IV — Solicitar exclusao da conta.
	 * Soft delete: User.deletedAt = now() + revoga refresh tokens.
	 * Hard delete acontece em 30 dias via DataRetentionCleanupProcessor.
	 * Usuario pode logar nesse periodo e cancelar via POST /profile/me/cancel-deletion.
	 */
	@Delete("me")
	@HttpCode(200)
	async requestDeletion(
		@CurrentUser("id") userId: string,
		@Res({ passthrough: true }) res: Response,
	) {
		await this.userDeletion.requestDeletion(userId);
		res.clearCookie(ACCESS_TOKEN_COOKIE, { path: "/" });
		res.clearCookie(REFRESH_TOKEN_COOKIE, { path: REFRESH_TOKEN_PATH });
		return {
			ok: true,
			retentionDays: 30,
			message: "Conta marcada para exclusão. Faça login em até 30 dias para cancelar.",
		};
	}

	@Post("me/cancel-deletion")
	@HttpCode(200)
	async cancelDeletion(@CurrentUser("id") userId: string) {
		await this.userDeletion.cancelDeletion(userId);
		return { ok: true, message: "Exclusão cancelada. Sua conta foi reativada." };
	}
}
