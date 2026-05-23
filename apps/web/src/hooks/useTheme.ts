"use client";

import { useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "quita.theme";

function applyTheme(t: Theme) {
	if (typeof document === "undefined") return;
	const isDark =
		t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
	document.documentElement.classList.toggle("dark", isDark);
}

export function useTheme() {
	const [theme, setThemeState] = useState<Theme>("system");

	// Carrega preferência do localStorage no mount + aplica
	useEffect(() => {
		const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system";
		setThemeState(stored);
		applyTheme(stored);

		// Re-aplica se sistema muda e usuário está em "system"
		const mq = window.matchMedia("(prefers-color-scheme: dark)");
		const onChange = () => {
			const current = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system";
			if (current === "system") applyTheme("system");
		};
		mq.addEventListener("change", onChange);
		return () => mq.removeEventListener("change", onChange);
	}, []);

	function setTheme(next: Theme) {
		setThemeState(next);
		localStorage.setItem(STORAGE_KEY, next);
		applyTheme(next);
	}

	return { theme, setTheme };
}

/**
 * Script inline para aplicar tema antes da hidratação (evita FOUC).
 * Conteúdo fixo escrito por nós — sem input externo, sem risco XSS.
 */
export const themeInitScript = `
(function() {
	try {
		var t = localStorage.getItem('${STORAGE_KEY}') || 'system';
		var isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
		if (isDark) document.documentElement.classList.add('dark');
	} catch (e) {}
})();
`;
