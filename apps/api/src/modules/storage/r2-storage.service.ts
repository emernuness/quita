import { randomBytes } from "node:crypto";
import {
	DeleteObjectCommand,
	type DeleteObjectCommandInput,
	GetObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Injectable, Logger } from "@nestjs/common";

const DEFAULT_BUCKET = "quita-ocr-uploads";
const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1h

export interface UploadInput {
	keyPrefix: string; // ex: "ocr/{userId}"
	contentType: string; // ex: "image/png"
	body: Buffer;
}

export interface UploadResult {
	key: string;
	publicUrl: string | null;
}

@Injectable()
export class R2StorageService {
	private readonly logger = new Logger(R2StorageService.name);
	private readonly client: S3Client | null;
	private readonly bucket: string;
	private readonly publicUrl: string | null;

	constructor() {
		const accountId = process.env.R2_ACCOUNT_ID;
		const accessKeyId = process.env.R2_ACCESS_KEY_ID;
		const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
		this.bucket = process.env.R2_BUCKET ?? DEFAULT_BUCKET;
		this.publicUrl = process.env.R2_PUBLIC_URL ?? null;

		if (accountId && accessKeyId && secretAccessKey) {
			this.client = new S3Client({
				region: "auto",
				endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
				credentials: { accessKeyId, secretAccessKey },
			});
		} else {
			this.client = null;
		}
	}

	get isConfigured(): boolean {
		return this.client !== null;
	}

	async upload(input: UploadInput): Promise<UploadResult | null> {
		if (!this.client) {
			this.logger.warn({ msg: "r2.upload.skipped (R2 nao configurado)", prefix: input.keyPrefix });
			return null;
		}
		const key = `${input.keyPrefix}/${Date.now()}-${randomBytes(8).toString("hex")}`;
		try {
			await this.client.send(
				new PutObjectCommand({
					Bucket: this.bucket,
					Key: key,
					Body: input.body,
					ContentType: input.contentType,
				}),
			);
			const publicUrl = this.publicUrl ? `${this.publicUrl.replace(/\/$/, "")}/${key}` : null;
			this.logger.log({ msg: "r2.upload", key, size: input.body.length });
			return { key, publicUrl };
		} catch (err) {
			this.logger.error({ msg: "r2.upload.failed", key, err });
			throw err;
		}
	}

	async getSignedDownloadUrl(key: string): Promise<string | null> {
		if (!this.client) return null;
		return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: key }), {
			expiresIn: SIGNED_URL_TTL_SECONDS,
		});
	}

	async delete(key: string): Promise<void> {
		if (!this.client) return;
		const input: DeleteObjectCommandInput = { Bucket: this.bucket, Key: key };
		try {
			await this.client.send(new DeleteObjectCommand(input));
			this.logger.log({ msg: "r2.delete", key });
		} catch (err) {
			this.logger.error({ msg: "r2.delete.failed", key, err });
		}
	}

	/**
	 * Deleta keys antigos por prefixo. Cloudflare R2 nao tem lifecycle
	 * nativo via SDK em todas as contas — implementacao via batch delete
	 * fica em OcrCleanupProcessor (chama delete por key gravado em DB).
	 */
	bucketName(): string {
		return this.bucket;
	}
}
