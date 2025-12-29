import Database from 'better-sqlite3';
import { supabase } from './src/database/supabase.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Open SQLite database
const dbPath = join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

console.log('🚀 Starting data migration from SQLite to Supabase...\n');

// Map to store old integer IDs to new UUIDs
const userIdMap = new Map();
const collectionIdMap = new Map();
const sampleIdMap = new Map();

async function migrateUsers() {
  console.log('📥 Migrating users...');
  
  // Get users from Supabase (already inserted manually)
  const { data: supabaseUsers, error } = await supabase
    .from('users')
    .select('*');
  
  if (error) {
    console.error('Error fetching Supabase users:', error);
    return;
  }

  // Get users from SQLite
  const sqliteUsers = db.prepare('SELECT * FROM users').all();
  
  console.log(`  SQLite users: ${sqliteUsers.length}`);
  console.log(`  Supabase users: ${supabaseUsers.length}`);
  
  // Map SQLite IDs to Supabase UUIDs by email
  for (const sqliteUser of sqliteUsers) {
    const supabaseUser = supabaseUsers.find(u => u.email === sqliteUser.email);
    if (supabaseUser) {
      userIdMap.set(sqliteUser.id, supabaseUser.id);
      console.log(`  ✓ Mapped ${sqliteUser.email}: ${sqliteUser.id} → ${supabaseUser.id}`);
    } else {
      console.log(`  ⚠️  No Supabase user found for ${sqliteUser.email}`);
    }
  }
  
  console.log(`  ✅ Mapped ${userIdMap.size} users\n`);
}

async function migrateCollections() {
  console.log('📥 Migrating collections...');
  
  // Get collections from Supabase (already inserted manually)
  const { data: supabaseCollections, error } = await supabase
    .from('collections')
    .select('*');
  
  if (error) {
    console.error('Error fetching Supabase collections:', error);
    return;
  }

  // Get collections from SQLite
  const sqliteCollections = db.prepare('SELECT * FROM collections').all();
  
  console.log(`  SQLite collections: ${sqliteCollections.length}`);
  console.log(`  Supabase collections: ${supabaseCollections.length}`);
  
  // Map SQLite IDs to Supabase UUIDs by name + year + season
  for (const sqliteCol of sqliteCollections) {
    const supabaseCol = supabaseCollections.find(c => 
      c.name === sqliteCol.name && 
      c.year === sqliteCol.year && 
      c.season === sqliteCol.season
    );
    if (supabaseCol) {
      collectionIdMap.set(sqliteCol.id, supabaseCol.id);
      console.log(`  ✓ Mapped ${sqliteCol.name} ${sqliteCol.season} ${sqliteCol.year}: ${sqliteCol.id} → ${supabaseCol.id}`);
    } else {
      console.log(`  ⚠️  No Supabase collection found for ${sqliteCol.name} ${sqliteCol.season} ${sqliteCol.year}`);
    }
  }
  
  console.log(`  ✅ Mapped ${collectionIdMap.size} collections\n`);
}

async function migrateSamples() {
  console.log('📥 Migrating samples...');
  
  // Get samples from SQLite
  const sqliteSamples = db.prepare('SELECT * FROM samples').all();
  console.log(`  Found ${sqliteSamples.length} samples in SQLite`);
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  
  for (const sample of sqliteSamples) {
    try {
      // Map foreign keys
      const collectionUuid = collectionIdMap.get(sample.collection_id);
      const responsibleUserUuid = sample.responsible_user_id 
        ? userIdMap.get(sample.responsible_user_id) 
        : null;
      
      if (!collectionUuid) {
        console.log(`  ⚠️  Skipping ${sample.sample_code}: no collection mapping for ID ${sample.collection_id}`);
        errorCount++;
        continue;
      }
      
      // Insert into Supabase
      const { data, error } = await supabase
        .from('samples')
        .insert({
          collection_id: collectionUuid,
          sample_code: sample.sample_code,
          name: sample.name,
          sample_round: sample.sample_round || 'Proto',
          product_type: sample.product_type || 'Other',
          supplier_name: sample.supplier_name || '',
          status: sample.status || 'In Review',
          responsible_user_id: responsibleUserUuid,
          received_date: sample.received_date,
          feedback_deadline: sample.feedback_deadline,
          internal_notes: sample.internal_notes || '',
          tags: sample.tags || ''
        })
        .select()
        .single();
      
      if (error) {
        errorCount++;
        errors.push({ sample: sample.sample_code, error: error.message });
        console.log(`  ❌ Error inserting ${sample.sample_code}: ${error.message}`);
      } else {
        successCount++;
        sampleIdMap.set(sample.id, data.id);
        if (successCount % 10 === 0) {
          console.log(`  ✓ Migrated ${successCount}/${sqliteSamples.length} samples...`);
        }
      }
    } catch (err) {
      errorCount++;
      errors.push({ sample: sample.sample_code, error: err.message });
      console.log(`  ❌ Exception migrating ${sample.sample_code}: ${err.message}`);
    }
  }
  
  console.log(`\n  ✅ Successfully migrated ${successCount} samples`);
  if (errorCount > 0) {
    console.log(`  ❌ Failed to migrate ${errorCount} samples`);
    if (errors.length > 0 && errors.length <= 10) {
      console.log('\n  Error details:');
      errors.forEach(e => console.log(`    - ${e.sample}: ${e.error}`));
    }
  }
  console.log();
}

