import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { SupportController } from "./support.controller";

@Module({
	imports: [PrismaModule, AuthModule],
	controllers: [SupportController],
})
export class SupportModule {}
