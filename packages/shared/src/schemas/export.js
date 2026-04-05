"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createExportSchema = void 0;
const zod_1 = require("zod");
const index_js_1 = require("../enums/index.js");
exports.createExportSchema = zod_1.z.object({
    format: zod_1.z.enum([index_js_1.ExportFormat.PDF, index_js_1.ExportFormat.CSV]),
});
//# sourceMappingURL=export.js.map