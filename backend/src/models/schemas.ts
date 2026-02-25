import { z } from 'zod';

const variantTypes = [
  'Standard',
  'Reverse Holo',
  'Poké Ball Mirror',
  'Master Ball Mirror',
  'Cosmos Holo',
  'Promo',
] as const;

const conditionTypes = [
  'Mint',
  'Near Mint',
  'Lightly Played',
  'Moderately Played',
  'Heavily Played',
  'Damaged',
] as const;

export const addToCollectionSchema = z.object({
  card_id: z.number().int().positive(),
  variant: z.enum(variantTypes).default('Standard'),
  quantity: z.number().int().min(0).default(1),
  condition: z.enum(conditionTypes).default('Near Mint'),
  is_graded: z.boolean().default(false),
  grading_company: z.string().max(10).optional(),
  grade: z.number().min(0).max(10).optional(),
  date_acquired: z.string().optional(),
  purchase_price_usd: z.number().min(0).optional(),
  notes: z.string().optional(),
});

export const updateCollectionSchema = z
  .object({
    variant: z.enum(variantTypes).optional(),
    quantity: z.number().int().min(0).optional(),
    condition: z.enum(conditionTypes).optional(),
    is_graded: z.boolean().optional(),
    grading_company: z.string().max(10).nullable().optional(),
    grade: z.number().min(0).max(10).nullable().optional(),
    date_acquired: z.string().nullable().optional(),
    purchase_price_usd: z.number().min(0).nullable().optional(),
    notes: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort_by: z.string().optional(),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
});

export const cardFilterSchema = z.object({
  set_code: z.string().optional(),
  language: z.string().optional(),
  rarity: z.string().optional(),
  card_type: z.string().optional(),
  energy_type: z.string().optional(),
  is_pokemon_ex: z.coerce.boolean().optional(),
  is_secret_rare: z.coerce.boolean().optional(),
  is_promo: z.coerce.boolean().optional(),
  search: z.string().optional(),
});
