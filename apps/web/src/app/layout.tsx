import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const jakarta = Plus_Jakarta_Sans({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700", "800"],
	variable: "--font-jakarta",
	display: "swap",
});

export const metadata: Metadata = {
	title: "Quita — Saia das dívidas. Viva no azul.",
	description: "Organizador financeiro para quem está no vermelho.",
	icons: {
		icon: [
			{ url: "/brand/icone.svg", type: "image/svg+xml" },
			{ url: "/brand/icone.png", type: "image/png" },
		],
		apple: "/brand/icon-01.png",
	},
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="pt-BR" className={jakarta.variable}>
			<body>
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
