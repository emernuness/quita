import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { type LoginInput, type RegisterInput, loginSchema, registerSchema } from "@quita/shared";
import { CurrentUser, ZodValidationPipe } from "../../common";
import type { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Controller("auth")
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post("register")
	register(@Body(new ZodValidationPipe(registerSchema)) body: RegisterInput) {
		return this.authService.register(body);
	}

	@Post("login")
	login(@Body(new ZodValidationPipe(loginSchema)) body: LoginInput) {
		return this.authService.login(body);
	}

	@Post("refresh")
	@UseGuards(JwtAuthGuard)
	refresh(@CurrentUser("id") userId: string) {
		return this.authService.refresh(userId);
	}

	@Get("me")
	@UseGuards(JwtAuthGuard)
	me(@CurrentUser("id") userId: string) {
		return this.authService.me(userId);
	}
}
