import db from './connection.js';

/**
 * Initialize database schema for Viktor & Rolf QC System
 * Creates all necessary tables with proper relationships
 */

export function initializeDatabase() {
  console.log('🔨 Initializing database schema...');

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      job_title TEXT NOT NULL,
      role TEXT CHECK(role IN ('viewer', 'editor', 'admin')) DEFAULT 'editor',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Collections table
  db.exec(`
    CREATE TABLE IF NOT EXISTS collections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      season TEXT NOT NULL,
      year INTEGER NOT NULL,
      category TEXT CHECK(category IN ('Mariage', 'Haute Couture', 'Ready to Wear')) NOT NULL,
      status TEXT CHECK(status IN ('Active', 'Archived')) DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Samples table
  db.exec(`
    CREATE TABLE IF NOT EXISTS samples (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      collection_id INTEGER NOT NULL,
      sample_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      sample_round TEXT CHECK(sample_round IN ('Proto', 'SMS', 'PPS', 'Final')) DEFAULT 'Proto',
      product_type TEXT CHECK(product_type IN ('Jacket', 'Dress', 'Pants', 'Corset', 'Knit', 'Shirt', 'Coat', 'Skirt', 'Top', 'Other')) DEFAULT 'Other',
      supplier_name TEXT,
      status TEXT CHECK(status IN ('In Review', 'Changes Needed', 'Approved', 'Rejected')) DEFAULT 'In Review',
      responsible_user_id INTEGER,
      received_date DATE,
      feedback_deadline DATE,
      internal_notes TEXT,
      tags TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
      FOREIGN KEY (responsible_user_id) REFERENCES users(id)
    )
  `);

  // Sample Photos table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sample_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sample_id INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      photo_type TEXT CHECK(photo_type IN ('Front', 'Back', 'Detail', 'Issue', 'Other')) DEFAULT 'Other',
      is_main_photo BOOLEAN DEFAULT 0,
      display_order INTEGER DEFAULT 0,
      quality_review_id INTEGER,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sample_id) REFERENCES samples(id) ON DELETE CASCADE,
      FOREIGN KEY (quality_review_id) REFERENCES quality_reviews(id) ON DELETE SET NULL
    )
  `);

  // Quality Reviews table
  db.exec(`
    CREATE TABLE IF NOT EXISTS quality_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sample_id INTEGER NOT NULL,
      reviewer_id INTEGER NOT NULL,
      review_date DATE DEFAULT CURRENT_DATE,
      quality_category TEXT CHECK(quality_category IN ('Construction', 'Fit', 'Fabric', 'Finish', 'Measurement')) NOT NULL,
      issue_description TEXT,
      severity TEXT CHECK(severity IN ('Low', 'Medium', 'High')) NOT NULL,
      action_required BOOLEAN DEFAULT 0,
      review_status TEXT CHECK(review_status IN ('Open', 'Resolved', 'Re-opened')) DEFAULT 'Open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sample_id) REFERENCES samples(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewer_id) REFERENCES users(id)
    )
  `);

  // Quality Review Photos table
  db.exec(`
    CREATE TABLE IF NOT EXISTS quality_review_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quality_review_id INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quality_review_id) REFERENCES quality_reviews(id) ON DELETE CASCADE
    )
  `);

  // Quality Review Comments table (for audit trail)
  db.exec(`
    CREATE TABLE IF NOT EXISTS quality_review_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quality_review_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      comment TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quality_review_id) REFERENCES quality_reviews(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Supplier Communications table
  db.exec(`
    CREATE TABLE IF NOT EXISTS supplier_communications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sample_id INTEGER NOT NULL,
      supplier_name TEXT NOT NULL,
      communication_date DATE NOT NULL,
      communication_type TEXT CHECK(communication_type IN ('Email', 'Call', 'Meeting')) NOT NULL,
      summary TEXT NOT NULL,
      sample_due_date DATE,
      feedback_due_date DATE,
      status TEXT CHECK(status IN ('Waiting for Supplier', 'Waiting for Internal Feedback', 'Completed')) DEFAULT 'Waiting for Supplier',
      is_important BOOLEAN DEFAULT 0,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sample_id) REFERENCES samples(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // Supplier Communication Attachments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS supplier_comm_attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_comm_id INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_type TEXT,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (supplier_comm_id) REFERENCES supplier_communications(id) ON DELETE CASCADE
    )
  `);

  // Audit Trail table - tracks all changes
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_trail (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      changes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  console.log('✅ Database schema initialized successfully');
}

// Run initialization
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeDatabase();
  process.exit(0);
}
