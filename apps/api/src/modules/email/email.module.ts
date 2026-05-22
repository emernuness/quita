import { Module } from "@nestjs/common";
import { ResendEmailService } from "./resend-email.service";

/**
 * Onda 5: emails transacionais via Resend.
 *
 * Pendente:
 * - RESEND_API_KEY no env
 * - Pacote `resend` (pnpm add resend)
 * - Domain configurado com DKIM/SPF/DMARC validos
 * - Templates de email (welcome, password_reset, monthly_plan, alerts)
 */
@Module({
	providers: [ResendEmailService],
	exports: [ResendEmailService],
})
export class EmailModule {}
