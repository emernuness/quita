import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	NotFoundException,
} from "@nestjs/common";
import type {
	CreateDebtInput,
	UpdateDebtInput,
	CreatePaymentInput,
} from "@quita/shared";
import type {
	DebtNature as PrismaDebtNature,
	DebtStatus as PrismaDebtStatus,
	PaymentType as PrismaPaymentType,
} from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { Decimal } from "@prisma/client/runtime/library";

function decimalToNumber(val: Decimal | null | undefined): number | null {
	if (val == null) return null;
	return val.toNumber();
}

function serializeDebt(debt: any) {
	return {
		...debt,
		totalAmount: debt.totalAmount.toNumber(),
		monthlyAmount: decimalToNumber(debt.monthlyAmount),
		amountPaid: debt.amountPaid.toNumber(),
		interestSaved: decimalToNumber(debt.interestSaved),
		...(debt.payments
			? {
					payments: debt.payments.map((p: any) => ({
						...p,
						amount: p.amount.toNumber(),
					})),
				}
			: {}),
	};
}

@Injectable()
export class DebtsService {
	constructor(private readonly prisma: PrismaService) {}

	async listDebts(userId: string) {
		const debts = await this.prisma.debt.findMany({
			where: { userId },
			include: { category: true },
			orderBy: { priorityOrder: "asc" },
		});

		return debts.map(serializeDebt);
	}

	async getDebt(userId: string, id: string) {
		const debt = await this.prisma.debt.findUnique({
			where: { id },
			include: {
				category: true,
				payments: {
					where: { undone: false },
					orderBy: { paidAt: "desc" },
				},
			},
		});

		if (!debt) throw new NotFoundException("Debt not found");
		if (debt.userId !== userId)
			throw new ForbiddenException("Not your resource");

		return serializeDebt(debt);
	}

	async createDebt(userId: string, data: CreateDebtInput) {
		const maxOrder = await this.prisma.debt.aggregate({
			where: { userId },
			_max: { priorityOrder: true },
		});

		const debt = await this.prisma.debt.create({
			data: {
				userId,
				categoryId: data.categoryId,
				creditor: data.creditor,
				nature: (data.nature as PrismaDebtNature) ?? "one_time",
				totalAmount: data.totalAmount,
				monthlyAmount: data.monthlyAmount ?? undefined,
				overdueMonths: data.overdueMonths ?? undefined,
				totalInstallments: data.totalInstallments ?? undefined,
				currentInstallment: data.currentInstallment ?? undefined,
				hasInterest: data.hasInterest,
				dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
				status: (data.status as PrismaDebtStatus) ?? "on_time",
				priorityOrder: (maxOrder._max.priorityOrder ?? 0) + 1,
			},
			include: { category: true },
		});

		return serializeDebt(debt);
	}

	async updateDebt(userId: string, id: string, data: UpdateDebtInput) {
		const debt = await this.prisma.debt.findUnique({ where: { id } });

		if (!debt) throw new NotFoundException("Debt not found");
		if (debt.userId !== userId)
			throw new ForbiddenException("Not your resource");

		const updated = await this.prisma.debt.update({
			where: { id },
			data: {
				...(data.categoryId !== undefined && {
					categoryId: data.categoryId,
				}),
				...(data.creditor !== undefined && { creditor: data.creditor }),
				...(data.nature !== undefined && { nature: data.nature as PrismaDebtNature }),
				...(data.totalAmount !== undefined && {
					totalAmount: data.totalAmount,
				}),
				...(data.monthlyAmount !== undefined && {
					monthlyAmount: data.monthlyAmount,
				}),
				...(data.overdueMonths !== undefined && {
					overdueMonths: data.overdueMonths,
				}),
				...(data.totalInstallments !== undefined && {
					totalInstallments: data.totalInstallments,
				}),
				...(data.currentInstallment !== undefined && {
					currentInstallment: data.currentInstallment,
				}),
				...(data.hasInterest !== undefined && {
					hasInterest: data.hasInterest,
				}),
				...(data.dueDate !== undefined && {
					dueDate: data.dueDate ? new Date(data.dueDate) : null,
				}),
				...(data.status !== undefined && { status: data.status as PrismaDebtStatus }),
			},
			include: { category: true },
		});

		return serializeDebt(updated);
	}

	async deleteDebt(userId: string, id: string) {
		const debt = await this.prisma.debt.findUnique({ where: { id } });

		if (!debt) throw new NotFoundException("Debt not found");
		if (debt.userId !== userId)
			throw new ForbiddenException("Not your resource");

		await this.prisma.debt.delete({ where: { id } });

		return { deleted: true };
	}

	async createPayment(
		userId: string,
		debtId: string,
		data: CreatePaymentInput,
	) {
		const debt = await this.prisma.debt.findUnique({
			where: { id: debtId },
		});

		if (!debt) throw new NotFoundException("Debt not found");
		if (debt.userId !== userId)
			throw new ForbiddenException("Not your resource");

		const canUndoUntil = new Date();
		canUndoUntil.setHours(canUndoUntil.getHours() + 24);

		const paidAt = data.paidAt ? new Date(data.paidAt) : new Date();

		const newAmountPaid = debt.amountPaid.toNumber() + data.amount;
		const isFull = data.paymentType === "full";

		const [payment] = await this.prisma.$transaction([
			this.prisma.payment.create({
				data: {
					userId,
					debtId,
					amount: data.amount,
					paymentType: data.paymentType as PrismaPaymentType,
					paidAt,
					canUndoUntil,
				},
			}),
			this.prisma.debt.update({
				where: { id: debtId },
				data: {
					amountPaid: newAmountPaid,
					...(isFull && {
						status: "paid",
						paidAt: new Date(),
					}),
				},
			}),
		]);

		return {
			...payment,
			amount: payment.amount.toNumber(),
		};
	}

	async undoPayment(userId: string, debtId: string, paymentId: string) {
		const payment = await this.prisma.payment.findUnique({
			where: { id: paymentId },
		});

		if (!payment) throw new NotFoundException("Payment not found");
		if (payment.userId !== userId)
			throw new ForbiddenException("Not your resource");
		if (payment.debtId !== debtId)
			throw new BadRequestException("Payment does not belong to this debt");
		if (payment.undone)
			throw new BadRequestException("Payment already undone");
		if (!payment.canUndoUntil || payment.canUndoUntil < new Date())
			throw new BadRequestException("Undo window expired");

		const debt = await this.prisma.debt.findUnique({
			where: { id: debtId },
		});

		if (!debt) throw new NotFoundException("Debt not found");

		const newAmountPaid = Math.max(
			0,
			debt.amountPaid.toNumber() - payment.amount.toNumber(),
		);

		await this.prisma.$transaction([
			this.prisma.payment.update({
				where: { id: paymentId },
				data: { undone: true },
			}),
			this.prisma.debt.update({
				where: { id: debtId },
				data: {
					amountPaid: newAmountPaid,
					...(debt.status === "paid" && {
						status: "on_time",
						paidAt: null,
					}),
				},
			}),
		]);

		return { undone: true };
	}

	async listCategories() {
		return this.prisma.debtCategory.findMany({
			orderBy: { name: "asc" },
		});
	}
}
