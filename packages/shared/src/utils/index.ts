// ── Currency ────────────────────────────────────────────────────────

/**
 * Formats a number as BRL currency string: "R$ 1.234,56"
 */
export function formatBRL(value: number): string {
	return value.toLocaleString("pt-BR", {
		style: "currency",
		currency: "BRL",
	});
}

/**
 * Formats a number as compact BRL: R$ 8K, R$ 1,6K, R$ 24,5K, R$ 1,2M
 * Values below 1000 are displayed normally: R$ 850,00
 */
export function formatBRLCompact(value: number): string {
	const abs = Math.abs(value);
	const sign = value < 0 ? "-" : "";

	if (abs >= 1_000_000) {
		const m = abs / 1_000_000;
		const formatted = m % 1 === 0 ? `${m}` : m.toFixed(1).replace(".", ",");
		return `${sign}R$ ${formatted}M`;
	}
	if (abs >= 1_000) {
		const k = abs / 1_000;
		const formatted = k % 1 === 0 ? `${k}` : k.toFixed(1).replace(".", ",");
		return `${sign}R$ ${formatted}K`;
	}
	return formatBRL(value);
}

/**
 * Parses a BRL-formatted string ("1.234,56" or "R$ 1.234,56") to a number.
 */
export function parseBRL(value: string): number {
	const cleaned = value
		.replace(/R\$\s?/, "")
		.replace(/\./g, "")
		.replace(",", ".");
	const num = Number.parseFloat(cleaned);
	return Number.isNaN(num) ? 0 : num;
}

// ── Validation ─────────────────────────────────────────────────────

/**
 * Validates a Brazilian CPF number with digit verification.
 */
export function isValidCPF(cpf: string): boolean {
	const digits = cpf.replace(/\D/g, "");
	if (digits.length !== 11) return false;

	// Reject known invalid sequences (all same digit)
	if (/^(\d)\1{10}$/.test(digits)) return false;

	// First check digit
	let sum = 0;
	for (let i = 0; i < 9; i++) {
		sum += Number.parseInt(digits.charAt(i), 10) * (10 - i);
	}
	let remainder = (sum * 10) % 11;
	if (remainder === 10) remainder = 0;
	if (remainder !== Number.parseInt(digits.charAt(9), 10)) return false;

	// Second check digit
	sum = 0;
	for (let i = 0; i < 10; i++) {
		sum += Number.parseInt(digits.charAt(i), 10) * (11 - i);
	}
	remainder = (sum * 10) % 11;
	if (remainder === 10) remainder = 0;
	if (remainder !== Number.parseInt(digits.charAt(10), 10)) return false;

	return true;
}

/**
 * Validates a Brazilian phone number (10 or 11 digits, optionally prefixed with +55).
 */
export function isValidPhone(phone: string): boolean {
	const digits = phone.replace(/\D/g, "");
	// With country code: 12-13 digits; without: 10-11 digits
	if (digits.startsWith("55")) {
		return digits.length >= 12 && digits.length <= 13;
	}
	return digits.length >= 10 && digits.length <= 11;
}

/**
 * Formats a phone number as "(11) 99999-9999".
 */
export function formatPhone(phone: string): string {
	const digits = phone.replace(/\D/g, "");
	const local = digits.startsWith("55") ? digits.slice(2) : digits;

	if (local.length === 11) {
		return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
	}
	if (local.length === 10) {
		return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
	}
	return phone; // Return as-is if unexpected length
}

// ── Date ───────────────────────────────────────────────────────────

const MONTHS_PT = [
	"janeiro",
	"fevereiro",
	"março",
	"abril",
	"maio",
	"junho",
	"julho",
	"agosto",
	"setembro",
	"outubro",
	"novembro",
	"dezembro",
] as const;

function toDate(date: Date | string): Date {
	return typeof date === "string" ? new Date(date) : date;
}

/**
 * Formats a date as "dd/mm/yyyy" (Brazilian format).
 */
export function formatDateBR(date: Date | string): string {
	const d = toDate(date);
	const day = String(d.getDate()).padStart(2, "0");
	const month = String(d.getMonth() + 1).padStart(2, "0");
	const year = d.getFullYear();
	return `${day}/${month}/${year}`;
}

/**
 * Formats a date as "marco 2026" (month name in Portuguese + year).
 */
export function formatMonthBR(date: Date | string): string {
	const d = toDate(date);
	return `${MONTHS_PT[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Returns a relative time string in Portuguese:
 * "há 2 horas", "ontem", "há 3 dias"
 */
export function getRelativeTime(date: Date | string): string {
	const d = toDate(date);
	const now = new Date();
	const diffMs = now.getTime() - d.getTime();

	if (diffMs < 0) return "agora";

	const diffSeconds = Math.floor(diffMs / 1000);
	const diffMinutes = Math.floor(diffSeconds / 60);
	const diffHours = Math.floor(diffMinutes / 60);
	const diffDays = Math.floor(diffHours / 24);

	if (diffSeconds < 60) return "agora";
	if (diffMinutes < 60) {
		return diffMinutes === 1 ? "há 1 minuto" : `há ${diffMinutes} minutos`;
	}
	if (diffHours < 24) {
		return diffHours === 1 ? "há 1 hora" : `há ${diffHours} horas`;
	}
	if (diffDays === 1) return "ontem";
	if (diffDays < 30) return `há ${diffDays} dias`;
	const diffMonths = Math.floor(diffDays / 30);
	if (diffMonths < 12) {
		return diffMonths === 1 ? "há 1 mês" : `há ${diffMonths} meses`;
	}
	const diffYears = Math.floor(diffMonths / 12);
	return diffYears === 1 ? "há 1 ano" : `há ${diffYears} anos`;
}
