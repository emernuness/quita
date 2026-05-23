import { themeInitScript } from "@/hooks/useTheme";
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const jakarta = Plus_Jakarta_Sans({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700", "800"],
	variable: "--font-jakarta",
	display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://quita.com.br";

export const metadata: Metadata = {
	metadataBase: new URL(siteUrl),
	title: {
		default: "Quita — Saia das dívidas. Viva no azul.",
		template: "%s | Quita",
	},
	description:
		"Plano personalizado para quitar dívidas, com motor que classifica seu momento financeiro e recomenda o próximo passo certo.",
	keywords: ["quitação", "dívidas", "finanças pessoais", "Brasil", "superendividamento"],
	openGraph: {
		type: "website",
		locale: "pt_BR",
		url: siteUrl,
		siteName: "Quita",
		title: "Quita — Saia das dívidas. Viva no azul.",
		description:
			"Motor de quitação de dívidas com plano mensal personalizado. LGPD + Lei do superendividamento.",
		images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Quita" }],
	},
	twitter: {
		card: "summary_large_image",
		title: "Quita — Saia das dívidas",
		description: "Plano mensal personalizado para quitar dívidas.",
		images: ["/og-image.png"],
	},
	robots: { index: true, follow: true },
	icons: {
		icon: [
			{ url: "/brand/icone.svg", type: "image/svg+xml" },
			{ url: "/brand/icone.png", type: "image/png" },
		],
		apple: "/brand/icon-01.png",
	},
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#f4f6f4" },
		{ media: "(prefers-color-scheme: dark)", color: "#0d1117" },
	],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="pt-BR" className={jakarta.variable} suppressHydrationWarning>
			<head>
				{/* biome-ignore lint/security/noDangerouslySetInnerHtml: theme bootstrap script with fixed content */}
				<script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
			</head>
			<body>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
