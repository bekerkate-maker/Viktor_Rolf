import { useState, useEffect } from 'react';
import InternalNotesSection from '../components/InternalNotesSection';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { samplesAPI, photosAPI, manufacturersAPI } from '../api';
import type { Sample, SamplePhoto } from '../types';
import { getStatusBadge } from '../components/SampleHeader';
import EditSampleModal from '../components/EditSampleModal';
// Voeg Lucide icons toe voor buttons
import { Plus, X, ChevronLeft, ChevronRight, Trash2, Pencil, Check, Minus, Download, Scissors, Ruler, ClipboardCheck, Save, EyeOff, Eye, Activity, RefreshCw, Tag, Calendar, Factory, User, AlignLeft } from 'lucide-react';

const STATUS_OPTIONS = ['In Review', 'Changes Needed', 'Approved', 'Rejected'] as const;

function SampleDetail() {
  const params = useParams<{ id: string; collectionId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const fromManufacturer = queryParams.get('fromManufacturer');
  const fromCollection = queryParams.get('fromCollection');
  const fromCategory = queryParams.get('fromCategory');
  const fromYear = queryParams.get('fromYear');
  const fromSeason = queryParams.get('fromSeason');
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
  const [manufacturersList, setManufacturersList] = useState<string[]>([]);

  useEffect(() => {
    manufacturersAPI.getAll().then(res => {
      setManufacturersList(res.data.map(m => m.name));
    }).catch(console.error);
  }, []);
  const [savingChecks, setSavingChecks] = useState(false);
  const [hasSavedChecks, setHasSavedChecks] = useState(false);
  const [editModePrompt, setEditModePrompt] = useState(false);
  const [editingField, setEditingField] = useState<'name' | 'code' | null>(null);

  const [fitChecks, setFitChecks] = useState<Record<string, 'reject' | 'doubt' | 'approve'>>({});
  const [workChecks, setWorkChecks] = useState<Record<string, 'reject' | 'doubt' | 'approve'>>({});
  const [fitComments, setFitComments] = useState<Record<string, string>>({});
  const [workComments, setWorkComments] = useState<Record<string, string>>({});
  const [activeCommentItem, setActiveCommentItem] = useState<{ type: 'fit' | 'work', item: string } | null>(null);

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

  const renderChecklist = (title: string, sections: { name: string, items: string[] }[], setStateSections: any, state: any, setState: any, comments: Record<string, string>, setComments: any, Icon: any, newItemText: string, setNewItemText: any, hiddenItems: string[], setHiddenItems: any, showHidden: boolean, setShowHidden: any, selectedCategory: string, setSelectedCategory: any) => {
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
          gridTemplateColumns: 'minmax(0, 1fr) 70px 70px 70px 40px', 
          gap: 8, 
          alignItems: 'center', 
          padding: '12px 0', 
          borderBottom: '1px solid #f5f5f5',
          cursor: !showHidden ? 'grab' : 'default',
          background: draggedItemInfo?.itemIndex === itemIndex && draggedItemInfo?.sectionIndex === sectionIndex && draggedItemInfo?.type === type ? '#f0f0f0' : 'transparent',
          transition: 'background 0.2s',
          overflow: 'hidden'
        }}
      >
        <div style={{ minWidth: 0, fontWeight: 500, fontSize: 15, display: 'flex', flexDirection: 'column', color: showHidden ? '#888' : '#111' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {!showHidden && (
              <button
                className="no-print"
                onClick={() => setActiveCommentItem(activeCommentItem?.item === item && activeCommentItem?.type === type ? null : { type, item })}
                style={{ marginRight: 8, background: 'none', border: 'none', color: comments[item] ? '#111' : '#ccc', cursor: 'pointer', padding: 2, display: 'flex', transition: 'color 0.2s' }}
                title="Add comment"
              >
                <AlignLeft size={14} />
              </button>
            )}
            
            <span style={{ textDecoration: showHidden ? 'line-through' : 'none', opacity: showHidden ? 0.6 : 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item}</span>
            <span className="print-only print-status-marker" style={{ display: 'none' }}>
              {state[item] === 'approve' && <span className="status-approve">Approved</span>}
              {state[item] === 'doubt' && <span className="status-doubt">Review</span>}
              {state[item] === 'reject' && <span className="status-reject">Rejected</span>}
              {!state[item] && <span>No result</span>}
            </span>
            

            {isCustom && (
              <button
                className="no-print"
                onClick={() => {
                  const newState = { ...state };
                  delete newState[item];
                  setState(newState);
                  
                  const newComments = { ...comments };
                  delete newComments[item];
                  setComments(newComments);
                  
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
          
          {(comments[item] || (activeCommentItem?.item === item && activeCommentItem?.type === type)) && (
            <div style={{ marginTop: 4, width: '100%' }}>
              {activeCommentItem?.item === item && activeCommentItem?.type === type ? (
                <input
                  type="text"
                  placeholder="Add a note..."
                  value={comments[item] || ''}
                  autoFocus
                  onChange={(e) => setComments({ ...comments, [item]: e.target.value })}
                  onBlur={() => !comments[item] && setActiveCommentItem(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setActiveCommentItem(null);
                  }}
                  style={{
                    width: '90%',
                    fontSize: 12,
                    padding: '4px 8px',
                    borderRadius: 4,
                    border: '1px solid #ddd',
                    outline: 'none',
                    background: '#fff'
                  }}
                />
              ) : (
                <div className="print-item-comment" style={{ fontSize: 11, color: '#666', fontStyle: 'italic', paddingLeft: 22 }}>
                  {comments[item]}
                </div>
              )}
            </div>
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

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {showHidden ? (
            <button
              className="no-print"
              onClick={() => setHiddenItems(hiddenItems.filter((i: string) => i !== item))}
              style={{ background: 'none', border: 'none', color: '#111', cursor: 'pointer', padding: 2, display: 'flex', opacity: 0.8 }}
              title="Restore item"
            >
              <Eye size={14} />
            </button>
          ) : (
            <button
              className="no-print"
              onClick={() => setHiddenItems([...hiddenItems, item])}
              style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer', padding: 2, display: 'flex', opacity: 0.5, transition: 'opacity 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0.5'}
              title="Hide item"
            >
              <EyeOff size={14} />
            </button>
          )}
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

        <div className="assessment-checklist-row" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 70px 70px 70px 40px', gap: 8, alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: 8, marginBottom: 12, fontWeight: 600, color: '#888', fontSize: 11, textTransform: 'uppercase' }}>
          <div>Item</div>
          <div style={{ textAlign: 'center', color: '#e53935' }}>Rejected</div>
          <div style={{ textAlign: 'center', color: '#ffb300' }}>Review</div>
          <div style={{ textAlign: 'center', color: '#43a047' }}>Approved</div>
          <div />
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
          setFitComments(parsed.fitComments || {});
          setWorkComments(parsed.workComments || {});
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

  const handleSetMainPhoto = async (photoId: number) => {
    try {
      await photosAPI.setMainPhoto(photoId);
      if (id) await loadPhotos(id);
    } catch (error: any) {
      console.error('Error setting main photo:', error);
      alert('Failed to set main photo');
    }
  };

  const handleDownloadPDF = () => {
    // Trigger printing dialog
    window.print();
  };

  // Start editing title
  const handleStartEditTitle = (field: 'name' | 'code') => {
    if (sample) {
      setEditedName(sample.name);
      setEditedSampleCode(sample.sample_code);
      setEditingField(field);
      setIsEditingTitle(true);
      setEditModePrompt(false);
    }
  };

  // Save edited title
  const handleSaveTitle = async () => {
    if (!sample || !id || editedName.trim() === '' || editedSampleCode.trim() === '') return;

    try {
      const formattedCode = editedSampleCode.trim().toUpperCase();
      await samplesAPI.update(id, { name: editedName.trim(), sample_code: formattedCode });
      setSample({ ...sample, name: editedName.trim(), sample_code: formattedCode });
      setIsEditingTitle(false);
      setEditingField(null);
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
    setEditingField(null);
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
    <>
      <style>{`
        .print-only-container { display: none; }
        @media print {
          body { background: white !important; font-family: 'Inter', sans-serif !important; }
          @page {
            size: A4;
            margin: 0;
          }
          body { 
            background: white !important; 
            font-family: 'Inter', sans-serif !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Hide UI components but NOT the wrappers containing the print content */
          .no-print, nav, .top-nav, .page-header, .search-section, .category-selection, .year-selection, .season-selection, .samples-view, .modal-overlay, #status-filter { 
            display: none !important; 
          }
          /* Reset wrappers to 0 margin/padding to prevent blank space */
          .app-container, .main-layout, .main-content {
            margin: 0 !important;
            padding: 0 !important;
            min-height: 0 !important;
            background: none !important;
          }
          .print-only-container { display: block !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
          
          .print-page { 
            page-break-after: always; 
            padding: 15mm; 
            height: 297mm; 
            width: 210mm;
            display: flex;
            flex-direction: column;
            color: #111;
            box-sizing: border-box;
            overflow: hidden; /* Strict one-page */
          }

          .print-top-row {
            display: flex;
            gap: 15px;
            height: 240px; /* Adjusted to fix overlap */
            margin-bottom: 20px;
          }

          .print-photo-container {
            width: 180px; /* Bigger */
            height: 240px; /* Taller */
            border: 1px solid #111;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            background: #fff;
          }

          .print-info-container {
            flex: 1;
            border: 1px solid #111;
            padding: 15px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            font-size: 13px;
          }

          .print-middle-row {
            display: flex;
            gap: 15px;
            flex: 1;
            margin-bottom: 20px;
            min-height: 0;
          }

          .print-column {
            flex: 1;
            border: 1px solid #111;
            padding: 15px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
          }

          .print-column-title {
            font-weight: 900;
            text-transform: uppercase;
            font-size: 14px;
            border-bottom: 2px solid #111;
            padding-bottom: 8px;
            margin-bottom: 15px;
            text-align: center;
          }

          .print-assessment-list {
            font-size: 11px;
            flex: 1;
            overflow: hidden;
          }

          .print-notes-container {
            height: 120px; 
            border: 1px solid #111;
            padding: 15px;
            margin-bottom: 15px;
          }

          .print-footer-container {
            height: 90px;
            border: 1px solid #111;
            padding: 15px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            text-align: center;
          }
        }
      `}</style>
      <div className="no-print">
        <div className="sample-detail-modern sample-detail-fullwidth luxury-font" style={{
          width: '100%',
          margin: 0,
          padding: 0,
          minHeight: '100vh',
          boxSizing: 'border-box',
          position: 'relative'
        }}>
          {/* Back Button - top left, under navbar */}


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
          <div
            onClick={() => {
              if (fromManufacturer && fromCollection) {
                navigate(`/quality-control/manufacturer/${fromManufacturer}/collection/${fromCollection}`);
              } else if (fromCategory && fromYear && fromSeason) {
                const categorySlug = fromCategory.toLowerCase().replace(/ /g, '-');
                const seasonSlug = fromSeason.toLowerCase() === 'spring/summer' ? 'ss' : 'fw';
                navigate(`/quality-control/${categorySlug}/${fromYear}/${seasonSlug}`);
              } else if (sample.collection_type && sample.year && sample.season) {
                // Fallback for direct links
                let categorySlug = sample.collection_type.toLowerCase();
                if (categorySlug === 'rtw' || categorySlug.includes('ready to wear')) {
                  categorySlug = 'ready-to-wear';
                } else if (categorySlug.includes('eyewear')) {
                  categorySlug = 'eyewear-collection';
                } else {
                  categorySlug = categorySlug.replace(/ /g, '-');
                }
                
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
              transition: 'color 0.2s',
              width: 'fit-content'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#111'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#999'}
          >
            ← Back
          </div>

          {isEditingTitle ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  autoFocus={editingField === 'name'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') handleCancelEditTitle();
                  }}
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    letterSpacing: '2.5px',
                    color: '#999',
                    textTransform: 'uppercase',
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    padding: 0,
                    width: '100%',
                    fontFamily: 'inherit'
                  }}
                />
                
                  <input
                    type="text"
                    value={editedSampleCode}
                    onChange={(e) => setEditedSampleCode(e.target.value.toUpperCase())}
                    autoFocus={editingField === 'code'}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle();
                    if (e.key === 'Escape') handleCancelEditTitle();
                  }}
                  style={{
                    fontSize: '48px',
                    fontWeight: 300,
                    margin: 0,
                    color: '#111',
                    letterSpacing: '-0.5px',
                    lineHeight: 1.1,
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    padding: 0,
                    width: '100%',
                    textTransform: 'uppercase',
                    fontFamily: 'inherit'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button
                  onClick={handleSaveTitle}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 20,
                    background: '#111',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  <Save size={14} /> Save Changes
                </button>
                <button
                  onClick={handleCancelEditTitle}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 20,
                    background: '#f5f5f5',
                    color: '#666',
                    border: '1px solid #ddd',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setEditModePrompt(true)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                cursor: 'pointer',
                borderRadius: 8,
                transition: 'all 0.2s',
                position: 'relative',
                width: 'fit-content',
                marginLeft: -8,
                padding: '4px 8px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
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
                {sample.name}
              </span>
              <h1 style={{ 
                fontSize: '48px', 
                fontWeight: 300, 
                margin: 0, 
                color: '#111', 
                letterSpacing: '-0.5px',
                lineHeight: 1.1
              }}>
                {sample.sample_code}
              </h1>

              {/* Selection Prompt */}
              {editModePrompt && (
                <>
                  <div 
                    onClick={(e) => { e.stopPropagation(); setEditModePrompt(false); }}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}
                  />
                  <div 
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      marginTop: 12,
                      background: '#fff',
                      border: '1px solid #eee',
                      borderRadius: 12,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                      padding: 20,
                      zIndex: 1001,
                      width: 300,
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <button 
                        onClick={() => handleStartEditTitle('name')}
                        style={{
                          padding: '12px 16px',
                          background: '#f9f9f9',
                          border: '1px solid #eee',
                          borderRadius: 8,
                          textAlign: 'left',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#f9f9f9'}
                      >
                        Article Description <Pencil size={14} opacity={0.5} />
                      </button>
                      <button 
                        onClick={() => handleStartEditTitle('code')}
                        style={{
                          padding: '12px 16px',
                          background: '#f9f9f9',
                          border: '1px solid #eee',
                          borderRadius: 8,
                          textAlign: 'left',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f0f0f0'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#f9f9f9'}
                      >
                        Article Number <Tag size={14} opacity={0.5} />
                      </button>
                      <button 
                        onClick={() => setEditModePrompt(false)}
                        style={{
                          padding: '8px 16px',
                          background: 'transparent',
                          border: 'none',
                          color: '#999',
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: 'pointer',
                          marginTop: 4
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </>
              )}
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

          {/* Print Only Header Display */}
          <div className="print-only style-header-content" style={{ display: 'none', marginBottom: '24px', width: '100%' }}>
            <h1 style={{ fontSize: '36px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', margin: '0 0 4px 0', color: '#111' }}>
              {sample.sample_code}
            </h1>
            <div style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '0.5px', color: '#555', textTransform: 'uppercase' }}>
              {sample.name} - Quality Control Report
            </div>
          </div>

          <div className="print-only print-info-summary" style={{ display: 'none' }}>
            <div className="print-info-item">
              <div className="print-info-label">Article Code</div>
              <div className="print-info-value">{sample.sample_code}</div>
            </div>
            <div className="print-info-item">
              <div className="print-info-label">Category</div>
              <div className="print-info-value">{sample.product_type}</div>
            </div>
            <div className="print-info-item">
              <div className="print-info-label">Manufacturer</div>
              <div className="print-info-value">{sample.supplier_name || '—'}</div>
            </div>
            <div className="print-info-item">
              <div className="print-info-label">Season & Year</div>
              <div className="print-info-value">{sample.season} {sample.year}</div>
            </div>
            <div className="print-info-item">
              <div className="print-info-label">Status</div>
              <div className="print-info-value">{sample.status}</div>
            </div>
            <div className="print-info-item">
              <div className="print-info-label">Responsible</div>
              <div className="print-info-value">{sample.responsible_user_name || '—'}</div>
            </div>
          </div>

          <div className="print-top-section" style={{ display: 'grid', gridTemplateColumns: photos.length > 0 ? '1fr 1fr' : '1fr', gap: 24, alignItems: 'stretch' }}>
          {/* Linker kolom: Photos */}
          <div className="luxury-card no-print" style={{ border: '1px solid #eee', borderRadius: 12, background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}><Tag size={14} /> Article Code</div>
                <div style={{ fontWeight: 600, color: '#111', fontSize: 18, fontFamily: 'monospace' }}>{sample.sample_code}</div>
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
          <div className="assessment-checklists-container responsive-grid" style={{ marginBottom: 12 }}>
            <div className="print-page-box print-fit-box" style={{ minWidth: 0 }}>
              {renderChecklist('Fit', fitSections, setFitSections, fitChecks, setFitChecks, fitComments, setFitComments, Ruler, newFitItem, setNewFitItem, hiddenFitItems, setHiddenFitItems, showHiddenFit, setShowHiddenFit, selectedFitCategory, setSelectedFitCategory)}
            </div>
            <div className="print-page-box print-work-box" style={{ minWidth: 0 }}>
              <div className="print-only print-flex-row" style={{ display: 'none', alignItems: 'center', gap: 12, marginBottom: 24, borderBottom: '2px solid #e9ecef', paddingBottom: 16 }}>
                <div style={{ background: '#111', color: '#fff', padding: 10, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ClipboardCheck size={24} />
                </div>
                <div>
                  <h2 style={{ fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: 0.5, color: '#111' }}>Quality Control Assessment</h2>
                </div>
              </div>
              {renderChecklist('Workmanship', workSections, setWorkSections, workChecks, setWorkChecks, workComments, setWorkComments, Scissors, newWorkItem, setNewWorkItem, hiddenWorkItems, setHiddenWorkItems, showHiddenWork, setShowHiddenWork, selectedWorkCategory, setSelectedWorkCategory)}
            </div>
          </div>

          {/* Kleine Save Assessment knop rechts onder de checklist */}
          <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 24 }}>
            <button
              onClick={async () => {
                setSavingChecks(true);
                try {
                  let parsed = { _isJsonBlob: true, notes: '', fitChecks: {}, workChecks: {}, fitComments: {}, workComments: {}, hiddenFitItems: [], hiddenWorkItems: [] };
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
                  parsed.fitComments = fitComments;
                  parsed.workComments = workComments;
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
          <div className="luxury-card no-print" style={{ border: '1px solid #eee', borderRadius: 12, background: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', padding: 24, display: 'flex', flexDirection: 'column', marginBottom: 32 }}>
            <h3 className="luxury-card-title" style={{ fontWeight: 600, fontSize: 18, letterSpacing: 1, marginBottom: 16 }}>Internal Notes & Final Remarks</h3>
            <InternalNotesSection sample={sample} />
          </div>

        </div>

        {/* Download QC PDF Button */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'center', marginTop: 16, paddingBottom: 60 }}>
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

          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            {/* Set Main Photo button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSetMainPhoto(photos[lightboxIndex].id);
              }}
              disabled={photos[lightboxIndex].is_main_photo}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 16px',
                background: photos[lightboxIndex].is_main_photo ? '#fff' : 'rgba(255, 255, 255, 0.2)',
                border: 'none',
                borderRadius: 6,
                color: photos[lightboxIndex].is_main_photo ? '#111' : '#fff',
                cursor: photos[lightboxIndex].is_main_photo ? 'default' : 'pointer',
                fontSize: 14,
                fontWeight: photos[lightboxIndex].is_main_photo ? 700 : 500,
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!photos[lightboxIndex].is_main_photo) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                if (!photos[lightboxIndex].is_main_photo) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              <Check size={16} />
              {photos[lightboxIndex].is_main_photo ? 'Main Photo' : 'Set as Main Photo'}
            </button>

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
          </div>

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
              <div key={photo.id} style={{ position: 'relative' }}>
                <img
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
                {photo.is_main_photo && (
                  <div style={{ position: 'absolute', top: -4, right: -4, background: '#111', color: '#fff', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={10} />
                  </div>
                )}
              </div>
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
      </div>

      {/* Unified Print Layout Container (Hidden in browser) */}
      <div className="print-only-container">
        <div key={sample.id} className="print-page">
          {/* TOP ROW */}
          <div className="print-top-row">
            <div className="print-photo-container">
              {photos.length > 0 ? (
                <img src={photos.find(p => p.is_main_photo)?.file_path || photos[0].file_path} alt="Article" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '10px', color: '#ccc' }}>FOTO</span>
              )}
            </div>
            <div className="print-info-container">
              <div className="print-info-item">
                <span className="print-info-label">Article Identification: </span>
                <span style={{ fontWeight: 800, fontSize: '16px' }}>{sample.sample_code}</span>
              </div>
              <div className="print-info-item">
                <span className="print-info-label">Article Name: </span>
                <span>{sample.name}</span>
              </div>
              <div className="print-info-item">
                <span className="print-info-label">Category: </span>
                <span>{sample.product_type}</span>
              </div>
              <div className="print-info-item">
                <span className="print-info-label">Season: </span>
                <span>{sample.season} {sample.year}</span>
              </div>
              <div className="print-info-item">
                <span className="print-info-label">Manufacturer: </span>
                <span style={{ fontWeight: 600 }}>{sample.supplier_name || 'N/A'}</span>
              </div>
              <div className="print-info-item">
                <span className="print-info-label">Style Note: </span>
                <span>{sample.tags || '—'}</span>
              </div>
            </div>
          </div>

          {/* MIDDLE ROW */}
          <div className="print-middle-row">
            {/* Fit Results */}
            <div className="print-column">
              <div className="print-column-title">Fit Assessment</div>
              <div className="print-assessment-list">
                {Object.keys(fitChecks).map(key => {
                  const value = fitChecks[key];
                  if (value === 'approve' || !value) return null;
                  const label = value === 'reject' ? 'Rejected' : value === 'doubt' ? 'Review' : String(value);
                  return (
                    <div key={key} className="print-assessment-item" style={{ marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px dashed #eee' }}>
                      <span className="print-assessment-status" style={{ color: value === 'reject' ? '#d32f2f' : '#f57c00', float: 'right', fontWeight: 'bold' }}>
                        {label}
                      </span>
                      <span className="print-assessment-name" style={{ fontWeight: '500' }}>{key}</span>
                      {fitComments[key] && (
                        <span className="print-assessment-comment" style={{ display: 'block', fontStyle: 'italic', fontSize: '10px', marginTop: '2px' }}>{fitComments[key]}</span>
                      )}
                    </div>
                  );
                })}
                {Object.keys(fitChecks).filter(k => fitChecks[k] && fitChecks[k] !== 'approve').length === 0 && (
                  <p style={{ textAlign: 'center', opacity: 0.5, marginTop: 20 }}>No issues reported.</p>
                )}
              </div>
            </div>

            {/* Manufacturer Results */}
            <div className="print-column">
              <div className="print-column-title">Workmanship Assessment</div>
              <div className="print-assessment-list">
                {Object.entries(workChecks).map(([key, value]) => {
                  if (value === 'approve' || !value) return null;
                  const label = value === 'reject' ? 'Rejected' : value === 'doubt' ? 'Review' : String(value);
                  return (
                    <div key={key} className="print-assessment-item" style={{ marginBottom: '8px', paddingBottom: '4px', borderBottom: '1px dashed #eee' }}>
                      <span className="print-assessment-status" style={{ color: value === 'reject' ? '#d32f2f' : '#f57c00', float: 'right', fontWeight: 'bold' }}>
                        {label}
                      </span>
                      <span className="print-assessment-name" style={{ fontWeight: '500' }}>{key}</span>
                      {workComments[key] && (
                        <span className="print-assessment-comment" style={{ display: 'block', fontStyle: 'italic', fontSize: '10px', marginTop: '2px' }}>{workComments[key]}</span>
                      )}
                    </div>
                  );
                })}
                {Object.keys(workChecks).filter(k => workChecks[k] && workChecks[k] !== 'approve').length === 0 && (
                  <p style={{ textAlign: 'center', opacity: 0.5, marginTop: 20 }}>No issues reported.</p>
                )}
              </div>
            </div>
          </div>

          {/* BOTTOM ROW - Internal Notes */}
          <div className="print-notes-container">
            <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '12px', marginBottom: '8px', borderBottom: '1px solid #ddd', paddingBottom: '4px' }}>
              Internal Notes & Final Remarks
            </div>
            <div style={{ fontSize: '11px', lineHeight: '1.4' }}>
              {(sample.internal_notes && sample.internal_notes.includes('_isJsonBlob')) 
                ? JSON.parse(sample.internal_notes).notes 
                : sample.internal_notes || 'No final remarks.'}
            </div>
          </div>

          {/* FOOTER - Thank You */}
          <div className="print-footer-container" style={{ borderTop: '1px solid #111', background: '#fafafa' }}>
            <div style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Thank You</div>
            <div style={{ fontSize: '10px', color: '#333', maxWidth: '500px', margin: '0 auto', lineHeight: '1.5' }}>
              We kindly ask you to review these quality control notes and apply the necessary adjustments for the next sample round. Best regards, Viktor & Rolf.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default SampleDetail;
