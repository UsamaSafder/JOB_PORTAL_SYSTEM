const { getPool, sql } = require('../config/database');

async function cleanupTestData() {
  try {
    const pool = await getPool();
    
    console.log('Cleaning up old test data...');
    
    // Delete applications
    await pool.request().query(`
      DELETE FROM Applications WHERE JobID IN (
        SELECT JobID FROM Jobs WHERE CompanyID = (
          SELECT CompanyID FROM Companies WHERE userId = (
            SELECT id FROM Users WHERE email = 'test.company@example.com'
          )
        )
      )
    `);
    
    // Delete jobs
    await pool.request().query(`
      DELETE FROM Jobs WHERE CompanyID = (
        SELECT CompanyID FROM Companies WHERE userId = (
          SELECT id FROM Users WHERE email = 'test.company@example.com'
        )
      )
    `);
    
    // Delete companies
    await pool.request().query(`
      DELETE FROM Companies WHERE userId IN (
        SELECT id FROM Users WHERE email = 'test.company@example.com'
      )
    `);
    
    // Delete candidates
    await pool.request().query(`
      DELETE FROM Candidates WHERE userId IN (
        SELECT id FROM Users WHERE email LIKE 'test.candidate%@example.com'
      )
    `);
    
    // Delete users
    await pool.request().query(`
      DELETE FROM Users WHERE email = 'test.company@example.com' OR email LIKE 'test.candidate%@example.com'
    `);
    
    console.log('✓ Old test data cleaned up successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error cleaning up test data:', error.message);
    process.exit(1);
  }
}

cleanupTestData();
