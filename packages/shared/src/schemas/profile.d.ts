import { z } from "zod";
export declare const updateProfileSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    phone?: string | undefined;
}, {
    name?: string | undefined;
    phone?: string | undefined;
}>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export declare const changePasswordSchema: z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    newPassword: string;
    currentPassword: string;
}, {
    newPassword: string;
    currentPassword: string;
}>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export declare const updateSecuritySchema: z.ZodObject<{
    biometricFingerprint: z.ZodOptional<z.ZodBoolean>;
    biometricFace: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    biometricFingerprint?: boolean | undefined;
    biometricFace?: boolean | undefined;
}, {
    biometricFingerprint?: boolean | undefined;
    biometricFace?: boolean | undefined;
}>;
export type UpdateSecurityInput = z.infer<typeof updateSecuritySchema>;
export declare const updateDiscreteModeSchema: z.ZodObject<{
    enabled: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
}, {
    enabled: boolean;
}>;
export type UpdateDiscreteModeInput = z.infer<typeof updateDiscreteModeSchema>;
export declare const updateNotificationPrefsSchema: z.ZodObject<{
    dueDates: z.ZodOptional<z.ZodBoolean>;
    weeklyProgress: z.ZodOptional<z.ZodBoolean>;
    paymentIncentive: z.ZodOptional<z.ZodBoolean>;
    riskAlert: z.ZodOptional<z.ZodBoolean>;
    newsAndTips: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    dueDates?: boolean | undefined;
    weeklyProgress?: boolean | undefined;
    paymentIncentive?: boolean | undefined;
    riskAlert?: boolean | undefined;
    newsAndTips?: boolean | undefined;
}, {
    dueDates?: boolean | undefined;
    weeklyProgress?: boolean | undefined;
    paymentIncentive?: boolean | undefined;
    riskAlert?: boolean | undefined;
    newsAndTips?: boolean | undefined;
}>;
export type UpdateNotificationPrefsInput = z.infer<typeof updateNotificationPrefsSchema>;
//# sourceMappingURL=profile.d.ts.map