import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateEyewear() {
  console.log('Updating "Haute Couture" to "Eyewear Collection"...');
  
  // 1. Update collections category
  const { data: cols, error: colError } = await supabase
    .from('collections')
    .update({ category: 'Eyewear Collection' })
    .eq('category', 'Haute Couture');

  if (colError) {
    console.error('Error updating collections:', colError);
  } else {
    console.log('Successfully updated collections category.');
  }

  // 2. Also update collections with names containing "Haute Couture" or "Couture"
  const { data: colsByName, error: colNameError } = await supabase
    .from('collections')
    .update({ category: 'Eyewear Collection' })
    .ilike('name', '%couture%');

  if (colNameError) {
    console.error('Error updating collections by name:', colNameError);
  } else {
    console.log('Successfully updated collections containing "Couture" in name.');
  }

  console.log('Done.');
}

updateEyewear();
