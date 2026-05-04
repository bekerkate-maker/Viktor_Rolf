
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function migratePhotos() {
  console.log('Starting photo migration...');
  
  // 1. Migrate sample_photos
  const { data: samplePhotos, error: spError } = await supabase.from('sample_photos').select('*');
  if (spError) {
    console.error('Error fetching sample_photos:', spError);
  } else {
    console.log(`Found ${samplePhotos.length} sample photo records.`);
    for (const photo of samplePhotos) {
      if (photo.file_path.startsWith('/uploads/')) {
        const fileName = path.basename(photo.file_path);
        const localPath = path.join(__dirname, '..', 'uploads', 'samples', fileName);
        
        if (fs.existsSync(localPath)) {
          console.log(`Uploading ${fileName} for sample ${photo.sample_id}...`);
          const fileBuffer = fs.readFileSync(localPath);
          const storagePath = `samples/${photo.sample_id}/${fileName}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('sample-photos')
            .upload(storagePath, fileBuffer, { upsert: true });
            
          if (uploadError) {
            console.error(`Upload error for ${fileName}:`, uploadError);
            continue;
          }
          
          const { data: { publicUrl } } = supabase.storage
            .from('sample-photos')
            .getPublicUrl(storagePath);
            
          const { error: updateError } = await supabase
            .from('sample_photos')
            .update({ file_path: publicUrl })
            .eq('id', photo.id);
            
          if (updateError) console.error(`Update error for ${photo.id}:`, updateError);
          else console.log(`Migrated ${fileName} to ${publicUrl}`);
        } else {
          console.warn(`File not found locally: ${localPath}`);
        }
      }
    }
  }

  // 2. Migrate quality_review_photos
  const { data: qrPhotos, error: qrpError } = await supabase.from('quality_review_photos').select('*');
  if (qrpError) {
    console.error('Error fetching quality_review_photos:', qrpError);
  } else {
    console.log(`Found ${qrPhotos.length} quality review photo records.`);
    // Implement if needed, but let's start with samples
  }

  console.log('Migration finished.');
}

migratePhotos();
