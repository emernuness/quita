/**
 * Formats a number as BRL currency string: "R$ 1.234,56"
 */
export declare function formatBRL(value: number): string;
/**
 * Formats a number as compact BRL: R$ 8K, R$ 1,6K, R$ 24,5K, R$ 1,2M
 * Values below 1000 are displayed normally: R$ 850,00
 */
export declare function formatBRLCompact(value: number): string;
/**
 * Parses a BRL-formatted string ("1.234,56" or "R$ 1.234,56") to a number.
 */
export declare function parseBRL(value: string): number;
/**
 * Validates a Brazilian CPF number with digit verification.
 */
export declare function isValidCPF(cpf: string): boolean;
/**
 * Validates a Brazilian phone number (10 or 11 digits, optionally prefixed with +55).
 */
export declare function isValidPhone(phone: string): boolean;
/**
 * Formats a phone number as "(11) 99999-9999".
 */
export declare function formatPhone(phone: string): string;
/**
 * Formats a date as "dd/mm/yyyy" (Brazilian format).
 */
export declare function formatDateBR(date: Date | string): string;
/**
 * Formats a date as "marco 2026" (month name in Portuguese + year).
 */
export declare function formatMonthBR(date: Date | string): string;
/**
 * Returns a relative time string in Portuguese:
 * "há 2 horas", "ontem", "há 3 dias"
 */
export declare function getRelativeTime(date: Date | string): string;
//# sourceMappingURL=index.d.ts.map