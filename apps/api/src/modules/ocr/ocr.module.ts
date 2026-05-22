import { Module } from "@nestjs/common";
import { OcrService } from "./ocr.service";

/**
 * Onda 4: OCR via OpenAI Vision (gpt-4o-mini) p/ boletos/contratos.
 *
 * Spec: docs/quita-especificacao/03-bridge-ocr/BRIDGE_OCR_PREMIUM.md
 *
 * Scaffold pendente de:
 * - OPENAI_API_KEY no env
 * - Pacote `openai` (pnpm add openai)
 * - Schemas Zod p/ extracao estruturada
 * - Quota/budget por usuario (anti-abuse)
 */
@Module({
	providers: [OcrService],
	exports: [OcrService],
})
export class OcrModule {}
