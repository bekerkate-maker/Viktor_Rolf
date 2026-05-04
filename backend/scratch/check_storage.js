
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBuckets() {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error('Error listing buckets:', error);
    return;
  }
  console.log('Buckets:', data);
  
  const hasPhotos = data.find(b => b.name === 'sample-photos');
  if (!hasPhotos) {
    console.log('Creating bucket: sample-photos');
    const { data: newBucket, error: createError } = await supabase.storage.createBucket('sample-photos', {
      public: true,
      fileSizeLimit: 10485760 // 10MB
    });
    if (createError) console.error('Error creating bucket:', createError);
    else console.log('Bucket created:', newBucket);
  }
}

checkBuckets();
