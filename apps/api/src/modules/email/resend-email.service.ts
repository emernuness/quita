import { Injectable, Logger } from "@nestjs/common";

export interface SendEmailInput {
	to: string;
	subject: string;
	html: string;
	text?: string;
}

/**
 * Scaffold Resend (Onda 5). Em dev sem RESEND_API_KEY apenas loga.
 */
@Injectable()
export class ResendEmailService {
	private readonly logger = new Logger(ResendEmailService.name);
	private get isConfigured(): boolean {
		return typeof process.env.RESEND_API_KEY === "string" && process.env.RESEND_API_KEY.length > 0;
	}

	async send(input: SendEmailInput): Promise<{ id: string | null }> {
		if (!this.isConfigured) {
			this.logger.log({
				msg: "email.skipped (RESEND_API_KEY ausente)",
				to: input.to,
				subject: input.subject,
			});
			return { id: null };
		}
		// TODO Onda 5: import Resend client + chamar resend.emails.send().
		this.logger.log({ msg: "email.send", to: input.to, subject: input.subject });
		return { id: null };
	}
}
