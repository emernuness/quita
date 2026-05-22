import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";

/**
 * Scaffold OcrService (Onda 4).
 *
 * Quando OPENAI_API_KEY presente: chama gpt-4o-mini vision com imagem
 * do boleto/contrato + prompt estruturado, retorna JSON validado por Zod.
 */
export interface OcrExtractInput {
	imageBase64: string;
	type: "boleto" | "settlement_proposal" | "contract";
}

export interface OcrExtractedBoleto {
	type: "boleto";
	creditor: string | null;
	amount: number | null;
	dueDate: string | null;
	confidence: "high" | "medium" | "low";
}

@Injectable()
export class OcrService {
	private readonly logger = new Logger(OcrService.name);
	private get isConfigured(): boolean {
		return typeof process.env.OPENAI_API_KEY === "string" && process.env.OPENAI_API_KEY.length > 0;
	}

	async extract(input: OcrExtractInput): Promise<OcrExtractedBoleto> {
		if (!this.isConfigured) {
			this.logger.warn("OPENAI_API_KEY ausente — OCR indisponivel.");
			throw new ServiceUnavailableException("OCR não está configurado nesta instalação.");
		}
		// TODO Onda 4: chamar OpenAI Vision + validar via Zod.
		void input;
		throw new ServiceUnavailableException("OCR — implementacao pendente Onda 4.");
	}
}
