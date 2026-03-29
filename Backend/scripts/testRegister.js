// use global fetch (Node 18+) — no extra dependency required

const test = async () => {
  const url = 'http://localhost:5001/api/auth/register';
  const payload = {
    email: `test.user+${Date.now()}@example.test`,
    password: 'password123',
    role: 'candidate',
    firstName: 'Test',
    lastName: 'User',
    phone: '01234567890'
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const body = await res.text();
    console.log('Status:', res.status);
    console.log('Body:', body);
  } catch (err) {
    console.error('Request failed', err);
  }
};

test();
