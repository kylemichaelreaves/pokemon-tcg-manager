-- ============================================================
--  pokemon_cards  —  PostgreSQL Database Schema  (full seed)
--  Includes complete card data for:
--    MEW  — Scarlet & Violet 151 (English, Sep 22 2023)
--    SV2A — Pokémon Card 151    (Japanese, Jun 16 2023)
-- ============================================================


-- ============================================================
--  LOOKUP TABLES
-- ============================================================

CREATE TABLE languages (
    language_id  SMALLINT     PRIMARY KEY,
    code         CHAR(2)      NOT NULL UNIQUE,
    name         VARCHAR(50)  NOT NULL
);

INSERT INTO languages VALUES
    (1, 'EN', 'English'),
    (2, 'JP', 'Japanese');


CREATE TABLE sets (
    set_id        SERIAL        PRIMARY KEY,
    set_code      VARCHAR(10)   NOT NULL UNIQUE,
    name          VARCHAR(100)  NOT NULL,
    series        VARCHAR(50),
    language_id   SMALLINT      NOT NULL REFERENCES languages(language_id),
    release_date  DATE,
    total_cards   SMALLINT,
    total_with_sr SMALLINT,
    notes         TEXT
);

INSERT INTO sets (set_code, name, series, language_id, release_date, total_cards, total_with_sr) VALUES
    ('MEW',  'Scarlet & Violet — 151', 'Scarlet & Violet', 1, '2023-09-22', 165, 207),
    ('SV2A', 'Pokémon Card 151',       'Scarlet & Violet', 2, '2023-06-16', 165, 212);


CREATE TABLE rarities (
    rarity_id    SMALLINT     PRIMARY KEY,
    code         VARCHAR(10)  NOT NULL UNIQUE,
    name         VARCHAR(60)  NOT NULL,
    language_id  SMALLINT     REFERENCES languages(language_id),
    sort_order   SMALLINT     NOT NULL
);

INSERT INTO rarities (rarity_id, code, name, language_id, sort_order) VALUES
    (1,  'C',   'Common',                    NULL, 1),
    (2,  'U',   'Uncommon',                  NULL, 2),
    (3,  'R',   'Rare',                      NULL, 3),
    (4,  'RR',  'Double Rare',               NULL, 4),
    (5,  'IR',  'Illustration Rare',         1,    5),
    (6,  'SIR', 'Special Illustration Rare', 1,    6),
    (7,  'UR',  'Ultra Rare',                1,    7),
    (8,  'HR',  'Hyper Rare',                1,    8),
    (9,  'AR',  'Art Rare',                  2,    5),
    (10, 'SR',  'Super Rare',                2,    6),
    (11, 'SAR', 'Special Art Rare',          2,    7),
    (12, 'JUR', 'Ultra Rare (Gold)',          2,    8);


CREATE TABLE card_types (
    card_type_id  SMALLINT    PRIMARY KEY,
    name          VARCHAR(30) NOT NULL UNIQUE
);

INSERT INTO card_types VALUES
    (1, 'Pokémon'),
    (2, 'Trainer - Item'),
    (3, 'Trainer - Supporter'),
    (4, 'Trainer - Stadium'),
    (5, 'Energy');


CREATE TABLE energy_types (
    energy_type_id  SMALLINT    PRIMARY KEY,
    name            VARCHAR(20) NOT NULL UNIQUE
);

INSERT INTO energy_types VALUES
    (1,  'Grass'),
    (2,  'Fire'),
    (3,  'Water'),
    (4,  'Lightning'),
    (5,  'Psychic'),
    (6,  'Fighting'),
    (7,  'Darkness'),
    (8,  'Metal'),
    (9,  'Dragon'),
    (10, 'Colorless'),
    (11, 'None');


CREATE TABLE holo_patterns (
    holo_pattern_id  SMALLINT    PRIMARY KEY,
    name             VARCHAR(30) NOT NULL UNIQUE
);

INSERT INTO holo_patterns VALUES
    (1, 'Standard Reverse'),
    (2, 'Poké Ball Mirror'),
    (3, 'Master Ball Mirror'),
    (4, 'Cosmos Holo');


CREATE TABLE promo_sources (
    promo_source_id  SMALLINT    PRIMARY KEY,
    name             VARCHAR(60) NOT NULL UNIQUE
);

INSERT INTO promo_sources VALUES
    (1, 'GameStop'),
    (2, 'Best Buy'),
    (3, 'Pokémon Center'),
    (4, 'Elite Trainer Box'),
    (5, 'Hobby Store'),
    (6, 'Booster Bundle'),
    (7, 'Japanese Product Exclusive');


-- ============================================================
--  CORE TABLE: cards
-- ============================================================

CREATE TABLE cards (
    card_id          SERIAL       PRIMARY KEY,
    set_id           INT          NOT NULL REFERENCES sets(set_id),
    card_number      VARCHAR(10)  NOT NULL,
    pokedex_number   SMALLINT,
    name             VARCHAR(80)  NOT NULL,
    name_local       VARCHAR(80),
    card_type_id     SMALLINT     NOT NULL REFERENCES card_types(card_type_id),
    energy_type_id   SMALLINT     NOT NULL REFERENCES energy_types(energy_type_id),
    rarity_id        SMALLINT     NOT NULL REFERENCES rarities(rarity_id),
    is_pokemon_ex    BOOLEAN      NOT NULL DEFAULT FALSE,
    is_secret_rare   BOOLEAN      NOT NULL DEFAULT FALSE,
    is_promo         BOOLEAN      NOT NULL DEFAULT FALSE,
    promo_source_id  SMALLINT     REFERENCES promo_sources(promo_source_id),
    has_holo_variant BOOLEAN      NOT NULL DEFAULT FALSE,
    notes            TEXT,
    CONSTRAINT uq_card UNIQUE (set_id, card_number, is_promo)
);

CREATE INDEX idx_cards_set       ON cards(set_id);
CREATE INDEX idx_cards_rarity    ON cards(rarity_id);
CREATE INDEX idx_cards_card_type ON cards(card_type_id);
CREATE INDEX idx_cards_pokedex   ON cards(pokedex_number);
CREATE INDEX idx_cards_is_promo  ON cards(is_promo);
CREATE INDEX idx_cards_is_secret ON cards(is_secret_rare);


CREATE TABLE card_holo_variants (
    holo_variant_id  SERIAL   PRIMARY KEY,
    card_id          INT      NOT NULL REFERENCES cards(card_id),
    holo_pattern_id  SMALLINT NOT NULL REFERENCES holo_patterns(holo_pattern_id),
    approx_pull_rate VARCHAR(40),
    CONSTRAINT uq_holo_variant UNIQUE (card_id, holo_pattern_id)
);

CREATE INDEX idx_holo_variant_card ON card_holo_variants(card_id);


CREATE TABLE promo_details (
    promo_detail_id   SERIAL        PRIMARY KEY,
    card_id           INT           NOT NULL REFERENCES cards(card_id),
    promo_number      VARCHAR(20),
    stamp_description VARCHAR(100)
);


-- ============================================================
--  COLLECTION TRACKING
-- ============================================================

CREATE TYPE card_condition AS ENUM (
    'Mint', 'Near Mint', 'Lightly Played',
    'Moderately Played', 'Heavily Played', 'Damaged'
);

