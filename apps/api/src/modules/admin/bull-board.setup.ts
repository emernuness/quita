import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import type { Queue } from "bullmq";

export const bullBoardAdapter = new ExpressAdapter();
bullBoardAdapter.setBasePath("/admin/queues");

let initialized = false;

export function initBullBoard(queues: Queue[]) {
	if (initialized) return;
	createBullBoard({
		queues: queues.map((q) => new BullMQAdapter(q)),
		serverAdapter: bullBoardAdapter,
	});
	initialized = true;
}
