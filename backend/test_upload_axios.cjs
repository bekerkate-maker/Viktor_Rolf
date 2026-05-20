
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

async function test() {
  try {
    const loginRes = await axios.post('http://127.0.0.1:3002/api/auth/login', {
      email: 'sophie.laurent@viktor-rolf.com',
      password: 'password123'
    });
    const token = loginRes.data.token;
    
    const samplesRes = await axios.get('http://127.0.0.1:3002/api/samples', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const sampleId = samplesRes.data[0].id;
    
    fs.writeFileSync('dummy.jpg', 'fake image data');
    const form = new FormData();
    form.append('photos', fs.createReadStream('dummy.jpg'), 'dummy.jpg');
    
    const uploadRes = await axios.post('http://127.0.0.1:3002/api/photos/samples/' + sampleId, form, {
      headers: {
        'Authorization': 'Bearer ' + token,
        ...form.getHeaders()
      }
    });
    
    console.log('Upload Status:', uploadRes.status);
    console.log('Response:', uploadRes.data);
  } catch (e) {
    if (e.response) {
       console.error('HTTP Error:', e.response.status, e.response.statusText);
       console.error('Data:', e.response.data);
    } else {
       console.error('Error:', e.message);
    }
  }
}
test();
