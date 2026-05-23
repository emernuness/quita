/** @type {import('next').NextConfig} */

const IS_PROD = process.env.NODE_ENV === "production";
const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api").replace(
	/\/api\/?$/,
	"",
);

/**
 * Content Security Policy (ADR-0001/0016).
 *
 * Em dev permitimos eval e inline para HMR. Em prod, restrito.
 * `connect-src` precisa incluir a origem da API (httpOnly cookies
 * dependem de cross-origin com credentials).
 */
function buildCsp() {
	const scriptSrc = IS_PROD ? "'self'" : "'self' 'unsafe-eval' 'unsafe-inline'";
	const styleSrc = "'self' 'unsafe-inline'";
	const connectSrc = ["'self'", API_ORIGIN, "https://*.posthog.com", "https://*.sentry.io"].join(
		" ",
	);
	return [
		"default-src 'self'",
		`script-src ${scriptSrc}`,
		`style-src ${styleSrc}`,
		"img-src 'self' data: blob:",
		"font-src 'self' data:",
		`connect-src ${connectSrc}`,
		"frame-ancestors 'none'",
		"base-uri 'self'",
		"form-action 'self'",
	].join("; ");
}

const securityHeaders = [
	{ key: "Content-Security-Policy", value: buildCsp() },
	{ key: "X-Frame-Options", value: "DENY" },
	{ key: "X-Content-Type-Options", value: "nosniff" },
	{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
	{
		key: "Permissions-Policy",
		value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
	},
];

const nextConfig = {
	reactStrictMode: true,
	transpilePackages: ["@quita/shared", "@quita/motor"],
	env: {
		NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api",
	},
	async headers() {
		return [
			{
				source: "/:path*",
				headers: securityHeaders,
			},
		];
	},
};

export default nextConfig;
