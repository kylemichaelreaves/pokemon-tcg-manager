"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCards = getCards;
exports.getCardById = getCardById;
exports.getSets = getSets;
const db_1 = require("../utils/db");
const ALLOWED_SORT_COLUMNS = {
    name: 'name',
    card_number: 'card_number',
    set_code: 'set_code',
    rarity: 'rarity',
    card_type: 'card_type',
    energy_type: 'energy_type',
    pokedex_number: 'pokedex_number',
};
async function getCards(pagination, filters) {
    const { page, limit, sort_by, sort_order } = pagination;
    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let paramIndex = 1;
    if (filters.set_code) {
        conditions.push(`set_code = $${paramIndex++}`);
        params.push(filters.set_code);
    }
    if (filters.language) {
        conditions.push(`language = $${paramIndex++}`);
        params.push(filters.language);
    }
    if (filters.rarity) {
        conditions.push(`rarity = $${paramIndex++}`);
        params.push(filters.rarity);
    }
    if (filters.card_type) {
        conditions.push(`card_type = $${paramIndex++}`);
        params.push(filters.card_type);
    }
    if (filters.energy_type) {
        conditions.push(`energy_type = $${paramIndex++}`);
        params.push(filters.energy_type);
    }
    if (filters.is_pokemon_ex !== undefined) {
        conditions.push(`is_pokemon_ex = $${paramIndex++}`);
        params.push(filters.is_pokemon_ex);
    }
    if (filters.is_secret_rare !== undefined) {
        conditions.push(`is_secret_rare = $${paramIndex++}`);
        params.push(filters.is_secret_rare);
    }
    if (filters.is_promo !== undefined) {
        conditions.push(`is_promo = $${paramIndex++}`);
        params.push(filters.is_promo);
    }
    if (filters.search) {
        conditions.push(`name ILIKE $${paramIndex++}`);
        params.push(`%${filters.search}%`);
    }
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sortColumn = ALLOWED_SORT_COLUMNS[sort_by || ''] || 'set_code, card_number';
    const sortDir = sort_order === 'desc' ? 'DESC' : 'ASC';
    const countResult = await (0, db_1.queryOne)(`SELECT COUNT(*) as count FROM v_cards ${whereClause}`, params);
    const total = parseInt(countResult?.count || '0', 10);
    const dataParams = [...params, limit, offset];
    const rows = await (0, db_1.query)(`SELECT * FROM v_cards ${whereClause} ORDER BY ${sortColumn} ${sortDir} LIMIT $${paramIndex++} OFFSET $${paramIndex}`, dataParams);
    return {
        data: rows,
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
    };
}
async function getCardById(id) {
    return (0, db_1.queryOne)('SELECT * FROM v_cards WHERE card_id = $1', [id]);
}
async function getSets() {
    return (0, db_1.query)(`SELECT s.set_id, s.set_code, s.name, s.series, l.code AS language,
            s.release_date, s.total_cards, s.total_with_sr
     FROM sets s
     JOIN languages l ON s.language_id = l.language_id
     ORDER BY s.release_date DESC`);
}
//# sourceMappingURL=cardService.js.map