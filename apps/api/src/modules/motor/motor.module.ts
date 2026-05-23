import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { MotorOrchestratorService } from "./motor-orchestrator.service";
import { MotorController } from "./motor.controller";

@Module({
	imports: [PrismaModule, AuthModule],
	controllers: [MotorController],
	providers: [MotorOrchestratorService],
	exports: [MotorOrchestratorService],
})
export class MotorModule {}
