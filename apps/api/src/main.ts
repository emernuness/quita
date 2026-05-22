import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";

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
	const app = await NestFactory.create(AppModule);

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

	const port = Number(process.env.PORT ?? 3000);
	await app.listen(port);
	console.log(`API running on port ${port}`);
}

bootstrap();
