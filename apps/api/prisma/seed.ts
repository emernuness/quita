import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
	const categories = [
		{ slug: "credit_card", name: "Cartao de credito", icon: "credit-card" },
		{ slug: "bank_loan", name: "Banco / Emprestimo", icon: "landmark" },
		{ slug: "overdue_bill", name: "Conta atrasada", icon: "alert-circle" },
		{ slug: "housing", name: "Moradia", icon: "home" },
		{ slug: "personal", name: "Pessoa conhecida", icon: "users" },
		{ slug: "other", name: "Outra divida", icon: "more-horizontal" },
	];

	for (const cat of categories) {
		await prisma.debtCategory.upsert({
			where: { slug: cat.slug },
			update: { name: cat.name, icon: cat.icon },
			create: cat,
		});
	}

	console.log("Seed completed: 6 debt categories");
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
