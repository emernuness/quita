import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { UserDeletionService } from "./user-deletion.service";

@Module({
	imports: [PrismaModule, AuthModule],
	providers: [UserDeletionService],
	exports: [UserDeletionService],
})
export class UserModule {}
