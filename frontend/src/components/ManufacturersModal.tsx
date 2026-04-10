import React, { useState, useEffect } from 'react';
import { manufacturersAPI, Manufacturer } from '../api';

interface ManufacturersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const ManufacturersModal: React.FC<ManufacturersModalProps> = ({ isOpen, onClose, onUpdate }) => {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadManufacturers();
    }
  }, [isOpen]);

  const loadManufacturers = async () => {
    try {
      setLoading(true);
      const res = await manufacturersAPI.getAll();
      setManufacturers(res.data);
    } catch (err) {
      console.error('Error loading manufacturers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      await manufacturersAPI.create(newName.trim());
      setNewName('');
      loadManufacturers();
      onUpdate();
    } catch (err) {
      console.error('Error adding manufacturer:', err);
    }
  };

  const handleUpdate = async (id: string, currentName: string) => {
    if (!editingName.trim()) return;
    try {
      await manufacturersAPI.update(id, editingName.trim(), currentName);
      setEditingId(null);
      loadManufacturers();
      onUpdate();
    } catch (err) {
      console.error('Error updating manufacturer:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Weet je zeker dat je deze manufacturer wilt verwijderen?')) return;
    try {
      await manufacturersAPI.delete(id);
      loadManufacturers();
      onUpdate();
    } catch (err) {
      console.error('Error deleting manufacturer:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Manage Manufacturers</h3>
        </div>
        
        <div className="modal-body" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input
              type="text"
              placeholder="New manufacturer name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{ flex: 1, padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <button 
              onClick={handleAdd}
              className="btn btn-primary"
              style={{ padding: '8px 16px', background: '#111', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Add
            </button>
          </div>

          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {loading ? (
              <p>Loading...</p>
            ) : manufacturers.length === 0 ? (
              <p style={{ color: '#888', fontStyle: 'italic' }}>No manufacturers found.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {manufacturers.map((m) => (
                  <li key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #eee' }}>
                    {editingId === m.id ? (
                      <div style={{ display: 'flex', gap: '5px', flex: 1 }}>
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          style={{ flex: 1, padding: '4px 8px', border: '1px solid #ddd', borderRadius: '4px' }}
                          autoFocus
                        />
                        <button onClick={() => handleUpdate(m.id, m.name)} style={{ padding: '4px 8px', background: '#e0e0e0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✓</button>
                        <button onClick={() => setEditingId(null)} style={{ padding: '4px 8px', background: '#f5f5f5', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>×</button>
                      </div>
                    ) : (
                      <>
                        <span style={{ fontSize: '14px', fontWeight: 500 }}>{m.name}</span>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button 
                            onClick={() => {
                              setEditingId(m.id);
                              setEditingName(m.name);
                            }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666' }}
                          >
                            ✎
                          </button>
                          <button 
                            onClick={() => handleDelete(m.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4d4f' }}
                          >
                            ×
                          </button>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'flex-end', padding: '15px 20px', borderTop: '1px solid #eee' }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '8px 20px', background: '#f5f5f5', border: '1px solid #ddd', cursor: 'pointer', borderRadius: '4px' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManufacturersModal;
