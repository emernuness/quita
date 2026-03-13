import { PrismaClient } from "@prisma/client";
import { DEBT_CATEGORY_SEEDS } from "@quita/shared";

const prisma = new PrismaClient();

async function main() {
	for (const cat of DEBT_CATEGORY_SEEDS) {
		await prisma.debtCategory.upsert({
			where: { slug: cat.slug },
			update: { name: cat.name, icon: cat.icon },
			create: { slug: cat.slug, name: cat.name, icon: cat.icon },
		});
	}

	console.log(`Seed completed: ${DEBT_CATEGORY_SEEDS.length} debt categories`);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
