import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { UserDeletionService } from "./user-deletion.service";

/**
 * Modulo de operacoes sensiveis de User (LGPD).
 *
 * Atualmente expoe apenas UserDeletionService usado pelo endpoint
 * DELETE /profile/me (a integrar no ProfileController em sprint
 * dedicada).
 */
@Module({
	imports: [PrismaModule],
	providers: [UserDeletionService],
	exports: [UserDeletionService],
})
export class UserModule {}
