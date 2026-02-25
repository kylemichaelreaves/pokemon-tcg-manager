"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cardFilterSchema = exports.paginationSchema = exports.updateCollectionSchema = exports.addToCollectionSchema = void 0;
const zod_1 = require("zod");
const variantTypes = [
    'Standard',
    'Reverse Holo',
    'Poké Ball Mirror',
    'Master Ball Mirror',
    'Cosmos Holo',
    'Promo',
];
const conditionTypes = [
    'Mint',
    'Near Mint',
    'Lightly Played',
    'Moderately Played',
    'Heavily Played',
    'Damaged',
];
exports.addToCollectionSchema = zod_1.z.object({
    card_id: zod_1.z.number().int().positive(),
    variant: zod_1.z.enum(variantTypes).default('Standard'),
    quantity: zod_1.z.number().int().min(0).default(1),
    condition: zod_1.z.enum(conditionTypes).default('Near Mint'),
    is_graded: zod_1.z.boolean().default(false),
    grading_company: zod_1.z.string().max(10).optional(),
    grade: zod_1.z.number().min(0).max(10).optional(),
    date_acquired: zod_1.z.string().optional(),
    purchase_price_usd: zod_1.z.number().min(0).optional(),
    notes: zod_1.z.string().optional(),
});
exports.updateCollectionSchema = zod_1.z
    .object({
    variant: zod_1.z.enum(variantTypes).optional(),
    quantity: zod_1.z.number().int().min(0).optional(),
    condition: zod_1.z.enum(conditionTypes).optional(),
    is_graded: zod_1.z.boolean().optional(),
    grading_company: zod_1.z.string().max(10).nullable().optional(),
    grade: zod_1.z.number().min(0).max(10).nullable().optional(),
    date_acquired: zod_1.z.string().nullable().optional(),
    purchase_price_usd: zod_1.z.number().min(0).nullable().optional(),
    notes: zod_1.z.string().nullable().optional(),
})
    .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
});
exports.paginationSchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().max(100).default(20),
    sort_by: zod_1.z.string().optional(),
    sort_order: zod_1.z.enum(['asc', 'desc']).default('asc'),
});
exports.cardFilterSchema = zod_1.z.object({
    set_code: zod_1.z.string().optional(),
    language: zod_1.z.string().optional(),
    rarity: zod_1.z.string().optional(),
    card_type: zod_1.z.string().optional(),
    energy_type: zod_1.z.string().optional(),
    is_pokemon_ex: zod_1.z.coerce.boolean().optional(),
    is_secret_rare: zod_1.z.coerce.boolean().optional(),
    is_promo: zod_1.z.coerce.boolean().optional(),
    search: zod_1.z.string().optional(),
});
//# sourceMappingURL=schemas.js.map