import {
	Body,
	Controller,
	Headers,
	HttpCode,
	Post,
	type RawBodyRequest,
	Req,
	UnauthorizedException,
	UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import { z } from "zod";
import { CurrentUser, ZodValidationPipe } from "../../common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { StripeService } from "./stripe.service";

const checkoutSessionSchema = z.object({
	priceId: z.string().min(1),
	successUrl: z.string().url(),
	cancelUrl: z.string().url(),
});

type CheckoutSessionBody = z.infer<typeof checkoutSessionSchema>;

@ApiTags("subscription")
@Controller("subscription")
export class SubscriptionController {
	constructor(private readonly stripe: StripeService) {}

	@Post("checkout")
	@UseGuards(JwtAuthGuard)
	@Throttle({ default: { limit: 5, ttl: 60_000 } })
	async checkout(
		@CurrentUser("id") userId: string,
		@CurrentUser("email") userEmail: string | undefined,
		@Body(new ZodValidationPipe(checkoutSessionSchema)) body: CheckoutSessionBody,
	) {
		return this.stripe.createCheckoutSession({
			userId,
			customerEmail: userEmail,
			...body,
		});
	}

	/**
	 * Webhook publico (Stripe assina). Auth via header `stripe-signature`,
	 * nao via JWT. Usa rawBody para validar assinatura — main.ts foi
	 * configurado com { rawBody: true } no NestFactory.create.
	 */
	@Post("webhook")
	@HttpCode(200)
	async webhook(
		@Req() req: RawBodyRequest<Request>,
		@Headers("stripe-signature") signature: string,
	) {
		const raw = req.rawBody;
		if (!raw) {
			throw new UnauthorizedException("Webhook sem corpo bruto disponível.");
		}
		if (!signature) {
			throw new UnauthorizedException("Webhook sem assinatura Stripe.");
		}
		await this.stripe.handleWebhook(raw, signature);
		return { received: true };
	}
}
