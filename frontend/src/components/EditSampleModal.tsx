import { useState, useEffect } from 'react';
import { samplesAPI } from '../api';
import type { Sample } from '../types';

interface EditSampleModalProps {
  isOpen: boolean;
  onClose: () => void;
  sample: Sample | null;
  onSampleUpdated: () => void;
}

function EditSampleModal({ isOpen, onClose, sample, onSampleUpdated }: EditSampleModalProps) {
  const [formData, setFormData] = useState({
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

  // Populate form when sample changes
  useEffect(() => {
    if (isOpen && sample) {
      setFormData({
        name: sample.name || '',
        sample_round: (sample.sample_round || 'Proto') as 'Proto' | 'SMS' | 'PPS' | 'Final',
        product_type: (sample.product_type || 'Dress') as 'Jacket' | 'Dress' | 'Pants' | 'Corset' | 'Knit' | 'Shirt' | 'Coat' | 'Skirt' | 'Top' | 'Other',
        supplier_name: sample.supplier_name || '',
        status: (sample.status || 'In Review') as 'In Review' | 'Changes Needed' | 'Approved' | 'Rejected',
        received_date: sample.received_date ? sample.received_date.split('T')[0] : '',
        feedback_deadline: sample.feedback_deadline ? sample.feedback_deadline.split('T')[0] : '',
        internal_notes: sample.internal_notes || '',
        tags: sample.tags || '',
      });
    }
  }, [isOpen, sample]);

  if (!isOpen || !sample) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Get responsible user ID from localStorage (current user)
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      const payload = {
        name: formData.name,
        sample_round: formData.sample_round,
        product_type: formData.product_type,
        supplier_name: formData.supplier_name,
        status: formData.status,
        received_date: formData.received_date || undefined,
        feedback_deadline: formData.feedback_deadline || undefined,
        internal_notes: formData.internal_notes,
        tags: formData.tags,
        responsible_user_id: user?.id || sample.responsible_user_id,
      };
      
      console.log('Updating sample with payload:', payload);
      
  await samplesAPI.update(String(sample.id), payload);

      onSampleUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error updating sample:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      alert(`Failed to update sample: ${errorMessage}`);
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
          <h2 className="modal-title">Edit Sample</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Sample Code</label>
              <input
                type="text"
                value={sample.sample_code}
                className="form-input"
                disabled
                style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
              />
              <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px' }}>
                Sample code cannot be changed
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Sample Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Silk Evening Dress"
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
                className="form-select"
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
                className="form-select"
                required
              >
                <option value="Dress">Dress</option>
                <option value="Jacket">Jacket</option>
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
              <label className="form-label">Supplier Name</label>
              <input
                type="text"
                name="supplier_name"
                value={formData.supplier_name}
                onChange={handleChange}
                className="form-input"
                placeholder="e.g., Atelier Montaigne"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="form-select"
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
              className="form-textarea"
              placeholder="Add any internal notes or comments..."
              rows={3}
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
              placeholder="e.g., urgent, special, archived (comma-separated)"
            />
          </div>

          <div className="modal-actions" style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            marginTop: 24,
            paddingTop: 20,
            borderTop: '1px solid #eee',
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: '1px solid #ddd',
                background: '#fff',
                color: '#333',
                fontSize: 14,
                fontWeight: 500,
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: submitting ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!submitting) {
                  e.currentTarget.style.background = '#f5f5f5';
                  e.currentTarget.style.borderColor = '#111';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#fff';
                e.currentTarget.style.borderColor = '#ddd';
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                border: 'none',
                background: submitting ? '#888' : '#111',
                color: '#fff',
                fontSize: 14,
                fontWeight: 500,
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
              onMouseEnter={(e) => {
                if (!submitting) {
                  e.currentTarget.style.background = '#333';
                }
              }}
              onMouseLeave={(e) => {
                if (!submitting) {
                  e.currentTarget.style.background = '#111';
                }
              }}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditSampleModal;
