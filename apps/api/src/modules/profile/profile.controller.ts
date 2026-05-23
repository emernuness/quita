import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
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
import { CurrentUser, ZodValidationPipe } from "../../common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ProfileService } from "./profile.service";

@Controller("profile")
@UseGuards(JwtAuthGuard)
export class ProfileController {
	constructor(private readonly profileService: ProfileService) {}

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
}
