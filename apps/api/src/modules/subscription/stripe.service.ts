import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import StripeLib from "stripe";
import { PrismaService } from "../../prisma/prisma.service";

type StripeInstance = InstanceType<typeof StripeLib>;
type StripeEventArg = Parameters<StripeInstance["webhooks"]["constructEvent"]>;
type StripeEvent = ReturnType<StripeInstance["webhooks"]["constructEvent"]>;
type CheckoutSessionResponse = Awaited<
	ReturnType<StripeInstance["checkout"]["sessions"]["create"]>
>;

export interface CheckoutSessionInput {
	userId: string;
	priceId: string;
	successUrl: string;
	cancelUrl: string;
	customerEmail?: string;
}

export interface CheckoutSessionResult {
	id: string;
	url: string;
}

@Injectable()
export class StripeService {
	private readonly logger = new Logger(StripeService.name);
	private readonly client: StripeInstance | null;
	private readonly webhookSecret: string | null;

	constructor(private readonly prisma: PrismaService) {
		const key = process.env.STRIPE_SECRET_KEY;
		this.client = key ? new StripeLib(key) : null;
		this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? null;
	}

	private require(): StripeInstance {
		if (!this.client) {
			throw new ServiceUnavailableException("Pagamentos não estão configurados nesta instalação.");
		}
		return this.client;
	}

	async createCheckoutSession(input: CheckoutSessionInput): Promise<CheckoutSessionResult> {
		const stripe = this.require();
		const session: CheckoutSessionResponse = await stripe.checkout.sessions.create({
			mode: "subscription",
			line_items: [{ price: input.priceId, quantity: 1 }],
			success_url: input.successUrl,
			cancel_url: input.cancelUrl,
			customer_email: input.customerEmail,
			client_reference_id: input.userId,
			metadata: { userId: input.userId },
		});
		if (!session.url || !session.id) {
			throw new ServiceUnavailableException("Sessão de pagamento inválida.");
		}
		return { id: session.id, url: session.url };
	}

	async handleWebhook(rawBody: Buffer, signature: string): Promise<void> {
		if (!this.client || !this.webhookSecret) return;

		let event: StripeEvent;
		try {
			const args: StripeEventArg = [rawBody, signature, this.webhookSecret];
			event = this.client.webhooks.constructEvent(...args);
		} catch (err) {
			this.logger.error("Stripe webhook signature invalida", err as Error);
			throw new ServiceUnavailableException("Assinatura de webhook inválida.");
		}

		switch (event.type) {
			case "checkout.session.completed": {
				const session = event.data.object as {
					metadata?: Record<string, string | null>;
					client_reference_id?: string | null;
					expires_at?: number | null;
				};
				const userId = session.metadata?.userId ?? session.client_reference_id ?? null;
				if (userId) {
					await this.prisma.user.update({
						where: { id: userId },
						data: {
							planType: "premium",
							planExpiresAt: session.expires_at ? new Date(session.expires_at * 1000) : null,
						},
					});
					this.logger.log({ msg: "stripe.checkout.completed", userId });
				}
				break;
			}
			case "invoice.payment_failed": {
				const invoice = event.data.object as { customer?: string | null };
				this.logger.warn({ msg: "stripe.invoice.payment_failed", customerId: invoice.customer });
				break;
			}
			case "customer.subscription.deleted": {
				const sub = event.data.object as { customer?: string | null };
				this.logger.warn({ msg: "stripe.subscription.deleted", customerId: sub.customer });
				break;
			}
			default:
				this.logger.debug({ msg: "stripe.event.ignored", type: event.type });
		}
	}
}
