import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function test() {
    console.log('Testing Supabase connection...');
    console.log('URL:', process.env.SUPABASE_URL);
    try {
        const { data, error } = await supabase.from('collections').select('id, name').limit(1);
        if (error) {
            console.error('Supabase Error:', error);
        } else {
            console.log('Success! Connection established.');
            console.log('Data:', data);
        }
    } catch (err) {
        console.error('Catch Error:', err);
    }
}

test();
