import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const sqlPath = path.join(process.cwd(), 'supabase', 'analytics_functions.sql');
const dbUrl = process.env.SUPABASE_DB_URL;

if (!dbUrl) {
  console.error(
    'Set SUPABASE_DB_URL to your Supabase Postgres connection string, then rerun.',
  );
  console.error(
    'Find it in Supabase Dashboard → Project Settings → Database → Connection string.',
  );
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, 'utf8');

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  await client.query(sql);
  console.log('Analytics SQL functions applied successfully.');
} catch (error) {
  console.error('Failed to apply analytics SQL:', error);
  process.exit(1);
} finally {
  await client.end();
}
