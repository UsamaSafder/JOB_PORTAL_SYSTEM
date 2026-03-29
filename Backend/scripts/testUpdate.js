require('dotenv').config();
const { getPool, sql } = require('../config/database');

(async () => {
  try {
    const pool = await getPool();
    
    // First, let's find a candidate to update
    console.log('Finding candidates...');
    const candidates = await pool.request()
      .query('SELECT TOP 5 CandidateID, FullName, PhoneNumber FROM Candidates');
    
    console.log('Candidates found:', candidates.recordset);
    
    if (candidates.recordset.length === 0) {
      console.log('No candidates in database');
      process.exit(1);
    }
    
    const candidateId = candidates.recordset[0].CandidateID;
    console.log('\nTesting update on candidate ID:', candidateId);
    
    // Try a simple update
    console.log('\nAttempting simple UPDATE...');
    const result = await pool.request()
      .input('candidateId', sql.Int, candidateId)
      .input('fullName', sql.NVarChar, 'Test User Update')
      .query(`UPDATE Candidates SET FullName = @fullName OUTPUT INSERTED.* WHERE CandidateID = @candidateId`);
    
    console.log('Update successful!');
    console.log('Result:', result.recordset[0]);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    console.error('Code:', err.code);
    console.error('Number:', err.number);
    console.error('Full error:', err);
    process.exit(1);
  }
})();
