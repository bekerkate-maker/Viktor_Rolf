import { supabase } from './backend/src/database/supabase.js';

async function test() {
  const { data, error } = await supabase.from('manufacturers').select('*');
  if (error) {
    console.log('Manufacturers table does not exist or error:', error.message);
    if (error.code === '42P01') {
      console.log('Creating table manufacturers...');
      // This part is the tricky one since we don't have SQL execution access easily
    }
  } else {
    console.log('Manufacturers table exists:', data);
  }
}

test();
