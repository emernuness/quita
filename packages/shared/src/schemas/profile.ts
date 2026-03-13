import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const updateSecuritySchema = z.object({
  biometricFingerprint: z.boolean().optional(),
  biometricFace: z.boolean().optional(),
});
export type UpdateSecurityInput = z.infer<typeof updateSecuritySchema>;

export const updateDiscreteModeSchema = z.object({
  enabled: z.boolean(),
});
export type UpdateDiscreteModeInput = z.infer<typeof updateDiscreteModeSchema>;

export const updateNotificationPrefsSchema = z.object({
  dueDates: z.boolean().optional(),
  weeklyProgress: z.boolean().optional(),
  paymentIncentive: z.boolean().optional(),
  riskAlert: z.boolean().optional(),
  newsAndTips: z.boolean().optional(),
});
export type UpdateNotificationPrefsInput = z.infer<
  typeof updateNotificationPrefsSchema
>;
