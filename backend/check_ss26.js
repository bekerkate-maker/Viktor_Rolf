import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

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
    console.table(collections.map(c => ({
        id: c.id,
        name: c.name,
        category: c.category,
        season: c.season,
        year: c.year
    })));

    for (const col of collections) {
        const { count, error: countError } = await supabase
            .from('samples')
            .select('*', { count: 'exact', head: true })
            .eq('collection_id', col.id);

        console.log(`Collection ${col.name} (ID: ${col.id}) has ${count} samples`);

        if (count > 0) {
            const { data: samples } = await supabase
                .from('samples')
                .select('sample_code, name')
                .eq('collection_id', col.id)
                .limit(5);
            console.log('Sample codes:', samples.map(s => s.sample_code).join(', '));
        }
    }
}

checkCollections();