CREATE TYPE variant_type AS ENUM (
    'Standard',
    'Reverse Holo',
    'Poké Ball Mirror',
    'Master Ball Mirror',
    'Cosmos Holo',
    'Promo'
);

CREATE TABLE collection (
    collection_id       SERIAL         PRIMARY KEY,
    card_id             INT            NOT NULL REFERENCES cards(card_id),
    variant             variant_type   NOT NULL DEFAULT 'Standard',
    quantity            SMALLINT       NOT NULL DEFAULT 1 CHECK (quantity >= 0),
    condition           card_condition NOT NULL DEFAULT 'Near Mint',
    is_graded           BOOLEAN        NOT NULL DEFAULT FALSE,
    grading_company     VARCHAR(10),
    grade               NUMERIC(3,1),
    date_acquired       DATE,
    purchase_price_usd  NUMERIC(8,2),
    notes               TEXT,
    CONSTRAINT uq_collection UNIQUE (card_id, variant)
);

CREATE INDEX idx_collection_card    ON collection(card_id);
CREATE INDEX idx_collection_variant ON collection(variant);


-- ============================================================
--  VIEWS
-- ============================================================

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
    c.has_holo_variant
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
    col.purchase_price_usd
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


-- ============================================================
--  FULL CARD DATA
-- ============================================================

-- ── Helper: seed both EN and JP base cards in one pass ──────
-- We insert EN first (set_id=1), then JP (set_id=2).
-- Columns: set_id, card_number, pokedex_number, name, name_local,
--          card_type_id, energy_type_id, rarity_id,
--          is_pokemon_ex, has_holo_variant

