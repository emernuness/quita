import { Module } from "@nestjs/common";
import { QueueModule } from "../../queues/queue.module";
import { DebtsController } from "./debts.controller";
import { DebtsService } from "./debts.service";

@Module({
	imports: [QueueModule],
	controllers: [DebtsController],
	providers: [DebtsService],
})
export class DebtsModule {}
