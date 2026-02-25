"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const db_1 = require("./db");
async function migrate() {
    const pool = (0, db_1.getPool)();
    console.log('Running migrations...');
    const migrationsDir = node_path_1.default.join(__dirname, '..', '..', '..', 'db', 'migrations');
    const files = node_fs_1.default.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
    for (const file of files) {
        const sql = node_fs_1.default.readFileSync(node_path_1.default.join(migrationsDir, file), 'utf-8');
        console.log(`  Running ${file}...`);
        await pool.query(sql);
        console.log(`  ✓ ${file} complete`);
    }
    console.log('All migrations complete.');
    await (0, db_1.closePool)();
}
migrate().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
//# sourceMappingURL=migrate.js.map