INSERT INTO cards (set_id, card_number, pokedex_number, name, name_local, card_type_id, energy_type_id, rarity_id, is_pokemon_ex, has_holo_variant)
VALUES
-- ── English base set (set_id = 1) ───────────────────────────
(1,'001/165',1,  'Bulbasaur',      NULL,1,1, 1,FALSE,TRUE),
(1,'002/165',2,  'Ivysaur',        NULL,1,1, 2,FALSE,TRUE),
(1,'003/165',3,  'Venusaur ex',    NULL,1,1, 4,TRUE, FALSE),
(1,'004/165',4,  'Charmander',     NULL,1,2, 1,FALSE,TRUE),
(1,'005/165',5,  'Charmeleon',     NULL,1,2, 2,FALSE,TRUE),
(1,'006/165',6,  'Charizard ex',   NULL,1,2, 4,TRUE, FALSE),
(1,'007/165',7,  'Squirtle',       NULL,1,3, 1,FALSE,TRUE),
(1,'008/165',8,  'Wartortle',      NULL,1,3, 2,FALSE,TRUE),
(1,'009/165',9,  'Blastoise ex',   NULL,1,3, 4,TRUE, FALSE),
(1,'010/165',10, 'Caterpie',       NULL,1,1, 1,FALSE,TRUE),
(1,'011/165',11, 'Metapod',        NULL,1,1, 1,FALSE,TRUE),
(1,'012/165',12, 'Butterfree',     NULL,1,1, 2,FALSE,TRUE),
(1,'013/165',13, 'Weedle',         NULL,1,1, 1,FALSE,TRUE),
(1,'014/165',14, 'Kakuna',         NULL,1,1, 1,FALSE,TRUE),
(1,'015/165',15, 'Beedrill',       NULL,1,1, 3,FALSE,TRUE),
(1,'016/165',16, 'Pidgey',         NULL,1,10,1,FALSE,TRUE),
(1,'017/165',17, 'Pidgeotto',      NULL,1,10,1,FALSE,TRUE),
(1,'018/165',18, 'Pidgeot',        NULL,1,10,2,FALSE,TRUE),
(1,'019/165',19, 'Rattata',        NULL,1,10,1,FALSE,TRUE),
(1,'020/165',20, 'Raticate',       NULL,1,10,2,FALSE,TRUE),
(1,'021/165',21, 'Spearow',        NULL,1,10,1,FALSE,TRUE),
(1,'022/165',22, 'Fearow',         NULL,1,10,2,FALSE,TRUE),
(1,'023/165',23, 'Ekans',          NULL,1,5, 1,FALSE,TRUE),
(1,'024/165',24, 'Arbok ex',       NULL,1,5, 4,TRUE, FALSE),
(1,'025/165',25, 'Pikachu',        NULL,1,4, 1,FALSE,TRUE),
(1,'026/165',26, 'Raichu',         NULL,1,4, 3,FALSE,TRUE),
(1,'027/165',27, 'Sandshrew',      NULL,1,6, 1,FALSE,TRUE),
(1,'028/165',28, 'Sandslash',      NULL,1,6, 2,FALSE,TRUE),
(1,'029/165',29, 'Nidoran ♀',      NULL,1,5, 1,FALSE,TRUE),
(1,'030/165',30, 'Nidorina',       NULL,1,5, 2,FALSE,TRUE),
(1,'031/165',31, 'Nidoqueen',      NULL,1,5, 2,FALSE,TRUE),
(1,'032/165',32, 'Nidoran ♂',      NULL,1,5, 1,FALSE,TRUE),
(1,'033/165',33, 'Nidorino',       NULL,1,5, 2,FALSE,TRUE),
(1,'034/165',34, 'Nidoking',       NULL,1,5, 3,FALSE,TRUE),
(1,'035/165',35, 'Clefairy',       NULL,1,5, 1,FALSE,TRUE),
(1,'036/165',36, 'Clefable',       NULL,1,5, 2,FALSE,TRUE),
(1,'037/165',37, 'Vulpix',         NULL,1,2, 1,FALSE,TRUE),
(1,'038/165',38, 'Ninetales ex',   NULL,1,2, 4,TRUE, FALSE),
(1,'039/165',39, 'Jigglypuff',     NULL,1,5, 1,FALSE,TRUE),
(1,'040/165',40, 'Wigglytuff ex',  NULL,1,5, 4,TRUE, FALSE),
(1,'041/165',41, 'Zubat',          NULL,1,5, 1,FALSE,TRUE),
(1,'042/165',42, 'Golbat',         NULL,1,5, 2,FALSE,TRUE),
(1,'043/165',43, 'Oddish',         NULL,1,1, 1,FALSE,TRUE),
(1,'044/165',44, 'Gloom',          NULL,1,1, 2,FALSE,TRUE),
(1,'045/165',45, 'Vileplume',      NULL,1,1, 3,FALSE,TRUE),
(1,'046/165',46, 'Paras',          NULL,1,1, 1,FALSE,TRUE),
(1,'047/165',47, 'Parasect',       NULL,1,1, 2,FALSE,TRUE),
(1,'048/165',48, 'Venonat',        NULL,1,1, 1,FALSE,TRUE),
(1,'049/165',49, 'Venomoth',       NULL,1,1, 2,FALSE,TRUE),
(1,'050/165',50, 'Diglett',        NULL,1,6, 1,FALSE,TRUE),
(1,'051/165',51, 'Dugtrio',        NULL,1,6, 2,FALSE,TRUE),
(1,'052/165',52, 'Meowth',         NULL,1,10,1,FALSE,TRUE),
(1,'053/165',53, 'Persian',        NULL,1,10,2,FALSE,TRUE),
(1,'054/165',54, 'Psyduck',        NULL,1,3, 1,FALSE,TRUE),
(1,'055/165',55, 'Golduck',        NULL,1,3, 2,FALSE,TRUE),
(1,'056/165',56, 'Mankey',         NULL,1,6, 1,FALSE,TRUE),
(1,'057/165',57, 'Primeape',       NULL,1,6, 2,FALSE,TRUE),
(1,'058/165',58, 'Growlithe',      NULL,1,2, 1,FALSE,TRUE),
(1,'059/165',59, 'Arcanine',       NULL,1,2, 2,FALSE,TRUE),
(1,'060/165',60, 'Poliwag',        NULL,1,3, 1,FALSE,TRUE),
(1,'061/165',61, 'Poliwhirl',      NULL,1,3, 1,FALSE,TRUE),
(1,'062/165',62, 'Poliwrath',      NULL,1,3, 2,FALSE,TRUE),
(1,'063/165',63, 'Abra',           NULL,1,5, 1,FALSE,TRUE),
(1,'064/165',64, 'Kadabra',        NULL,1,5, 2,FALSE,TRUE),
(1,'065/165',65, 'Alakazam ex',    NULL,1,5, 4,TRUE, FALSE),
(1,'066/165',66, 'Machop',         NULL,1,6, 1,FALSE,TRUE),
(1,'067/165',67, 'Machoke',        NULL,1,6, 2,FALSE,TRUE),
(1,'068/165',68, 'Machamp',        NULL,1,6, 3,FALSE,TRUE),
(1,'069/165',69, 'Bellsprout',     NULL,1,1, 1,FALSE,TRUE),
(1,'070/165',70, 'Weepinbell',     NULL,1,1, 1,FALSE,TRUE),
(1,'071/165',71, 'Victreebel',     NULL,1,1, 2,FALSE,TRUE),
(1,'072/165',72, 'Tentacool',      NULL,1,3, 1,FALSE,TRUE),
(1,'073/165',73, 'Tentacruel',     NULL,1,3, 2,FALSE,TRUE),
(1,'074/165',74, 'Geodude',        NULL,1,6, 1,FALSE,TRUE),
(1,'075/165',75, 'Graveler',       NULL,1,6, 2,FALSE,TRUE),
(1,'076/165',76, 'Golem ex',       NULL,1,6, 4,TRUE, FALSE),
(1,'077/165',77, 'Ponyta',         NULL,1,2, 1,FALSE,TRUE),
(1,'078/165',78, 'Rapidash',       NULL,1,2, 2,FALSE,TRUE),
(1,'079/165',79, 'Slowpoke',       NULL,1,5, 1,FALSE,TRUE),
(1,'080/165',80, 'Slowbro',        NULL,1,5, 2,FALSE,TRUE),
(1,'081/165',81, 'Magnemite',      NULL,1,4, 1,FALSE,TRUE),
(1,'082/165',82, 'Magneton',       NULL,1,4, 2,FALSE,TRUE),
(1,'083/165',83, 'Farfetch''d',    NULL,1,10,1,FALSE,TRUE),
(1,'084/165',84, 'Doduo',          NULL,1,10,1,FALSE,TRUE),
(1,'085/165',85, 'Dodrio',         NULL,1,10,3,FALSE,TRUE),
(1,'086/165',86, 'Seel',           NULL,1,3, 1,FALSE,TRUE),
(1,'087/165',87, 'Dewgong',        NULL,1,3, 2,FALSE,TRUE),
(1,'088/165',88, 'Grimer',         NULL,1,5, 1,FALSE,TRUE),
(1,'089/165',89, 'Muk',            NULL,1,5, 2,FALSE,TRUE),
(1,'090/165',90, 'Shellder',       NULL,1,3, 1,FALSE,TRUE),
(1,'091/165',91, 'Cloyster',       NULL,1,3, 2,FALSE,TRUE),
(1,'092/165',92, 'Gastly',         NULL,1,5, 1,FALSE,TRUE),
(1,'093/165',93, 'Haunter',        NULL,1,5, 2,FALSE,TRUE),
(1,'094/165',94, 'Gengar',         NULL,1,5, 3,FALSE,TRUE),
(1,'095/165',95, 'Onix',           NULL,1,6, 2,FALSE,TRUE),
(1,'096/165',96, 'Drowzee',        NULL,1,5, 1,FALSE,TRUE),
(1,'097/165',97, 'Hypno',          NULL,1,5, 2,FALSE,TRUE),
(1,'098/165',98, 'Krabby',         NULL,1,3, 1,FALSE,TRUE),
(1,'099/165',99, 'Kingler',        NULL,1,3, 2,FALSE,TRUE),
(1,'100/165',100,'Voltorb',        NULL,1,4, 1,FALSE,TRUE),
(1,'101/165',101,'Electrode',      NULL,1,4, 3,FALSE,TRUE),
(1,'102/165',102,'Exeggcute',      NULL,1,1, 1,FALSE,TRUE),
(1,'103/165',103,'Exeggutor',      NULL,1,1, 2,FALSE,TRUE),
(1,'104/165',104,'Cubone',         NULL,1,6, 1,FALSE,TRUE),
(1,'105/165',105,'Marowak',        NULL,1,6, 3,FALSE,TRUE),
(1,'106/165',106,'Hitmonlee',      NULL,1,6, 2,FALSE,TRUE),
(1,'107/165',107,'Hitmonchan',     NULL,1,6, 2,FALSE,TRUE),
(1,'108/165',108,'Lickitung',      NULL,1,10,1,FALSE,TRUE),
(1,'109/165',109,'Koffing',        NULL,1,5, 1,FALSE,TRUE),
(1,'110/165',110,'Weezing',        NULL,1,5, 3,FALSE,TRUE),
(1,'111/165',111,'Rhyhorn',        NULL,1,6, 1,FALSE,TRUE),
(1,'112/165',112,'Rhydon',         NULL,1,6, 2,FALSE,TRUE),
(1,'113/165',113,'Chansey',        NULL,1,10,3,FALSE,TRUE),
(1,'114/165',114,'Tangela',        NULL,1,1, 1,FALSE,TRUE),
(1,'115/165',115,'Kangaskhan ex',  NULL,1,10,4,TRUE, FALSE),
(1,'116/165',116,'Horsea',         NULL,1,3, 1,FALSE,TRUE),
(1,'117/165',117,'Seadra',         NULL,1,3, 2,FALSE,TRUE),
(1,'118/165',118,'Goldeen',        NULL,1,3, 1,FALSE,TRUE),
(1,'119/165',119,'Seaking',        NULL,1,3, 2,FALSE,TRUE),
(1,'120/165',120,'Staryu',         NULL,1,3, 1,FALSE,TRUE),
(1,'121/165',121,'Starmie',        NULL,1,3, 3,FALSE,TRUE),
(1,'122/165',122,'Mr. Mime',       NULL,1,5, 3,FALSE,TRUE),
(1,'123/165',123,'Scyther',        NULL,1,1, 2,FALSE,TRUE),
(1,'124/165',124,'Jynx ex',        NULL,1,5, 4,TRUE, FALSE),
(1,'125/165',125,'Electabuzz',     NULL,1,4, 1,FALSE,TRUE),
(1,'126/165',126,'Magmar',         NULL,1,2, 1,FALSE,TRUE),
(1,'127/165',127,'Pinsir',         NULL,1,1, 2,FALSE,TRUE),
(1,'128/165',128,'Tauros',         NULL,1,10,2,FALSE,TRUE),
(1,'129/165',129,'Magikarp',       NULL,1,3, 1,FALSE,TRUE),
(1,'130/165',130,'Gyarados',       NULL,1,3, 3,FALSE,TRUE),
(1,'131/165',131,'Lapras',         NULL,1,3, 2,FALSE,TRUE),
(1,'132/165',132,'Ditto',          NULL,1,10,3,FALSE,TRUE),
(1,'133/165',133,'Eevee',          NULL,1,10,1,FALSE,TRUE),
(1,'134/165',134,'Vaporeon',       NULL,1,3, 3,FALSE,TRUE),
(1,'135/165',135,'Jolteon',        NULL,1,4, 3,FALSE,TRUE),
(1,'136/165',136,'Flareon',        NULL,1,2, 3,FALSE,TRUE),
(1,'137/165',137,'Porygon',        NULL,1,10,1,FALSE,TRUE),
(1,'138/165',138,'Omanyte',        NULL,1,3, 2,FALSE,TRUE),
(1,'139/165',139,'Omastar',        NULL,1,3, 3,FALSE,TRUE),
(1,'140/165',140,'Kabuto',         NULL,1,6, 2,FALSE,TRUE),
(1,'141/165',141,'Kabutops',       NULL,1,6, 3,FALSE,TRUE),
(1,'142/165',142,'Aerodactyl',     NULL,1,6, 3,FALSE,TRUE),
(1,'143/165',143,'Snorlax',        NULL,1,10,2,FALSE,TRUE),
(1,'144/165',144,'Articuno',       NULL,1,3, 3,FALSE,TRUE),
(1,'145/165',145,'Zapdos ex',      NULL,1,4, 4,TRUE, FALSE),
(1,'146/165',146,'Moltres',        NULL,1,2, 3,FALSE,TRUE),
(1,'147/165',147,'Dratini',        NULL,1,9, 1,FALSE,TRUE),
(1,'148/165',148,'Dragonair',      NULL,1,9, 2,FALSE,TRUE),
(1,'149/165',149,'Dragonite',      NULL,1,9, 3,FALSE,TRUE),
(1,'150/165',150,'Mewtwo',         NULL,1,5, 3,FALSE,TRUE),
(1,'151/165',151,'Mew ex',         NULL,1,5, 4,TRUE, FALSE),
-- English Trainers
(1,'152/165',NULL,'Antique Dome Fossil',   NULL,2,11,1,FALSE,TRUE),
(1,'153/165',NULL,'Antique Helix Fossil',  NULL,2,11,1,FALSE,TRUE),
(1,'154/165',NULL,'Antique Old Amber',     NULL,2,11,1,FALSE,TRUE),
(1,'155/165',NULL,'Big Air Balloon',       NULL,2,11,2,FALSE,TRUE),
(1,'156/165',NULL,'Bill''s Transfer',      NULL,3,11,2,FALSE,TRUE),
(1,'157/165',NULL,'Cycling Road',          NULL,4,11,2,FALSE,TRUE),
(1,'158/165',NULL,'Daisy''s Help',         NULL,3,11,2,FALSE,TRUE),
(1,'159/165',NULL,'Energy Sticker',        NULL,2,11,2,FALSE,TRUE),
(1,'160/165',NULL,'Erika''s Invitation',   NULL,3,11,2,FALSE,TRUE),
(1,'161/165',NULL,'Giovanni''s Charisma',  NULL,3,11,2,FALSE,TRUE),
(1,'162/165',NULL,'Grabber',               NULL,2,11,2,FALSE,TRUE),
(1,'163/165',NULL,'Leftovers',             NULL,2,11,2,FALSE,TRUE),
(1,'164/165',NULL,'Protective Goggles',    NULL,2,11,2,FALSE,TRUE),
(1,'165/165',NULL,'Rigid Band',            NULL,2,11,2,FALSE,TRUE);

