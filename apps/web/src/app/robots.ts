import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://quita.com.br";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: "*",
				allow: ["/", "/termos", "/privacidade", "/login", "/register"],
				disallow: ["/app/", "/onboarding/", "/admin/"],
			},
		],
		sitemap: `${siteUrl}/sitemap.xml`,
	};
}
