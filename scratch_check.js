import { supabase } from './backend/src/database/supabase.js';

async function checkData() {
  console.log('--- Checking Manufacturers ---');
  const { data: manufacturers, error: mError } = await supabase.from('manufacturers').select('*');
  if (mError) console.error('Manufacturers error:', mError.message);
  else console.log(`Found ${manufacturers.length} manufacturers:`, manufacturers);

  console.log('\n--- Checking Unique Manufacturers in Samples ---');
  const { data: samples, error: sError } = await supabase.from('samples').select('supplier_name');
  if (sError) console.error('Samples error:', sError.message);
  else {
    const unique = [...new Set(samples.map(s => s.supplier_name).filter(Boolean))];
    console.log(`Found ${unique.length} unique manufacturers from ${samples.length} samples:`, unique);
  }
}

checkData();
