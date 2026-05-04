import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: '/Users/katebeker/Documents/👘Viktor & Rolf/V&R Vibecoding/Viktor_Rolf/backend/.env' });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function checkPhotos() {
    const { data, error } = await supabase
      .from('samples')
      .select(`
        id, 
        sample_code,
        photos:sample_photos(*)
      `)
      .limit(5);

    if (error) {
        console.error('Error:', error);
    } else {
        console.dir(data, { depth: null });
    }
}

checkPhotos();
