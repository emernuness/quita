import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { Logger } from "nestjs-pino";
import { AppModule } from "./app.module";
import { ACCESS_TOKEN_COOKIE } from "./modules/auth/constants";
import { initPostHog } from "./observability/posthog";
import { initSentry } from "./observability/sentry";

function parseCorsOrigins(): string[] | true {
	const raw = process.env.CORS_ORIGINS?.trim();
	if (!raw) {
		// Dev fallback — web roda em 4400 (Next custom port) e 3000 (storybook/dev).
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
	const app = await NestFactory.create(AppModule, { bufferLogs: true });
	app.useLogger(app.get(Logger));

	app.setGlobalPrefix("api");
	app.use(cookieParser());
	app.use(
		helmet({
			contentSecurityPolicy: false, // CSP do front fica no Next (rota web).
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
	console.log(`API running on port ${port}`);
}

bootstrap();
