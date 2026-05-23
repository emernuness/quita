import { Module } from "@nestjs/common";
import { R2StorageService } from "./r2-storage.service";

/**
 * Storage via Cloudflare R2 (S3-compatible, ~10x mais barato que S3 + zero egress fee).
 *
 * Env vars necessarias para ativar:
 * - R2_ACCOUNT_ID
 * - R2_ACCESS_KEY_ID
 * - R2_SECRET_ACCESS_KEY
 * - R2_BUCKET (default: quita-ocr-uploads)
 * - R2_PUBLIC_URL (https://pub-<id>.r2.dev ou dominio custom)
 *
 * Sem essas vars, service eh no-op (uploads retornam null).
 */
@Module({
	providers: [R2StorageService],
	exports: [R2StorageService],
})
export class StorageModule {}
