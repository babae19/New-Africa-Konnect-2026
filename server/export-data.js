const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is required to export database data.');
  process.exit(1);
}

const tables = ['users', 'expert_profiles', 'projects', 'contracts', 'messages', 'tasks', 'files', 'activities', 'audit_logs', 'password_reset_tokens', 'notifications', 'project_invitations', 'applications', 'interviews', 'milestones', 'transactions'];
const pool = new Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });

async function exportData() {
  const client = await pool.connect();
  const output = { timestamp: new Date().toISOString(), source: 'Database', tables: {} };
  try {
    for (const table of tables) {
      const exists = await client.query('SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = $1 AND table_name = $2)', ['public', table]);
      output.tables[table] = exists.rows[0].exists ? (await client.query(`SELECT * FROM ${table}`)).rows : [];
    }
    const exportPath = path.join(__dirname, 'database-export.json');
    fs.writeFileSync(exportPath, JSON.stringify(output, null, 2));
    console.log(`Database export saved to ${exportPath}`);
  } finally {
    client.release();
    await pool.end();
  }
}

exportData().catch((error) => {
  console.error('Database export failed:', error.message);
  process.exit(1);
});
