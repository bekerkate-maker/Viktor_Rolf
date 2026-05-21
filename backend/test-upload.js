import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

async function test() {
  try {
    const form = new FormData();
    // Use an existing file to test upload
    form.append('photos', fs.createReadStream('package.json'), 'package.heic');
    
    // We don't have a valid token or sampleId, but we can try to hit the endpoint to see if it reaches the HEIC processing or if there's a typo.
    // Wait, let's just grep the error from the node process!
  } catch (err) {
    console.error(err);
  }
}
test();
