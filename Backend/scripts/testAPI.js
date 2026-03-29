const axios = require('axios');

async function testAPI() {
  try {
    console.log('Testing Job Portal API...\n');

    // First, login as company
    console.log('1. Testing company login...');
    const loginRes = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'test.company@example.com',
      password: 'password123'
    });

    const token = loginRes.data.token;
    console.log('✓ Login successful');
    console.log('  Token:', token.substring(0, 50) + '...');
    console.log('  User Role:', loginRes.data.user.role);

    // Now test fetching applications
    console.log('\n2. Testing get company applications endpoint...');
    const appsRes = await axios.get('http://localhost:5001/api/applications/company/received', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✓ API call successful');
    console.log('  Applications count:', appsRes.data.length);
    
    if (appsRes.data.length > 0) {
      console.log('\n  Sample application:');
      const app = appsRes.data[0];
      console.log('    - Job Title:', app.jobTitle);
      console.log('    - Candidate Name:', app.candidateName);
      console.log('    - Status:', app.status);
      console.log('    - Applied At:', app.appliedAt);
    }

    console.log('\n✓ All tests passed! Data is displaying correctly.');
    process.exit(0);
  } catch (error) {
    console.error('✗ Test failed');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.error || error.message);
    if (error.response?.data?.details) {
      console.error('Details:', error.response.data.details);
    }
    process.exit(1);
  }
}

testAPI();
