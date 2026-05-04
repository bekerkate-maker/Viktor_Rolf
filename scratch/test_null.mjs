import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, 'backend/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNullStatus() {
  // Try to find a sample and set its status to null
  const { data: samples, error: fetchError } = await supabase.from('samples').select('id').limit(1);
  if (fetchError || !samples || samples.length === 0) {
    console.error('No samples found to test');
    return;
  }

  const sampleId = samples[0].id;
  console.log(`Testing NULL status on sample ${sampleId}...`);
  
  const { error: updateError } = await supabase
    .from('samples')
    .update({ status: null })
    .eq('id', sampleId);

  if (updateError) {
    console.log('Update to NULL failed:', updateError.message);
  } else {
    console.log('Update to NULL succeeded!');
  }
}

testNullStatus();
