import { useState, useEffect } from 'react';
import { samplesAPI, manufacturersAPI } from '../api';
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
    name: '',
    product_type: 'Dress' as any,
    supplier_name: '',
    status: 'In Review' as any,
    received_date: '',
    feedback_deadline: '',
    internal_notes: '',
    tags: '',
    // New Article Number components
    garment_type: '',
    garment_category: '',
    sequence: '',
    fabric_code: '',
    color_code: '',
    season_digit: '',
    year_digits: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [showManufacturerDropdown, setShowManufacturerDropdown] = useState(false);
  const [manufacturersList, setManufacturersList] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      manufacturersAPI.getAll().then(res => {
        setManufacturersList(res.data.map(m => m.name));
      }).catch(console.error);

      // Auto-select the first collection if none is selected
      if (collections.length > 0 && !formData.collection_id) {
        setFormData(prev => ({ ...prev, collection_id: collections[0].id }));
      }
    }
  }, [isOpen, collections]);

  // Automatic category/year updates disabled to ensure manual input as per user request


  if (!isOpen) return null;

  // Generate sample code automatically based on new standardized format: XS 001 00 11426
  const generateSampleCode = () => {
    const { garment_type, garment_category, sequence, fabric_code, color_code, season_digit, year_digits } = formData;
    return `${garment_type}${garment_category} ${sequence.padStart(3, '0')} ${fabric_code.padStart(2, '0')} ${color_code.padStart(2, '0')}${season_digit}${year_digits}`;
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
        name: '',
        product_type: 'Dress',
        supplier_name: '',
        status: 'In Review',
        received_date: '',
        feedback_deadline: '',
        internal_notes: '',
        tags: '',
        garment_type: '',
        garment_category: '',
        sequence: '',
        fabric_code: '',
        color_code: '',
        season_digit: '',
        year_digits: '',
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
    let value = e.target.value;
    const components = ['garment_type', 'garment_category', 'sequence', 'fabric_code', 'color_code', 'season_digit', 'year_digits'];
    
    if (components.includes(e.target.name)) {
      value = value.toUpperCase();
    }

    setFormData({
      ...formData,
      [e.target.name]: value,
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
          <div className="form-group">
            <label className="form-label">Production (Collection) *</label>
            <select
              name="collection_id"
              value={formData.collection_id}
              onChange={handleChange}
              className="form-input"
              required
            >
              <option value="">Select a production...</option>
              {collections.map(col => (
                <option key={col.id} value={col.id}>
                  {col.name} ({col.category} · {col.season} {col.year})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 24, padding: 16, background: '#fcfcfc', border: '1px solid #eee', borderRadius: 8, width: '100%', boxSizing: 'border-box' }}>
            <label className="form-label" style={{ fontWeight: 700, marginBottom: 12, color: '#111', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>Article Number Components</label>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'end' }}>
              <div style={{ width: 100 }}>
                <label style={{ fontSize: 10, color: '#999', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Type/Cat</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  <input
                    type="text"
                    name="garment_type"
                    value={formData.garment_type}
                    onChange={handleChange}
                    style={{ width: 45, padding: '8px 4px', textAlign: 'center', border: '1px solid #ddd', borderRadius: 4, fontSize: 14 }}
                    maxLength={1}
                    required
                  />
                  <input
                    type="text"
                    name="garment_category"
                    value={formData.garment_category}
                    onChange={handleChange}
                    style={{ width: 45, padding: '8px 4px', textAlign: 'center', border: '1px solid #ddd', borderRadius: 4, fontSize: 14 }}
                    maxLength={1}
                    required
                  />
                </div>
              </div>
              <div style={{ width: 70 }}>
                <label style={{ fontSize: 10, color: '#999', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Seq.</label>
                <input
                  type="text"
                  name="sequence"
                  value={formData.sequence}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '8px 8px', textAlign: 'center', border: '1px solid #ddd', borderRadius: 4, fontSize: 14 }}
                  maxLength={3}
                  placeholder="001"
                  required
                />
              </div>
              <div style={{ width: 60 }}>
                <label style={{ fontSize: 10, color: '#999', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Fab.</label>
                <input
                  type="text"
                  name="fabric_code"
                  value={formData.fabric_code}
                  onChange={handleChange}
                  style={{ width: '100%', padding: '8px 8px', textAlign: 'center', border: '1px solid #ddd', borderRadius: 4, fontSize: 14 }}
                  maxLength={2}
                  placeholder="00"
                  required
                />
              </div>
              <div style={{ width: 160 }}>
                <label style={{ fontSize: 10, color: '#999', textTransform: 'uppercase', marginBottom: 4, display: 'block' }}>Color/Ses/Yr</label>
                <div style={{ display: 'flex', gap: 4 }}>
                  <input
                    type="text"
                    name="color_code"
                    value={formData.color_code}
                    onChange={handleChange}
                    style={{ width: 55, padding: '8px 4px', textAlign: 'center', border: '1px solid #ddd', borderRadius: 4, fontSize: 14 }}
                    maxLength={2}
                    placeholder="11"
                    required
                  />
                  <input
                    type="text"
                    name="season_digit"
                    value={formData.season_digit}
                    onChange={handleChange}
                    style={{ width: 45, padding: '8px 4px', textAlign: 'center', border: '1px solid #ddd', borderRadius: 4, fontSize: 14 }}
                    maxLength={1}
                    placeholder="4"
                    required
                  />
                  <input
                    type="text"
                    name="year_digits"
                    value={formData.year_digits}
                    onChange={handleChange}
                    style={{ width: 55, padding: '8px 4px', textAlign: 'center', border: '1px solid #ddd', borderRadius: 4, fontSize: 14 }}
                    maxLength={2}
                    placeholder="26"
                    required
                  />
                </div>
              </div>
            </div>

            <div style={{ marginTop: 24, textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#111', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
              {generateSampleCode()}
            </div>


            <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #eee' }}>
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
                <option value="None">None</option>
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
