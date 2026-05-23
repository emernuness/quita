import { Module } from "@nestjs/common";
import { QueueModule } from "../../queues/queue.module";
import { OnboardingController } from "./onboarding.controller";
import { OnboardingService } from "./onboarding.service";

@Module({
	imports: [QueueModule],
	controllers: [OnboardingController],
	providers: [OnboardingService],
})
export class OnboardingModule {}
