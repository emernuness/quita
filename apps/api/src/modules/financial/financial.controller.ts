import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import {
	type CreateExpenseInput,
	type CreateIncomeInput,
	type UpdateExpenseInput,
	type UpdateIncomeInput,
	createExpenseSchema,
	createIncomeSchema,
	updateExpenseSchema,
	updateIncomeSchema,
} from "@quita/shared";
import { CurrentUser, ZodValidationPipe } from "../../common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { FinancialService } from "./financial.service";

@Controller("financial")
@UseGuards(JwtAuthGuard)
export class FinancialController {
	constructor(private readonly financialService: FinancialService) {}

	@Get("summary")
	getSummary(@CurrentUser("id") userId: string) {
		return this.financialService.getSummary(userId);
	}

	// --- Incomes ---

	@Get("incomes")
	listIncomes(@CurrentUser("id") userId: string) {
		return this.financialService.listIncomes(userId);
	}

	@Post("incomes")
	createIncome(
		@CurrentUser("id") userId: string,
		@Body(new ZodValidationPipe(createIncomeSchema)) body: CreateIncomeInput,
	) {
		return this.financialService.createIncome(userId, body);
	}

	@Patch("incomes/:id")
	updateIncome(
		@CurrentUser("id") userId: string,
		@Param("id") id: string,
		@Body(new ZodValidationPipe(updateIncomeSchema)) body: UpdateIncomeInput,
	) {
		return this.financialService.updateIncome(userId, id, body);
	}

	@Delete("incomes/:id")
	deleteIncome(@CurrentUser("id") userId: string, @Param("id") id: string) {
		return this.financialService.deleteIncome(userId, id);
	}

	// --- Expenses ---

	@Get("expenses")
	listExpenses(@CurrentUser("id") userId: string) {
		return this.financialService.listExpenses(userId);
	}

	@Post("expenses")
	createExpense(
		@CurrentUser("id") userId: string,
		@Body(new ZodValidationPipe(createExpenseSchema)) body: CreateExpenseInput,
	) {
		return this.financialService.createExpense(userId, body);
	}

	@Patch("expenses/:id")
	updateExpense(
		@CurrentUser("id") userId: string,
		@Param("id") id: string,
		@Body(new ZodValidationPipe(updateExpenseSchema)) body: UpdateExpenseInput,
	) {
		return this.financialService.updateExpense(userId, id, body);
	}

	@Delete("expenses/:id")
	deleteExpense(@CurrentUser("id") userId: string, @Param("id") id: string) {
		return this.financialService.deleteExpense(userId, id);
	}
}
