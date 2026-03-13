import { SetMetadata } from "@nestjs/common";

export const PREMIUM_KEY = "isPremiumOnly";
export const PremiumOnly = () => SetMetadata(PREMIUM_KEY, true);
