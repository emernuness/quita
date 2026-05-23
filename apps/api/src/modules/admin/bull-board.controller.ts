import { All, Controller, Req, Res, UseGuards } from "@nestjs/common";
import type { Request, Response } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AdminEmailGuard } from "./admin-email.guard";
import { bullBoardAdapter } from "./bull-board.setup";

/**
 * Spec Fase 5 op — UI Bull Board em /admin/queues protegido por
 * JwtAuthGuard + AdminEmailGuard (ADMIN_EMAILS env CSV).
 */
@Controller("admin/queues")
@UseGuards(JwtAuthGuard, AdminEmailGuard)
export class BullBoardController {
	@All("*")
	async handle(@Req() req: Request, @Res() res: Response) {
		const handler = bullBoardAdapter.getRouter();
		return handler(req, res);
	}
}
