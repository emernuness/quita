import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import { AuthModule } from "./modules/auth/auth.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { DebtsModule } from "./modules/debts/debts.module";
import { FinancialModule } from "./modules/financial/financial.module";
import { OnboardingModule } from "./modules/onboarding/onboarding.module";
import { ProfileModule } from "./modules/profile/profile.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
	imports: [
		ThrottlerModule.forRoot([
			{ name: "short", ttl: 60_000, limit: 60 }, // 60 req/min global por IP
			{ name: "auth", ttl: 60_000, limit: 10 }, // 10 tentativas /login por min
		]),
		PrismaModule,
		AuthModule,
		OnboardingModule,
		FinancialModule,
		DebtsModule,
		DashboardModule,
		ProfileModule,
	],
	providers: [
		{ provide: APP_GUARD, useClass: ThrottlerGuard },
		{ provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
		{ provide: APP_FILTER, useClass: HttpExceptionFilter },
	],
})
export class AppModule {}
