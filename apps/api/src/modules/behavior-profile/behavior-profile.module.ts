import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { QueueModule } from "../../queues/queue.module";
import { AuthModule } from "../auth/auth.module";
import { BehaviorProfileController } from "./behavior-profile.controller";
import { BehaviorProfileService } from "./behavior-profile.service";

@Module({
	imports: [PrismaModule, AuthModule, QueueModule],
	controllers: [BehaviorProfileController],
	providers: [BehaviorProfileService],
})
export class BehaviorProfileModule {}