-- English Secret Rares (166–207)
INSERT INTO cards (set_id, card_number, pokedex_number, name, card_type_id, energy_type_id, rarity_id, is_pokemon_ex, is_secret_rare, has_holo_variant)
VALUES
-- Illustration Rares (166–181)
(1,'166/165',1,  'Bulbasaur',           1,1, 5,FALSE,TRUE,FALSE),
(1,'167/165',4,  'Charmander',          1,2, 5,FALSE,TRUE,FALSE),
(1,'168/165',7,  'Squirtle',            1,3, 5,FALSE,TRUE,FALSE),
(1,'169/165',10, 'Caterpie',            1,1, 5,FALSE,TRUE,FALSE),
(1,'170/165',25, 'Pikachu',             1,4, 5,FALSE,TRUE,FALSE),
(1,'171/165',35, 'Clefairy',            1,5, 5,FALSE,TRUE,FALSE),
(1,'172/165',37, 'Vulpix',              1,2, 5,FALSE,TRUE,FALSE),
(1,'173/165',39, 'Jigglypuff',          1,5, 5,FALSE,TRUE,FALSE),
(1,'174/165',43, 'Oddish',              1,1, 5,FALSE,TRUE,FALSE),
(1,'175/165',60, 'Poliwag',             1,3, 5,FALSE,TRUE,FALSE),
(1,'176/165',63, 'Abra',               1,5, 5,FALSE,TRUE,FALSE),
(1,'177/165',74, 'Geodude',             1,6, 5,FALSE,TRUE,FALSE),
(1,'178/165',79, 'Slowpoke',            1,5, 5,FALSE,TRUE,FALSE),
(1,'179/165',92, 'Gastly',              1,5, 5,FALSE,TRUE,FALSE),
(1,'180/165',96, 'Drowzee',             1,5, 5,FALSE,TRUE,FALSE),
(1,'181/165',133,'Eevee',              1,10,5,FALSE,TRUE,FALSE),
-- Special Illustration Rares (182–188)
(1,'182/165',3,  'Venusaur ex',         1,1, 6,TRUE, TRUE,FALSE),
(1,'183/165',6,  'Charizard ex',        1,2, 6,TRUE, TRUE,FALSE),
(1,'184/165',9,  'Blastoise ex',        1,3, 6,TRUE, TRUE,FALSE),
(1,'185/165',65, 'Alakazam ex',         1,5, 6,TRUE, TRUE,FALSE),
(1,'186/165',151,'Mew ex',             1,5, 6,TRUE, TRUE,FALSE),
(1,'187/165',145,'Zapdos ex',           1,4, 6,TRUE, TRUE,FALSE),
(1,'188/165',NULL,'Giovanni''s Charisma',3,11,6,FALSE,TRUE,FALSE),
-- Ultra Rares (189–206)
(1,'189/165',NULL,'Erika''s Invitation',  3,11,7,FALSE,TRUE,FALSE),
(1,'190/165',NULL,'Giovanni''s Charisma', 3,11,7,FALSE,TRUE,FALSE),
(1,'191/165',1,  'Bulbasaur',            1,1, 7,FALSE,TRUE,FALSE),
(1,'192/165',2,  'Ivysaur',              1,1, 7,FALSE,TRUE,FALSE),
(1,'193/165',3,  'Venusaur ex',          1,1, 7,TRUE, TRUE,FALSE),
(1,'194/165',4,  'Charmander',           1,2, 7,FALSE,TRUE,FALSE),
(1,'195/165',5,  'Charmeleon',           1,2, 7,FALSE,TRUE,FALSE),
(1,'196/165',6,  'Charizard ex',         1,2, 7,TRUE, TRUE,FALSE),
(1,'197/165',7,  'Squirtle',             1,3, 7,FALSE,TRUE,FALSE),
(1,'198/165',8,  'Wartortle',            1,3, 7,FALSE,TRUE,FALSE),
(1,'199/165',9,  'Blastoise ex',         1,3, 7,TRUE, TRUE,FALSE),
(1,'200/165',65, 'Alakazam ex',          1,5, 7,TRUE, TRUE,FALSE),
(1,'201/165',151,'Mew ex',              1,5, 7,TRUE, TRUE,FALSE),
(1,'202/165',145,'Zapdos ex',            1,4, 7,TRUE, TRUE,FALSE),
(1,'203/165',115,'Kangaskhan ex',        1,10,7,TRUE, TRUE,FALSE),
(1,'204/165',24, 'Arbok ex',             1,5, 7,TRUE, TRUE,FALSE),
(1,'205/165',38, 'Ninetales ex',         1,2, 7,TRUE, TRUE,FALSE),
(1,'206/165',76, 'Golem ex',             1,6, 7,TRUE, TRUE,FALSE),
-- Hyper Rares (207–209) — gold etched
(1,'207/165',3,  'Venusaur ex',          1,1, 8,TRUE, TRUE,FALSE),
(1,'208/165',6,  'Charizard ex',         1,2, 8,TRUE, TRUE,FALSE),
(1,'209/165',9,  'Blastoise ex',         1,3, 8,TRUE, TRUE,FALSE);

