import { useState, useEffect } from 'react';
import { samplesAPI } from '../api';
import type { Collection } from '../types';

interface AddSampleModalProps {
  isOpen: boolean;
  onClose: () => void;
  collections: Collection[];
  onSampleAdded: () => void;
}

function AddSampleModal({ isOpen, onClose, collections, onSampleAdded }: AddSampleModalProps) {
  const [formData, setFormData] = useState({
    collection_id: 0,
    sample_number: '',
    name: '',
    sample_round: 'Proto' as 'Proto' | 'SMS' | 'PPS' | 'Final',
    product_type: 'Dress' as 'Jacket' | 'Dress' | 'Pants' | 'Corset' | 'Knit' | 'Shirt' | 'Coat' | 'Skirt' | 'Top' | 'Other',
    supplier_name: '',
    status: 'In Review' as 'In Review' | 'Changes Needed' | 'Approved' | 'Rejected',
    received_date: '',
    feedback_deadline: '',
    internal_notes: '',
    tags: '',
  });

  const [submitting, setSubmitting] = useState(false);

  // Update collection_id when collections change or modal opens
  useEffect(() => {
    if (isOpen && collections.length > 0) {
      setFormData(prev => ({
        ...prev,
        collection_id: collections[0].id
      }));
    }
  }, [isOpen, collections]);

  if (!isOpen) return null;

  // Generate sample code automatically based on collection and sample number
  const generateSampleCode = () => {
    const collection = collections.find(c => c.id === formData.collection_id);
    if (!collection || !formData.sample_number) return '';
    
    // Get season code (SS/FW)
    const seasonCode = collection.season;
    // Get year last 2 digits
    const yearCode = String(collection.year).slice(-2);
    // Get category code (RTW/HC/MAR)
    let categoryCode = 'RTW';
    if (collection.category === 'Haute Couture') categoryCode = 'HC';
    if (collection.category === 'Mariage') categoryCode = 'MAR';
    
    // Format: SS26-RTW-001
    return `${seasonCode}${yearCode}-${categoryCode}-${formData.sample_number.padStart(3, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Get responsible user ID from localStorage (current user)
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      // Generate the sample code
      const sample_code = generateSampleCode();
      
      const payload = {
        collection_id: formData.collection_id,
        sample_code,
        name: formData.name,
        sample_round: formData.sample_round,
        product_type: formData.product_type,
        supplier_name: formData.supplier_name,
        status: formData.status,
        received_date: formData.received_date,
        feedback_deadline: formData.feedback_deadline,
        internal_notes: formData.internal_notes,
        tags: formData.tags,
        responsible_user_id: user?.id || 1,
      };
      
      console.log('Creating sample with payload:', payload);
      console.log('Available collections:', collections);
      
      await samplesAPI.create(payload);

      onSampleAdded();
      onClose();
      
      // Reset form - keep the collection_id
      setFormData({
        collection_id: collections[0]?.id || formData.collection_id,
        sample_number: '',
        name: '',
        sample_round: 'Proto',
        product_type: 'Dress',
        supplier_name: '',
        status: 'In Review',
        received_date: '',
        feedback_deadline: '',
        internal_notes: '',
        tags: '',
      });
    } catch (error: any) {
      console.error('Error creating sample:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      alert(`Failed to create sample: ${errorMessage}\n\nCheck console for details.`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add New Sample</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Sample Number *</label>
              <input
                type="text"
                name="sample_number"
                value={formData.sample_number}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., 001"
                maxLength={3}
                required
              />
              {formData.sample_number && (
                <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>
                  Code: {generateSampleCode()}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Sample Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Asymmetric Blazer"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Sample Round *</label>
              <select
                name="sample_round"
                value={formData.sample_round}
                onChange={handleChange}
                className="form-input"
                required
              >
                <option value="Proto">Proto</option>
                <option value="SMS">SMS</option>
                <option value="PPS">PPS</option>
                <option value="Final">Final</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Product Type *</label>
              <select
                name="product_type"
                value={formData.product_type}
                onChange={handleChange}
                className="form-input"
                required
              >
                <option value="Jacket">Jacket</option>
                <option value="Dress">Dress</option>
                <option value="Pants">Pants</option>
                <option value="Corset">Corset</option>
                <option value="Knit">Knit</option>
                <option value="Shirt">Shirt</option>
                <option value="Coat">Coat</option>
                <option value="Skirt">Skirt</option>
                <option value="Top">Top</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Supplier Name *</label>
              <input
                type="text"
                name="supplier_name"
                value={formData.supplier_name}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Sample Supplier Co."
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-input"
                required
              >
                <option value="In Review">In Review</option>
                <option value="Changes Needed">Changes Needed</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Received Date</label>
              <input
                type="date"
                name="received_date"
                value={formData.received_date}
                onChange={handleChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Feedback Deadline</label>
              <input
                type="date"
                name="feedback_deadline"
                value={formData.feedback_deadline}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Internal Notes</label>
            <textarea
              name="internal_notes"
              value={formData.internal_notes}
              onChange={handleChange}
              className="form-input"
              rows={3}
              placeholder="Add any internal notes..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tags</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., urgent, rework, final-check (comma-separated)"
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Sample'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddSampleModal;
