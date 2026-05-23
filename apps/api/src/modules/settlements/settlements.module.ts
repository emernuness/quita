import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { AuthModule } from "../auth/auth.module";
import { OcrModule } from "../ocr/ocr.module";
import { StorageModule } from "../storage/storage.module";
import { SettlementsController } from "./settlements.controller";
import { SettlementsService } from "./settlements.service";

@Module({
	imports: [PrismaModule, AuthModule, OcrModule, StorageModule],
	controllers: [SettlementsController],
	providers: [SettlementsService],
	exports: [SettlementsService],
})
export class SettlementsModule {}
