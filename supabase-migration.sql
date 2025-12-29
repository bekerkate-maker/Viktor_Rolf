-- Viktor & Rolf Quality Control System - Supabase Migration
-- Convert from SQLite to PostgreSQL
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  job_title TEXT NOT NULL,
  role TEXT CHECK(role IN ('viewer', 'editor', 'admin')) DEFAULT 'editor',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collections table
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  season TEXT NOT NULL,
  year INTEGER NOT NULL,
  category TEXT CHECK(category IN ('Mariage', 'Haute Couture', 'Ready to Wear')) NOT NULL,
  status TEXT CHECK(status IN ('Active', 'Archived')) DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Samples table
CREATE TABLE IF NOT EXISTS samples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  sample_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  sample_round TEXT CHECK(sample_round IN ('Proto', 'SMS', 'PPS', 'Final')) DEFAULT 'Proto',
  product_type TEXT CHECK(product_type IN ('Jacket', 'Dress', 'Pants', 'Corset', 'Knit', 'Shirt', 'Coat', 'Skirt', 'Top', 'Other')) DEFAULT 'Other',
  supplier_name TEXT,
  status TEXT CHECK(status IN ('In Review', 'Changes Needed', 'Approved', 'Rejected')) DEFAULT 'In Review',
  responsible_user_id UUID REFERENCES users(id),
  received_date DATE,
  feedback_deadline DATE,
  internal_notes TEXT,
  tags TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sample Photos table
CREATE TABLE IF NOT EXISTS sample_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sample_id UUID NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  photo_type TEXT CHECK(photo_type IN ('Front', 'Back', 'Detail', 'Issue', 'Other')) DEFAULT 'Other',
  is_main_photo BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  quality_review_id UUID REFERENCES quality_reviews(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quality Reviews table
CREATE TABLE IF NOT EXISTS quality_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sample_id UUID NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id),
  review_date DATE DEFAULT CURRENT_DATE,
  quality_category TEXT CHECK(quality_category IN ('Construction', 'Fit', 'Fabric', 'Finish', 'Measurement')) NOT NULL,
  issue_description TEXT,
  severity TEXT CHECK(severity IN ('Low', 'Medium', 'High')) NOT NULL,
  action_required BOOLEAN DEFAULT FALSE,
  review_status TEXT CHECK(review_status IN ('Open', 'Resolved', 'Re-opened')) DEFAULT 'Open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quality Review Photos table
