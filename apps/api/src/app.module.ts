import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { LoggerModule } from "nestjs-pino";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import { AuthModule } from "./modules/auth/auth.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { DebtsModule } from "./modules/debts/debts.module";
import { EmailModule } from "./modules/email/email.module";
import { FinancialModule } from "./modules/financial/financial.module";
import { MotorModule } from "./modules/motor/motor.module";
import { OcrModule } from "./modules/ocr/ocr.module";
import { OnboardingModule } from "./modules/onboarding/onboarding.module";
import { ProfileModule } from "./modules/profile/profile.module";
import { SubscriptionModule } from "./modules/subscription/subscription.module";
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
			{ name: "short", ttl: 60_000, limit: 60 }, // 60 req/min global por IP
			{ name: "auth", ttl: 60_000, limit: 10 }, // 10 tentativas /login por min
		]),
		PrismaModule,
		QueueModule,
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
	],
	providers: [
		{ provide: APP_GUARD, useClass: ThrottlerGuard },
		{ provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
		{ provide: APP_FILTER, useClass: HttpExceptionFilter },
	],
})
export class AppModule {}
