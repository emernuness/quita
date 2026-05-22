import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import type { DashboardService } from "./dashboard.service";

@Controller("dashboard")
@UseGuards(JwtAuthGuard)
export class DashboardController {
	constructor(private readonly dashboardService: DashboardService) {}

	@Get()
	getDashboard(@CurrentUser("id") userId: string) {
		return this.dashboardService.getDashboard(userId);
	}
}
