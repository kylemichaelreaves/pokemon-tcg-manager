"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCollection = getCollection;
exports.getCollectionEntryById = getCollectionEntryById;
exports.addToCollection = addToCollection;
exports.updateCollectionEntry = updateCollectionEntry;
exports.removeFromCollection = removeFromCollection;
exports.getCompletionSummary = getCompletionSummary;
const db_1 = require("../utils/db");
async function getCollection() {
    return (0, db_1.query)('SELECT * FROM v_collection');
}
async function getCollectionEntryById(id) {
    return (0, db_1.queryOne)('SELECT * FROM v_collection WHERE collection_id = $1', [id]);
}
async function addToCollection(input) {
    const result = await (0, db_1.queryOne)(`INSERT INTO collection
       (card_id, variant, quantity, condition, is_graded, grading_company, grade, date_acquired, purchase_price_usd, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`, [
        input.card_id,
        input.variant || 'Standard',
        input.quantity ?? 1,
        input.condition || 'Near Mint',
        input.is_graded || false,
        input.grading_company || null,
        input.grade ?? null,
        input.date_acquired || null,
        input.purchase_price_usd ?? null,
        input.notes || null,
    ]);
    if (!result)
        throw new Error('Failed to add to collection');
    return result;
}
async function updateCollectionEntry(id, input) {
    const fields = [];
    const params = [];
    let paramIndex = 1;
    for (const [key, value] of Object.entries(input)) {
        if (value !== undefined) {
            fields.push(`${key} = $${paramIndex++}`);
            params.push(value);
        }
    }
    if (fields.length === 0)
        return null;
    params.push(id);
    return (0, db_1.queryOne)(`UPDATE collection SET ${fields.join(', ')} WHERE collection_id = $${paramIndex} RETURNING *`, params);
}
async function removeFromCollection(id) {
    const result = await (0, db_1.queryOne)('DELETE FROM collection WHERE collection_id = $1 RETURNING collection_id', [id]);
    return result !== null;
}
async function getCompletionSummary() {
    return (0, db_1.query)('SELECT * FROM v_completion_summary');
}
//# sourceMappingURL=collectionService.js.map