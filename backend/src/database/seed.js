import db from './connection.js';
import { initializeDatabase } from './schema.js';
import bcrypt from 'bcryptjs';

/**
 * Seed database with realistic dummy data for Viktor & Rolf
 */
async function seedDatabase() {
  console.log('🌱 Seeding database with dummy data...');

  // Clear existing data
  db.exec('DELETE FROM audit_trail');
  db.exec('DELETE FROM supplier_comm_attachments');
  db.exec('DELETE FROM supplier_communications');
  db.exec('DELETE FROM quality_review_comments');
  db.exec('DELETE FROM quality_review_photos');
  db.exec('DELETE FROM quality_reviews');
  db.exec('DELETE FROM samples');
  db.exec('DELETE FROM collections');
  db.exec('DELETE FROM users');

  // Reset auto-increment
  db.exec('DELETE FROM sqlite_sequence');

  // Hash password for all users (demo password: "password123")
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Insert Users
  const users = [
    { first_name: 'Sophie', last_name: 'Laurent', email: 'sophie.laurent@viktor-rolf.com', password: hashedPassword, job_title: 'Product Developer', role: 'admin' },
    { first_name: 'Marco', last_name: 'Visconti', email: 'marco.visconti@viktor-rolf.com', password: hashedPassword, job_title: 'Designer', role: 'editor' },
    { first_name: 'Emma', last_name: 'Chen', email: 'emma.chen@viktor-rolf.com', password: hashedPassword, job_title: 'Merchandiser', role: 'editor' },
    { first_name: 'Lucas', last_name: 'van der Berg', email: 'lucas.vandeberg@viktor-rolf.com', password: hashedPassword, job_title: 'Quality Control', role: 'viewer' },
    { first_name: 'Isabella', last_name: 'Rossi', email: 'isabella.rossi@viktor-rolf.com', password: hashedPassword, job_title: 'Production Manager', role: 'editor' }
  ];

  const insertUser = db.prepare('INSERT INTO users (first_name, last_name, email, password, job_title, role) VALUES (?, ?, ?, ?, ?, ?)');
  users.forEach(user => insertUser.run(user.first_name, user.last_name, user.email, user.password, user.job_title, user.role));

  // Insert Collections - Ready to Wear SS22 to FW26
  const collections = [
    { name: 'Spring Summer 2022', season: 'SS', year: 2022, category: 'Ready to Wear', status: 'Archived' },
    { name: 'Fall Winter 2022', season: 'FW', year: 2022, category: 'Ready to Wear', status: 'Archived' },
    { name: 'Spring Summer 2023', season: 'SS', year: 2023, category: 'Ready to Wear', status: 'Archived' },
    { name: 'Fall Winter 2023', season: 'FW', year: 2023, category: 'Ready to Wear', status: 'Archived' },
    { name: 'Spring Summer 2024', season: 'SS', year: 2024, category: 'Ready to Wear', status: 'Archived' },
    { name: 'Fall Winter 2024', season: 'FW', year: 2024, category: 'Ready to Wear', status: 'Archived' },
    { name: 'Spring Summer 2025', season: 'SS', year: 2025, category: 'Ready to Wear', status: 'Active' },
    { name: 'Fall Winter 2025', season: 'FW', year: 2025, category: 'Ready to Wear', status: 'Active' },
    { name: 'Spring Summer 2026', season: 'SS', year: 2026, category: 'Ready to Wear', status: 'Active' },
    { name: 'Fall Winter 2026', season: 'FW', year: 2026, category: 'Ready to Wear', status: 'Active' }
  ];

  const insertCollection = db.prepare('INSERT INTO collections (name, season, year, category, status) VALUES (?, ?, ?, ?, ?)');
  collections.forEach(col => insertCollection.run(col.name, col.season, col.year, col.category, col.status));

  // Sample names for Ready to Wear
  const sampleNames = [
    'Tailored Blazer', 'Wool Coat', 'Pleated Skirt', 'Leather Jacket', 'Cashmere Sweater',
    'Silk Blouse', 'Wide-Leg Trousers', 'Pencil Dress', 'Bomber Jacket', 'Knit Cardigan',
    'Button-Down Shirt', 'Midi Skirt', 'Turtleneck Top', 'Denim Jacket', 'Maxi Dress',
    'Crop Top', 'High-Waist Pants', 'Trench Coat', 'Wrap Dress', 'Blazer Dress',
    'Knit Dress', 'Cargo Pants', 'Oversized Shirt', 'Mini Skirt', 'Evening Gown'
  ];

  const statuses = ['In Review', 'Changes Needed', 'Approved', 'Rejected'];
  
  // Insert Samples - 25 per collection
  const samples = [];
  collections.forEach((col, colIndex) => {
    const collectionId = colIndex + 1;
    const seasonCode = col.season;
    const yearCode = col.year.toString().slice(-2);
    
    for (let i = 0; i < 25; i++) {
      const sampleNumber = (i + 1).toString().padStart(3, '0');
      const sampleCode = `${seasonCode}${yearCode}-RTW-${sampleNumber}`;
      const name = sampleNames[i];
      const version = Math.floor(Math.random() * 3) + 1;
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const responsibleUserId = Math.floor(Math.random() * 5) + 1;
      const sampleRounds = ['Proto', 'SMS', 'PPS', 'Final'];
      const productTypes = ['Jacket', 'Dress', 'Pants', 'Corset', 'Knit', 'Shirt', 'Coat', 'Skirt', 'Top'];
      const sampleRound = sampleRounds[Math.floor(Math.random() * sampleRounds.length)];
      const productType = productTypes[Math.floor(Math.random() * productTypes.length)];
      
      samples.push({
        collection_id: collectionId,
        sample_code: sampleCode,
        name: name,
        sample_round: sampleRound,
        product_type: productType,
        supplier_name: 'Sample Supplier',
        status: status,
        responsible_user_id: responsibleUserId
      });
    }
  });

  const insertSample = db.prepare(`
    INSERT INTO samples (collection_id, sample_code, name, sample_round, product_type, supplier_name, status, responsible_user_id) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  samples.forEach(s => insertSample.run(s.collection_id, s.sample_code, s.name, s.sample_round, s.product_type, s.supplier_name, s.status, s.responsible_user_id));

  // Insert Quality Reviews - Sample data for some items
  const qualityReviews = [
    { sample_id: 1, reviewer_id: 2, quality_category: 'Construction', issue_description: 'Loose threads on left shoulder seam', severity: 'Medium', action_required: 1, review_status: 'Open' },
    { sample_id: 5, reviewer_id: 3, quality_category: 'Fabric', issue_description: 'Slight color variation in panel', severity: 'Low', action_required: 1, review_status: 'Open' },
    { sample_id: 12, reviewer_id: 2, quality_category: 'Fit', issue_description: 'Sleeve length 2cm too long per tech pack', severity: 'High', action_required: 1, review_status: 'Open' },
    { sample_id: 25, reviewer_id: 5, quality_category: 'Finish', issue_description: 'Button placement not aligned', severity: 'Medium', action_required: 1, review_status: 'Open' },
    { sample_id: 50, reviewer_id: 2, quality_category: 'Construction', issue_description: 'Lining not properly attached at hem', severity: 'High', action_required: 1, review_status: 'Open' },
    { sample_id: 100, reviewer_id: 3, quality_category: 'Fabric', issue_description: 'Overall construction meets standards', severity: 'Low', action_required: 0, review_status: 'Resolved' }
  ];

  const insertQR = db.prepare(`
    INSERT INTO quality_reviews (sample_id, reviewer_id, quality_category, issue_description, severity, action_required, review_status) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  qualityReviews.forEach(qr => insertQR.run(qr.sample_id, qr.reviewer_id, qr.quality_category, qr.issue_description, qr.severity, qr.action_required, qr.review_status));

  // Insert Quality Review Comments
  const comments = [
    { quality_review_id: 1, user_id: 2, comment: 'Initial review completed. Issue identified during first inspection.' },
    { quality_review_id: 1, user_id: 3, comment: 'Discussed with production team. Expected fix within 48 hours.' },
    { quality_review_id: 3, user_id: 2, comment: 'Critical issue - this affects the entire silhouette. Priority remake.' },
    { quality_review_id: 5, user_id: 5, comment: 'Sample returned to supplier. Awaiting corrected version.' }
  ];

  const insertComment = db.prepare(`
    INSERT INTO quality_review_comments (quality_review_id, user_id, comment) 
    VALUES (?, ?, ?)
  `);
  comments.forEach(c => insertComment.run(c.quality_review_id, c.user_id, c.comment));

  // Insert Supplier Communications
  const supplierComms = [
    { 
      sample_id: 1, 
      supplier_name: 'Atelier Milano', 
      communication_date: '2025-12-15', 
      communication_type: 'Email', 
      summary: 'Discussed seam reinforcement requirements. Supplier confirmed 3-day turnaround.', 
      sample_due_date: '2025-12-29', 
      feedback_due_date: '2025-12-27', 
      status: 'Waiting for Supplier', 
      is_important: 1, 
      created_by: 2 
    },
    { 
      sample_id: 2, 
      supplier_name: 'Sartoria Napoli', 
      communication_date: '2025-12-20', 
      communication_type: 'Meeting', 
      summary: 'In-person review of sleeve pattern. New measurements provided. Tech pack updated.', 
      sample_due_date: '2026-01-10', 
      feedback_due_date: '2026-01-05', 
      status: 'Waiting for Supplier', 
      is_important: 1, 
      created_by: 2 
    },
    { 
      sample_id: 3, 
      supplier_name: 'Maison Dubois', 
      communication_date: '2025-12-10', 
      communication_type: 'Email', 
      summary: 'Sample approved. Proceed to production.', 
      sample_due_date: '2025-12-15', 
      feedback_due_date: '2025-12-12', 
      status: 'Completed', 
      is_important: 0, 
      created_by: 3 
    },
    { 
      sample_id: 6, 
      supplier_name: 'Textile House Prague', 
      communication_date: '2025-12-22', 
      communication_type: 'Call', 
      summary: 'Urgent call regarding lining issue. Supplier will rework and ship express.', 
      sample_due_date: '2025-12-30', 
      feedback_due_date: '2025-12-28', 
      status: 'Waiting for Supplier', 
      is_important: 1, 
      created_by: 2 
    },
    { 
      sample_id: 7, 
      supplier_name: 'Atelier Romano', 
      communication_date: '2025-12-18', 
      communication_type: 'Email', 
      summary: 'Sent tech pack revisions. Awaiting confirmation from supplier.', 
      sample_due_date: '2026-01-08', 
      feedback_due_date: '2026-01-03', 
      status: 'Waiting for Internal Feedback', 
      is_important: 0, 
      created_by: 3 
    },
    { 
      sample_id: 9, 
      supplier_name: 'Leather Craft Milano', 
      communication_date: '2025-12-05', 
      communication_type: 'Meeting', 
      summary: 'Final approval meeting. Sample meets all requirements.', 
      sample_due_date: '2025-12-08', 
      feedback_due_date: '2025-12-07', 
      status: 'Completed', 
      is_important: 0, 
      created_by: 2 
    }
  ];

  const insertSupplierComm = db.prepare(`
    INSERT INTO supplier_communications (
      sample_id, supplier_name, communication_date, communication_type, summary, 
      sample_due_date, feedback_due_date, status, is_important, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  supplierComms.forEach(sc => 
    insertSupplierComm.run(
      sc.sample_id, sc.supplier_name, sc.communication_date, sc.communication_type, sc.summary,
      sc.sample_due_date, sc.feedback_due_date, sc.status, sc.is_important, sc.created_by
    )
  );

  // Insert Audit Trail
  const auditEntries = [
    { entity_type: 'sample', entity_id: 1, action: 'status_changed', user_id: 2, changes: 'Status changed from "In Progress" to "Review Needed"' },
    { entity_type: 'quality_review', entity_id: 1, action: 'created', user_id: 2, changes: 'Quality review created for stitching issue' },
    { entity_type: 'supplier_communication', entity_id: 1, action: 'created', user_id: 2, changes: 'Communication logged with Atelier Milano' },
    { entity_type: 'sample', entity_id: 3, action: 'status_changed', user_id: 3, changes: 'Status changed to "Approved"' }
  ];

  const insertAudit = db.prepare(`
    INSERT INTO audit_trail (entity_type, entity_id, action, user_id, changes) 
    VALUES (?, ?, ?, ?, ?)
  `);
  auditEntries.forEach(a => insertAudit.run(a.entity_type, a.entity_id, a.action, a.user_id, a.changes));

  console.log('✅ Database seeded successfully with dummy data');
  console.log('📊 Summary:');
  console.log(`   - ${users.length} users (password: password123)`);
  console.log(`   - ${collections.length} collections (Ready to Wear SS22-FW26)`);
  console.log(`   - ${samples.length} samples (25 per collection)`);
  console.log(`   - ${qualityReviews.length} quality reviews`);
  console.log(`   - ${supplierComms.length} supplier communications`);
}

// Initialize and seed (only when run directly)
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase();
  await seedDatabase();
  process.exit(0);
}

export default seedDatabase;
