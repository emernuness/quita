import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	UseGuards,
} from "@nestjs/common";
import {
	createIncomeSchema,
	updateIncomeSchema,
	createExpenseSchema,
	updateExpenseSchema,
} from "@quita/shared";
import { CurrentUser, ZodValidationPipe } from "../../common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { FinancialService } from "./financial.service";

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
		@Body(new ZodValidationPipe(createIncomeSchema)) body: any,
	) {
		return this.financialService.createIncome(userId, body);
	}

	@Patch("incomes/:id")
	updateIncome(
		@CurrentUser("id") userId: string,
		@Param("id") id: string,
		@Body(new ZodValidationPipe(updateIncomeSchema)) body: any,
	) {
		return this.financialService.updateIncome(userId, id, body);
	}

	@Delete("incomes/:id")
	deleteIncome(
		@CurrentUser("id") userId: string,
		@Param("id") id: string,
	) {
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
		@Body(new ZodValidationPipe(createExpenseSchema)) body: any,
	) {
		return this.financialService.createExpense(userId, body);
	}

	@Patch("expenses/:id")
	updateExpense(
		@CurrentUser("id") userId: string,
		@Param("id") id: string,
		@Body(new ZodValidationPipe(updateExpenseSchema)) body: any,
	) {
		return this.financialService.updateExpense(userId, id, body);
	}

	@Delete("expenses/:id")
	deleteExpense(
		@CurrentUser("id") userId: string,
		@Param("id") id: string,
	) {
		return this.financialService.deleteExpense(userId, id);
	}
}
