import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { QueueModule } from "../../queues/queue.module";
import { AuthModule } from "../auth/auth.module";
import { GoalsController } from "./goals.controller";
import { GoalsService } from "./goals.service";

@Module({
	imports: [PrismaModule, AuthModule, QueueModule],
	controllers: [GoalsController],
	providers: [GoalsService],
})
export class GoalsModule {}
