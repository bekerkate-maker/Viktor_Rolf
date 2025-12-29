import { initializeDatabase } from './schema.js';
import seedDatabase from './seed.js';

console.log('🚀 Setting up Viktor & Rolf QC System Database...\n');

initializeDatabase();
await seedDatabase();

console.log('\n✨ Database setup complete!');
console.log('💡 You can now start the backend server.');
