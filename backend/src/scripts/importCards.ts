#!/usr/bin/env tsx
/**
 * CLI tool to import Pokemon TCG card data from TCGdex API.
 *
 * Usage:
 *   npx tsx backend/src/scripts/importCards.ts [options]
 *
 * Options:
 *   --set <id>        Import only a specific set (can be repeated)
 *   --dry-run         Preview what would be imported without writing
 *   --force           Re-import/update existing records
 *   --quick           Use set card summaries only (fast, but no rarity/type data)
 *
 * Examples:
 *   npx tsx backend/src/scripts/importCards.ts
 *   npx tsx backend/src/scripts/importCards.ts --set sv03.5 --set sv04
 *   npx tsx backend/src/scripts/importCards.ts --quick --dry-run
 */

import {
  importFromApi,
  ImportOptions,
  ImportProgressEvent,
} from '../services/importService';
import { closePool } from '../utils/db';

function parseArgs(args: string[]): ImportOptions {
  const options: ImportOptions = {};
  const setIds: string[] = [];

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--set':
        setIds.push(args[++i]);
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--force':
        options.force = true;
        break;
      case '--quick':
        options.quick = true;
        break;
      case '--help':
        console.log(`
Usage: npx tsx backend/src/scripts/importCards.ts [options]

Options:
  --set <id>        Import only a specific set (can be repeated)
  --dry-run         Preview what would be imported without writing
  --force           Re-import/update existing records
  --quick           Use set card summaries only (fast, but no rarity/type data)
  --help            Show this help message

Examples:
  npx tsx backend/src/scripts/importCards.ts --set sv03.5
  npx tsx backend/src/scripts/importCards.ts --quick
  npx tsx backend/src/scripts/importCards.ts --dry-run
`);
        process.exit(0);
    }
  }

  if (setIds.length > 0) {
    options.setIds = setIds;
  }

  return options;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));

  options.onProgress = (event: ImportProgressEvent) => {
    const prefix = event.phase === 'sets' ? '[sets]' : '[cards]';
    const progress =
      event.total > 0 ? ` (${event.current}/${event.total})` : '';
    console.log(`${prefix}${progress} ${event.message}`);
  };

  console.log('Pokemon TCG Import (TCGdex)');
  console.log('==========================');

  if (options.dryRun) {
    console.log('DRY RUN — no data will be written\n');
  }
  if (options.setIds) {
    console.log(`Filtering to sets: ${options.setIds.join(', ')}\n`);
  }
  if (options.force) {
    console.log('Force mode — existing records will be updated\n');
  }
  if (options.quick) {
    console.log(
      'Quick mode — using card summaries only (no rarity/type data)\n',
    );
  }

  const result = await importFromApi(options);

  console.log('\n--- Import Summary ---');
  console.log(
    `Sets:  ${result.setsImported} imported, ${result.setsSkipped} skipped`,
  );
  console.log(
    `Cards: ${result.cardsImported} imported, ${result.cardsUpdated} updated, ${result.cardsSkipped} skipped`,
  );
  console.log(`Duration: ${(result.duration / 1000).toFixed(1)}s`);

  if (result.lookupTablesExtended.rarities.length > 0) {
    console.log(
      `\nNew rarities added: ${result.lookupTablesExtended.rarities.join(', ')}`,
    );
  }
  if (result.lookupTablesExtended.cardTypes.length > 0) {
    console.log(
      `New card types added: ${result.lookupTablesExtended.cardTypes.join(', ')}`,
    );
  }
  if (result.lookupTablesExtended.energyTypes.length > 0) {
    console.log(
      `New energy types added: ${result.lookupTablesExtended.energyTypes.join(', ')}`,
    );
  }

  if (result.errors.length > 0) {
    console.log(`\nErrors (${result.errors.length}):`);
    for (const e of result.errors) {
      const cardPart = e.cardId ? `/${e.cardId}` : '';
      console.error(`  ${e.setId}${cardPart}: ${e.error}`);
    }
  }

  await closePool();
}

main().catch(async (err) => {
  console.error('Import failed:', err);
  await closePool();
  process.exit(1);
});
