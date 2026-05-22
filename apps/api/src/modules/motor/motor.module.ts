import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { MotorOrchestratorService } from "./motor-orchestrator.service";

/**
 * Spec: Fase 4 §3 — modulo NestJS que envolve @quita/motor (puro)
 * com side effects (Prisma, BullMQ, EventEmitter).
 *
 * Onda 2 entregou o motor puro em packages/motor/. Esta camada wrapa
 * com I/O: carrega contexto do DB, chama generateMonthlyPlan, persiste
 * MonthlyActionPlan + RecommendedAction[].
 */
@Module({
	imports: [PrismaModule],
	providers: [MotorOrchestratorService],
	exports: [MotorOrchestratorService],
})
export class MotorModule {}
