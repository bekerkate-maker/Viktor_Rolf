// Type definitions for Viktor & Rolf QC System

export interface User {
  id: string | number;
  name: string;
  email: string;
  role: 'viewer' | 'editor' | 'admin';
  created_at: string;
}

export interface Collection {
  id: string | number;
  name: string;
  season: string;
  year: number;
  category: 'Mariage' | 'Eyewear Collection' | 'Ready to Wear';
  status: 'Active' | 'Archived';
  created_at: string;
  updated_at: string;
  sample_count?: number;
  in_progress_count?: number;
  review_needed_count?: number;
  approved_count?: number;
  rejected_count?: number;
  samples?: Sample[];
}

export interface Sample {
  id: string | number;
  collection_id: string | number;
  sample_code: string;
  name: string;
  product_type: 'Jacket' | 'Dress' | 'Pants' | 'Corset' | 'Knit' | 'Shirt' | 'Coat' | 'Skirt' | 'Top' | 'Other';
  supplier_name: string;
  status: 'In Review' | 'Changes Needed' | 'Approved' | 'Rejected';
  responsible_user_id: string | number;
  received_date?: string;
  feedback_deadline?: string;
  internal_notes?: string;
  tags?: string;
  sample_round?: string;
  latest_comment_date?: string;
  created_at: string;
  updated_at: string;
  collection_name?: string;
  season?: string;
  year?: number;
  collection_type?: string;
  responsible_user_name?: string;
  responsible_user_email?: string;
  quality_review_count?: number;
  supplier_comm_count?: number;
  latest_comment?: string | null;
  latest_status?: string;
  
  quality_reviews?: QualityReview[];

  audit_trail?: AuditTrailEntry[];
  photos?: SamplePhoto[];
}

export interface SamplePhoto {
  id: string | number;
  sample_id: string | number;
  file_path: string;
  file_name: string;
  photo_type: 'Front' | 'Back' | 'Detail' | 'Issue' | 'Other';
  quality_review_id?: string | number;
  is_main_photo: boolean | number;
  display_order: number;
  uploaded_at: string;
}

export interface QualityReview {
  id: string | number;
  sample_id: string | number;
  reviewer_id: string | number;
  review_date: string;
  quality_category: 'Construction' | 'Fit' | 'Fabric' | 'Finish' | 'Measurement';
  issue_description: string;
  severity: 'Low' | 'Medium' | 'High';
  action_required: boolean;
  review_status: 'Open' | 'Resolved' | 'Re-opened';
  created_at: string;
  updated_at: string;
  sample_code?: string;
  sample_name?: string;
  collection_name?: string;
  reviewer_name?: string;
  reviewer_email?: string;
  photos?: QualityReviewPhoto[];
  comments?: QualityReviewComment[];
}

export interface QualityReviewPhoto {
  id: string | number;
  quality_review_id: string | number;
  file_path: string;
  file_name: string;
  uploaded_at: string;
}

export interface QualityReviewComment {
  id: string | number;
  quality_review_id: string | number;
  user_id: string | number;
  comment: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
}





export interface AuditTrailEntry {
  id: string | number;
  entity_type: string;
  entity_id: string | number;
  action: string;
  user_id: string | number;
  changes: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

export interface DashboardStats {
  collections: {
    total: number;
    active: number;
  };
  samples: {
    total: number;
    in_progress: number;
    review_needed: number;
    approved: number;
  };
  quality_reviews: {
    total: number;
    pending: number;
    high_severity: number;
  };
}

export interface QualityReviewStats {
  total_reviews: number;
  pending_review: number;
  changes_requested: number;
  approved: number;
  high_severity: number;
  medium_severity: number;
  low_severity: number;
}

export interface SupplierCommunication {
  id: string | number;
  sample_id: string | number;
  supplier_name: string;
  communication_date: string;
  communication_type: 'Email' | 'Call' | 'Meeting';
  summary: string;
  sample_due_date?: string;
  feedback_due_date?: string;
  status: 'Waiting for Supplier' | 'Waiting for Internal Feedback' | 'Completed';
  is_important: boolean;
  created_by: string | number;
  created_at: string;
  updated_at: string;
  sample_code?: string;
  sample_name?: string;
  collection_name?: string;
  created_by_name?: string;
  created_by_email?: string;
  attachments?: any[];
}
