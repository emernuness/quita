import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import {
	type CreateDebtInput,
	type CreatePaymentInput,
	type UpdateDebtInput,
	createDebtSchema,
	createPaymentSchema,
	updateDebtSchema,
} from "@quita/shared";
import { CurrentUser, ZodValidationPipe } from "../../common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { DebtsService } from "./debts.service";

@Controller("debts")
@UseGuards(JwtAuthGuard)
export class DebtsController {
	constructor(private readonly debtsService: DebtsService) {}

	@Get("categories")
	listCategories() {
		return this.debtsService.listCategories();
	}

	@Get()
	listDebts(@CurrentUser("id") userId: string) {
		return this.debtsService.listDebts(userId);
	}

	@Get(":id")
	getDebt(@CurrentUser("id") userId: string, @Param("id") id: string) {
		return this.debtsService.getDebt(userId, id);
	}

	@Post()
	createDebt(
		@CurrentUser("id") userId: string,
		@Body(new ZodValidationPipe(createDebtSchema)) body: CreateDebtInput,
	) {
		return this.debtsService.createDebt(userId, body);
	}

	@Patch(":id")
	updateDebt(
		@CurrentUser("id") userId: string,
		@Param("id") id: string,
		@Body(new ZodValidationPipe(updateDebtSchema)) body: UpdateDebtInput,
	) {
		return this.debtsService.updateDebt(userId, id, body);
	}

	@Delete(":id")
	deleteDebt(@CurrentUser("id") userId: string, @Param("id") id: string) {
		return this.debtsService.deleteDebt(userId, id);
	}

	@Post(":id/payments")
	createPayment(
		@CurrentUser("id") userId: string,
		@Param("id") debtId: string,
		@Body(new ZodValidationPipe(createPaymentSchema)) body: CreatePaymentInput,
	) {
		return this.debtsService.createPayment(userId, debtId, body);
	}

	@Delete(":debtId/payments/:paymentId")
	undoPayment(
		@CurrentUser("id") userId: string,
		@Param("debtId") debtId: string,
		@Param("paymentId") paymentId: string,
	) {
		return this.debtsService.undoPayment(userId, debtId, paymentId);
	}
}
