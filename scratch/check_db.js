import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, 'backend/.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function check() {
  const { data, error } = await supabase.rpc('get_table_info', { t_name: 'samples' });
  if (error) {
    // If no RPC, try to just insert a 'None' and see the error again to confirm
    const { error: insertError } = await supabase.from('samples').insert({ name: 'Test', status: 'None' });
    console.log('Insert error:', insertError);
  } else {
    console.log('Table info:', data);
  }
}

check();
