import { InjectQueue } from "@nestjs/bullmq";
import { Module, type OnModuleInit } from "@nestjs/common";
import type { Queue } from "bullmq";
import { PrismaModule } from "../../prisma/prisma.module";
import { MOTOR_RECALC_QUEUE, MOTOR_SCHEDULED_QUEUE } from "../../queues/queue.constants";
import { QueueModule } from "../../queues/queue.module";
import { AuthModule } from "../auth/auth.module";
import { AdminEmailGuard } from "./admin-email.guard";
import { BullBoardController } from "./bull-board.controller";
import { initBullBoard } from "./bull-board.setup";

@Module({
	imports: [PrismaModule, AuthModule, QueueModule],
	controllers: [BullBoardController],
	providers: [AdminEmailGuard],
})
export class AdminModule implements OnModuleInit {
	constructor(
		@InjectQueue(MOTOR_RECALC_QUEUE) private readonly recalcQueue: Queue,
		@InjectQueue(MOTOR_SCHEDULED_QUEUE) private readonly scheduledQueue: Queue,
	) {}

	onModuleInit() {
		initBullBoard([this.recalcQueue, this.scheduledQueue]);
	}
}
