-- 003_api_import_support.sql
-- Schema changes to support importing card data from the TCGdex API.
-- Adds api_id columns for deduplication, set image URLs, card import metadata,
-- and sequences for dynamically extending lookup tables.

-- 1. Add api_id to sets for deduplication with TCGdex set IDs
ALTER TABLE sets ADD COLUMN api_id VARCHAR(20) UNIQUE;

-- 2. Add api_id to cards for deduplication with TCGdex card IDs
ALTER TABLE cards ADD COLUMN api_id VARCHAR(30) UNIQUE;

-- 3. Add set image URLs (symbol and logo from the API)
ALTER TABLE sets ADD COLUMN image_symbol_url TEXT;
ALTER TABLE sets ADD COLUMN image_logo_url TEXT;

-- 4. Add import tracking metadata to cards
ALTER TABLE cards ADD COLUMN imported_at TIMESTAMPTZ;
ALTER TABLE cards ADD COLUMN api_data JSONB;

-- 5. Add unique constraint on rarities.name for upsert by name
--    (currently only code is unique; API imports use name for dedup)
ALTER TABLE rarities ADD CONSTRAINT rarities_name_unique UNIQUE (name);

-- 6. Create sequences for auto-assigning IDs to new lookup table rows.
--    Start at 100 to avoid colliding with existing hand-curated IDs (1-12).
CREATE SEQUENCE rarities_rarity_id_seq START WITH 100;
CREATE SEQUENCE card_types_card_type_id_seq START WITH 100;
CREATE SEQUENCE energy_types_energy_type_id_seq START WITH 100;

-- 7. Recreate views to keep them in sync with schema changes.
--    Views must be dropped in dependency order.
DROP VIEW IF EXISTS v_completion_summary;
DROP VIEW IF EXISTS v_collection;
DROP VIEW IF EXISTS v_cards;

CREATE VIEW v_cards AS
SELECT
    c.card_id,
    s.set_code,
    s.name          AS set_name,
    l.code          AS language,
    c.card_number,
    c.pokedex_number,
    c.name,
    c.name_local,
    ct.name         AS card_type,
    et.name         AS energy_type,
    r.name          AS rarity,
    c.is_pokemon_ex,
    c.is_secret_rare,
    c.is_promo,
    c.has_holo_variant,
    c.image_path
FROM cards c
JOIN sets         s  ON c.set_id         = s.set_id
JOIN languages    l  ON s.language_id    = l.language_id
JOIN card_types   ct ON c.card_type_id   = ct.card_type_id
JOIN energy_types et ON c.energy_type_id = et.energy_type_id
JOIN rarities     r  ON c.rarity_id      = r.rarity_id
ORDER BY s.set_code, c.card_number;

CREATE VIEW v_collection AS
SELECT
    col.collection_id,
    s.set_code,
    l.code          AS language,
    c.card_number,
    c.name,
    r.name          AS rarity,
    col.variant,
    col.quantity,
    col.condition,
    col.is_graded,
    col.grading_company,
    col.grade,
    col.date_acquired,
    col.purchase_price_usd,
    c.image_path
FROM collection col
JOIN cards        c  ON col.card_id      = c.card_id
JOIN sets         s  ON c.set_id         = s.set_id
JOIN languages    l  ON s.language_id    = l.language_id
JOIN rarities     r  ON c.rarity_id      = r.rarity_id
ORDER BY s.set_code, c.card_number, col.variant;

CREATE VIEW v_completion_summary AS
SELECT
    s.set_code,
    s.name                                              AS set_name,
    l.code                                              AS language,
    COUNT(*)                                            AS total_cards,
    COUNT(*) FILTER (WHERE c.is_secret_rare)            AS secret_rares,
    COUNT(*) FILTER (WHERE c.is_promo)                  AS promos,
    COUNT(*) FILTER (WHERE c.has_holo_variant)          AS holo_variant_eligible,
    COUNT(DISTINCT col.card_id)                         AS owned_unique_cards,
    COUNT(col.collection_id)                            AS owned_total_variants,
    ROUND(
        COUNT(DISTINCT col.card_id)::NUMERIC /
        NULLIF(COUNT(*), 0) * 100, 1
    )                                                   AS pct_complete
FROM cards c
JOIN sets         s  ON c.set_id      = s.set_id
JOIN languages    l  ON s.language_id = l.language_id
LEFT JOIN collection col ON c.card_id = col.card_id
GROUP BY s.set_code, s.name, l.code
ORDER BY s.set_code;

-- 8. Backfill api_id for existing 151 English set.
--    The TCGdex ID for English Scarlet & Violet 151 is "sv03.5".
--    SV2A (Japanese) has no TCGdex equivalent (API is English-only).
UPDATE sets SET api_id = 'sv03.5' WHERE set_code = 'MEW';
