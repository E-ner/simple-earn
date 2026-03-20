const http = require('http');

async function run() {
  const BASE = 'http://localhost:3000';
  console.log('--- 1. Registering User ---');
  
  const regRes = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `test_${Date.now()}@example.com`, username: `user_${Date.now()}`, password: 'Password123!', country: 'RW' })
  });
  console.log('Register Status:', regRes.status);
  console.log(await regRes.json());
  
  console.log('\n--- 2. Getting CSRF Token ---');
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const csrfCookies = csrfRes.headers.get('set-cookie');
  const { csrfToken } = await csrfRes.json();
  console.log('CSRF Token:', csrfToken);
  
  console.log('\n--- 3. Logging In ---');
  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': csrfCookies
    },
    body: new URLSearchParams({
      email: 'test@example.com', // from the DB seed
      password: 'password123',
      csrfToken,
      redirect: 'false'
    }),
    redirect: 'manual'
  });
  const sessionCookies = loginRes.headers.get('set-cookie');
  console.log('Login Status:', loginRes.status);
  console.log(await loginRes.json());
  
  console.log('\n--- 4. Checking Session ---');
  const sessionRes = await fetch(`${BASE}/api/auth/session`, {
    headers: { 'Cookie': sessionCookies || '' }
  });
  console.log('Session Status:', sessionRes.status);
  const sessionData = await sessionRes.json();
  console.log(sessionData);
  
  if (sessionData.user) {
    console.log('\n✅ System is fully operational: End-to-end auth works!');
  } else {
    console.log('\n❌ Session failed to return user data.');
  }
}

run().catch(console.error);
