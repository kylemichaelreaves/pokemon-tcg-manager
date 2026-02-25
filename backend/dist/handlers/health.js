"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = handler;
const response_1 = require("../middleware/response");
const db_1 = require("../utils/db");
async function handler() {
    try {
        const pool = (0, db_1.getPool)();
        await pool.query('SELECT 1');
        return (0, response_1.success)({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: 'connected',
        });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : 'Health check failed';
        return (0, response_1.error)(message, 503);
    }
}
//# sourceMappingURL=health.js.map