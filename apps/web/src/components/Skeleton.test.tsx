import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SkeletonCard, SkeletonLine, SkeletonList } from "./Skeleton";

describe("Skeleton", () => {
	it("SkeletonLine renderiza div animada", () => {
		const { container } = render(<SkeletonLine />);
		const div = container.firstChild as HTMLElement;
		expect(div.className).toContain("animate-pulse");
	});

	it("SkeletonCard renderiza N linhas + título", () => {
		const { container } = render(<SkeletonCard lines={4} />);
		const card = container.firstChild as HTMLElement;
		expect(card.className).toContain("animate-pulse");
		// 1 title + 4 lines = 5 divs
		const inner = card.querySelector("div");
		expect(inner?.children.length).toBe(5);
	});

	it("SkeletonList renderiza N cards", () => {
		const { container } = render(<SkeletonList count={3} />);
		const wrapper = container.firstChild as HTMLElement;
		expect(wrapper.children.length).toBe(3);
	});

	it("SkeletonList default count=3", () => {
		const { container } = render(<SkeletonList />);
		const wrapper = container.firstChild as HTMLElement;
		expect(wrapper.children.length).toBe(3);
	});
});
