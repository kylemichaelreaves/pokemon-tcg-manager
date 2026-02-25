import { z } from 'zod';
export declare const addToCollectionSchema: z.ZodObject<{
    card_id: z.ZodNumber;
    variant: z.ZodDefault<z.ZodEnum<["Standard", "Reverse Holo", "Poké Ball Mirror", "Master Ball Mirror", "Cosmos Holo", "Promo"]>>;
    quantity: z.ZodDefault<z.ZodNumber>;
    condition: z.ZodDefault<z.ZodEnum<["Mint", "Near Mint", "Lightly Played", "Moderately Played", "Heavily Played", "Damaged"]>>;
    is_graded: z.ZodDefault<z.ZodBoolean>;
    grading_company: z.ZodOptional<z.ZodString>;
    grade: z.ZodOptional<z.ZodNumber>;
    date_acquired: z.ZodOptional<z.ZodString>;
    purchase_price_usd: z.ZodOptional<z.ZodNumber>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    card_id: number;
    variant: "Standard" | "Reverse Holo" | "Poké Ball Mirror" | "Master Ball Mirror" | "Cosmos Holo" | "Promo";
    quantity: number;
    condition: "Mint" | "Near Mint" | "Lightly Played" | "Moderately Played" | "Heavily Played" | "Damaged";
    is_graded: boolean;
    grading_company?: string | undefined;
    grade?: number | undefined;
    date_acquired?: string | undefined;
    purchase_price_usd?: number | undefined;
    notes?: string | undefined;
}, {
    card_id: number;
    variant?: "Standard" | "Reverse Holo" | "Poké Ball Mirror" | "Master Ball Mirror" | "Cosmos Holo" | "Promo" | undefined;
    quantity?: number | undefined;
    condition?: "Mint" | "Near Mint" | "Lightly Played" | "Moderately Played" | "Heavily Played" | "Damaged" | undefined;
    is_graded?: boolean | undefined;
    grading_company?: string | undefined;
    grade?: number | undefined;
    date_acquired?: string | undefined;
    purchase_price_usd?: number | undefined;
    notes?: string | undefined;
}>;
export declare const updateCollectionSchema: z.ZodEffects<z.ZodObject<{
    variant: z.ZodOptional<z.ZodEnum<["Standard", "Reverse Holo", "Poké Ball Mirror", "Master Ball Mirror", "Cosmos Holo", "Promo"]>>;
    quantity: z.ZodOptional<z.ZodNumber>;
    condition: z.ZodOptional<z.ZodEnum<["Mint", "Near Mint", "Lightly Played", "Moderately Played", "Heavily Played", "Damaged"]>>;
    is_graded: z.ZodOptional<z.ZodBoolean>;
    grading_company: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    grade: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    date_acquired: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    purchase_price_usd: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    variant?: "Standard" | "Reverse Holo" | "Poké Ball Mirror" | "Master Ball Mirror" | "Cosmos Holo" | "Promo" | undefined;
    quantity?: number | undefined;
    condition?: "Mint" | "Near Mint" | "Lightly Played" | "Moderately Played" | "Heavily Played" | "Damaged" | undefined;
    is_graded?: boolean | undefined;
    grading_company?: string | null | undefined;
    grade?: number | null | undefined;
    date_acquired?: string | null | undefined;
    purchase_price_usd?: number | null | undefined;
    notes?: string | null | undefined;
}, {
    variant?: "Standard" | "Reverse Holo" | "Poké Ball Mirror" | "Master Ball Mirror" | "Cosmos Holo" | "Promo" | undefined;
    quantity?: number | undefined;
    condition?: "Mint" | "Near Mint" | "Lightly Played" | "Moderately Played" | "Heavily Played" | "Damaged" | undefined;
    is_graded?: boolean | undefined;
    grading_company?: string | null | undefined;
    grade?: number | null | undefined;
    date_acquired?: string | null | undefined;
    purchase_price_usd?: number | null | undefined;
    notes?: string | null | undefined;
}>, {
    variant?: "Standard" | "Reverse Holo" | "Poké Ball Mirror" | "Master Ball Mirror" | "Cosmos Holo" | "Promo" | undefined;
    quantity?: number | undefined;
    condition?: "Mint" | "Near Mint" | "Lightly Played" | "Moderately Played" | "Heavily Played" | "Damaged" | undefined;
    is_graded?: boolean | undefined;
    grading_company?: string | null | undefined;
    grade?: number | null | undefined;
    date_acquired?: string | null | undefined;
    purchase_price_usd?: number | null | undefined;
    notes?: string | null | undefined;
}, {
    variant?: "Standard" | "Reverse Holo" | "Poké Ball Mirror" | "Master Ball Mirror" | "Cosmos Holo" | "Promo" | undefined;
    quantity?: number | undefined;
    condition?: "Mint" | "Near Mint" | "Lightly Played" | "Moderately Played" | "Heavily Played" | "Damaged" | undefined;
    is_graded?: boolean | undefined;
    grading_company?: string | null | undefined;
    grade?: number | null | undefined;
    date_acquired?: string | null | undefined;
    purchase_price_usd?: number | null | undefined;
    notes?: string | null | undefined;
}>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sort_by: z.ZodOptional<z.ZodString>;
    sort_order: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
}, "strip", z.ZodTypeAny, {
    page: number;
    limit: number;
    sort_order: "asc" | "desc";
    sort_by?: string | undefined;
}, {
    page?: number | undefined;
    limit?: number | undefined;
    sort_by?: string | undefined;
    sort_order?: "asc" | "desc" | undefined;
}>;
export declare const cardFilterSchema: z.ZodObject<{
    set_code: z.ZodOptional<z.ZodString>;
    language: z.ZodOptional<z.ZodString>;
    rarity: z.ZodOptional<z.ZodString>;
    card_type: z.ZodOptional<z.ZodString>;
    energy_type: z.ZodOptional<z.ZodString>;
    is_pokemon_ex: z.ZodOptional<z.ZodBoolean>;
    is_secret_rare: z.ZodOptional<z.ZodBoolean>;
    is_promo: z.ZodOptional<z.ZodBoolean>;
    search: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    search?: string | undefined;
    set_code?: string | undefined;
    rarity?: string | undefined;
    card_type?: string | undefined;
    energy_type?: string | undefined;
    language?: string | undefined;
    is_pokemon_ex?: boolean | undefined;
    is_secret_rare?: boolean | undefined;
    is_promo?: boolean | undefined;
}, {
    search?: string | undefined;
    set_code?: string | undefined;
    rarity?: string | undefined;
    card_type?: string | undefined;
    energy_type?: string | undefined;
    language?: string | undefined;
    is_pokemon_ex?: boolean | undefined;
    is_secret_rare?: boolean | undefined;
    is_promo?: boolean | undefined;
}>;
//# sourceMappingURL=schemas.d.ts.map