import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import {
	onboardingIncomeSchema,
	onboardingDebtCategoriesSchema,
	onboardingDebtSchema,
	onboardingExpensesSchema,
} from "@quita/shared";
import { z } from "zod";
import { CurrentUser, ZodValidationPipe } from "../../common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { OnboardingService } from "./onboarding.service";

const onboardingDebtsBodySchema = z.array(onboardingDebtSchema).min(1);

@Controller("onboarding")
@UseGuards(JwtAuthGuard)
export class OnboardingController {
	constructor(private readonly onboardingService: OnboardingService) {}

	@Post("income")
	saveIncome(
		@CurrentUser("id") userId: string,
		@Body(new ZodValidationPipe(onboardingIncomeSchema)) body: any,
	) {
		return this.onboardingService.saveIncome(userId, body);
	}

	@Post("categories")
	saveCategories(
		@CurrentUser("id") userId: string,
		@Body(new ZodValidationPipe(onboardingDebtCategoriesSchema)) body: any,
	) {
		return this.onboardingService.saveCategories(userId, body);
	}

	@Post("debts")
	saveDebts(
		@CurrentUser("id") userId: string,
		@Body(new ZodValidationPipe(onboardingDebtsBodySchema)) body: any,
	) {
		return this.onboardingService.saveDebts(userId, body);
	}

	@Post("expenses")
	saveExpenses(
		@CurrentUser("id") userId: string,
		@Body(new ZodValidationPipe(onboardingExpensesSchema)) body: any,
	) {
		return this.onboardingService.saveExpenses(userId, body);
	}

	@Post("complete")
	complete(@CurrentUser("id") userId: string) {
		return this.onboardingService.complete(userId);
	}
}
