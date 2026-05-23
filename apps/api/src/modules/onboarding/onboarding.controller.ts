import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
	type OnboardingDebtCategoriesInput,
	type OnboardingDebtInput,
	type OnboardingExpensesInput,
	type OnboardingIncomeInput,
	onboardingDebtCategoriesSchema,
	onboardingDebtSchema,
	onboardingExpensesSchema,
	onboardingIncomeSchema,
} from "@quita/shared";
import { z } from "zod";
import { CurrentUser, ZodValidationPipe } from "../../common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { OnboardingService } from "./onboarding.service";

const onboardingDebtsBodySchema = z.array(onboardingDebtSchema).min(1);

@ApiTags("onboarding")
@Controller("onboarding")
@UseGuards(JwtAuthGuard)
export class OnboardingController {
	constructor(private readonly onboardingService: OnboardingService) {}

	@Post("income")
	saveIncome(
		@CurrentUser("id") userId: string,
		@Body(new ZodValidationPipe(onboardingIncomeSchema)) body: OnboardingIncomeInput,
	) {
		return this.onboardingService.saveIncome(userId, body);
	}

	@Post("categories")
	saveCategories(
		@CurrentUser("id") userId: string,
		@Body(new ZodValidationPipe(onboardingDebtCategoriesSchema))
		body: OnboardingDebtCategoriesInput,
	) {
		return this.onboardingService.saveCategories(userId, body);
	}

	@Post("debts")
	saveDebts(
		@CurrentUser("id") userId: string,
		@Body(new ZodValidationPipe(onboardingDebtsBodySchema)) body: OnboardingDebtInput[],
	) {
		return this.onboardingService.saveDebts(userId, body);
	}

	@Post("expenses")
	saveExpenses(
		@CurrentUser("id") userId: string,
		@Body(new ZodValidationPipe(onboardingExpensesSchema)) body: OnboardingExpensesInput,
	) {
		return this.onboardingService.saveExpenses(userId, body);
	}

	@Post("complete")
	complete(@CurrentUser("id") userId: string) {
		return this.onboardingService.complete(userId);
	}
}
