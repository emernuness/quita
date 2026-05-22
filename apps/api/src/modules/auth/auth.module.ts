import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthAuditService } from "./auth-audit.service";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { ACCESS_TOKEN_TTL_SECONDS } from "./constants";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { JwtStrategy } from "./jwt.strategy";
import { RefreshTokenService } from "./refresh-token.service";

@Module({
	imports: [
		PassportModule,
		JwtModule.registerAsync({
			useFactory: () => {
				const secret = process.env.JWT_SECRET;
				if (!secret) {
					throw new Error("JWT_SECRET nao configurado — defina no .env antes de iniciar a API.");
				}
				if (process.env.NODE_ENV === "production" && secret.length < 32) {
					throw new Error("JWT_SECRET deve ter no minimo 32 caracteres em producao.");
				}
				return {
					secret,
					signOptions: { expiresIn: `${ACCESS_TOKEN_TTL_SECONDS}s` },
				};
			},
		}),
	],
	controllers: [AuthController],
	providers: [AuthService, JwtStrategy, JwtAuthGuard, RefreshTokenService, AuthAuditService],
	exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
