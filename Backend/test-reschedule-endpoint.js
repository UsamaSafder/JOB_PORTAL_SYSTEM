const http = require('http');

// Create a simple test token (this should be similar to what the candidate gets)
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJ0ZXN0QGV4YW1wbGUuY29tIiwicm9sZSI6ImNhbmRpZGF0ZSJ9.dummy';

const options = {
  hostname: 'localhost',
  port: 5001,
  path: '/api/applications/1/request-reschedule',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${testToken}`
  }
};

const req = http.request(options, (res) => {
  console.log(`\nStatus Code: ${res.statusCode}`);
  console.log('Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\nResponse Body:');
    console.log(data);
  });
});

req.on('error', (error) => {
  console.error('Request Error:', error);
});

const payload = JSON.stringify({ reason: 'Test reschedule request' });
console.log('Sending POST request to:', options.path);
console.log('Payload:', payload);
console.log('Headers:', options.headers);

req.write(payload);
req.end();
