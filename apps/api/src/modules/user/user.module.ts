import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { DataFreshnessService } from "./data-freshness.service";
import { UserDeletionService } from "./user-deletion.service";
import { UserController } from "./user.controller";

@Module({
	imports: [PrismaModule, AuthModule],
	controllers: [UserController],
	providers: [UserDeletionService, DataFreshnessService],
	exports: [UserDeletionService, DataFreshnessService],
})
export class UserModule {}
