const { getPool } = require('../config/database');

(async () => {
  try {
    const pool = await getPool();
    const rdr = await pool.request()
      .input('tableName', 'Candidates')
      .query(`SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = @tableName`);

    console.log('Candidates table columns:');
    rdr.recordset.forEach(r => console.log(r.COLUMN_NAME, r.DATA_TYPE));

    const rdr2 = await pool.request()
      .input('tableName', 'Companies')
      .query(`SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = @tableName`);

    console.log('\nCompanies table columns:');
    rdr2.recordset.forEach(r => console.log(r.COLUMN_NAME, r.DATA_TYPE));

    const rdr3 = await pool.request()
      .input('tableName', 'Users')
      .query(`SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = @tableName`);

    console.log('\nUsers table columns:');
    rdr3.recordset.forEach(r => console.log(r.COLUMN_NAME, r.DATA_TYPE));

    process.exit(0);
  } catch (err) {
    console.error('Inspect failed:', err);
    process.exit(1);
  }
})();
