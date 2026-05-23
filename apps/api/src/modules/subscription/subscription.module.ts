import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { StripeService } from "./stripe.service";
import { SubscriptionController } from "./subscription.controller";

/**
 * Onda 4: Premium via Stripe Connect BR.
 *
 * Scaffold pendente de:
 * - STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET no .env
 * - CNPJ e conta PJ p/ ativar Connect BR
 * - Produtos/precos cadastrados no dashboard Stripe
 */
@Module({
	imports: [PrismaModule],
	controllers: [SubscriptionController],
	providers: [StripeService],
	exports: [StripeService],
})
export class SubscriptionModule {}
