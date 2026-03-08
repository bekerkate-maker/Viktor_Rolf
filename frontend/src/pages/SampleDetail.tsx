import { useState, useEffect } from 'react';
import InternalNotesSection from '../components/InternalNotesSection';
import { useParams, useNavigate } from 'react-router-dom';
import { samplesAPI, photosAPI } from '../api';
import type { Sample, SamplePhoto } from '../types';
import { getStatusBadge } from '../components/SampleHeader';
import EditSampleModal from '../components/EditSampleModal';
// Voeg Lucide icons toe voor buttons
import { Plus, X, ChevronLeft, ChevronRight, ArrowLeft, Trash2, Pencil, Check, Minus, Download, Scissors, Ruler, ClipboardCheck, Save, EyeOff, Eye, Activity, RefreshCw, Tag, Calendar, Factory, User, AlignLeft } from 'lucide-react';

const STATUS_OPTIONS = ['In Review', 'Changes Needed', 'Approved', 'Rejected'] as const;

function SampleDetail() {
  const params = useParams<{ id: string; collectionId?: string }>();
  const navigate = useNavigate();
  const id = params.id;
  const [sample, setSample] = useState<Sample | null>(null);
  const [photos, setPhotos] = useState<SamplePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [savingChecks, setSavingChecks] = useState(false);
  const [hasSavedChecks, setHasSavedChecks] = useState(false);

  const [fitChecks, setFitChecks] = useState<Record<string, 'reject' | 'doubt' | 'approve'>>({});
  const [workChecks, setWorkChecks] = useState<Record<string, 'reject' | 'doubt' | 'approve'>>({});

  const [newFitItem, setNewFitItem] = useState('');
  const [newWorkItem, setNewWorkItem] = useState('');

  const [hiddenFitItems, setHiddenFitItems] = useState<string[]>([]);
  const [hiddenWorkItems, setHiddenWorkItems] = useState<string[]>([]);
  const [showHiddenFit, setShowHiddenFit] = useState(false);
  const [showHiddenWork, setShowHiddenWork] = useState(false);

  const fitItems = [
    'Length',
    'Chest',
    'Waist',
    'Shoulder width',
    'Sleeve length',
    'Hip circumference',
    'High hip',
    'Front rise',
    'Back rise',
    'Neckline depth',
    'Neckline width',
    'Bicep width',
    'Cuff opening',
    'Leg opening',
    'Inseam',
    'Outseam',
    'Across back',
    'Across chest',
    'Chest width',
    'Waist width',
    'Hip width',
    'Total length (Center back)',
    'Neck opening',
    'Drape',
    'Balance',
    'Ease of movement',
    'Lining ease',
    'Symmetry',
    'Tension lines',
    'Point of strain',
    'Shoulder placement',
    'Hem levelness'
  ];
  const workItems = [
    'Stitch placement',
    'Stitch distance',
    'Thread thickness',
    'Button attachment',
    'Thread tension',
    'Buttonhole',
    'Thread trimming',
    'Seam alignment',
    'Pattern matching',
    'Hem finish',
    'Lining attachment',
    'Zipper functionality',
    'Interfacing quality',
    'Pressing quality',
    'Label positioning',
    'Overlock neatness',
    'Hook and eye security',
    'Snap fastener strength',
    'Shoulder pad stability',
    'Embroidery tension'
  ];

  const renderChecklist = (title: string, defaultItems: string[], state: any, setState: any, Icon: any, newItemText: string, setNewItemText: any, hiddenItems: string[], setHiddenItems: any, showHidden: boolean, setShowHidden: any) => {
    const customItems = Object.keys(state).filter(k => !defaultItems.includes(k));
    const allItems = [...defaultItems, ...customItems];

    const visibleItems = allItems.filter(item => !hiddenItems.includes(item));
    const currentlyHiddenItems = allItems.filter(item => hiddenItems.includes(item));

    const itemsToRender = showHidden ? currentlyHiddenItems : visibleItems;

    return (
      <div className="luxury-card" style={{ height: '100%', border: '1px solid #eee', borderRadius: 12, background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', padding: 24, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 className="luxury-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 18, letterSpacing: 1, margin: 0, textTransform: 'uppercase' }}>
            <Icon size={20} />
            {title} {showHidden ? '(Hidden Items)' : ''}
          </h3>
          {(currentlyHiddenItems.length > 0 || showHidden) && (
            <button
              onClick={() => setShowHidden(!showHidden)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 13, padding: '4px 8px', borderRadius: 6, transition: 'background 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
            >
              {showHidden ? <Eye size={14} /> : <EyeOff size={14} />}
              {showHidden ? 'Back to visible' : `See hidden items (${currentlyHiddenItems.length})`}
            </button>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 90px 90px 90px', gap: 16, alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: 8, marginBottom: 12, fontWeight: 600, color: '#888', fontSize: 13, textTransform: 'uppercase' }}>
          <div>Item</div>
          <div style={{ textAlign: 'center', color: '#e53935', fontSize: 11 }}>Rejected</div>
          <div style={{ textAlign: 'center', color: '#ffb300', fontSize: 11 }}>Review</div>
          <div style={{ textAlign: 'center', color: '#43a047', fontSize: 11 }}>Approved</div>
        </div>

        <div style={{ flex: 1 }}>
          {itemsToRender.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#bbb', fontStyle: 'italic', fontSize: 14 }}>
              No {showHidden ? 'hidden' : 'visible'} items.
            </div>
          ) : (
            itemsToRender.map(item => (
              <div key={item} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 90px 90px 90px', gap: 16, alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f5f5f5' }}>
                <div style={{ minWidth: 0, fontWeight: 500, fontSize: 15, display: 'flex', alignItems: 'center', color: showHidden ? '#888' : '#111' }}>
                  {showHidden ? (
                    <button
                      onClick={() => setHiddenItems(hiddenItems.filter((i: string) => i !== item))}
                      style={{ marginRight: 8, background: 'none', border: 'none', color: '#111', cursor: 'pointer', padding: 2, display: 'flex', opacity: 0.8 }}
                      title="Restore item"
                    >
                      <Eye size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={() => setHiddenItems([...hiddenItems, item])}
                      style={{ marginRight: 8, background: 'none', border: 'none', color: '#999', cursor: 'pointer', padding: 2, display: 'flex', opacity: 0.5, transition: 'opacity 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
                      title="Hide item"
                    >
                      <EyeOff size={14} />
                    </button>
                  )}
                  <span style={{ textDecoration: showHidden ? 'line-through' : 'none', opacity: showHidden ? 0.6 : 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item}</span>
                  {!defaultItems.includes(item) && (
                    <button
                      onClick={() => {
                        const newState = { ...state };
                        delete newState[item];
                        setState(newState);
                        if (hiddenItems.includes(item)) {
                          setHiddenItems(hiddenItems.filter((i: string) => i !== item));
                        }
                      }}
                      style={{ marginLeft: 8, flexShrink: 0, background: 'none', border: 'none', color: '#e53935', cursor: 'pointer', padding: 2, display: 'flex' }}
                      title="Remove custom item"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div
                  onClick={() => !showHidden && setState({ ...state, [item]: 'reject' })}
                  style={{ width: 70, height: 40, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: showHidden ? 'default' : 'pointer', borderRadius: 8, background: state[item] === 'reject' ? '#ffeeee' : '#f9f9f9', color: state[item] === 'reject' ? '#e53935' : '#ccc', border: state[item] === 'reject' ? '2px solid #e53935' : '1px solid #eee', transition: 'all 0.2s', opacity: showHidden ? 0.4 : 1 }}>
                  <X size={20} strokeWidth={state[item] === 'reject' ? 3 : 2} />
                </div>

                <div
                  onClick={() => !showHidden && setState({ ...state, [item]: 'doubt' })}
                  style={{ width: 70, height: 40, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: showHidden ? 'default' : 'pointer', borderRadius: 8, background: state[item] === 'doubt' ? '#fff8e1' : '#f9f9f9', color: state[item] === 'doubt' ? '#ffb300' : '#ccc', border: state[item] === 'doubt' ? '2px solid #ffb300' : '1px solid #eee', transition: 'all 0.2s', opacity: showHidden ? 0.4 : 1 }}>
                  <Minus size={20} strokeWidth={state[item] === 'doubt' ? 3 : 2} />
                </div>

                <div
                  onClick={() => !showHidden && setState({ ...state, [item]: 'approve' })}
                  style={{ width: 70, height: 40, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: showHidden ? 'default' : 'pointer', borderRadius: 8, background: state[item] === 'approve' ? '#e8f5e9' : '#f9f9f9', color: state[item] === 'approve' ? '#43a047' : '#ccc', border: state[item] === 'approve' ? '2px solid #43a047' : '1px solid #eee', transition: 'all 0.2s', opacity: showHidden ? 0.4 : 1 }}>
                  <Check size={20} strokeWidth={state[item] === 'approve' ? 3 : 2} />
                </div>
              </div>
            ))
          )}
        </div>

        {!showHidden && (
          <div style={{ display: 'flex', gap: 12, marginTop: 'auto', paddingTop: 16, borderTop: '1px dashed #eee' }}>
            <input
              type="text"
              placeholder={`Add custom ${title.toLowerCase()} item...`}
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newItemText.trim() && !allItems.includes(newItemText.trim())) {
                  setState({ ...state, [newItemText.trim()]: 'approve' });
                  setNewItemText('');
                }
              }}
              style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14 }}
            />
            <button
              onClick={() => {
                if (newItemText.trim() && !allItems.includes(newItemText.trim())) {
                  setState({ ...state, [newItemText.trim()]: 'approve' });
                  setNewItemText('');
                }
              }}
              style={{ padding: '0 16px', background: '#f9f9f9', color: '#666', borderRadius: 8, border: '1px solid #eee', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f0f0f0';
                e.currentTarget.style.borderColor = '#ddd';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f9f9f9';
                e.currentTarget.style.borderColor = '#eee';
              }}
            >
              <Plus size={16} /> Add
            </button>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (id) {
      loadSample(id);
      loadPhotos(id);
    }
    // eslint-disable-next-line
  }, [id]);

  const loadSample = async (sampleId: string) => {
    try {
      const response = await samplesAPI.getById(sampleId);
      setSample(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading sample:', error);
      setLoading(false);
    }
  };

  // Load data immediately when sample arrives
  useEffect(() => {
    if (sample && sample.internal_notes) {
      try {
        const parsed = JSON.parse(sample.internal_notes);
        if (parsed && typeof parsed === 'object' && parsed._isJsonBlob) {
          setFitChecks(parsed.fitChecks || {});
          setWorkChecks(parsed.workChecks || {});
          setHiddenFitItems(parsed.hiddenFitItems || []);
          setHiddenWorkItems(parsed.hiddenWorkItems || []);
        }
      } catch (e) {
        // Plain text fallback, nothing to parse into checklists
      }
    }
  }, [sample]);

  const loadPhotos = async (sampleId: string) => {
    try {
      const response = await photosAPI.getPhotos(sampleId);
      setPhotos(response.data);
    } catch (error) {
      console.error('Error loading photos:', error);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !id) return;

    const files = Array.from(event.target.files);
    setUploading(true);

    try {
      await photosAPI.uploadPhotos(id, files);
      await loadPhotos(id);
      // Reset file input
      const fileInput = document.getElementById('photo-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      console.error('Error uploading photos:', error);
      const msg = error?.response?.data?.error || error?.message || 'Failed to upload photos';
      alert(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!window.confirm('Are you sure you want to delete this photo?')) return;

    try {
      await photosAPI.deletePhoto(photoId);
      // Als we de huidige foto verwijderen, ga naar de vorige of sluit lightbox
      if (photos.length === 1) {
        setShowLightbox(false);
      } else if (lightboxIndex >= photos.length - 1) {
        setLightboxIndex(photos.length - 2);
      }
      if (id) await loadPhotos(id);
    } catch (error: any) {
      console.error('Error deleting photo:', error);
      alert('Failed to delete photo');
    }
  };

  const handleDownloadPDF = () => {
    // Generate the filename: "Stylenumber"_"Manufacturer"_V&R
    const originalTitle = document.title;
    const styleNumber = sample?.sample_code || 'Stylenumber';
    const manufacturer = sample?.supplier_name || 'Manufacturer';
    document.title = `${styleNumber}_${manufacturer}_V&R`;

    // Trigger printing dialog
    window.print();

    // Revert title
    setTimeout(() => {
      document.title = originalTitle;
    }, 100);
  };

  // Start editing name
  const handleStartEditName = () => {
    if (sample) {
      setEditedName(sample.name);
      setIsEditingName(true);
    }
  };

  // Save edited name
  const handleSaveName = async () => {
    if (!sample || !id || editedName.trim() === '') return;

    try {
      await samplesAPI.update(id, { name: editedName.trim() });
      setSample({ ...sample, name: editedName.trim() });
      setIsEditingName(false);
    } catch (error) {
      console.error('Error updating style name:', error);
      alert('Failed to update style name');
    }
  };

  // Cancel editing name
  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditedName('');
  };

  // Update status
  const handleStatusChange = async (newStatus: typeof STATUS_OPTIONS[number]) => {
    if (!sample || !id) return;

    try {
      await samplesAPI.update(id, { status: newStatus });
      setSample({ ...sample, status: newStatus });
      setShowStatusDropdown(false);
    } catch (error) {
      console.error('Error updating sample status:', error);
      alert('Failed to update sample status');
    }
  };

  if (loading) {
    return <div className="loading luxury-font">Loading sample...</div>;
  }
  if (!sample) {
    return <div className="empty-state luxury-font">Sample not found.</div>;
  }

  // Nieuwe layout
  return (
    <div className="sample-detail-modern sample-detail-fullwidth luxury-font" style={{
      width: '100%',
      margin: 0,
      padding: 0,
      minHeight: '100vh',
      boxSizing: 'border-box',
    }}>
      {/* Terug knop - links boven, onder de navbar */}
      <div style={{ paddingTop: 16, paddingLeft: 16 }}>
        <button
          onClick={() => {
            // Bouw de terug-URL op basis van de sample data
            if (sample.collection_type && sample.year && sample.season) {
              const categorySlug = sample.collection_type.toLowerCase().replace(/ /g, '-');
              const seasonSlug = sample.season.toLowerCase();
              navigate(`/quality-control/${categorySlug}/${sample.year}/${seasonSlug}`);
            } else {
              navigate('/quality-control');
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: '1px solid #ddd',
            background: '#fff',
            cursor: 'pointer',
            fontSize: 18,
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f5f5f5';
            e.currentTarget.style.borderColor = '#111';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#fff';
            e.currentTarget.style.borderColor = '#ddd';
          }}
          title="Terug naar overzicht"
        >
          <ArrowLeft size={16} color="#111" />
        </button>
      </div>

      {/* Brede header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 32,
        margin: '16px 0 0 0',
        padding: '20px 0',
      }}>
        {/* Editable sample name */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <span style={{ fontWeight: 700, fontSize: 32, letterSpacing: 1.2, color: '#111' }}>
            {sample.sample_code.split('-').pop()} —
          </span>
          {isEditingName ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') handleCancelEditName();
                }}
                autoFocus
                style={{
                  fontWeight: 700,
                  fontSize: 32,
                  letterSpacing: 1.2,
                  color: '#111',
                  border: 'none',
                  borderBottom: '2px solid #111',
                  background: 'transparent',
                  outline: 'none',
                  padding: '0 4px',
                  minWidth: 200,
                }}
              />
              <button
                onClick={handleSaveName}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: '1px solid #4CAF50',
                  background: '#4CAF50',
                  cursor: 'pointer',
                  color: '#fff',
                }}
                title="Save"
              >
                <Check size={16} />
              </button>
              <button
                onClick={handleCancelEditName}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: '1px solid #ddd',
                  background: '#fff',
                  cursor: 'pointer',
                }}
                title="Cancel"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <span
              onClick={handleStartEditName}
              style={{
                fontWeight: 700,
                fontSize: 32,
                letterSpacing: 1.2,
                color: '#111',
                wordBreak: 'break-word',
                cursor: 'pointer',
                borderBottom: '2px solid transparent',
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderBottom = '2px solid #111'}
              onMouseLeave={(e) => e.currentTarget.style.borderBottom = '2px solid transparent'}
              title="Click to edit name"
            >
              {sample.name}
            </span>
          )}
        </div>

        {/* Clickable status dropdown */}
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            style={{ cursor: 'pointer' }}
            title="Click to change status"
          >
            {getStatusBadge(sample.status)}
          </div>

          {showStatusDropdown && (
            <>
              {/* Invisible overlay to close dropdown when clicking outside */}
              <div
                onClick={() => setShowStatusDropdown(false)}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 99,
                }}
              />
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 8,
                background: '#fff',
                borderRadius: 8,
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                overflow: 'hidden',
                zIndex: 100,
                minWidth: 180,
              }}>
                {STATUS_OPTIONS.map((status) => (
                  <div
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      background: sample.status === status ? '#f5f5f5' : '#fff',
                      borderLeft: sample.status === status ? '3px solid #111' : '3px solid transparent',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                    onMouseLeave={(e) => e.currentTarget.style.background = sample.status === status ? '#f5f5f5' : '#fff'}
                  >
                    {getStatusBadge(status)}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Layout: Top section met fotos (links) en info (rechts) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '0 16px 48px 16px' }}>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'stretch' }}>
          {/* Linker kolom: Photos */}
          <div className="luxury-card" style={{ border: '1px solid #eee', borderRadius: 12, background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: photos.length === 1 ? '1fr' : '1fr 1fr', gap: 2, background: '#f5f5f5', minHeight: 400 }}>
              {photos.length > 0 ? (
                photos.slice(0, 2).map((photo, index) => {
                  const isLastWithMore = index === 1 && photos.length > 2;
                  return (
                    <div
                      key={photo.id}
                      onClick={() => { setLightboxIndex(index); setShowLightbox(true); }}
                      style={{
                        position: 'relative',
                        cursor: 'pointer',
                        overflow: 'hidden',
                        height: '100%',
                      }}
                    >
                      <img
                        src={photo.file_path}
                        alt={photo.file_name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.2s',
                        }}
                      />
                      {isLastWithMore && (
                        <div style={{
                          position: 'absolute',
                          right: 12, bottom: 12,
                          padding: '6px 14px',
                          background: 'rgba(255, 255, 255, 0.85)',
                          backdropFilter: 'blur(4px)',
                          WebkitBackdropFilter: 'blur(4px)',
                          borderRadius: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#222',
                          fontSize: 13,
                          fontWeight: 600,
                          boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
                        }}>
                          +{photos.length - 2}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="luxury-empty-state" style={{ textAlign: 'center', color: '#bbb', fontSize: 16, padding: '24px 48px', gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, height: '100%' }}>
                  <Plus size={24} style={{ opacity: 0.5 }} />
                  <div>No photos yet</div>
                </div>
              )}
            </div>
            <div style={{ padding: 12, width: '100%', borderTop: '1px solid #f0f0f0', background: '#fafbfc', display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                id="photo-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                disabled={uploading}
              />
              <label
                htmlFor="photo-upload"
                className="btn luxury-btn"
                style={{
                  padding: '8px 18px',
                  fontWeight: 500,
                  borderRadius: 8,
                  background: uploading ? '#ccc' : '#f5f5f5',
                  border: '1px solid #eee',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  opacity: uploading ? 0.7 : 1,
                  width: '100%',
                  textAlign: 'center',
                }}
              >
                {uploading ? 'Uploading...' : 'Add Photos'}
              </label>
            </div>
          </div>

          {/* Rechter kolom: Style Information */}
          <div className="luxury-card" style={{ border: '1px solid #eee', borderRadius: 12, background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', padding: 24, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h3 className="luxury-card-title" style={{ fontWeight: 600, fontSize: 18, letterSpacing: 1, margin: 0 }}>Style Information</h3>
              <button
                onClick={() => setShowEditModal(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid #ddd',
                  background: '#fff',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#333',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f5f5f5';
                  e.currentTarget.style.borderColor = '#111';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#fff';
                  e.currentTarget.style.borderColor = '#ddd';
                }}
              >
                <Pencil size={14} />
                Edit
              </button>
            </div>

            <div className="luxury-info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px 24px', flex: 1 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}><Activity size={14} /> Status</div>
                <div style={{ fontWeight: 500, color: '#111', fontSize: 18 }}>{sample.status}</div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}><RefreshCw size={14} /> Style Round</div>
                <div style={{ fontWeight: 500, color: '#111', fontSize: 18 }}>{sample.sample_round}</div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}><Tag size={14} /> Category</div>
                <div style={{ fontWeight: 500, color: '#111', fontSize: 18 }}>{sample.product_type}</div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}><Calendar size={14} /> Season</div>
                <div style={{ fontWeight: 500, color: '#111', fontSize: 18 }}>{sample.season} {sample.year}</div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}><Factory size={14} /> Manufacturer</div>
                <div style={{ fontWeight: 500, color: '#111', fontSize: 18 }}>{sample.supplier_name || '—'}</div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}><User size={14} /> Responsible</div>
                <div style={{ fontWeight: 500, color: '#111', fontSize: 18 }}>{sample.responsible_user_name || '—'}</div>
              </div>

              <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}><AlignLeft size={14} /> Style Notes</div>
                <div style={{ fontSize: 18, color: '#111', fontWeight: 500, lineHeight: 1.5, fontStyle: 'italic' }}>
                  {sample.tags ? (
                    `"${sample.tags}"`
                  ) : (
                    <span style={{ color: '#bbb', fontSize: 16, fontStyle: 'italic' }}>No style notes added</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quality Control Assessment Wrapper */}
        <div style={{
          background: '#faf8f5',
          border: '1px solid #f0ebe1',
          borderRadius: 16,
          padding: 32,
          marginTop: 16,
          position: 'relative',
        }}>
          {/* Section Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, borderBottom: '2px solid #e9ecef', paddingBottom: 16 }}>
            <div style={{ background: '#111', color: '#fff', padding: 10, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ClipboardCheck size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: 0.5, color: '#111' }}>Quality Control Assessment</h2>
              <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: 14 }}>Please review and provide your input for this style.</p>
            </div>
          </div>

          {/* Checklijst secties */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 24 }}>
            {renderChecklist('Fit', fitItems, fitChecks, setFitChecks, Ruler, newFitItem, setNewFitItem, hiddenFitItems, setHiddenFitItems, showHiddenFit, setShowHiddenFit)}
            {renderChecklist('Workmanship', workItems, workChecks, setWorkChecks, Scissors, newWorkItem, setNewWorkItem, hiddenWorkItems, setHiddenWorkItems, showHiddenWork, setShowHiddenWork)}
          </div>

          {/* Quick Action Button for Saving Checks */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24, marginTop: -8 }}>
            <button
              onClick={async () => {
                setSavingChecks(true);
                try {
                  let parsed = { _isJsonBlob: true, notes: '', fitChecks: {}, workChecks: {}, hiddenFitItems: [], hiddenWorkItems: [] };
                  try {
                    const existing = JSON.parse(sample?.internal_notes || '{}');
                    if (existing && typeof existing === 'object' && existing._isJsonBlob) {
                      parsed = existing;
                    } else {
                      parsed.notes = sample?.internal_notes || '';
                    }
                  } catch (e) {
                    parsed.notes = sample?.internal_notes || '';
                  }

                  parsed.fitChecks = fitChecks;
                  parsed.workChecks = workChecks;
                  parsed.hiddenFitItems = hiddenFitItems as any;
                  parsed.hiddenWorkItems = hiddenWorkItems as any;

                  await samplesAPI.update(String(sample?.id), {
                    internal_notes: JSON.stringify(parsed)
                  });

                  setSavingChecks(false);
                  setHasSavedChecks(true);
                } catch (err) {
                  setSavingChecks(false);
                  alert('Oeps, kon checks niet opslaan.');
                }
              }}
              disabled={savingChecks || hasSavedChecks}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 24px',
                borderRadius: 8,
                background: hasSavedChecks ? '#f1f3f5' : '#f9f9f9',
                color: hasSavedChecks ? '#868e96' : '#666',
                border: hasSavedChecks ? '1px solid #dee2e6' : '1px solid #eee',
                cursor: (savingChecks || hasSavedChecks) ? 'default' : 'pointer',
                fontSize: 14,
                fontWeight: 500,
                transition: 'all 0.4s',
                opacity: savingChecks ? 0.7 : 1,
              }}
              onMouseEnter={(e) => {
                if (!savingChecks && !hasSavedChecks) {
                  e.currentTarget.style.background = '#f0f0f0';
                  e.currentTarget.style.borderColor = '#ddd';
                }
              }}
              onMouseLeave={(e) => {
                if (!savingChecks && !hasSavedChecks) {
                  e.currentTarget.style.background = '#f9f9f9';
                  e.currentTarget.style.borderColor = '#eee';
                }
              }}
            >
              {hasSavedChecks ? <Check size={16} color="#868e96" /> : <Save size={16} />}
              {savingChecks ? 'Saving...' : hasSavedChecks ? 'Assessment Saved' : 'Save Assessment'}
            </button>
          </div>

          {/* Internal Notes in een full-width block eronder */}
          <div className="luxury-card" style={{ border: '1px solid #eee', borderRadius: 12, background: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', padding: 24, display: 'flex', flexDirection: 'column' }}>
            <h3 className="luxury-card-title" style={{ fontWeight: 600, fontSize: 18, letterSpacing: 1, marginBottom: 16 }}>Internal Notes & Final Remarks</h3>
            <InternalNotesSection sample={sample} />
          </div>
        </div>

        {/* Download QC PDF Button */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
          <button
            onClick={handleDownloadPDF}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '14px 28px',
              borderRadius: 30,
              background: '#111',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: 15,
              fontWeight: 500,
              letterSpacing: 0.5,
              transition: 'all 0.2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.15)';
              e.currentTarget.style.background = '#333';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
              e.currentTarget.style.background = '#111';
            }}
          >
            <Download size={18} />
            Download QC PDF
          </button>
        </div>
      </div>

      {/* Lightbox Modal voor alle fotos */}
      {showLightbox && photos.length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.92)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setShowLightbox(false)}
        >
          {/* Close button */}
          <button
            onClick={() => setShowLightbox(false)}
            style={{
              position: 'absolute',
              top: 24, right: 24,
              background: 'transparent',
              border: 'none',
              color: '#fff',
              cursor: 'pointer',
              padding: 8,
              zIndex: 10001,
            }}
          >
            <X size={32} />
          </button>

          {/* Navigation arrows */}
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((prev) => (prev - 1 + photos.length) % photos.length); }}
                style={{
                  position: 'absolute',
                  left: 24,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  padding: 12,
                  borderRadius: '50%',
                  zIndex: 10001,
                }}
              >
                <ChevronLeft size={32} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((prev) => (prev + 1) % photos.length); }}
                style={{
                  position: 'absolute',
                  right: 24,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  padding: 12,
                  borderRadius: '50%',
                  zIndex: 10001,
                }}
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}

          {/* Main image */}
          <img
            src={photos[lightboxIndex].file_path}
            alt={photos[lightboxIndex].file_name}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '85vw',
              maxHeight: '80vh',
              objectFit: 'contain',
              borderRadius: 8,
            }}
          />

          {/* Photo counter */}
          <div style={{
            color: '#fff',
            marginTop: 16,
            fontSize: 14,
            opacity: 0.8,
          }}>
            {lightboxIndex + 1} / {photos.length}
          </div>

          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeletePhoto(photos[lightboxIndex].id);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 12,
              padding: '8px 16px',
              background: 'rgba(220, 53, 69, 0.9)',
              border: 'none',
              borderRadius: 6,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 14,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(220, 53, 69, 1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(220, 53, 69, 0.9)';
            }}
          >
            <Trash2 size={16} />
            Delete Photo
          </button>

          {/* Thumbnail strip */}
          <div style={{
            display: 'flex',
            gap: 8,
            marginTop: 16,
            maxWidth: '90vw',
            overflowX: 'auto',
            padding: '8px 0',
          }}>
            {photos.map((photo, index) => (
              <img
                key={photo.id}
                src={photo.file_path}
                alt={photo.file_name}
                onClick={(e) => { e.stopPropagation(); setLightboxIndex(index); }}
                style={{
                  width: 60,
                  height: 60,
                  objectFit: 'cover',
                  borderRadius: 6,
                  cursor: 'pointer',
                  border: index === lightboxIndex ? '2px solid #fff' : '2px solid transparent',
                  opacity: index === lightboxIndex ? 1 : 0.6,
                  transition: 'all 0.2s',
                }}
              />
            ))}
          </div>
        </div>
      )}

      <EditSampleModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        sample={sample}
        onSampleUpdated={() => typeof sample.id === 'string' ? loadSample(sample.id) : undefined}
      />
    </div>
  );
}

export default SampleDetail;
