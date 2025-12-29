import db from '../src/database/connection.js';

async function run() {
  try {
    // Find SS 2026 collections
    const collections = db.prepare(`SELECT * FROM collections WHERE season = ? AND year = ?`).all('SS', 2026);

    if (!collections || collections.length === 0) {
      console.error('No collections found for SS 2026. Aborting.');
      process.exit(1);
    }

    // Prefer Ready to Wear / RTW if available
    let collection = collections.find(c => /rtw|ready/i.test(c.name || '') || /RTW/i.test(c.type));
    if (!collection) collection = collections[0];

    console.log(`Using collection id=${collection.id}, name=${collection.name}, type=${collection.type}`);

    let inserted = 0;
    let skipped = 0;

    for (let i = 1; i <= 25; i++) {
      const num = String(i).padStart(3, '0');
      const sample_code = `SS26-RTW-${num}`;

      const exists = db.prepare('SELECT id FROM samples WHERE sample_code = ?').get(sample_code);
      if (exists) {
        console.log(`Skipping existing sample code ${sample_code} (id=${exists.id})`);
        skipped++;
        continue;
      }

      const name = `RTW Sample ${num}`;

      const result = db.prepare(`
        INSERT INTO samples (
          collection_id,
          sample_code,
          name,
          sample_round,
          product_type,
          supplier_name,
          status,
          responsible_user_id,
          received_date,
          feedback_deadline,
          internal_notes,
          tags
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        collection.id,
        sample_code,
        name,
        'Proto',
        'Dress',
        '',
        'In Review',
        1,
        null,
        null,
        '',
        ''
      );

      console.log(`Inserted sample ${sample_code} (id=${result.lastInsertRowid})`);
      inserted++;
    }

    console.log(`Done. Inserted: ${inserted}, Skipped: ${skipped}`);
    process.exit(0);
  } catch (err) {
    console.error('Error restoring samples:', err);
    process.exit(2);
  }
}

run();
