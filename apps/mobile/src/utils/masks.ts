/**
 * Input masks for Brazilian formats
 */

/** Format phone: (41) 99999-9999 or (41) 9999-9999 */
export function maskPhone(raw: string): string {
	const digits = raw.replace(/\D/g, "").slice(0, 11);
	if (digits.length <= 2) return digits;
	if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
	if (digits.length <= 10) {
		return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
	}
	return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/** Strip phone mask to digits only */
export function unmaskPhone(masked: string): string {
	return masked.replace(/\D/g, "");
}

/** Format currency: R$ 1.234,56 (live typing, input in digits) */
export function maskCurrency(raw: string): string {
	const digits = raw.replace(/\D/g, "");
	if (!digits) return "";
	const cents = Number.parseInt(digits, 10);
	if (Number.isNaN(cents)) return "";
	const reais = Math.floor(cents / 100);
	const centavos = cents % 100;
	const reaisStr = reais.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
	return `R$ ${reaisStr},${String(centavos).padStart(2, "0")}`;
}

/** Parse masked currency to number: "R$ 1.234,56" → 1234.56 */
export function unmaskCurrency(masked: string): number {
	if (!masked) return 0;
	const cleaned = masked.replace("R$", "").replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
	const value = Number.parseFloat(cleaned);
	return Number.isNaN(value) ? 0 : value;
}

/** Format date: DD/MM/AAAA */
export function maskDate(raw: string): string {
	const digits = raw.replace(/\D/g, "").slice(0, 8);
	if (digits.length <= 2) return digits;
	if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
	return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

/** Parse DD/MM/AAAA to ISO date string YYYY-MM-DD */
export function unmaskDate(masked: string): string | undefined {
	const digits = masked.replace(/\D/g, "");
	if (digits.length !== 8) return undefined;
	const day = digits.slice(0, 2);
	const month = digits.slice(2, 4);
	const year = digits.slice(4, 8);
	const d = Number.parseInt(day, 10);
	const m = Number.parseInt(month, 10);
	const y = Number.parseInt(year, 10);
	if (d < 1 || d > 31 || m < 1 || m > 12 || y < 2000 || y > 2100) return undefined;
	const date = new Date(Number(year), Number(month) - 1, Number(day));
	if (
		date.getFullYear() !== Number(year) ||
		date.getMonth() !== Number(month) - 1 ||
		date.getDate() !== Number(day)
	)
		return undefined;
	return `${year}-${month}-${day}`;
}
