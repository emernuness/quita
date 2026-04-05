import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import {
	updateProfileSchema,
	changePasswordSchema,
	updateSecuritySchema,
	updateDiscreteModeSchema,
	updateNotificationPrefsSchema,
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
		@Body(new ZodValidationPipe(updateProfileSchema)) body: any,
	) {
		return this.profileService.updateProfile(userId, body);
	}

	@Patch("password")
	changePassword(
		@CurrentUser("id") userId: string,
		@Body(new ZodValidationPipe(changePasswordSchema)) body: any,
	) {
		return this.profileService.changePassword(userId, body);
	}

	@Patch("security")
	updateSecurity(
		@CurrentUser("id") userId: string,
		@Body(new ZodValidationPipe(updateSecuritySchema)) body: any,
	) {
		return this.profileService.updateSecurity(userId, body);
	}

	@Patch("discrete-mode")
	toggleDiscreteMode(
		@CurrentUser("id") userId: string,
		@Body(new ZodValidationPipe(updateDiscreteModeSchema)) body: any,
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
		@Body(new ZodValidationPipe(updateNotificationPrefsSchema)) body: any,
	) {
		return this.profileService.updateNotificationPrefs(userId, body);
	}
}
