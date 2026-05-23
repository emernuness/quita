import { z } from "zod";

const envSchema = z
	.object({
		NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
		PORT: z.coerce.number().int().min(1).max(65535).default(3000),

		// DB + cache
		DATABASE_URL: z.string().url("DATABASE_URL deve ser URL valida"),
		REDIS_URL: z.string().min(1, "REDIS_URL obrigatorio"),

		// Auth
		JWT_SECRET: z.string().min(1, "JWT_SECRET obrigatorio"),
		REFRESH_TOKEN_HMAC_SECRET: z.string().min(1, "REFRESH_TOKEN_HMAC_SECRET obrigatorio"),

		// CORS
		CORS_ORIGINS: z.string().optional(),

		// Observabilidade (opcional)
		SENTRY_DSN: z.string().url().optional().or(z.literal("")),
		RELEASE_SHA: z.string().optional(),
		POSTHOG_API_KEY: z.string().optional(),
		POSTHOG_HOST: z.string().url().optional().or(z.literal("")),

		// Email (opcional)
		RESEND_API_KEY: z.string().optional(),
		RESEND_FROM: z.string().optional(),

		// Stripe (opcional, mas se um lado existe os 2 sao obrigatorios)
		STRIPE_SECRET_KEY: z.string().optional(),
		STRIPE_WEBHOOK_SECRET: z.string().optional(),

		// OpenAI (opcional)
		OPENAI_API_KEY: z.string().optional(),

		// R2 Storage (opcional, mas requer todos juntos)
		R2_ACCOUNT_ID: z.string().optional(),
		R2_ACCESS_KEY_ID: z.string().optional(),
		R2_SECRET_ACCESS_KEY: z.string().optional(),
		R2_BUCKET: z.string().optional(),
		R2_PUBLIC_URL: z.string().optional(),
	})
	.refine((env) => env.NODE_ENV !== "production" || env.JWT_SECRET.length >= 32, {
		message: "JWT_SECRET deve ter min 32 chars em production",
		path: ["JWT_SECRET"],
	})
	.refine((env) => env.NODE_ENV !== "production" || env.REFRESH_TOKEN_HMAC_SECRET.length >= 32, {
		message: "REFRESH_TOKEN_HMAC_SECRET deve ter min 32 chars em production",
		path: ["REFRESH_TOKEN_HMAC_SECRET"],
	})
	.refine((env) => !env.STRIPE_SECRET_KEY || !!env.STRIPE_WEBHOOK_SECRET, {
		message:
			"STRIPE_WEBHOOK_SECRET obrigatorio quando STRIPE_SECRET_KEY definido (validacao webhook)",
		path: ["STRIPE_WEBHOOK_SECRET"],
	})
	.refine(
		(env) => {
			const r2Vars = [env.R2_ACCOUNT_ID, env.R2_ACCESS_KEY_ID, env.R2_SECRET_ACCESS_KEY];
			const set = r2Vars.filter((v) => !!v).length;
			return set === 0 || set === 3;
		},
		{
			message:
				"R2 storage requer R2_ACCOUNT_ID + R2_ACCESS_KEY_ID + R2_SECRET_ACCESS_KEY juntos (ou nenhum)",
			path: ["R2_ACCOUNT_ID"],
		},
	);

export type Env = z.infer<typeof envSchema>;

/**
 * Valida env vars no boot. Lanca erro detalhado se invalido.
 * Chame em main.ts ANTES de NestFactory.create.
 */
export function validateEnv(): Env {
	const parsed = envSchema.safeParse(process.env);
	if (!parsed.success) {
		const issues = parsed.error.issues
			.map((i) => `  - ${i.path.join(".")}: ${i.message}`)
			.join("\n");
		throw new Error(`Variaveis de ambiente invalidas:\n${issues}`);
	}
	return parsed.data;
}
