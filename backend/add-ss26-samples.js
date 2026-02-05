import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function addSS26Samples() {
  try {
    console.log('🌸 Adding example samples to Spring/Summer 2026...\n');

    // Get SS26 collection
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select('id, name')
      .eq('season', 'SS')
      .eq('year', 2026)
      .eq('category', 'Ready to Wear')
      .single();

    if (collectionError || !collection) {
      console.error('❌ Error finding SS26 collection:', collectionError?.message);
      return;
    }

    console.log('✅ Found collection:', collection.name);
    console.log('   Collection ID:', collection.id);

    // Get a user ID for responsible_user_id (use Sophie Laurent as default)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'sophie.laurent@viktor-rolf.com')
      .single();

    if (userError || !user) {
      console.error('❌ Error finding user:', userError?.message);
      return;
    }

    // Example samples to add
    const exampleSamples = [
      {
        sample_code: 'SS26-RTW-001',
        collection_id: collection.id,
        name: 'Oversized blazer with sculptural shoulders',
        product_type: 'Jacket',
        supplier_name: 'Atelier Couture Paris',
        status: 'Approved',
        responsible_user_id: user.id,
        sample_round: 'Proto',
        internal_notes: 'Example sample - approved for production. Wool gabardine, Midnight Navy, Size 38'
      },
      {
        sample_code: 'SS26-RTW-002',
        collection_id: collection.id,
        name: 'Asymmetric pleated dress',
        product_type: 'Dress',
        supplier_name: 'Maison Textile Lyon',
        status: 'In Review',
        responsible_user_id: user.id,
        sample_round: 'SMS',
        internal_notes: 'Example sample - awaiting final review. Silk chiffon, Powder Pink, Size 40'
      },
      {
        sample_code: 'SS26-ACC-001',
        collection_id: collection.id,
        name: 'Geometric leather clutch',
        product_type: 'Other',
        supplier_name: 'Leather Studio Milano',
        status: 'In Review',
        responsible_user_id: user.id,
        sample_round: 'Proto',
        internal_notes: 'Example sample - hardware in gold finish. Calf leather, Black/Gold, One Size'
      },
      {
        sample_code: 'SS26-RTW-003',
        collection_id: collection.id,
        name: 'Deconstructed trench coat',
        product_type: 'Coat',
        supplier_name: 'Atelier Couture Paris',
        status: 'Approved',
        responsible_user_id: user.id,
        sample_round: 'PPS',
        internal_notes: 'Example sample - signature piece. Cotton twill, Beige, Size 40'
      },
      {
        sample_code: 'SS26-RTW-004',
        collection_id: collection.id,
        name: 'Wide-leg palazzo pants',
        product_type: 'Pants',
        supplier_name: 'Maison Textile Lyon',
        status: 'Changes Needed',
        responsible_user_id: user.id,
        sample_round: 'SMS',
        internal_notes: 'Example sample - checking drape. Viscose crepe, Ivory, Size 38'
      }
    ];

    console.log('\n📦 Adding samples...\n');

    for (const sample of exampleSamples) {
      // Check if sample already exists
      const { data: existing } = await supabase
        .from('samples')
        .select('id')
        .eq('sample_code', sample.sample_code)
        .single();

      if (existing) {
        console.log(`⚠️  ${sample.sample_code} - already exists, skipping`);
        continue;
      }

      // Insert sample
      const { data, error } = await supabase
        .from('samples')
        .insert(sample)
        .select()
        .single();

      if (error) {
        console.log(`❌ ${sample.sample_code} - error: ${error.message}`);
      } else {
        console.log(`✅ ${sample.sample_code} - ${sample.name}`);
      }
    }

    // Show final count
    const { data: finalSamples, error: countError } = await supabase
      .from('samples')
      .select('id')
      .eq('collection_id', collection.id);

    if (!countError) {
      console.log(`\n✨ Total samples in SS26: ${finalSamples.length}`);
    }

    console.log('\n✅ Done!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addSS26Samples();
