// Quita brand tokens — derivados de quita-brand.json v1.0
// Mantém as chaves originais para compatibilidade com telas existentes
// e adiciona a paleta completa do brand guide.

export const colors = {
	// Backgrounds
	background: "#F4F6F4",
	surface: "#FFFFFF",

	// Texto
	textPrimary: "#1A2030",
	textSecondary: "#5A6560",
	textTertiary: "#9AA59C",

	// Acentos / ações (substitui antigo "accentBlue")
	accentBlue: "#0A5248", // legacy alias → Teal Dark (primary)
	accentTeal: "#0A5248",
	accentGreen: "#3DC55C",
	accentGreenLight: "#5DD67A",
	accentTealMid: "#0E6B58",

	// Semânticas
	successGreen: "#2EA84A",
	dangerRed: "#B85430",
	warningOrange: "#C48E1C",
	infoTeal: "#0E8C74",

	// Bordas / superfícies neutras
	border: "#E4E8E5",
	borderStrong: "#1A2030",
	gray100: "#F4F6F4",
	gray200: "#E4E8E5",
	gray400: "#9AA59C",
	gray600: "#5A6560",

	// Backgrounds informativos / badges
	infoBackground: "#DFF2EE",
	successBackground: "#DFF5E8",
	dangerBackground: "#F9EAE5",
	warningBackground: "#F9F0DC",
	neutralBackground: "#F4F6F4",

	// Overlays
	overlayLight: "rgba(244,246,244,0.7)",

	// "Modo discreto" / gradient — mantido em tons da marca
	blueModeGradientStart: "#0A5248",
	blueModeGradientMid: "#0E6B58",
	blueModeGradientEnd: "#3DC55C",

	// Brand puro (acesso direto se necessário)
	brandTealDark: "#0A5248",
	brandTealMid: "#0E6B58",
	brandNavy: "#1A2030",
	brandBlack: "#0D0D0D",
	white: "#FFFFFF",
} as const;

export const fonts = {
	heading: "PlusJakartaSans_700Bold",
	body: "PlusJakartaSans_400Regular",
	bodySemiBold: "PlusJakartaSans_600SemiBold",
	bodyMedium: "PlusJakartaSans_500Medium",
	mono: "PlusJakartaSans_700Bold",
} as const;

export const fontSizes = {
	displayH1: 28,
	h2: 20,
	h3: 16,
	body: 14,
	caption: 12,
	label: 11,
	numeric: 32,
} as const;

export const lineHeights = {
	displayH1: 35, // 28 * 1.25
	h2: 26, // 20 * 1.3
	h3: 22, // 16 * 1.4
	body: 22, // 14 * 1.6
	caption: 18, // 12 * 1.5
} as const;

export const spacing = {
	xs: 4,
	sm: 8,
	md: 12,
	lg: 16,
	xl: 24,
	xxl: 32,
	xxxl: 48,
} as const;

export const radius = {
	input: 4,
	sm: 8,
	md: 12,
	card: 14,
	lg: 16,
	page: 20,
	xl: 24,
	pill: 26,
	full: 9999,
} as const;

// Badges semânticos prontos
export const badges = {
	success: { background: "#DFF5E8", color: "#115C28", dot: "#2EA84A" },
	danger: { background: "#F9EAE5", color: "#7A2D14", dot: "#B85430" },
	warning: { background: "#F9F0DC", color: "#7A5810", dot: "#C48E1C" },
	info: { background: "#DFF2EE", color: "#065848", dot: "#0E8C74" },
	neutral: {
		background: "#F4F6F4",
		color: "#5A6560",
		dot: "#9AA59C",
		border: "#E4E8E5",
	},
} as const;
