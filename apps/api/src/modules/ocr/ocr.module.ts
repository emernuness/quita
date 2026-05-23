import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { StorageModule } from "../storage/storage.module";
import { OcrConsentGuard } from "./ocr-consent.guard";
import { OcrQuotaGuard } from "./ocr-quota.guard";
import { OcrController } from "./ocr.controller";
import { OcrService } from "./ocr.service";

/**
 * Onda 4 + Bridge OCR Premium: OCR via OpenAI Vision (gpt-4o-mini).
 *
 * Spec: docs/quita-especificacao/03-bridge-ocr/BRIDGE_OCR_PREMIUM.md
 *
 * Endpoints expostos via OcrController:
 * - GET /ocr/quota                 — uso mensal vs limit (E1.4)
 * - POST /ocr/signed-upload-url    — URL R2 pre-assinada (E1.2)
 * - POST /ocr/extract-by-key       — OCR de imagem ja em R2 (E1.3)
 */
@Module({
	imports: [PrismaModule, AuthModule, StorageModule],
	controllers: [OcrController],
	providers: [OcrService, OcrQuotaGuard, OcrConsentGuard],
	exports: [OcrService, OcrQuotaGuard, OcrConsentGuard],
})
export class OcrModule {}