-- English Promos
INSERT INTO cards (set_id, card_number, pokedex_number, name, card_type_id, energy_type_id, rarity_id, is_promo, promo_source_id, has_holo_variant)
VALUES
(1,'SVP EN049',145,'Zapdos ex',       1,4,4,TRUE,1,FALSE),  -- GameStop
(1,'SVP EN050',65, 'Alakazam ex',     1,5,4,TRUE,2,FALSE),  -- Best Buy
(1,'SVP EN051',143,'Snorlax',         1,10,5,TRUE,4,FALSE), -- ETB
(1,'SVP EN052',150,'Mewtwo',          1,5,5,TRUE,3,FALSE),  -- Pokémon Center
(1,'SVP EN053',151,'Mew ex',          1,5,6,TRUE,3,FALSE);  -- Pokémon Center


-- ── Japanese base set (set_id = 2) ───────────────────────────
INSERT INTO cards (set_id, card_number, pokedex_number, name, name_local, card_type_id, energy_type_id, rarity_id, is_pokemon_ex, has_holo_variant)
VALUES
(2,'001/165',1,  'Bulbasaur',     'フシギダネ',   1,1, 1,FALSE,TRUE),
(2,'002/165',2,  'Ivysaur',       'フシギソウ',   1,1, 2,FALSE,TRUE),
(2,'003/165',3,  'Venusaur ex',   'フシギバナex', 1,1, 4,TRUE, FALSE),
(2,'004/165',4,  'Charmander',    'ヒトカゲ',     1,2, 1,FALSE,TRUE),
(2,'005/165',5,  'Charmeleon',    'リザード',     1,2, 2,FALSE,TRUE),
(2,'006/165',6,  'Charizard ex',  'リザードンex', 1,2, 4,TRUE, FALSE),
(2,'007/165',7,  'Squirtle',      'ゼニガメ',     1,3, 1,FALSE,TRUE),
(2,'008/165',8,  'Wartortle',     'カメール',     1,3, 2,FALSE,TRUE),
(2,'009/165',9,  'Blastoise ex',  'カメックスex', 1,3, 4,TRUE, FALSE),
(2,'010/165',10, 'Caterpie',      'キャタピー',   1,1, 1,FALSE,TRUE),
(2,'011/165',11, 'Metapod',       'トランセル',   1,1, 1,FALSE,TRUE),
(2,'012/165',12, 'Butterfree',    'バタフリー',   1,1, 2,FALSE,TRUE),
(2,'013/165',13, 'Weedle',        'ビードル',     1,1, 1,FALSE,TRUE),
(2,'014/165',14, 'Kakuna',        'コクーン',     1,1, 1,FALSE,TRUE),
(2,'015/165',15, 'Beedrill',      'スピアー',     1,1, 3,FALSE,TRUE),
(2,'016/165',16, 'Pidgey',        'ポッポ',       1,10,1,FALSE,TRUE),
(2,'017/165',17, 'Pidgeotto',     'ピジョン',     1,10,1,FALSE,TRUE),
(2,'018/165',18, 'Pidgeot',       'ピジョット',   1,10,2,FALSE,TRUE),
(2,'019/165',19, 'Rattata',       'コラッタ',     1,10,1,FALSE,TRUE),
(2,'020/165',20, 'Raticate',      'ラッタ',       1,10,2,FALSE,TRUE),
(2,'021/165',21, 'Spearow',       'オニスズメ',   1,10,1,FALSE,TRUE),
(2,'022/165',22, 'Fearow',        'オニドリル',   1,10,2,FALSE,TRUE),
(2,'023/165',23, 'Ekans',         'アーボ',       1,5, 1,FALSE,TRUE),
(2,'024/165',24, 'Arbok ex',      'アーボックex', 1,5, 4,TRUE, FALSE),
(2,'025/165',25, 'Pikachu',       'ピカチュウ',   1,4, 1,FALSE,TRUE),
(2,'026/165',26, 'Raichu',        'ライチュウ',   1,4, 3,FALSE,TRUE),
(2,'027/165',27, 'Sandshrew',     'サンド',       1,6, 1,FALSE,TRUE),
(2,'028/165',28, 'Sandslash',     'サンドパン',   1,6, 2,FALSE,TRUE),
(2,'029/165',29, 'Nidoran ♀',     'ニドラン♀',   1,5, 1,FALSE,TRUE),
(2,'030/165',30, 'Nidorina',      'ニドリーナ',   1,5, 2,FALSE,TRUE),
(2,'031/165',31, 'Nidoqueen',     'ニドクイン',   1,5, 2,FALSE,TRUE),
(2,'032/165',32, 'Nidoran ♂',     'ニドラン♂',   1,5, 1,FALSE,TRUE),
(2,'033/165',33, 'Nidorino',      'ニドリーノ',   1,5, 2,FALSE,TRUE),
(2,'034/165',34, 'Nidoking',      'ニドキング',   1,5, 3,FALSE,TRUE),
(2,'035/165',35, 'Clefairy',      'ピッピ',       1,5, 1,FALSE,TRUE),
(2,'036/165',36, 'Clefable',      'ピクシー',     1,5, 2,FALSE,TRUE),
(2,'037/165',37, 'Vulpix',        'ロコン',       1,2, 1,FALSE,TRUE),
(2,'038/165',38, 'Ninetales ex',  'キュウコンex', 1,2, 4,TRUE, FALSE),
(2,'039/165',39, 'Jigglypuff',    'プリン',       1,5, 1,FALSE,TRUE),
(2,'040/165',40, 'Wigglytuff ex', 'プクリンex',   1,5, 4,TRUE, FALSE),
(2,'041/165',41, 'Zubat',         'ズバット',     1,5, 1,FALSE,TRUE),
(2,'042/165',42, 'Golbat',        'ゴルバット',   1,5, 2,FALSE,TRUE),
(2,'043/165',43, 'Oddish',        'ナゾノクサ',   1,1, 1,FALSE,TRUE),
(2,'044/165',44, 'Gloom',         'クサイハナ',   1,1, 2,FALSE,TRUE),
(2,'045/165',45, 'Vileplume',     'ラフレシア',   1,1, 3,FALSE,TRUE),
(2,'046/165',46, 'Paras',         'パラス',       1,1, 1,FALSE,TRUE),
(2,'047/165',47, 'Parasect',      'パラセクト',   1,1, 2,FALSE,TRUE),
(2,'048/165',48, 'Venonat',       'コンパン',     1,1, 1,FALSE,TRUE),
(2,'049/165',49, 'Venomoth',      'モルフォン',   1,1, 2,FALSE,TRUE),
(2,'050/165',50, 'Diglett',       'ディグダ',     1,6, 1,FALSE,TRUE),
(2,'051/165',51, 'Dugtrio',       'ダグトリオ',   1,6, 2,FALSE,TRUE),
(2,'052/165',52, 'Meowth',        'ニャース',     1,10,1,FALSE,TRUE),
(2,'053/165',53, 'Persian',       'ペルシアン',   1,10,2,FALSE,TRUE),
(2,'054/165',54, 'Psyduck',       'コダック',     1,3, 1,FALSE,TRUE),
(2,'055/165',55, 'Golduck',       'ゴルダック',   1,3, 2,FALSE,TRUE),
(2,'056/165',56, 'Mankey',        'マンキー',     1,6, 1,FALSE,TRUE),
(2,'057/165',57, 'Primeape',      'オコリザル',   1,6, 2,FALSE,TRUE),
(2,'058/165',58, 'Growlithe',     'ガーディ',     1,2, 1,FALSE,TRUE),
(2,'059/165',59, 'Arcanine',      'ウインディ',   1,2, 2,FALSE,TRUE),
(2,'060/165',60, 'Poliwag',       'ニョロモ',     1,3, 1,FALSE,TRUE),
(2,'061/165',61, 'Poliwhirl',     'ニョロゾ',     1,3, 1,FALSE,TRUE),
(2,'062/165',62, 'Poliwrath',     'ニョロボン',   1,3, 2,FALSE,TRUE),
(2,'063/165',63, 'Abra',          'ケーシィ',     1,5, 1,FALSE,TRUE),
(2,'064/165',64, 'Kadabra',       'ユンゲラー',   1,5, 2,FALSE,TRUE),
(2,'065/165',65, 'Alakazam ex',   'フーディンex', 1,5, 4,TRUE, FALSE),
(2,'066/165',66, 'Machop',        'ワンリキー',   1,6, 1,FALSE,TRUE),
(2,'067/165',67, 'Machoke',       'ゴーリキー',   1,6, 2,FALSE,TRUE),
(2,'068/165',68, 'Machamp',       'カイリキー',   1,6, 3,FALSE,TRUE),
(2,'069/165',69, 'Bellsprout',    'マダツボミ',   1,1, 1,FALSE,TRUE),
(2,'070/165',70, 'Weepinbell',    'ウツドン',     1,1, 1,FALSE,TRUE),
(2,'071/165',71, 'Victreebel',    'ウツボット',   1,1, 2,FALSE,TRUE),
(2,'072/165',72, 'Tentacool',     'メノクラゲ',   1,3, 1,FALSE,TRUE),
(2,'073/165',73, 'Tentacruel',    'ドククラゲ',   1,3, 2,FALSE,TRUE),
(2,'074/165',74, 'Geodude',       'イシツブテ',   1,6, 1,FALSE,TRUE),
(2,'075/165',75, 'Graveler',      'ゴローン',     1,6, 2,FALSE,TRUE),
(2,'076/165',76, 'Golem ex',      'ゴローニャex', 1,6, 4,TRUE, FALSE),
(2,'077/165',77, 'Ponyta',        'ポニータ',     1,2, 1,FALSE,TRUE),
(2,'078/165',78, 'Rapidash',      'ギャロップ',   1,2, 2,FALSE,TRUE),
(2,'079/165',79, 'Slowpoke',      'ヤドン',       1,5, 1,FALSE,TRUE),
(2,'080/165',80, 'Slowbro',       'ヤドラン',     1,5, 2,FALSE,TRUE),
(2,'081/165',81, 'Magnemite',     'コイル',       1,4, 1,FALSE,TRUE),
(2,'082/165',82, 'Magneton',      'レアコイル',   1,4, 2,FALSE,TRUE),
(2,'083/165',83, 'Farfetch''d',   'カモネギ',     1,10,1,FALSE,TRUE),
(2,'084/165',84, 'Doduo',         'ドードー',     1,10,1,FALSE,TRUE),
(2,'085/165',85, 'Dodrio',        'ドードリオ',   1,10,3,FALSE,TRUE),
(2,'086/165',86, 'Seel',          'パウワウ',     1,3, 1,FALSE,TRUE),
(2,'087/165',87, 'Dewgong',       'ジュゴン',     1,3, 2,FALSE,TRUE),
(2,'088/165',88, 'Grimer',        'ベトベター',   1,5, 1,FALSE,TRUE),
(2,'089/165',89, 'Muk',           'ベトベトン',   1,5, 2,FALSE,TRUE),
(2,'090/165',90, 'Shellder',      'シェルダー',   1,3, 1,FALSE,TRUE),
(2,'091/165',91, 'Cloyster',      'パルシェン',   1,3, 2,FALSE,TRUE),
(2,'092/165',92, 'Gastly',        'ゴース',       1,5, 1,FALSE,TRUE),
(2,'093/165',93, 'Haunter',       'ゴースト',     1,5, 2,FALSE,TRUE),
(2,'094/165',94, 'Gengar',        'ゲンガー',     1,5, 3,FALSE,TRUE),
(2,'095/165',95, 'Onix',          'イワーク',     1,6, 2,FALSE,TRUE),
(2,'096/165',96, 'Drowzee',       'スリープ',     1,5, 1,FALSE,TRUE),
(2,'097/165',97, 'Hypno',         'スリーパー',   1,5, 2,FALSE,TRUE),
(2,'098/165',98, 'Krabby',        'クラブ',       1,3, 1,FALSE,TRUE),
(2,'099/165',99, 'Kingler',       'キングラー',   1,3, 2,FALSE,TRUE),
(2,'100/165',100,'Voltorb',       'ビリリダマ',   1,4, 1,FALSE,TRUE),
(2,'101/165',101,'Electrode',     'マルマイン',   1,4, 3,FALSE,TRUE),
(2,'102/165',102,'Exeggcute',     'タマタマ',     1,1, 1,FALSE,TRUE),
(2,'103/165',103,'Exeggutor',     'ナッシー',     1,1, 2,FALSE,TRUE),
(2,'104/165',104,'Cubone',        'カラカラ',     1,6, 1,FALSE,TRUE),
(2,'105/165',105,'Marowak',       'ガラガラ',     1,6, 3,FALSE,TRUE),
(2,'106/165',106,'Hitmonlee',     'サワムラー',   1,6, 2,FALSE,TRUE),
(2,'107/165',107,'Hitmonchan',    'エビワラー',   1,6, 2,FALSE,TRUE),
(2,'108/165',108,'Lickitung',     'ベロリンガ',   1,10,1,FALSE,TRUE),
(2,'109/165',109,'Koffing',       'ドガース',     1,5, 1,FALSE,TRUE),
(2,'110/165',110,'Weezing',       'マタドガス',   1,5, 3,FALSE,TRUE),
(2,'111/165',111,'Rhyhorn',       'サイホーン',   1,6, 1,FALSE,TRUE),
(2,'112/165',112,'Rhydon',        'サイドン',     1,6, 2,FALSE,TRUE),
(2,'113/165',113,'Chansey',       'ラッキー',     1,10,3,FALSE,TRUE),
(2,'114/165',114,'Tangela',       'モンジャラ',   1,1, 1,FALSE,TRUE),
(2,'115/165',115,'Kangaskhan ex', 'ガルーラex',   1,10,4,TRUE, FALSE),
(2,'116/165',116,'Horsea',        'タッツー',     1,3, 1,FALSE,TRUE),
(2,'117/165',117,'Seadra',        'シードラ',     1,3, 2,FALSE,TRUE),
(2,'118/165',118,'Goldeen',       'トサキント',   1,3, 1,FALSE,TRUE),
(2,'119/165',119,'Seaking',       'アズマオウ',   1,3, 2,FALSE,TRUE),
(2,'120/165',120,'Staryu',        'ヒトデマン',   1,3, 1,FALSE,TRUE),
(2,'121/165',121,'Starmie',       'スターミー',   1,3, 3,FALSE,TRUE),
(2,'122/165',122,'Mr. Mime',      'バリヤード',   1,5, 3,FALSE,TRUE),
(2,'123/165',123,'Scyther',       'ストライク',   1,1, 2,FALSE,TRUE),
(2,'124/165',124,'Jynx ex',       'ルージュラex', 1,5, 4,TRUE, FALSE),
(2,'125/165',125,'Electabuzz',    'エレブー',     1,4, 1,FALSE,TRUE),
(2,'126/165',126,'Magmar',        'ブーバー',     1,2, 1,FALSE,TRUE),
(2,'127/165',127,'Pinsir',        'カイロス',     1,1, 2,FALSE,TRUE),
(2,'128/165',128,'Tauros',        'ケンタロス',   1,10,2,FALSE,TRUE),
(2,'129/165',129,'Magikarp',      'コイキング',   1,3, 1,FALSE,TRUE),
(2,'130/165',130,'Gyarados',      'ギャラドス',   1,3, 3,FALSE,TRUE),
(2,'131/165',131,'Lapras',        'ラプラス',     1,3, 2,FALSE,TRUE),
(2,'132/165',132,'Ditto',         'メタモン',     1,10,3,FALSE,TRUE),
(2,'133/165',133,'Eevee',         'イーブイ',     1,10,1,FALSE,TRUE),
(2,'134/165',134,'Vaporeon',      'シャワーズ',   1,3, 3,FALSE,TRUE),
(2,'135/165',135,'Jolteon',       'サンダース',   1,4, 3,FALSE,TRUE),
(2,'136/165',136,'Flareon',       'ブースター',   1,2, 3,FALSE,TRUE),
(2,'137/165',137,'Porygon',       'ポリゴン',     1,10,1,FALSE,TRUE),
(2,'138/165',138,'Omanyte',       'オムナイト',   1,3, 2,FALSE,TRUE),
(2,'139/165',139,'Omastar',       'オムスター',   1,3, 3,FALSE,TRUE),
(2,'140/165',140,'Kabuto',        'カブト',       1,6, 2,FALSE,TRUE),
(2,'141/165',141,'Kabutops',      'カブトプス',   1,6, 3,FALSE,TRUE),
(2,'142/165',142,'Aerodactyl',    'プテラ',       1,6, 3,FALSE,TRUE),
(2,'143/165',143,'Snorlax',       'カビゴン',     1,10,2,FALSE,TRUE),
(2,'144/165',144,'Articuno',      'フリーザー',   1,3, 3,FALSE,TRUE),
(2,'145/165',145,'Zapdos ex',     'サンダーex',   1,4, 4,TRUE, FALSE),
(2,'146/165',146,'Moltres',       'ファイヤー',   1,2, 3,FALSE,TRUE),
(2,'147/165',147,'Dratini',       'ミニリュウ',   1,9, 1,FALSE,TRUE),
(2,'148/165',148,'Dragonair',     'ハクリュー',   1,9, 2,FALSE,TRUE),
(2,'149/165',149,'Dragonite',     'カイリュー',   1,9, 3,FALSE,TRUE),
(2,'150/165',150,'Mewtwo',        'ミュウツー',   1,5, 3,FALSE,TRUE),
(2,'151/165',151,'Mew ex',        'ミュウex',     1,5, 4,TRUE, FALSE),
-- Japanese Trainers
(2,'152/165',NULL,'Antique Dome Fossil',  'こだいのドームのかけら',   2,11,1,FALSE,TRUE),
(2,'153/165',NULL,'Antique Helix Fossil', 'こだいのならせんのかけら', 2,11,1,FALSE,TRUE),
(2,'154/165',NULL,'Antique Old Amber',    'こだいのはくぼくのかけら', 2,11,1,FALSE,TRUE),
(2,'155/165',NULL,'Big Air Balloon',      'おおきなふうせん',         2,11,2,FALSE,TRUE),
(2,'156/165',NULL,'Bill''s Transfer',     'マサキのはんてい',         3,11,2,FALSE,TRUE),
(2,'157/165',NULL,'Cycling Road',         'サイクリングロード',       4,11,2,FALSE,TRUE),
(2,'158/165',NULL,'Daisy''s Help',        'ナナミのおてつだい',       3,11,2,FALSE,TRUE),
(2,'159/165',NULL,'Energy Sticker',       'エネルギーシール',         2,11,2,FALSE,TRUE),
(2,'160/165',NULL,'Erika''s Invitation',  'エリカのおもてなし',       3,11,2,FALSE,TRUE),
(2,'161/165',NULL,'Giovanni''s Charisma', 'サカキのカリスマ',         3,11,2,FALSE,TRUE),
(2,'162/165',NULL,'Grabber',              'キャッチャーグラブ',       2,11,2,FALSE,TRUE),
(2,'163/165',NULL,'Leftovers',            'たべのこし',               2,11,2,FALSE,TRUE),
(2,'164/165',NULL,'Protective Goggles',   'まもりのゴーグル',         2,11,2,FALSE,TRUE),
(2,'165/165',NULL,'Rigid Band',           'かたいバンド',             2,11,2,FALSE,TRUE);

