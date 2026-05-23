import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { QueueModule } from "../../queues/queue.module";
import { HealthController } from "./health.controller";

@Module({
	imports: [PrismaModule, QueueModule],
	controllers: [HealthController],
})
export class HealthModule {}
