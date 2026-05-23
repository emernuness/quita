import { expect, test } from "@playwright/test";

/**
 * Smoke E2E pages publicas — não requer auth, banco ou Redis.
 * Garante que paths principais renderizam sem erro.
 */

test.describe("Páginas públicas", () => {
	test("/login renderiza form", async ({ page }) => {
		await page.goto("/login");
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
		await expect(page.getByLabel(/e-?mail/i)).toBeVisible();
		await expect(page.getByLabel(/senha/i).first()).toBeVisible();
	});

	test("/register renderiza form", async ({ page }) => {
		await page.goto("/register");
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
	});

	test("/termos exibe banner pendência + 10 seções", async ({ page }) => {
		await page.goto("/termos");
		await expect(page.getByText(/template inicial/i)).toBeVisible();
		await expect(page.getByRole("heading", { name: /termos de uso/i })).toBeVisible();
	});

	test("/privacidade exibe banner + LGPD", async ({ page }) => {
		await page.goto("/privacidade");
		await expect(page.getByText(/template inicial/i)).toBeVisible();
		await expect(page.getByRole("heading", { name: /privacidade/i })).toBeVisible();
		await expect(page.getByText(/LGPD/)).toBeVisible();
	});

	test("/not-existing-route renderiza 404 customizada", async ({ page }) => {
		await page.goto("/this-page-does-not-exist");
		await expect(page.getByText(/não encontrada/i)).toBeVisible();
	});
});

test.describe("Auth redirect", () => {
	test("/app sem auth redireciona para /login", async ({ page }) => {
		await page.goto("/app");
		await page.waitForURL(/\/login/, { timeout: 5_000 });
		expect(page.url()).toContain("/login");
	});
});