-- Japanese Secret Rares
INSERT INTO cards (set_id, card_number, pokedex_number, name, name_local, card_type_id, energy_type_id, rarity_id, is_pokemon_ex, is_secret_rare)
VALUES
-- AR (Art Rare) 166–181
(2,'166/165',1,  'Bulbasaur',           'フシギダネ',       1,1, 9,FALSE,TRUE),
(2,'167/165',4,  'Charmander',          'ヒトカゲ',         1,2, 9,FALSE,TRUE),
(2,'168/165',7,  'Squirtle',            'ゼニガメ',         1,3, 9,FALSE,TRUE),
(2,'169/165',10, 'Caterpie',            'キャタピー',       1,1, 9,FALSE,TRUE),
(2,'170/165',25, 'Pikachu',             'ピカチュウ',       1,4, 9,FALSE,TRUE),
(2,'171/165',35, 'Clefairy',            'ピッピ',           1,5, 9,FALSE,TRUE),
(2,'172/165',37, 'Vulpix',              'ロコン',           1,2, 9,FALSE,TRUE),
(2,'173/165',39, 'Jigglypuff',          'プリン',           1,5, 9,FALSE,TRUE),
(2,'174/165',43, 'Oddish',              'ナゾノクサ',       1,1, 9,FALSE,TRUE),
(2,'175/165',60, 'Poliwag',             'ニョロモ',         1,3, 9,FALSE,TRUE),
(2,'176/165',63, 'Abra',               'ケーシィ',         1,5, 9,FALSE,TRUE),
(2,'177/165',74, 'Geodude',             'イシツブテ',       1,6, 9,FALSE,TRUE),
(2,'178/165',79, 'Slowpoke',            'ヤドン',           1,5, 9,FALSE,TRUE),
(2,'179/165',92, 'Gastly',              'ゴース',           1,5, 9,FALSE,TRUE),
(2,'180/165',96, 'Drowzee',             'スリープ',         1,5, 9,FALSE,TRUE),
(2,'181/165',133,'Eevee',              'イーブイ',         1,10,9,FALSE,TRUE),
-- SR (Super Rare) 182–189
(2,'182/165',3,  'Venusaur ex',         'フシギバナex',     1,1, 10,TRUE, TRUE),
(2,'183/165',6,  'Charizard ex',        'リザードンex',     1,2, 10,TRUE, TRUE),
(2,'184/165',9,  'Blastoise ex',        'カメックスex',     1,3, 10,TRUE, TRUE),
(2,'185/165',65, 'Alakazam ex',         'フーディンex',     1,5, 10,TRUE, TRUE),
(2,'186/165',151,'Mew ex',             'ミュウex',         1,5, 10,TRUE, TRUE),
(2,'187/165',145,'Zapdos ex',           'サンダーex',       1,4, 10,TRUE, TRUE),
(2,'188/165',NULL,'Giovanni''s Charisma','サカキのカリスマ', 3,11,10,FALSE,TRUE),
(2,'189/165',NULL,'Erika''s Invitation', 'エリカのおもてなし',3,11,10,FALSE,TRUE),
-- SAR (Special Art Rare) 190–196
(2,'190/165',3,  'Venusaur ex',         'フシギバナex',     1,1, 11,TRUE, TRUE),
(2,'191/165',6,  'Charizard ex',        'リザードンex',     1,2, 11,TRUE, TRUE),
(2,'192/165',9,  'Blastoise ex',        'カメックスex',     1,3, 11,TRUE, TRUE),
(2,'193/165',65, 'Alakazam ex',         'フーディンex',     1,5, 11,TRUE, TRUE),
(2,'194/165',151,'Mew ex',             'ミュウex',         1,5, 11,TRUE, TRUE),
(2,'195/165',145,'Zapdos ex',           'サンダーex',       1,4, 11,TRUE, TRUE),
(2,'196/165',NULL,'Giovanni''s Charisma','サカキのカリスマ', 3,11,11,FALSE,TRUE),
-- UR (Ultra Rare / Gold) 197–212
(2,'197/165',1,  'Bulbasaur',           'フシギダネ',       1,1, 12,FALSE,TRUE),
(2,'198/165',4,  'Charmander',          'ヒトカゲ',         1,2, 12,FALSE,TRUE),
(2,'199/165',7,  'Squirtle',            'ゼニガメ',         1,3, 12,FALSE,TRUE),
(2,'200/165',65, 'Alakazam ex',         'フーディンex',     1,5, 12,TRUE, TRUE),
(2,'201/165',151,'Mew ex',             'ミュウex',         1,5, 12,TRUE, TRUE),
(2,'202/165',3,  'Venusaur ex',         'フシギバナex',     1,1, 12,TRUE, TRUE),
(2,'203/165',6,  'Charizard ex',        'リザードンex',     1,2, 12,TRUE, TRUE),
(2,'204/165',9,  'Blastoise ex',        'カメックスex',     1,3, 12,TRUE, TRUE),
(2,'205/165',145,'Zapdos ex',           'サンダーex',       1,4, 12,TRUE, TRUE),
(2,'206/165',115,'Kangaskhan ex',       'ガルーラex',       1,10,12,TRUE, TRUE),
(2,'207/165',24, 'Arbok ex',            'アーボックex',     1,5, 12,TRUE, TRUE),
(2,'208/165',38, 'Ninetales ex',        'キュウコンex',     1,2, 12,TRUE, TRUE),
(2,'209/165',76, 'Golem ex',            'ゴローニャex',     1,6, 12,TRUE, TRUE),
(2,'210/165',124,'Jynx ex',            'ルージュラex',     1,5, 12,TRUE, TRUE),
(2,'211/165',40, 'Wigglytuff ex',       'プクリンex',       1,5, 12,TRUE, TRUE),
(2,'212/165',NULL,'Giovanni''s Charisma','サカキのカリスマ', 3,11,12,FALSE,TRUE);

