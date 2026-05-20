
import fs from 'fs';

async function testUpload() {
  try {
    const loginRes = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sophie.laurent@viktor-rolf.com',
        password: 'password123'
      })
    });
    
    if (!loginRes.ok) throw new Error('Login failed: ' + await loginRes.text());
    const loginData = await loginRes.json();
    const token = loginData.token;
    
    const samplesRes = await fetch('http://localhost:3002/api/samples', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const samplesData = await samplesRes.json();
    const sampleId = samplesData[0].id;
    console.log('Sample ID:', sampleId);
    
    const FormData = (await import('formdata-node')).FormData;
    const fileFromPath = (await import('formdata-node/file-from-path')).fileFromPath;

    fs.writeFileSync('dummy.jpg', 'fake image data');
    const form = new FormData();
    form.append('photos', await fileFromPath('dummy.jpg'), 'dummy.jpg');
    
    const uploadRes = await fetch(`http://localhost:3002/api/photos/samples/${sampleId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: form
    });
    
    console.log('Status:', uploadRes.status);
    console.log('Response:', await uploadRes.text());
  } catch (e) {
    console.error(e);
  }
}
testUpload();
