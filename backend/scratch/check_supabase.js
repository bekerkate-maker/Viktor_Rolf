const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkData() {
  try {
    const { count, error } = await supabase
      .from('collections')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error fetching collections:', error);
      return;
    }
    
    console.log(`Supabase 'collections' table has ${count} records.`);
  } catch (err) {
    console.error('Failed to connect:', err);
  }
}

checkData();
