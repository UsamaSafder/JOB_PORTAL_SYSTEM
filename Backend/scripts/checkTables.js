const { getPool, closePool } = require('../config/database');

async function main() {
  const required = ['Users', 'Candidates', 'Companies', 'Jobs', 'Applications'];
  const pool = await getPool();
  const query = `
    SELECT name
    FROM sys.tables
    WHERE name IN ('Users', 'Candidates', 'Companies', 'Jobs', 'Applications')
    ORDER BY name;
  `;

  const result = await pool.request().query(query);
  const found = result.recordset.map((r) => r.name);
  const missing = required.filter((name) => !found.includes(name));

  console.log('Found tables:', found.join(', ') || '(none)');
  console.log('Missing tables:', missing.join(', ') || '(none)');

  await closePool();

  if (missing.length > 0) {
    process.exit(2);
  }
}

main().catch(async (error) => {
  console.error('Table check failed:', error);
  try {
    await closePool();
  } catch (_) {
    // Ignore close errors in failure path.
  }
  process.exit(1);
});