async function migrateSamplePhotos() {
  console.log('📥 Migrating sample photos...');
  
  const sqlitePhotos = db.prepare('SELECT * FROM sample_photos').all();
  console.log(`  Found ${sqlitePhotos.length} sample photos in SQLite`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const photo of sqlitePhotos) {
    try {
      const sampleUuid = sampleIdMap.get(photo.sample_id);
      
      if (!sampleUuid) {
        console.log(`  ⚠️  Skipping photo: no sample mapping for ID ${photo.sample_id}`);
        errorCount++;
        continue;
      }
      
      const { error } = await supabase
        .from('sample_photos')
        .insert({
          sample_id: sampleUuid,
          file_path: photo.file_path,
          file_name: photo.file_name,
          file_size: photo.file_size,
          mime_type: photo.mime_type,
          caption: photo.caption || ''
        });
      
      if (error) {
        errorCount++;
        console.log(`  ❌ Error inserting photo: ${error.message}`);
      } else {
        successCount++;
      }
    } catch (err) {
      errorCount++;
      console.log(`  ❌ Exception migrating photo: ${err.message}`);
    }
  }
  
  console.log(`  ✅ Successfully migrated ${successCount} sample photos`);
  if (errorCount > 0) {
    console.log(`  ❌ Failed to migrate ${errorCount} sample photos`);
  }
  console.log();
}

async function migrateQualityReviews() {
  console.log('📥 Migrating quality reviews...');
  
  const sqliteReviews = db.prepare('SELECT * FROM quality_reviews').all();
  console.log(`  Found ${sqliteReviews.length} quality reviews in SQLite`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const review of sqliteReviews) {
    try {
      const sampleUuid = sampleIdMap.get(review.sample_id);
      const reviewerUuid = review.reviewer_id ? userIdMap.get(review.reviewer_id) : null;
      
      if (!sampleUuid) {
        console.log(`  ⚠️  Skipping review: no sample mapping for ID ${review.sample_id}`);
        errorCount++;
        continue;
      }
      
      const { error } = await supabase
        .from('quality_reviews')
        .insert({
          sample_id: sampleUuid,
          reviewer_id: reviewerUuid,
          overall_rating: review.overall_rating,
          fit_rating: review.fit_rating,
          construction_rating: review.construction_rating,
          material_rating: review.material_rating,
          finishing_rating: review.finishing_rating,
          review_comments: review.comments || '',
          decision: review.decision || 'Under Review'
        });
      
      if (error) {
        errorCount++;
        console.log(`  ❌ Error inserting quality review: ${error.message}`);
      } else {
        successCount++;
      }
    } catch (err) {
      errorCount++;
      console.log(`  ❌ Exception migrating quality review: ${err.message}`);
    }
  }
  
  console.log(`  ✅ Successfully migrated ${successCount} quality reviews`);
  if (errorCount > 0) {
    console.log(`  ❌ Failed to migrate ${errorCount} quality reviews`);
  }
  console.log();
}

async function main() {
  try {
    await migrateUsers();
    await migrateCollections();
    await migrateSamples();
    await migrateSamplePhotos();
    await migrateQualityReviews();
    
    console.log('🎉 Migration completed!\n');
    console.log('Summary:');
    console.log(`  - Users mapped: ${userIdMap.size}`);
    console.log(`  - Collections mapped: ${collectionIdMap.size}`);
    console.log(`  - Samples migrated: ${sampleIdMap.size}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

main();
