import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import type { PrismaService } from "../../prisma/prisma.service";

/**
 * Stripe Service scaffold (Onda 4).
 *
 * Implementacao real depende de:
 * - STRIPE_SECRET_KEY no env
 * - Pacote `stripe` instalado (pnpm add stripe @stripe/stripe-js)
 * - Webhook signing secret
 * - CNPJ ativo + Connect BR aprovado
 *
 * Por ora expoe interface estavel — implementacao stub joga 503.
 */
export interface CheckoutSessionInput {
	userId: string;
	priceId: string;
	successUrl: string;
	cancelUrl: string;
}

export interface CheckoutSessionResult {
	id: string;
	url: string;
}

@Injectable()
export class StripeService {
	private readonly logger = new Logger(StripeService.name);
	private get isConfigured(): boolean {
		return (
			typeof process.env.STRIPE_SECRET_KEY === "string" && process.env.STRIPE_SECRET_KEY.length > 0
		);
	}

	constructor(private readonly prisma: PrismaService) {}

	async createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSessionResult> {
		if (!this.isConfigured) {
			this.logger.warn("STRIPE_SECRET_KEY ausente — checkout indisponivel.");
			throw new ServiceUnavailableException("Pagamentos não estão configurados nesta instalação.");
		}
		// TODO Onda 4: import Stripe + criar Checkout Session real.
		void input;
		throw new ServiceUnavailableException("Stripe Checkout — implementacao pendente Onda 4.");
	}

	async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
		if (!this.isConfigured) return; // ignora em dev sem chaves
		// TODO Onda 4: stripe.webhooks.constructEvent + roteamento de eventos
		// (checkout.session.completed -> upgrade plan, invoice.payment_failed -> downgrade, etc).
		void rawBody;
		void signature;
	}
}
