import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { QueueModule } from "../../queues/queue.module";
import { AuthModule } from "../auth/auth.module";
import { EmergencyReserveController } from "./emergency-reserve.controller";
import { EmergencyReserveService } from "./emergency-reserve.service";

@Module({
	imports: [PrismaModule, AuthModule, QueueModule],
	controllers: [EmergencyReserveController],
	providers: [EmergencyReserveService],
})
export class EmergencyReserveModule {}
