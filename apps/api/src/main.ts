import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { Logger } from "nestjs-pino";
import { AppModule } from "./app.module";
import { ACCESS_TOKEN_COOKIE } from "./modules/auth/constants";
import { initPostHog, shutdownPostHog } from "./observability/posthog";
import { initSentry } from "./observability/sentry";

function parseCorsOrigins(): string[] | true {
	const raw = process.env.CORS_ORIGINS?.trim();
	if (!raw) {
		return ["http://localhost:4400", "http://localhost:3000"];
	}
	if (raw === "*") return true;
	return raw
		.split(",")
		.map((s) => s.trim())
		.filter(Boolean);
}

async function bootstrap() {
	initSentry();
	initPostHog();

	// rawBody: true mantém o Buffer cru disponível em RawBodyRequest<Request>.
	// Necessário para validação de assinatura do Stripe webhook (C-01 review).
	const app = await NestFactory.create(AppModule, { bufferLogs: true, rawBody: true });
	app.useLogger(app.get(Logger));

	app.setGlobalPrefix("api");
	app.use(cookieParser());
	app.use(
		helmet({
			contentSecurityPolicy: false,
			crossOriginEmbedderPolicy: false,
		}),
	);

	const origins = parseCorsOrigins();
	app.enableCors({
		origin: origins === true ? true : origins,
		credentials: true,
		methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
		exposedHeaders: ["X-Request-Id"],
	});

	app.enableShutdownHooks();

	if (process.env.NODE_ENV !== "production") {
		const swaggerConfig = new DocumentBuilder()
			.setTitle("Quita API")
			.setDescription("Motor de decisão financeira para pessoas endividadas")
			.setVersion("1.0")
			.addCookieAuth(ACCESS_TOKEN_COOKIE)
			.build();
		const swaggerDoc = SwaggerModule.createDocument(app, swaggerConfig);
		SwaggerModule.setup("api/docs", app, swaggerDoc);
	}

	const port = Number(process.env.PORT ?? 3000);
	await app.listen(port);

	const shutdown = async (signal: string) => {
		console.log(`[shutdown] sinal recebido: ${signal}`);
		try {
			await app.close();
		} catch (err) {
			console.error("[shutdown] erro ao fechar Nest", err);
		}
		try {
			await shutdownPostHog();
		} catch (err) {
			console.error("[shutdown] erro ao flush PostHog", err);
		}
		process.exit(0);
	};
	process.on("SIGTERM", () => void shutdown("SIGTERM"));
	process.on("SIGINT", () => void shutdown("SIGINT"));

	console.log(`API running on port ${port}`);
}

bootstrap();
