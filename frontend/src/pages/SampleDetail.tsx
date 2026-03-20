import { useState, useEffect } from 'react';
import InternalNotesSection from '../components/InternalNotesSection';
import { useParams, useNavigate } from 'react-router-dom';
import { samplesAPI, photosAPI } from '../api';
import type { Sample, SamplePhoto } from '../types';
import { getStatusBadge } from '../components/SampleHeader';
import EditSampleModal from '../components/EditSampleModal';
// Voeg Lucide icons toe voor buttons
import { Plus, X, ChevronLeft, ChevronRight, Trash2, Pencil, Check, Minus, Download, Scissors, Ruler, ClipboardCheck, Save, EyeOff, Eye, Activity, RefreshCw, Tag, Calendar, Factory, User, AlignLeft } from 'lucide-react';

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
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedSampleCode, setEditedSampleCode] = useState('');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showManufacturerDropdown, setShowManufacturerDropdown] = useState(false);
  const manufacturersList = ["Cousy", "ABtex", "Guay", "F&P", "5D", "AESSE"];
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

  const [fitSections, setFitSections] = useState([
    {
      name: 'Tops, Jackets & Dresses',
      items: [
        'Total length (HSP)',
        '½ chest width',
        '½ waist width',
        '½ hip width',
        '½ hem width',
        'Back yoke',
        'Shoulder width',
        'Sleeve length',
        '½ bicep width',
        '½ cuff width',
        'Neck width (STS)',
        'Front neck drop',
        'Back neck drop'
      ]
    },
    {
      name: 'Bottoms (Pants & Skirts)',
      items: [
        '½ waist width',
        '½ hip width',
        'Front rise',
        'Back rise',
        'inseam',
        'Side seam',
        '½ leg opening'
      ]
    },
    {
      name: 'Movement & Drape',
      items: [
        'Ease of movement',
        'Balance'
      ]
    }
  ]);

  const [workSections, setWorkSections] = useState([
    {
      name: 'Workmanship Details',
      items: [
        'Topstitching placement',
        'Topstitching distance',
        'Stitching tension',
        'Yarn thickness',
        'Button attachement',
        'Button hole',
        'Overlock',
        'Loose threads',
        'Pattern matching',
        'Hem finishing',
        'Lining attachement',
        'Zipper functionality',
        'Interfacing quality',
        'Pressing quality',
        'Label positioning',
        'Hook and eye security',
        'Snap fastener strength',
        'Shoulder pad stability',
        'Embroidery attachement'
      ]
    }
  ]);

  const [selectedFitCategory, setSelectedFitCategory] = useState('Tops, Jackets & Dresses');
  const [selectedWorkCategory, setSelectedWorkCategory] = useState('Workmanship Details');

  const [draggedItemInfo, setDraggedItemInfo] = useState<{ sectionIndex: number, itemIndex: number, type: 'fit' | 'work' } | null>(null);

  const handleDragStart = (e: any, sectionIndex: number, itemIndex: number, type: 'fit' | 'work') => {
    setDraggedItemInfo({ sectionIndex, itemIndex, type });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: any) => {
    e.preventDefault();
  };

  const handleDrop = (e: any, targetSectionIndex: number, targetItemIndex: number, sections: any[], setSections: any, type: 'fit' | 'work') => {
    e.preventDefault();
    if (!draggedItemInfo || draggedItemInfo.type !== type) return;

    const { sectionIndex: sourceSIdx, itemIndex: sourceIIdx } = draggedItemInfo;
    const newSections = JSON.parse(JSON.stringify(sections));

    // Remove from source
    const [item] = newSections[sourceSIdx].items.splice(sourceIIdx, 1);
    // Add to target
    newSections[targetSectionIndex].items.splice(targetItemIndex, 0, item);

    setSections(newSections);
    setDraggedItemInfo(null);
  };

  const renderChecklist = (title: string, sections: { name: string, items: string[] }[], setStateSections: any, state: any, setState: any, Icon: any, newItemText: string, setNewItemText: any, hiddenItems: string[], setHiddenItems: any, showHidden: boolean, setShowHidden: any, selectedCategory: string, setSelectedCategory: any) => {
    const type = title.toLowerCase() === 'fit' ? 'fit' : 'work';
    const allDefaultItems = sections.reduce((acc, s) => [...acc, ...s.items], [] as string[]);
    const customItems = Object.keys(state).filter(k => !allDefaultItems.includes(k));
    const allItems = [...allDefaultItems, ...customItems];
    const currentlyHiddenItems = allItems.filter(item => hiddenItems.includes(item));

    const renderRow = (item: string, isCustom = false, sectionIndex?: number, itemIndex?: number) => (
      <div 
        key={item} 
        className="assessment-checklist-row" 
        draggable={!showHidden && sectionIndex !== undefined && itemIndex !== undefined}
        onDragStart={(e) => sectionIndex !== undefined && itemIndex !== undefined && handleDragStart(e, sectionIndex, itemIndex, type)}
        onDragOver={handleDragOver}
        onDrop={(e) => sectionIndex !== undefined && itemIndex !== undefined && handleDrop(e, sectionIndex, itemIndex, sections, setStateSections, type)}
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'minmax(0, 1fr) 90px 90px 90px', 
          gap: 16, 
          alignItems: 'center', 
          padding: '12px 0', 
          borderBottom: '1px solid #f5f5f5',
          cursor: !showHidden ? 'grab' : 'default',
          background: draggedItemInfo?.itemIndex === itemIndex && draggedItemInfo?.sectionIndex === sectionIndex && draggedItemInfo?.type === type ? '#f0f0f0' : 'transparent',
          transition: 'background 0.2s'
        }}
      >
        <div style={{ minWidth: 0, fontWeight: 500, fontSize: 15, display: 'flex', alignItems: 'center', color: showHidden ? '#888' : '#111' }}>
          {showHidden ? (
            <button
              className="no-print"
              onClick={() => setHiddenItems(hiddenItems.filter((i: string) => i !== item))}
              style={{ marginRight: 8, background: 'none', border: 'none', color: '#111', cursor: 'pointer', padding: 2, display: 'flex', opacity: 0.8 }}
              title="Restore item"
            >
              <Eye size={14} />
            </button>
          ) : (
            <button
              className="no-print"
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
          {isCustom && (
            <button
              className="no-print"
              onClick={() => {
                const newState = { ...state };
                delete newState[item];
                setState(newState);
                
                // Also remove from local sections state
                const newSections = [...sections];
                newSections.forEach((s, idx) => {
                  if (s.items.includes(item)) {
                    newSections[idx] = { ...s, items: s.items.filter(i => i !== item) };
                  }
                });
                setStateSections(newSections);

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
    );

    return (
      <div className="assessment-checklist-card luxury-card" style={{ height: '100%', border: '1px solid #eee', borderRadius: 12, background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', padding: 24, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 className="luxury-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: 18, letterSpacing: 1, margin: 0, textTransform: 'uppercase' }}>
            <Icon size={20} />
            {title} {showHidden ? '(Hidden Items)' : ''}
          </h3>
          {(currentlyHiddenItems.length > 0 || showHidden) && (
            <button
              className="no-print"
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

        <div className="assessment-checklist-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 90px 90px 90px', gap: 16, alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: 8, marginBottom: 12, fontWeight: 600, color: '#888', fontSize: 13, textTransform: 'uppercase' }}>
          <div>Item</div>
          <div style={{ textAlign: 'center', color: '#e53935', fontSize: 11 }}>Rejected</div>
          <div style={{ textAlign: 'center', color: '#ffb300', fontSize: 11 }}>Review</div>
          <div style={{ textAlign: 'center', color: '#43a047', fontSize: 11 }}>Approved</div>
        </div>

        <div style={{ flex: 1 }}>
          {showHidden ? (
            currentlyHiddenItems.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: '#bbb', fontStyle: 'italic', fontSize: 14 }}>No hidden items.</div>
            ) : (
              currentlyHiddenItems.map(item => renderRow(item, !allDefaultItems.includes(item)))
            )
          ) : (
            <>
              {sections.map((section, sIdx) => {
                const visibleSectionItems = section.items.filter(item => !hiddenItems.includes(item));
                if (visibleSectionItems.length === 0) return null;
                return (
                  <div key={section.name} style={{ marginBottom: 20 }}>
                    <div className="checklist-section-title" style={{ fontSize: 12, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, padding: '4px 0', borderBottom: '1px solid #f0f0f0' }}>
                      {section.name}
                    </div>
                    {visibleSectionItems.map((item, iIdx) => renderRow(item, false, sIdx, iIdx))}
                  </div>
                );
              })}
              {customItems.filter(item => !hiddenItems.includes(item)).length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div className="checklist-section-title" style={{ fontSize: 12, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, padding: '4px 0', borderBottom: '1px solid #f0f0f0' }}>
                    Additional Items
                  </div>
                  {customItems.filter(item => !hiddenItems.includes(item)).map(item => renderRow(item, true))}
                </div>
              )}
            </>
          )}
        </div>

        {!showHidden && (
          <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 'auto', paddingTop: 16, borderTop: '1px dashed #eee' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ padding: '8px', borderRadius: 8, border: '1px solid #ddd', fontSize: 13, background: '#fff' }}
              >
                {sections.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
                <option value="Additional Items">Additional Items</option>
              </select>
              <input
                type="text"
                placeholder={`Add custom ${title.toLowerCase()} item...`}
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newItemText.trim() && !allItems.includes(newItemText.trim())) {
                    const item = newItemText.trim();
                    setState({ ...state, [item]: 'approve' });
                    
                    if (selectedCategory !== 'Additional Items') {
                      const newSections = [...sections];
                      const sIdx = newSections.findIndex(s => s.name === selectedCategory);
                      if (sIdx > -1) {
                        newSections[sIdx] = { ...newSections[sIdx], items: [...newSections[sIdx].items, item] };
                        setStateSections(newSections);
                      }
                    }
                    setNewItemText('');
                  }
                }}
                style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14 }}
              />
            </div>
            <button
              onClick={() => {
                if (newItemText.trim() && !allItems.includes(newItemText.trim())) {
                  const item = newItemText.trim();
                  setState({ ...state, [item]: 'approve' });
                  
                  if (selectedCategory !== 'Additional Items') {
                    const newSections = [...sections];
                    const sIdx = newSections.findIndex(s => s.name === selectedCategory);
                    if (sIdx > -1) {
                      newSections[sIdx] = { ...newSections[sIdx], items: [...newSections[sIdx].items, item] };
                      setStateSections(newSections);
                    }
                  }
                  setNewItemText('');
                }
              }}
              style={{ width: '100%', padding: '10px', background: '#f9f9f9', color: '#666', borderRadius: 8, border: '1px solid #eee', cursor: 'pointer', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.2s' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f0f0f0';
                e.currentTarget.style.borderColor = '#ddd';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f9f9f9';
                e.currentTarget.style.borderColor = '#eee';
              }}
            >
              <Plus size={16} /> Add to {selectedCategory}
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
    // Trigger printing dialog
    window.print();
  };

  // Start editing title
  const handleStartEditTitle = () => {
    if (sample) {
      setEditedName(sample.name);
      setEditedSampleCode(sample.sample_code);
      setIsEditingTitle(true);
    }
  };

  // Save edited title
  const handleSaveTitle = async () => {
    if (!sample || !id || editedName.trim() === '' || editedSampleCode.trim() === '') return;

    try {
      await samplesAPI.update(id, { name: editedName.trim(), sample_code: editedSampleCode.trim() });
      setSample({ ...sample, name: editedName.trim(), sample_code: editedSampleCode.trim() });
      setIsEditingTitle(false);
    } catch (error) {
      console.error('Error updating style details:', error);
      alert('Failed to update article details');
    }
  };

  const handleManufacturerChange = async (newManufacturer: string) => {
    if (!sample || !id) return;
    try {
      await samplesAPI.update(id, { supplier_name: newManufacturer });
      setSample({ ...sample, supplier_name: newManufacturer });
      setShowManufacturerDropdown(false);
    } catch (error) {
      console.error('Error updating manufacturer:', error);
      alert('Failed to update manufacturer');
    }
  };

  // Cancel editing title
  const handleCancelEditTitle = () => {
    setIsEditingTitle(false);
    setEditedName('');
    setEditedSampleCode('');
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
    return <div className="loading luxury-font">Loading article...</div>;
  }
  if (!sample) {
    return <div className="empty-state luxury-font">Article not found.</div>;
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


      {/* Brede header */}
      <div className="no-print" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 32,
        margin: '16px 0 0 0',
        padding: '20px 16px',
      }}>
        {/* Editable sample code and name */}
        <div style={{ flex: 1 }}>
          {isEditingTitle ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1 }}>Article Number</label>
                  <input
                    type="text"
                    value={editedSampleCode}
                    onChange={(e) => setEditedSampleCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle();
                      if (e.key === 'Escape') handleCancelEditTitle();
                    }}
                    style={{
                      fontWeight: 700,
                      fontSize: 16,
                      letterSpacing: 1,
                      color: '#111',
                      border: 'none',
                      borderBottom: '1px solid #111',
                      background: 'transparent',
                      outline: 'none',
                      padding: '4px 0',
                      width: 180,
                      textTransform: 'uppercase'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1 }}>Article Description</label>
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveTitle();
                      if (e.key === 'Escape') handleCancelEditTitle();
                    }}
                    autoFocus
                    style={{
                      fontWeight: 300,
                      fontSize: 32,
                      letterSpacing: '-0.2px',
                      color: '#111',
                      border: 'none',
                      borderBottom: '1px solid #111',
                      background: 'transparent',
                      outline: 'none',
                      padding: '4px 0',
                      width: '100%',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-end', paddingBottom: 8 }}>
                  <button
                    onClick={handleSaveTitle}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      border: 'none',
                      background: '#111',
                      cursor: 'pointer',
                      color: '#fff',
                    }}
                    title="Save"
                  >
                    <Check size={18} />
                  </button>
                  <button
                    onClick={handleCancelEditTitle}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      border: '1px solid #ddd',
                      background: '#fff',
                      cursor: 'pointer',
                      color: '#666',
                    }}
                    title="Cancel"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 4, 
                padding: '4px 8px',
                marginLeft: -8,
                borderRadius: 8,
              }}
            >
              <div
                onClick={() => {
                  if (sample.collection_type && sample.year && sample.season) {
                    const categorySlug = sample.collection_type.toLowerCase().replace(/ /g, '-');
                    const seasonSlug = sample.season.toLowerCase();
                    navigate(`/quality-control/${categorySlug}/${sample.year}/${seasonSlug}`);
                  } else {
                    navigate('/quality-control');
                  }
                }}
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '2px',
                  color: '#999',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  marginBottom: 48,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#111'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#999'}
              >
                ← Back
              </div>
              <div
                onClick={handleStartEditTitle}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  cursor: 'pointer',
                  borderRadius: 4,
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f9f9f9'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                title="Click to edit article details"
              >
                <span style={{ 
                  fontSize: '13px', 
                  fontWeight: 700, 
                  letterSpacing: '2.5px', 
                  color: '#999', 
                  textTransform: 'uppercase' 
                }}>
                  {sample.sample_code}
                </span>
                <h1 style={{ 
                  fontSize: '48px', 
                  fontWeight: 300, 
                  margin: 0, 
                  color: '#111', 
                  letterSpacing: '-0.5px',
                  lineHeight: 1.1
                }}>
                  {sample.name}
                </h1>
              </div>
            </div>
          )}
        </div>

        {/* Clickable status dropdown */}
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            style={{ cursor: 'pointer' }}
            title="Click to change status"
          >
            {sample.status !== 'Approved' && getStatusBadge(sample.status)}
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

        <div className="print-page-box" style={{ display: 'block' }}>
          
          {/* Print Only Header Display */}
          <div className="print-only print-title-header" style={{ display: 'none', textAlign: 'center', marginBottom: '40px', width: '100%' }}>
            <h1 className="page-title" style={{ margin: 0, fontSize: '48px', fontWeight: 300, color: '#111', letterSpacing: '-0.5px' }}>Article Details</h1>
            <h1 style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 4px 0', color: '#111' }}>
              {sample.sample_code}
            </h1>
            <div style={{ fontSize: '22px', fontWeight: 600, letterSpacing: '0.5px', color: '#333', textTransform: 'uppercase', marginBottom: '8px' }}>
              {sample.name}
            </div>
          </div>

          <div className="print-top-section" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'stretch' }}>
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
            <div className="no-print" style={{ padding: 12, width: '100%', borderTop: '1px solid #f0f0f0', background: '#fafbfc', display: 'flex', alignItems: 'center', gap: 10 }}>
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
          <div className="luxury-card print-style-info-box" style={{ border: '1px solid #eee', borderRadius: 12, background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', padding: 24, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h3 className="luxury-card-title" style={{ fontWeight: 600, fontSize: 18, letterSpacing: 1, margin: 0 }}>Style Information</h3>
              <button
                className="no-print"
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}><Tag size={14} /> Category</div>
                <div style={{ fontWeight: 500, color: '#111', fontSize: 18 }}>{sample.product_type}</div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}><Calendar size={14} /> Season</div>
                <div style={{ fontWeight: 500, color: '#111', fontSize: 18 }}>{sample.season} {sample.year}</div>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}><Factory size={14} /> Manufacturer</div>
                <div 
                  onClick={() => setShowManufacturerDropdown(!showManufacturerDropdown)}
                  style={{ 
                    fontWeight: 500, 
                    color: '#111', 
                    fontSize: 18, 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  title="Click to change manufacturer"
                >
                  {sample.supplier_name || '—'}
                  <ChevronRight size={14} style={{ transform: showManufacturerDropdown ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', opacity: 0.5 }} />
                </div>
                {showManufacturerDropdown && (
                  <>
                    <div 
                      onClick={() => setShowManufacturerDropdown(false)}
                      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99 }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      marginTop: 8,
                      background: '#fff',
                      borderRadius: 8,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                      overflow: 'hidden',
                      zIndex: 100,
                      minWidth: 160,
                    }}>
                      {manufacturersList.map((m) => (
                        <div
                          key={m}
                          onClick={() => handleManufacturerChange(m)}
                          style={{
                            padding: '12px 16px',
                            cursor: 'pointer',
                            background: sample.supplier_name === m ? '#f5f5f5' : '#fff',
                            borderLeft: sample.supplier_name === m ? '3px solid #111' : '3px solid transparent',
                            transition: 'background 0.2s',
                            fontSize: 14,
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                          onMouseLeave={(e) => e.currentTarget.style.background = sample.supplier_name === m ? '#f5f5f5' : '#fff'}
                        >
                          {m}
                        </div>
                      ))}
                    </div>
                  </>
                )}
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
        </div>

        {/* Quality Control Assessment Wrapper */}
        <div className="assessment-wrapper" style={{
          background: '#faf8f5',
          border: '1px solid #f0ebe1',
          borderRadius: 16,
          padding: 32,
          marginTop: 16,
          position: 'relative',
        }}>
          {/* Section Header */}
          <div className="assessment-header" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, borderBottom: '2px solid #e9ecef', paddingBottom: 16 }}>
            <div className="assessment-icon" style={{ background: '#111', color: '#fff', padding: 10, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ClipboardCheck size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: 0.5, color: '#111' }}>Quality Control Assessment</h2>
              <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: 14 }}>Please review and provide your input for this style.</p>
            </div>
          </div>

          {/* Checklijst secties */}
          <div className="assessment-checklists-container" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 24, marginBottom: 12 }}>
            <div className="print-page-box print-fit-box">
              {renderChecklist('Fit', fitSections, setFitSections, fitChecks, setFitChecks, Ruler, newFitItem, setNewFitItem, hiddenFitItems, setHiddenFitItems, showHiddenFit, setShowHiddenFit, selectedFitCategory, setSelectedFitCategory)}
            </div>
            <div className="print-page-box print-work-box">
              <div className="print-only print-flex-row" style={{ display: 'none', alignItems: 'center', gap: 12, marginBottom: 24, borderBottom: '2px solid #e9ecef', paddingBottom: 16 }}>
                <div style={{ background: '#111', color: '#fff', padding: 10, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ClipboardCheck size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: 0.5, color: '#111' }}>Quality Control Assessment</h2>
                </div>
              </div>
              {renderChecklist('Workmanship', workSections, setWorkSections, workChecks, setWorkChecks, Scissors, newWorkItem, setNewWorkItem, hiddenWorkItems, setHiddenWorkItems, showHiddenWork, setShowHiddenWork, selectedWorkCategory, setSelectedWorkCategory)}
            </div>
          </div>

          {/* Kleine Save Assessment knop rechts onder de checklist */}
          <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
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
                  setTimeout(() => setHasSavedChecks(false), 3000);
                } catch (err) {
                  setSavingChecks(false);
                  alert('Oeps, kon checks niet opslaan.');
                }
              }}
              disabled={savingChecks}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                borderRadius: 8,
                background: hasSavedChecks ? '#4CAF50' : '#111',
                color: '#fff',
                border: 'none',
                cursor: savingChecks ? 'not-allowed' : 'pointer',
                fontSize: 13,
                fontWeight: 600,
                transition: 'all 0.2s',
                opacity: savingChecks ? 0.7 : 1,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
              onMouseEnter={(e) => {
                if (!savingChecks && !hasSavedChecks) {
                  e.currentTarget.style.background = '#333';
                }
              }}
              onMouseLeave={(e) => {
                if (!savingChecks && !hasSavedChecks) {
                  e.currentTarget.style.background = '#111';
                }
              }}
            >
              {hasSavedChecks ? <Check size={14} /> : savingChecks ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
              {savingChecks ? 'Saving...' : hasSavedChecks ? 'Assessment Saved' : 'Save Assessment'}
            </button>
          </div>

          {/* Internal Notes in een full-width block eronder */}
          <div className="luxury-card print-page-box print-notes-box" style={{ border: '1px solid #eee', borderRadius: 12, background: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', padding: 24, display: 'flex', flexDirection: 'column', marginBottom: 32 }}>
            <h3 className="luxury-card-title" style={{ fontWeight: 600, fontSize: 18, letterSpacing: 1, marginBottom: 16 }}>Internal Notes & Final Remarks</h3>
            <InternalNotesSection sample={sample} />

            {/* Print Only Thank You Closing */}
            <div className="print-only thank-you-block" style={{ display: 'none', marginTop: 'auto', paddingTop: 40, borderTop: '2px dotted #ccc', textAlign: 'center', color: '#111' }}>
              <h2 style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', letterSpacing: 1, fontSize: 32, marginBottom: 16 }}>Thank You</h2>
              <p style={{ fontSize: 16, maxWidth: 600, margin: '0 auto', lineHeight: 1.6, color: '#555' }}>We kindly ask you to review these quality control notes and apply the necessary adjustments for the next sample round. Best regards,</p>
              <h4 style={{ marginTop: 24, fontSize: 14, textTransform: 'uppercase', letterSpacing: 2 }}>Viktor & Rolf</h4>
            </div>
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
