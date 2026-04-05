import { Module } from "@nestjs/common";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { OnboardingModule } from "./modules/onboarding/onboarding.module";
import { FinancialModule } from "./modules/financial/financial.module";
import { DebtsModule } from "./modules/debts/debts.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { ProfileModule } from "./modules/profile/profile.module";

@Module({
	imports: [
		PrismaModule,
		AuthModule,
		OnboardingModule,
		FinancialModule,
		DebtsModule,
		DashboardModule,
		ProfileModule,
	],
	providers: [
		{
			provide: APP_INTERCEPTOR,
			useClass: TransformInterceptor,
		},
		{
			provide: APP_FILTER,
			useClass: HttpExceptionFilter,
		},
	],
})
export class AppModule {}
