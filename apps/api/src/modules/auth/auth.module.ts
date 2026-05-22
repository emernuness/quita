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
		JwtModule.register({
			secret: process.env.JWT_SECRET || "dev-secret-change-in-production",
			signOptions: { expiresIn: `${ACCESS_TOKEN_TTL_SECONDS}s` },
		}),
	],
	controllers: [AuthController],
	providers: [AuthService, JwtStrategy, JwtAuthGuard, RefreshTokenService, AuthAuditService],
	exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}
