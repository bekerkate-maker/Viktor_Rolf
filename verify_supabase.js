import { supabase } from './backend/src/database/supabase.js';

async function check() {
  console.log('--- Checking Supabase State ---');
  
  // 1. Check manufacturers table
  const { data: mData, error: mError } = await supabase.from('manufacturers').select('*');
  if (mError) {
    if (mError.code === '42P01') {
      console.log('Manufacturers table: MISSING (using samples fallback)');
    } else {
      console.log('Manufacturers table error:', mError.message);
    }
  } else {
    console.log(`Manufacturers table: FOUND (${mData.length} records)`);
    mData.forEach(m => console.log(` - ${m.name}`));
  }
  
  // 2. Check samples count and manufacturer names
  const { data: sData, error: sError } = await supabase.from('samples').select('id, name, supplier_name, sample_code');
  if (sError) {
    console.log('Samples table error:', sError.message);
  } else {
    console.log(`Samples (Articles) table: FOUND (${sData.length} records)`);
    // Sample a few
    sData.slice(0, 5).forEach(s => {
      console.log(` - [${s.sample_code}] ${s.name} (Manufacturer: ${s.supplier_name || 'NONE'})`);
    });
  }
  
  console.log('--- Check Finished ---');
}

check();
