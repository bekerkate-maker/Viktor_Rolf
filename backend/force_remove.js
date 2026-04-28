import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: '/Users/katebeker/Documents/👘Viktor & Rolf/V&R Vibecoding/Viktor_Rolf/backend/.env' });

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function removeSupplier() {
    console.log('Fetching manufacturers...');
    const { data: mfs } = await supabase.from('manufacturers').select('*');
    if (mfs) {
        const toDelete = mfs.filter(m => m.name.toLowerCase().includes('sample supplier'));
        for (const m of toDelete) {
            await supabase.from('manufacturers').delete().eq('id', m.id);
            console.log(`Deleted manufacturer: "${m.name}"`);
        }
    }

    console.log('Fetching samples...');
    const { data: samples } = await supabase.from('samples').select('id, supplier_name');
    if (samples) {
        const samplesToUpdate = samples.filter(s => s.supplier_name && s.supplier_name.toLowerCase().includes('sample supplier'));
        for (const s of samplesToUpdate) {
            await supabase.from('samples').update({ supplier_name: null }).eq('id', s.id);
            console.log(`Removed supplier from sample ID: ${s.id} (was ${s.supplier_name})`);
        }
    }
    
    console.log('Done!');
}

removeSupplier();
