import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { validateEnv } from "./env";

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
	process.env = { ...ORIGINAL_ENV };
});

afterEach(() => {
	process.env = { ...ORIGINAL_ENV };
});

describe("validateEnv", () => {
	it("ok com vars minimas em dev", () => {
		process.env.NODE_ENV = "development";
		process.env.DATABASE_URL = "postgresql://x:y@localhost:5432/db";
		process.env.REDIS_URL = "redis://localhost:6379";
		process.env.JWT_SECRET = "short";
		process.env.REFRESH_TOKEN_HMAC_SECRET = "short";
		expect(() => validateEnv()).not.toThrow();
	});

	it("falha em prod se JWT_SECRET < 32 chars", () => {
		process.env.NODE_ENV = "production";
		process.env.DATABASE_URL = "postgresql://x:y@localhost:5432/db";
		process.env.REDIS_URL = "redis://localhost:6379";
		process.env.JWT_SECRET = "short";
		process.env.REFRESH_TOKEN_HMAC_SECRET = "x".repeat(32);
		expect(() => validateEnv()).toThrow(/JWT_SECRET/);
	});

	it("falha se STRIPE_SECRET_KEY definido sem STRIPE_WEBHOOK_SECRET", () => {
		process.env.NODE_ENV = "development";
		process.env.DATABASE_URL = "postgresql://x:y@localhost:5432/db";
		process.env.REDIS_URL = "redis://localhost:6379";
		process.env.JWT_SECRET = "x".repeat(32);
		process.env.REFRESH_TOKEN_HMAC_SECRET = "x".repeat(32);
		process.env.STRIPE_SECRET_KEY = "sk_test_xxx";
		process.env.STRIPE_WEBHOOK_SECRET = "";
		expect(() => validateEnv()).toThrow(/STRIPE_WEBHOOK_SECRET/);
	});

	it("falha se R2 vars parciais (2 de 3)", () => {
		process.env.NODE_ENV = "development";
		process.env.DATABASE_URL = "postgresql://x:y@localhost:5432/db";
		process.env.REDIS_URL = "redis://localhost:6379";
		process.env.JWT_SECRET = "x".repeat(32);
		process.env.REFRESH_TOKEN_HMAC_SECRET = "x".repeat(32);
		process.env.R2_ACCOUNT_ID = "acct";
		process.env.R2_ACCESS_KEY_ID = "ak";
		process.env.R2_SECRET_ACCESS_KEY = "";
		expect(() => validateEnv()).toThrow(/R2/);
	});
});
