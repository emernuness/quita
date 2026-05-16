export function onlyDigits(value: string): string {
	return value.replace(/\D/g, "");
}

export function maskBRL(raw: string): string {
	const digits = raw.replace(/\D/g, "");
	if (!digits) return "";
	const n = Number.parseInt(digits, 10) / 100;
	return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function unmaskBRL(value: string): number {
	const digits = value.replace(/\D/g, "");
	if (!digits) return 0;
	return Number.parseInt(digits, 10) / 100;
}

export function maskPhone(raw: string): string {
	const d = raw.replace(/\D/g, "").slice(0, 11);
	if (d.length <= 2) return d;
	if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
	if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
	return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function maskDate(raw: string): string {
	const d = raw.replace(/\D/g, "").slice(0, 8);
	if (d.length <= 2) return d;
	if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
	return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}
