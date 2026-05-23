import { Module } from "@nestjs/common";
import { QueueModule } from "../../queues/queue.module";
import { FinancialController } from "./financial.controller";
import { FinancialService } from "./financial.service";

@Module({
	imports: [QueueModule],
	controllers: [FinancialController],
	providers: [FinancialService],
})
export class FinancialModule {}