-- Japanese Promos
INSERT INTO cards (set_id, card_number, pokedex_number, name, name_local, card_type_id, energy_type_id, rarity_id, is_promo, promo_source_id)
VALUES
(2,'001/SV2A-P',1, 'Bulbasaur',  'フシギダネ', 1,1,1,TRUE,7),
(2,'002/SV2A-P',4, 'Charmander', 'ヒトカゲ',   1,2,1,TRUE,7),
(2,'003/SV2A-P',7, 'Squirtle',   'ゼニガメ',   1,3,1,TRUE,7);


-- ── Holo variants ────────────────────────────────────────────

-- EN: Standard Reverse Holo for all eligible base cards
INSERT INTO card_holo_variants (card_id, holo_pattern_id, approx_pull_rate)
SELECT card_id, 1, '~2 per pack'
FROM cards WHERE set_id = 1 AND has_holo_variant = TRUE;

-- JP: Poké Ball Mirror Holo for all eligible base cards
INSERT INTO card_holo_variants (card_id, holo_pattern_id, approx_pull_rate)
SELECT card_id, 2, '~2 per pack'
FROM cards WHERE set_id = 2 AND has_holo_variant = TRUE;

-- JP: Master Ball Mirror Holo for all eligible base cards
INSERT INTO card_holo_variants (card_id, holo_pattern_id, approx_pull_rate)
SELECT card_id, 3, '~1 per box'
FROM cards WHERE set_id = 2 AND has_holo_variant = TRUE;

