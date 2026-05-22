import { describe, expect, it } from "vitest";

describe("smoke", () => {
	it("vitest harness is wired", () => {
		expect(1 + 1).toBe(2);
	});
});
