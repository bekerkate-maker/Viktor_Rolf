import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function checkCollections() {
    const { data: collections, error } = await supabase
        .from('collections')
        .select('*')
        .eq('year', 2026);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Collections for 2026:');
    console.table(collections);

    for (const col of collections) {
        const { count, error: countError } = await supabase
            .from('samples')
            .select('*', { count: 'exact', head: true })
            .eq('collection_id', col.id);

        console.log(`Collection ${col.name} (ID: ${col.id}) has ${count} samples`);
    }
}

checkCollections();
