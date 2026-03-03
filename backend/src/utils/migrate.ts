import fs from 'node:fs';
import path from 'node:path';
import { getPool, closePool } from './db';

async function migrate(): Promise<void> {
  const pool = getPool();

  console.log('Running migrations...');

  const migrationsDir = path.join(__dirname, '..', '..', '..', 'db', 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    console.log(`  Running ${file}...`);
    await pool.query(sql);
    console.log(`  ✓ ${file} complete`);
  }

  console.log('All migrations complete.');
  await closePool();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
