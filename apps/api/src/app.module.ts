import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { LoggerModule } from "nestjs-pino";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { SentryInterceptor } from "./common/interceptors/sentry.interceptor";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import { AuthModule } from "./modules/auth/auth.module";
import { BehaviorProfileModule } from "./modules/behavior-profile/behavior-profile.module";
import { ConsentModule } from "./modules/consent/consent.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { DebtsModule } from "./modules/debts/debts.module";
import { EmailModule } from "./modules/email/email.module";
import { EmergencyReserveModule } from "./modules/emergency-reserve/emergency-reserve.module";
import { FinancialModule } from "./modules/financial/financial.module";
import { GoalsModule } from "./modules/goals/goals.module";
import { HealthModule } from "./modules/health/health.module";
import { MotorModule } from "./modules/motor/motor.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { OcrModule } from "./modules/ocr/ocr.module";
import { OnboardingModule } from "./modules/onboarding/onboarding.module";
import { ProfileModule } from "./modules/profile/profile.module";
import { SettlementsModule } from "./modules/settlements/settlements.module";
import { StorageModule } from "./modules/storage/storage.module";
import { SubscriptionModule } from "./modules/subscription/subscription.module";
import { SupportModule } from "./modules/support/support.module";
import { UserModule } from "./modules/user/user.module";
import { PrismaModule } from "./prisma/prisma.module";
import { QueueModule } from "./queues/queue.module";

const IS_PROD = process.env.NODE_ENV === "production";

@Module({
	imports: [
		LoggerModule.forRoot({
			pinoHttp: {
				level: IS_PROD ? "info" : "debug",
				transport: IS_PROD
					? undefined
					: { target: "pino-pretty", options: { singleLine: true, colorize: true } },
				redact: {
					paths: [
						"req.headers.authorization",
						"req.headers.cookie",
						'req.headers["x-api-key"]',
						'res.headers["set-cookie"]',
						"req.body.password",
						"req.body.newPassword",
						"req.body.currentPassword",
					],
					remove: true,
				},
			},
		}),
		ThrottlerModule.forRoot([
			{ name: "short", ttl: 60_000, limit: 60 },
			{ name: "auth", ttl: 60_000, limit: 10 },
		]),
		PrismaModule,
		QueueModule,
		HealthModule,
		AuthModule,
		OnboardingModule,
		FinancialModule,
		DebtsModule,
		DashboardModule,
		ProfileModule,
		MotorModule,
		SubscriptionModule,
		OcrModule,
		EmailModule,
		UserModule,
		SettlementsModule,
		SupportModule,
		GoalsModule,
		EmergencyReserveModule,
		BehaviorProfileModule,
		StorageModule,
		NotificationsModule,
		ConsentModule,
	],
	providers: [
		{ provide: APP_GUARD, useClass: ThrottlerGuard },
		{ provide: APP_INTERCEPTOR, useClass: SentryInterceptor },
		{ provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
		{ provide: APP_FILTER, useClass: HttpExceptionFilter },
	],
})
export class AppModule {}
