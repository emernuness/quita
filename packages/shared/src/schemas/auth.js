"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokenSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const BR_PHONE_REGEX = /^(\+?55)?\d{10,11}$/;
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(2),
    email: zod_1.z.string().email(),
    phone: zod_1.z.string().regex(BR_PHONE_REGEX, "Telefone brasileiro inválido"),
    password: zod_1.z.string().min(8),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1, "Campo obrigatório"),
});
exports.forgotPasswordSchema = zod_1.z.object({
    contact: zod_1.z.string().min(1, "Campo obrigatório"),
});
exports.resetPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    code: zod_1.z.string(),
    newPassword: zod_1.z.string().min(8),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string(),
});
//# sourceMappingURL=auth.js.map