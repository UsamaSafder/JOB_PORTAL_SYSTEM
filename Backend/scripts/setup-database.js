require('dotenv').config();
const { ensureDatabaseExists, createTables } = require('../config/initDatabase');

async function setupDatabase() {
  try {
    console.log('Starting database setup...\n');
    
    // Step 1: Ensure database exists
    await ensureDatabaseExists();
    
    // Step 2: Create all tables
    await createTables();
    
    console.log('\n✓ Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Database setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();