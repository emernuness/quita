import { Injectable, Logger } from "@nestjs/common";
import { Resend } from "resend";

export interface SendEmailInput {
	to: string;
	subject: string;
	html: string;
	text?: string;
}

/**
 * Resend transactional email. No-op se RESEND_API_KEY ausente.
 */
@Injectable()
export class ResendEmailService {
	private readonly logger = new Logger(ResendEmailService.name);
	private readonly client: Resend | null;
	private readonly fromAddress: string;

	constructor() {
		const key = process.env.RESEND_API_KEY;
		this.client = key ? new Resend(key) : null;
		this.fromAddress = process.env.RESEND_FROM ?? "Quita <noreply@quita.com.br>";
	}

	async send(input: SendEmailInput): Promise<{ id: string | null }> {
		if (!this.client) {
			this.logger.log({
				msg: "email.skipped (RESEND_API_KEY ausente)",
				to: input.to,
				subject: input.subject,
			});
			return { id: null };
		}

		try {
			const res = await this.client.emails.send({
				from: this.fromAddress,
				to: input.to,
				subject: input.subject,
				html: input.html,
				text: input.text,
			});
			this.logger.log({
				msg: "email.send",
				to: input.to,
				subject: input.subject,
				id: res.data?.id,
			});
			return { id: res.data?.id ?? null };
		} catch (err) {
			this.logger.error("Falha ao enviar email via Resend", err as Error);
			throw err;
		}
	}
}
