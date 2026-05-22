import { Body, Controller, Headers, HttpCode, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { CurrentUser } from "../../common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { StripeService } from "./stripe.service";

@Controller("subscription")
export class SubscriptionController {
	constructor(private readonly stripe: StripeService) {}

	@Post("checkout")
	@UseGuards(JwtAuthGuard)
	async checkout(
		@CurrentUser("id") userId: string,
		@Body() body: { priceId: string; successUrl: string; cancelUrl: string },
	) {
		return this.stripe.createCheckoutSession({
			userId,
			priceId: body.priceId,
			successUrl: body.successUrl,
			cancelUrl: body.cancelUrl,
		});
	}

	/**
	 * Webhook publico (Stripe assina). Auth via header `stripe-signature`,
	 * nao via JWT. NaoSubmeter a CSRF (rota out-of-band).
	 */
	@Post("webhook")
	@HttpCode(200)
	async webhook(@Req() req: Request, @Headers("stripe-signature") signature: string) {
		const raw = (req as Request & { rawBody?: Buffer }).rawBody ?? Buffer.from("");
		await this.stripe.handleWebhook(raw, signature);
		return { received: true };
	}
}
