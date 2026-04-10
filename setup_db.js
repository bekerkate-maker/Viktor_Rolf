import { supabase } from './backend/src/database/supabase.js';

async function setup() {
  console.log('Checking for manufacturers table...');
  const { error: checkError } = await supabase.from('manufacturers').select('*').limit(1);
  
  if (checkError && checkError.code === '42P01') {
    console.log('Table "manufacturers" does not exist. Please create it manually in the Supabase SQL Editor:');
    console.log(`
      CREATE TABLE manufacturers (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    
    // Attempting a hacky creation via RPC if it exists (usually doesn't)
    // But better to just inform the user or use a different storage if I can't create it.
  } else if (!checkError) {
    console.log('Table exists.');
  } else {
    console.error('Error:', checkError);
  }
}

setup();
