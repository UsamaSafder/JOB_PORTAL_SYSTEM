require('dotenv').config();
const { getPool, sql } = require('../config/database');
const jwt = require('jsonwebtoken');

(async () => {
  try {
    const pool = await getPool();
    
    // Generate a test token for candidate ID 1
    const token = jwt.sign(
      { id: 1, role: 'candidate' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    console.log('Test token generated:', token);
    console.log('\nTo test the profile update, run this curl command:');
    console.log(`
curl -X PUT http://localhost:5002/api/users/candidate/profile \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${token}" \\
  -d '{
    "firstName": "Anab",
    "lastName": "Khan",
    "phone": "03026199472",
    "skills": "React,Node.js",
    "experience": "2",
    "email": "anab@test.com"
  }'
    `);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
})();
