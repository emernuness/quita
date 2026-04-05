"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNotificationPrefsSchema = exports.updateDiscreteModeSchema = exports.updateSecuritySchema = exports.changePasswordSchema = exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
exports.updateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).optional(),
    phone: zod_1.z.string().optional(),
});
exports.changePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string(),
    newPassword: zod_1.z.string().min(8),
});
exports.updateSecuritySchema = zod_1.z.object({
    biometricFingerprint: zod_1.z.boolean().optional(),
    biometricFace: zod_1.z.boolean().optional(),
});
exports.updateDiscreteModeSchema = zod_1.z.object({
    enabled: zod_1.z.boolean(),
});
exports.updateNotificationPrefsSchema = zod_1.z.object({
    dueDates: zod_1.z.boolean().optional(),
    weeklyProgress: zod_1.z.boolean().optional(),
    paymentIncentive: zod_1.z.boolean().optional(),
    riskAlert: zod_1.z.boolean().optional(),
    newsAndTips: zod_1.z.boolean().optional(),
});
//# sourceMappingURL=profile.js.map