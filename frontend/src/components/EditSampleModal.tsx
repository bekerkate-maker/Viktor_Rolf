import { useState, useEffect } from 'react';
import { samplesAPI, manufacturersAPI } from '../api';
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
    product_type: 'Dress' as any,
    supplier_name: '',
    status: 'In Review' as any,
    received_date: '',
    feedback_deadline: '',
    internal_notes: '',
    tags: '',
    // New Article Number components
    garment_type: 'X',
    garment_category: 'S',
    sequence: '001',
    fabric_code: '00',
    color_code: '11',
    season_digit: '1',
    year_digits: '26',
  });

  const [submitting, setSubmitting] = useState(false);
  const [showManufacturerDropdown, setShowManufacturerDropdown] = useState(false);
  const [manufacturersList, setManufacturersList] = useState<string[]>([]);

  // Utility to parse code: "XS 001 00 11426"
  const parseSampleCode = (code: string) => {
    if (!code) return null;
    const parts = code.split(' ');
    if (parts.length < 4) return null;
    
    const typeCat = parts[0];
    const sequence = parts[1];
    const fabric = parts[2];
    const lastPart = parts[3]; // "11426"
    
    return {
      garment_type: typeCat[0] || 'X',
      garment_category: typeCat[1] || 'S',
      sequence,
      fabric_code: fabric,
      color_code: lastPart.substring(0, 2),
      season_digit: lastPart.substring(2, 3),
      year_digits: lastPart.substring(3),
    };
  };

  const generateSampleCode = () => {
    const { garment_type, garment_category, sequence, fabric_code, color_code, season_digit, year_digits } = formData;
    return `${garment_type}${garment_category} ${sequence.padStart(3, '0')} ${fabric_code.padStart(2, '0')} ${color_code.padStart(2, '0')}${season_digit}${year_digits}`;
  };

  // Populate form when sample changes
  useEffect(() => {
    if (isOpen && sample) {
      const parsed = parseSampleCode(sample.sample_code);
      setFormData({
        name: sample.name || '',
        product_type: (sample.product_type || 'Dress') as any,
        supplier_name: sample.supplier_name || '',
        status: (sample.status || 'In Review') as any,
        received_date: sample.received_date ? sample.received_date.split('T')[0] : '',
        feedback_deadline: sample.feedback_deadline ? sample.feedback_deadline.split('T')[0] : '',
        internal_notes: sample.internal_notes || '',
        tags: sample.tags || '',
        garment_type: parsed?.garment_type || 'X',
        garment_category: parsed?.garment_category || 'S',
        sequence: parsed?.sequence || '001',
        fabric_code: parsed?.fabric_code || '00',
        color_code: parsed?.color_code || '11',
        season_digit: parsed?.season_digit || '1',
        year_digits: parsed?.year_digits || '26',
      });

      // Load dynamic manufacturers
      manufacturersAPI.getAll().then(res => {
        setManufacturersList(res.data.map(m => m.name));
      }).catch(console.error);
    }
  }, [isOpen, sample]);

  // Update garment category based on product type (only on add/initial, but here too for consistency)
  useEffect(() => {
    const typeMap: Record<string, string> = {
      'Jacket': 'J',
      'Dress': 'D',
      'Pants': 'P',
      'Corset': 'C',
      'Knit': 'K',
      'Shirt': 'S',
      'Coat': 'O',
      'Skirt': 'K',
      'Top': 'T',
      'Other': 'X'
    };
    if (typeMap[formData.product_type]) {
      // Only auto-update if it's the default or matches previous product_type
      // For now, let's allow manual overrides to stick.
    }
  }, [formData.product_type]);

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
        product_type: formData.product_type,
        supplier_name: formData.supplier_name,
        status: formData.status,
        sample_code: generateSampleCode(),
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
          <h2 className="modal-title">Edit Article</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
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
                  />
                  <input
                    type="text"
                    name="garment_category"
                    value={formData.garment_category}
                    onChange={handleChange}
                    style={{ width: 45, padding: '8px 4px', textAlign: 'center', border: '1px solid #ddd', borderRadius: 4, fontSize: 14 }}
                    maxLength={1}
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
                  />
                  <input
                    type="text"
                    name="season_digit"
                    value={formData.season_digit}
                    onChange={handleChange}
                    style={{ width: 45, padding: '8px 4px', textAlign: 'center', border: '1px solid #ddd', borderRadius: 4, fontSize: 14 }}
                    maxLength={1}
                    placeholder="4"
                  />
                  <input
                    type="text"
                    name="year_digits"
                    value={formData.year_digits}
                    onChange={handleChange}
                    style={{ width: 55, padding: '8px 4px', textAlign: 'center', border: '1px solid #ddd', borderRadius: 4, fontSize: 14 }}
                    maxLength={2}
                    placeholder="26"
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
                placeholder="e.g., Silk Evening Dress"
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

          <div className="form-row">
            <div
              className="form-group"
              style={{ position: 'relative' }}
              onMouseEnter={() => setShowManufacturerDropdown(true)}
              onMouseLeave={() => setShowManufacturerDropdown(false)}
            >
              <label className="form-label">Manufacturer</label>
              <input
                type="text"
                name="supplier_name"
                value={formData.supplier_name}
                onChange={handleChange}
                onFocus={() => setShowManufacturerDropdown(true)}
                className="form-input"
                placeholder="Select or type a manufacturer..."
                autoComplete="off"
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
