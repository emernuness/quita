import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import OpenAI from "openai";
import { z } from "zod";

export interface OcrExtractInput {
	imageBase64: string; // dataURL ou base64 puro
	type: "boleto" | "settlement_proposal" | "contract";
}

export interface OcrExtractedBoleto {
	type: "boleto";
	creditor: string | null;
	amount: number | null;
	dueDate: string | null;
	confidence: "high" | "medium" | "low";
}

const boletoResponseSchema = z.object({
	creditor: z.string().nullable(),
	amount: z.number().nullable(),
	dueDate: z.string().nullable(),
	confidence: z.enum(["high", "medium", "low"]),
});

const PROMPTS: Record<OcrExtractInput["type"], string> = {
	boleto:
		"Extraia do boleto: credor (nome da empresa), valor total em reais (numero), data de vencimento (YYYY-MM-DD). Retorne JSON estrito: {creditor, amount, dueDate, confidence}. confidence='high' se todos os campos legiveis e nao ambiguos; 'medium' se faltar 1 campo; 'low' caso contrario.",
	settlement_proposal:
		"Extraia da proposta de acordo: credor, valor a vista, parcelas (se houver), valor da parcela, prazo. Retorne JSON.",
	contract:
		"Extraia do contrato: credor, valor total, taxa de juros mensal, prazo total em meses. Retorne JSON.",
};

const VISION_MODEL = "gpt-4o-mini";

/**
 * OCR via OpenAI Vision (gpt-4o-mini). No-op se OPENAI_API_KEY ausente.
 */
@Injectable()
export class OcrService {
	private readonly logger = new Logger(OcrService.name);
	private readonly client: OpenAI | null;

	constructor() {
		const key = process.env.OPENAI_API_KEY;
		this.client = key ? new OpenAI({ apiKey: key }) : null;
	}

	async extract(input: OcrExtractInput): Promise<OcrExtractedBoleto> {
		if (!this.client) {
			this.logger.warn("OPENAI_API_KEY ausente — OCR indisponivel.");
			throw new ServiceUnavailableException("OCR não está configurado nesta instalação.");
		}

		const imageDataUrl = input.imageBase64.startsWith("data:")
			? input.imageBase64
			: `data:image/png;base64,${input.imageBase64}`;

		const completion = await this.client.chat.completions.create({
			model: VISION_MODEL,
			response_format: { type: "json_object" },
			messages: [
				{ role: "system", content: PROMPTS[input.type] },
				{
					role: "user",
					content: [
						{ type: "text", text: "Extraia os dados desta imagem." },
						{ type: "image_url", image_url: { url: imageDataUrl } },
					],
				},
			],
		});

		const raw = completion.choices[0]?.message?.content;
		if (!raw) {
			this.logger.warn("OCR retornou resposta vazia.");
			return { type: "boleto", creditor: null, amount: null, dueDate: null, confidence: "low" };
		}

		try {
			const parsed = boletoResponseSchema.parse(JSON.parse(raw));
			return { type: "boleto", ...parsed };
		} catch (err) {
			this.logger.warn({ msg: "OCR parse failure", raw, err });
			return { type: "boleto", creditor: null, amount: null, dueDate: null, confidence: "low" };
		}
	}
}
