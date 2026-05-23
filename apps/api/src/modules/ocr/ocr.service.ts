import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import OpenAI from "openai";
import { z } from "zod";

export type OcrInputType = "boleto" | "settlement_proposal" | "contract";

export interface OcrExtractInput {
	imageBase64: string;
	type: OcrInputType;
}

const confidence = z.enum(["high", "medium", "low"]);

const boletoSchema = z.object({
	creditor: z.string().nullable(),
	amount: z.number().nullable(),
	dueDate: z.string().nullable(),
	confidence,
});
const settlementSchema = z.object({
	creditor: z.string().nullable(),
	cashAmount: z.number().nullable(),
	installments: z.number().int().nullable(),
	installmentAmount: z.number().nullable(),
	deadline: z.string().nullable(),
	confidence,
});
const contractSchema = z.object({
	creditor: z.string().nullable(),
	totalAmount: z.number().nullable(),
	interestRateMonthly: z.number().nullable(),
	totalInstallments: z.number().int().nullable(),
	confidence,
});

export type OcrExtractedBoleto = { type: "boleto" } & z.infer<typeof boletoSchema>;
export type OcrExtractedSettlement = { type: "settlement_proposal" } & z.infer<
	typeof settlementSchema
>;
export type OcrExtractedContract = { type: "contract" } & z.infer<typeof contractSchema>;
export type OcrExtracted = OcrExtractedBoleto | OcrExtractedSettlement | OcrExtractedContract;

const PROMPTS: Record<OcrInputType, string> = {
	boleto:
		"Extraia do boleto: credor (nome da empresa), valor total em reais (numero), data de vencimento (YYYY-MM-DD). Retorne JSON estrito: {creditor, amount, dueDate, confidence}.",
	settlement_proposal:
		"Extraia da proposta de acordo: credor, valor a vista (cashAmount), parcelas (installments), valor da parcela (installmentAmount), prazo limite (deadline YYYY-MM-DD). Retorne JSON: {creditor, cashAmount, installments, installmentAmount, deadline, confidence}.",
	contract:
		"Extraia do contrato: credor, valor total (totalAmount), taxa de juros mensal em fracao (interestRateMonthly), prazo total em meses (totalInstallments). Retorne JSON: {creditor, totalAmount, interestRateMonthly, totalInstallments, confidence}.",
};

const VISION_MODEL = "gpt-4o-mini";

/**
 * OCR via OpenAI Vision (gpt-4o-mini). No-op se OPENAI_API_KEY ausente.
 * NUNCA logar input.imageBase64 (PII/dado financeiro).
 */
@Injectable()
export class OcrService {
	private readonly logger = new Logger(OcrService.name);
	private readonly client: OpenAI | null;

	constructor() {
		const key = process.env.OPENAI_API_KEY;
		this.client = key ? new OpenAI({ apiKey: key }) : null;
	}

	async extract(input: OcrExtractInput): Promise<OcrExtracted> {
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
			this.logger.warn({ msg: "OCR resposta vazia", inputType: input.type });
			return this.emptyResult(input.type);
		}

		try {
			const parsed = JSON.parse(raw);
			switch (input.type) {
				case "boleto":
					return { type: "boleto", ...boletoSchema.parse(parsed) };
				case "settlement_proposal":
					return { type: "settlement_proposal", ...settlementSchema.parse(parsed) };
				case "contract":
					return { type: "contract", ...contractSchema.parse(parsed) };
			}
		} catch (err) {
			this.logger.warn({ msg: "OCR parse failure", inputType: input.type, raw, err });
			return this.emptyResult(input.type);
		}
	}

	private emptyResult(type: OcrInputType): OcrExtracted {
		switch (type) {
			case "boleto":
				return { type: "boleto", creditor: null, amount: null, dueDate: null, confidence: "low" };
			case "settlement_proposal":
				return {
					type: "settlement_proposal",
					creditor: null,
					cashAmount: null,
					installments: null,
					installmentAmount: null,
					deadline: null,
					confidence: "low",
				};
			case "contract":
				return {
					type: "contract",
					creditor: null,
					totalAmount: null,
					interestRateMonthly: null,
					totalInstallments: null,
					confidence: "low",
				};
		}
	}
}
