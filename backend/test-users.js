import { supabase } from './src/database/supabase.js';

async function testUsers() {
  const { data: users, error } = await supabase
    .from('users')
    .select('*');
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Users in Supabase:');
    users.forEach(u => {
      console.log(`- ${u.first_name} ${u.last_name} (${u.email}) - ID: ${u.id}`);
    });
  }
}

testUsers();
