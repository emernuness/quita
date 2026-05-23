import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { DataFreshnessService } from "./data-freshness.service";

@ApiTags("user")
@Controller("user")
@UseGuards(JwtAuthGuard)
export class UserController {
	constructor(private readonly freshness: DataFreshnessService) {}

	/**
	 * Spec Fase 5 §6.12 C1 — tela Refinamento.
	 * Score por dimensao + sugestoes acionaveis.
	 */
	@Get("data-freshness")
	dataFreshness(@CurrentUser("id") userId: string) {
		return this.freshness.forUser(userId);
	}
}
