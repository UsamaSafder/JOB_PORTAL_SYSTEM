const { getPool, sql } = require('../config/database');

async function verifyAllCompanies() {
  try {
    const pool = await getPool();
    
    console.log('Verifying all companies...');
    
    // Update all company users to verified = 1
    const result = await pool.request()
      .query(`
        UPDATE Users 
        SET isVerified = 1 
        WHERE role = 'company'
      `);
    
    console.log(`✓ Successfully verified ${result.rowsAffected[0]} company/companies`);
    
    // Verify by showing count
    const verifyResult = await pool.request()
      .query(`
        SELECT COUNT(*) as VerifiedCount 
        FROM Users 
        WHERE role = 'company' AND isVerified = 1
      `);
    
    console.log(`✓ Total verified companies: ${verifyResult.recordset[0].VerifiedCount}`);
    
  } catch (error) {
    console.error('Error verifying companies:', error);
    process.exit(1);
  }
}

verifyAllCompanies();
