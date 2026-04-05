import type { ZodSchema, ZodIssue } from "zod";

/**
 * Validate data with a Zod schema and return field-level errors
 */
export function validateWithZod<T>(
	schema: ZodSchema<T>,
	data: unknown,
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
	const result = schema.safeParse(data);
	if (result.success) {
		return { success: true, data: result.data };
	}
	const errors: Record<string, string> = {};
	for (const issue of result.error.issues) {
		const field = issue.path.length > 0 ? issue.path.join(".") : "_root";
		if (!errors[field]) {
			errors[field] = translateZodError(issue);
		}
	}
	return { success: false, errors };
}

/** Translate common Zod error messages to Portuguese */
function translateZodError(issue: ZodIssue): string {
	const { message, code } = issue;
	if (message === "Required") return "Campo obrigatório";
	if (code === "too_small") {
		if ("minimum" in issue && typeof issue.minimum === "number") {
			if (issue.type === "string") return `Mínimo de ${issue.minimum} caracteres`;
			if (issue.type === "number") return `Valor mínimo: ${issue.minimum}`;
			if (issue.type === "array") return `Selecione pelo menos ${issue.minimum}`;
		}
		return "Valor mínimo não atingido";
	}
	if (code === "invalid_string") {
		if ("validation" in issue) {
			if (issue.validation === "email") return "E-mail inválido";
			if (issue.validation === "uuid") return "Identificador inválido";
		}
	}
	if (message.includes("Invalid email")) return "E-mail inválido";
	if (message.includes("Telefone brasileiro")) return "Celular inválido";
	if (message.includes("Invalid date")) return "Data inválida";
	if (message.includes("Invalid uuid")) return "Identificador inválido";
	if (message.includes("String must contain at least"))
		return message.replace(/String must contain at least (\d+) character\(s\)/, "Mínimo de $1 caracteres");
	return message;
}
