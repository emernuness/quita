import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("smoke", () => {
	it("vitest + RTL harness is wired", () => {
		render(<p>quita</p>);
		expect(screen.getByText("quita")).toBeInTheDocument();
	});
});
