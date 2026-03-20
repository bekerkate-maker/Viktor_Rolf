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
    collection_id: '' as string | number,
    sample_number: '',
    name: '',
    product_type: 'Dress' as 'Jacket' | 'Dress' | 'Pants' | 'Corset' | 'Knit' | 'Shirt' | 'Coat' | 'Skirt' | 'Top' | 'Other',
    supplier_name: '',
    status: 'In Review' as 'In Review' | 'Changes Needed' | 'Approved' | 'Rejected',
    received_date: '',
    feedback_deadline: '',
    internal_notes: '',
    tags: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [showManufacturerDropdown, setShowManufacturerDropdown] = useState(false);
  const manufacturersList = ["Cousy", "ABtex", "Guay", "F&P", "5D", "AESSE"];

  // Update collection_id when collections change or modal opens
  useEffect(() => {
    if (isOpen && collections.length > 0) {
      // If the current collection_id is not in the list (including initial 0/''), pick the first one
      if (!collections.some(c => c.id === formData.collection_id)) {
        setFormData(prev => ({
          ...prev,
          collection_id: collections[0].id
        }));
      }
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
    if (collection.category === 'Eyewear Collection') categoryCode = 'EYE';
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
        product_type: formData.product_type,
        supplier_name: formData.supplier_name,
        status: formData.status,
        received_date: formData.received_date || null,
        feedback_deadline: formData.feedback_deadline || null,
        internal_notes: formData.internal_notes,
        tags: formData.tags,
        // CRITICAL: Supabase uses UUIDs. Sending '1' as a number will fail with 500.
        // We use the logged-in user's ID, or null if not available.
        responsible_user_id: user?.id || null,
      };

      console.log('Creating sample with payload:', payload);

      await samplesAPI.create(payload as any);

      onSampleAdded();
      onClose();

      // Reset form - keep the collection_id
      setFormData({
        collection_id: collections[0]?.id || formData.collection_id,
        sample_number: '',
        name: '',
        product_type: 'Dress',
        supplier_name: '',
        status: 'In Review',
        received_date: '',
        feedback_deadline: '',
        internal_notes: '',
        tags: '',
      });
    } catch (error: any) {
      console.error('Error creating sample details:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      // Logs actual error details which helped identifying the 500 error
      console.error('Full server error:', error.response?.data);
      alert(`Failed to create sample: ${errorMessage}`);
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
          <h2 className="modal-title">Add New Article</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Article Number *</label>
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
              <label className="form-label">Article Description *</label>
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

          <div className="form-row">
            <div
              className="form-group"
              style={{ position: 'relative' }}
              onMouseEnter={() => setShowManufacturerDropdown(true)}
              onMouseLeave={() => setShowManufacturerDropdown(false)}
            >
              <label className="form-label">Manufacturer *</label>
              <input
                type="text"
                name="supplier_name"
                value={formData.supplier_name}
                onChange={handleChange}
                onFocus={() => setShowManufacturerDropdown(true)}
                className="form-input"
                placeholder="Select or type a manufacturer..."
                autoComplete="off"
                required
              />
              {showManufacturerDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  zIndex: 50,
                  marginTop: '4px',
                  overflow: 'hidden'
                }}>
                  {manufacturersList.map(m => (
                    <div
                      key={m}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        borderBottom: '1px solid #f5f5f5',
                        transition: 'background 0.2s',
                        color: formData.supplier_name === m ? '#000' : '#444',
                        fontWeight: formData.supplier_name === m ? 600 : 400,
                        background: formData.supplier_name === m ? '#fafafa' : 'transparent'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = formData.supplier_name === m ? '#fafafa' : 'transparent';
                      }}
                      onClick={() => {
                        setFormData({ ...formData, supplier_name: m });
                        setShowManufacturerDropdown(false);
                      }}
                    >
                      {m}
                    </div>
                  ))}
                </div>
              )}
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

          <div className="form-group">
            <label className="form-label">Style Notes</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., specific style notes or remarks..."
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Article'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddSampleModal;
