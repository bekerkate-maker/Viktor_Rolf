import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
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

async function hashPasswords() {
  try {
    console.log('🔐 Hashing plain text passwords in Supabase...\n');

    // Get all users
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, email, password');

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${users.length} users\n`);

    for (const user of users) {
      // Check if password is already a bcrypt hash
      if (user.password && user.password.startsWith('$2')) {
        console.log(`✅ ${user.email} - already hashed`);
        continue;
      }

      // Check if password exists
      if (!user.password) {
        console.log(`⚠️  ${user.email} - no password set`);
        continue;
      }

      // Hash the plain text password
      const hashedPassword = await bcrypt.hash(user.password, 10);

      // Update in Supabase
      const { error: updateError } = await supabase
        .from('users')
        .update({ password: hashedPassword })
        .eq('id', user.id);

      if (updateError) {
        console.log(`❌ ${user.email} - error: ${updateError.message}`);
      } else {
        console.log(`🔒 ${user.email} - password hashed (was: ${user.password})`);
      }
    }

    console.log('\n✅ Password hashing complete!');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

hashPasswords();