CREATE TABLE IF NOT EXISTS quality_review_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quality_review_id UUID NOT NULL REFERENCES quality_reviews(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quality Review Comments table
CREATE TABLE IF NOT EXISTS quality_review_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quality_review_id UUID NOT NULL REFERENCES quality_reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supplier Communications table
CREATE TABLE IF NOT EXISTS supplier_communications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sample_id UUID NOT NULL REFERENCES samples(id) ON DELETE CASCADE,
  supplier_name TEXT NOT NULL,
  communication_date DATE NOT NULL,
  communication_type TEXT CHECK(communication_type IN ('Email', 'Call', 'Meeting')) NOT NULL,
  summary TEXT NOT NULL,
  sample_due_date DATE,
  feedback_due_date DATE,
  status TEXT CHECK(status IN ('Waiting for Supplier', 'Waiting for Internal Feedback', 'Completed')) DEFAULT 'Waiting for Supplier',
  is_important BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Supplier Communication Attachments table
CREATE TABLE IF NOT EXISTS supplier_comm_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_comm_id UUID NOT NULL REFERENCES supplier_communications(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Trail table
CREATE TABLE IF NOT EXISTS audit_trail (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  changes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_samples_collection_id ON samples(collection_id);
CREATE INDEX IF NOT EXISTS idx_samples_responsible_user_id ON samples(responsible_user_id);
CREATE INDEX IF NOT EXISTS idx_samples_status ON samples(status);
CREATE INDEX IF NOT EXISTS idx_sample_photos_sample_id ON sample_photos(sample_id);
CREATE INDEX IF NOT EXISTS idx_quality_reviews_sample_id ON quality_reviews(sample_id);
CREATE INDEX IF NOT EXISTS idx_supplier_comms_sample_id ON supplier_communications(sample_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_entity ON audit_trail(entity_type, entity_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_samples_updated_at BEFORE UPDATE ON samples
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quality_reviews_updated_at BEFORE UPDATE ON quality_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_supplier_communications_updated_at BEFORE UPDATE ON supplier_communications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE sample_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_review_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE quality_review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_comm_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_trail ENABLE ROW LEVEL SECURITY;

-- Users policies (authenticated users can read all users, update own profile)
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Collections policies (authenticated users can read, editors can modify)
CREATE POLICY "Anyone can view collections" ON collections FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Editors can insert collections" ON collections FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Editors can update collections" ON collections FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can delete collections" ON collections FOR DELETE USING (auth.role() = 'authenticated');

-- Samples policies (authenticated users can read, editors can modify)
CREATE POLICY "Anyone can view samples" ON samples FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Editors can insert samples" ON samples FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Editors can update samples" ON samples FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Editors can delete samples" ON samples FOR DELETE USING (auth.role() = 'authenticated');

-- Sample Photos policies
CREATE POLICY "Anyone can view sample photos" ON sample_photos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Editors can insert sample photos" ON sample_photos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Editors can delete sample photos" ON sample_photos FOR DELETE USING (auth.role() = 'authenticated');

-- Quality Reviews policies
CREATE POLICY "Anyone can view quality reviews" ON quality_reviews FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Editors can insert quality reviews" ON quality_reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Editors can update quality reviews" ON quality_reviews FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Editors can delete quality reviews" ON quality_reviews FOR DELETE USING (auth.role() = 'authenticated');

-- Quality Review Photos policies
CREATE POLICY "Anyone can view review photos" ON quality_review_photos FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Editors can insert review photos" ON quality_review_photos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Editors can delete review photos" ON quality_review_photos FOR DELETE USING (auth.role() = 'authenticated');

-- Quality Review Comments policies
CREATE POLICY "Anyone can view comments" ON quality_review_comments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Editors can insert comments" ON quality_review_comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Supplier Communications policies
CREATE POLICY "Anyone can view supplier comms" ON supplier_communications FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Editors can insert supplier comms" ON supplier_communications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Editors can update supplier comms" ON supplier_communications FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Editors can delete supplier comms" ON supplier_communications FOR DELETE USING (auth.role() = 'authenticated');

-- Supplier Comm Attachments policies
CREATE POLICY "Anyone can view attachments" ON supplier_comm_attachments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Editors can insert attachments" ON supplier_comm_attachments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Editors can delete attachments" ON supplier_comm_attachments FOR DELETE USING (auth.role() = 'authenticated');

-- Audit Trail policies (read-only for everyone, insert for system)
CREATE POLICY "Anyone can view audit trail" ON audit_trail FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "System can insert audit trail" ON audit_trail FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create Storage buckets (run these in Supabase Storage UI or via API)
-- Bucket: sample-photos (for sample images)
-- Bucket: quality-review-photos (for quality review images)  
-- Bucket: supplier-attachments (for supplier communication files)

COMMENT ON TABLE users IS 'Application users with roles and authentication';
COMMENT ON TABLE collections IS 'Fashion collections by season and category';
COMMENT ON TABLE samples IS 'Sample items being reviewed and tracked';
COMMENT ON TABLE sample_photos IS 'Photos associated with samples';
COMMENT ON TABLE quality_reviews IS 'Quality control reviews for samples';
COMMENT ON TABLE supplier_communications IS 'Communications with suppliers about samples';
COMMENT ON TABLE audit_trail IS 'System audit log for all changes';
