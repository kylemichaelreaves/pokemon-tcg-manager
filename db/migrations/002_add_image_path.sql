-- 002_add_image_path.sql
-- Add image_path column to cards table for card image references.
-- Images are served from local filesystem (dev) or S3/CloudFront (prod).
-- The backend computes full image_url from IMAGE_BASE_URL + image_path.

ALTER TABLE cards ADD COLUMN image_path VARCHAR(255);

-- Recreate v_cards to include image_path
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

-- Recreate v_collection to include image_path
DROP VIEW IF EXISTS v_collection;

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
