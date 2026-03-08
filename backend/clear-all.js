import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function clearDatabase() {
    console.log('Clearing database...');

    // Check if table samples exists, then delete all
    const { error: samplesError } = await supabase
        .from('samples')
        .delete()
        .neq('id', 0); // deletes all rows

    if (samplesError) {
        console.error('Error deleting samples:', samplesError);
    } else {
        console.log('Deleted all samples successfully.');
    }

    const { error: collectionsError } = await supabase
        .from('collections')
        .delete()
        .neq('id', 0); // deletes all rows

    if (collectionsError) {
        console.error('Error deleting collections:', collectionsError);
    } else {
        console.log('Deleted all collections successfully.');
    }

    console.log('Database clearing completed.');
}

clearDatabase();
