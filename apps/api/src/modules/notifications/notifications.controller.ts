import { Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { NotificationsService } from "./notifications.service";

@ApiTags("notifications")
@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationsController {
	constructor(private readonly svc: NotificationsService) {}

	@Get()
	list(
		@CurrentUser("id") userId: string,
		@Query("unreadOnly") unreadOnly?: string,
		@Query("limit") limit?: string,
	) {
		return this.svc.list(userId, {
			unreadOnly: unreadOnly === "true",
			limit: limit ? Math.min(Math.max(Number(limit), 1), 100) : undefined,
		});
	}

	@Get("unread-count")
	async unread(@CurrentUser("id") userId: string) {
		const count = await this.svc.unreadCount(userId);
		return { count };
	}

	@Post(":id/read")
	markRead(@CurrentUser("id") userId: string, @Param("id") id: string) {
		return this.svc.markRead(userId, id);
	}

	@Post("read-all")
	markAllRead(@CurrentUser("id") userId: string) {
		return this.svc.markAllRead(userId);
	}
}
