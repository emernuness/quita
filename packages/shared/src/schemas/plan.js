"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStrategySchema = void 0;
const zod_1 = require("zod");
const index_js_1 = require("../enums/index.js");
exports.updateStrategySchema = zod_1.z.object({
    strategy: zod_1.z.enum([
        index_js_1.PlanStrategy.SMALLEST_FIRST,
        index_js_1.PlanStrategy.HIGHEST_INTEREST,
        index_js_1.PlanStrategy.CUSTOM,
    ]),
});
//# sourceMappingURL=plan.js.map