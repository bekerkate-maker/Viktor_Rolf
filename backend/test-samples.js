import db from './src/database/connection.js';

try {
  console.log('Testing samples query...');
  
  const samples = db.prepare(`
    SELECT 
      s.*,
      c.name as collection_name,
      c.season,
      c.year,
      (u.first_name || ' ' || u.last_name) as responsible_user_name,
      COUNT(DISTINCT qr.id) as quality_review_count,
      COUNT(DISTINCT sc.id) as supplier_comm_count
    FROM samples s
    LEFT JOIN collections c ON s.collection_id = c.id
    LEFT JOIN users u ON s.responsible_user_id = u.id
    LEFT JOIN quality_reviews qr ON s.id = qr.sample_id
    LEFT JOIN supplier_communications sc ON s.id = sc.sample_id
    WHERE s.collection_id = 9
    GROUP BY s.id 
    ORDER BY s.updated_at DESC
  `).all();

  console.log(`✓ Success! Found ${samples.length} samples`);
  console.log('First 3 samples:');
  samples.slice(0, 3).forEach(s => {
    console.log(`  - ${s.sample_code}: ${s.name}`);
  });
  
  process.exit(0);
} catch (error) {
  console.error('✗ Error:', error.message);
  console.error(error);
  process.exit(1);
}
