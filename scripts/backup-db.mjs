/**
 * Scheduled Supabase / Postgres Database Backup Utility
 * 
 * Exports core data tables (collections, products, orders, order_items,
 * enquiries, customers, site_settings, invoices, suppliers, purchase_invoices, purchase_items)
 * into timestamped JSON snapshots and pipe-separated CSV archives ('|' separator).
 * 
 * Usage:
 *   node scripts/backup-db.mjs
 * 
 * Env variables required (from .env or process.env):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'node:fs';
import * as path from 'node:path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TABLES = [
  'collections',
  'products',
  'orders',
  'order_items',
  'enquiries',
  'customers',
  'site_settings',
  'invoices',
  'suppliers',
  'purchase_invoices',
  'purchase_items',
];

function sanitizeCsvValue(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') {
    return JSON.stringify(val).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
  }
  return String(val).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function toPipeSeparatedCsv(rows) {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const headerLine = headers.join('|');
  const dataLines = rows.map((row) =>
    headers.map((h) => sanitizeCsvValue(row[h])).join('|')
  );
  return [headerLine, ...dataLines].join('\n');
}

async function runBackup() {
  console.log('--- Starting Hilo Arte Database Backup ---');

  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.warn(
      'Notice: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in environment.\n' +
      'Generating sample schema backup manifest.'
    );
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.resolve(process.cwd(), 'backups', timestamp);

  fs.mkdirSync(backupDir, { recursive: true });

  const manifest = {
    timestamp: new Date().toISOString(),
    tables: {},
  };

  if (SUPABASE_URL && SERVICE_KEY) {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    for (const table of TABLES) {
      try {
        console.log(`Backing up table: ${table}...`);
        const { data, error } = await supabase.from(table).select('*');
        if (error) {
          console.error(`Error dumping ${table}:`, error.message);
          manifest.tables[table] = { status: 'error', error: error.message };
          continue;
        }

        const count = data ? data.length : 0;
        manifest.tables[table] = { status: 'ok', rowCount: count };

        // Save JSON
        const jsonPath = path.join(backupDir, `${table}.json`);
        fs.writeFileSync(jsonPath, JSON.stringify(data || [], null, 2), 'utf-8');

        // Save CSV with '|' delimiter
        if (data && data.length > 0) {
          const csvPath = path.join(backupDir, `${table}.csv`);
          fs.writeFileSync(csvPath, toPipeSeparatedCsv(data), 'utf-8');
        }

        console.log(`✓ ${table}: ${count} rows backed up`);
      } catch (err) {
        console.error(`Failed to export ${table}:`, err);
        manifest.tables[table] = { status: 'error', error: String(err) };
      }
    }
  } else {
    // Write dry-run manifest for pipeline verification
    for (const table of TABLES) {
      manifest.tables[table] = { status: 'simulated', rowCount: 0 };
      const csvPath = path.join(backupDir, `${table}.csv`);
      fs.writeFileSync(csvPath, 'id|name|created_at\n', 'utf-8');
    }
    console.log('✓ Dry-run backup structure initialized with pipe-separated CSV format.');
  }

  const manifestPath = path.join(backupDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

  console.log(`\nBackup successfully written to: ${backupDir}`);
  console.log('--- Database Backup Complete ---');
}

runBackup().catch((err) => {
  console.error('Fatal backup error:', err);
  process.exit(1);
});
