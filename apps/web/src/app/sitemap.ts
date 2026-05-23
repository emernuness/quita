import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://quita.com.br";

export default function sitemap(): MetadataRoute.Sitemap {
	const now = new Date();
	return [
		{ url: `${siteUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
		{ url: `${siteUrl}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
		{ url: `${siteUrl}/register`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
		{
			url: `${siteUrl}/termos`,
			lastModified: now,
			changeFrequency: "yearly",
			priority: 0.3,
		},
		{
			url: `${siteUrl}/privacidade`,
			lastModified: now,
			changeFrequency: "yearly",
			priority: 0.3,
		},
	];
}
