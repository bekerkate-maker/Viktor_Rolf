import { useState, useEffect } from 'react';
import InternalNotesSection from '../components/InternalNotesSection';
import { useParams, useNavigate } from 'react-router-dom';
import { samplesAPI, photosAPI } from '../api';
import type { Sample, SamplePhoto } from '../types';
import { getStatusBadge } from '../components/SampleHeader';
import EditSampleModal from '../components/EditSampleModal';
// Voeg Lucide icons toe voor buttons
import { Plus, X, ChevronLeft, ChevronRight, ArrowLeft, Trash2, Pencil, Check } from 'lucide-react';

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
      console.error('Error updating sample name:', error);
      alert('Failed to update sample name');
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
          <span style={{fontWeight: 700, fontSize: 32, letterSpacing: 1.2, color: '#111'}}>
            {sample.sample_code.split('-').pop()} —
          </span>
          {isEditingName ? (
            <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
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
        <div style={{position: 'relative'}}>
          <div 
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            style={{cursor: 'pointer'}}
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
      
      {/* Layout: foto boven, info + notes onder */}
      <div style={{display: 'flex', flexDirection: 'column', gap: 24}}>
        {/* Foto gallery widget - banner style, volle breedte, geen marge */}
        <div style={{background: '#fff', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column'}}>
          {/* Photo gallery - banner formaat, max 4 zichtbaar */}
          <div style={{width: '100%', height: 280, display: 'grid', gridTemplateColumns: photos.length === 1 ? '1fr' : photos.length === 2 ? '1fr 1fr' : photos.length === 3 ? '1fr 1fr 1fr' : '1fr 1fr 1fr 1fr', gap: 2, background: '#f5f5f5'}}>
            {photos.length > 0 ? (
              photos.slice(0, 4).map((photo, index) => {
                const isLastWithMore = index === 3 && photos.length > 4;
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
                        filter: isLastWithMore ? 'blur(4px)' : 'none',
                        transition: 'transform 0.2s',
                      }}
                    />
                    {isLastWithMore && (
                      <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        fontSize: 18,
                        fontWeight: 600,
                        letterSpacing: 0.5,
                      }}>
                        +{photos.length - 4} more · Click to view
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="luxury-empty-state" style={{textAlign: 'center', color: '#bbb', fontSize: 16, padding: '24px 48px', gridColumn: '1 / -1', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, height: '100%'}}>
                <Plus size={24} style={{opacity: 0.5}} />
                <div>No photos yet</div>
              </div>
            )}
          </div>
          <div style={{padding: 12, width: '100%', borderTop: '1px solid #f0f0f0', background: '#fafbfc', display: 'flex', alignItems: 'center', gap: 10}}>
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
              }}
            >
              {uploading ? 'Uploading...' : 'Add Photos'}
            </label>
          </div>
        </div>

        {/* Onderste rij: Sample Info + Internal Notes naast elkaar */}
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '0 16px 48px 16px', alignItems: 'stretch'}}>
          {/* Sample Information */}
          <div className="luxury-card" style={{border: '1px solid #eee', borderRadius: 12, background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', padding: 24, display: 'flex', flexDirection: 'column'}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24}}>
              <h3 className="luxury-card-title" style={{fontWeight: 600, fontSize: 18, letterSpacing: 1, margin: 0}}>Sample Information</h3>
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
            <div className="luxury-info-grid" style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 40px', flex: 1}}>
              <div>
                <div style={{fontSize: 12, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5}}>Status</div>
                <div style={{fontWeight: 500, color: '#111', fontSize: 16}}>{sample.status}</div>
              </div>
              <div>
                <div style={{fontSize: 12, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5}}>Sample Round</div>
                <div style={{fontWeight: 500, color: '#111', fontSize: 16}}>{sample.sample_round}</div>
              </div>
              <div>
                <div style={{fontSize: 12, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5}}>Type</div>
                <div style={{fontWeight: 500, color: '#111', fontSize: 16}}>{sample.product_type}</div>
              </div>
              <div>
                <div style={{fontSize: 12, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5}}>Responsible</div>
                <div style={{fontWeight: 500, color: '#111', fontSize: 16}}>{sample.responsible_user_name || '—'}</div>
              </div>
              <div>
                <div style={{fontSize: 12, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5}}>QC Reviews</div>
                <div style={{fontWeight: 500, color: '#111', fontSize: 16}}>{sample.quality_review_count || 0}</div>
              </div>
              <div>
                <div style={{fontSize: 12, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5}}>Last Updated</div>
                <div style={{fontWeight: 500, color: '#111', fontSize: 16}}>{new Date(sample.updated_at).toLocaleDateString()}</div>
              </div>
              <div>
                <div style={{fontSize: 12, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5}}>Internal Notes</div>
                <div style={{fontWeight: 500, color: sample.internal_notes ? '#111' : '#bbb', fontSize: 16, fontStyle: sample.internal_notes ? 'normal' : 'italic'}}>
                  {sample.internal_notes || 'No notes added'}
                </div>
              </div>
              <div>
                <div style={{fontSize: 12, color: '#888', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5}}>Tags</div>
                <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
                  {sample.tags ? (
                    sample.tags.split(',').map((tag, i) => (
                      <span key={i} style={{
                        background: '#f5f5f5',
                        border: '1px solid #eee',
                        borderRadius: 16,
                        padding: '4px 12px',
                        fontSize: 13,
                        color: '#555',
                        fontWeight: 500,
                      }}>
                        {tag.trim()}
                      </span>
                    ))
                  ) : (
                    <span style={{color: '#bbb', fontSize: 16, fontStyle: 'italic'}}>No tags added</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Internal Notes */}
          <div className="luxury-card" style={{border: '1px solid #eee', borderRadius: 12, background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', padding: 24, display: 'flex', flexDirection: 'column'}}>
            <h3 className="luxury-card-title" style={{fontWeight: 600, fontSize: 18, letterSpacing: 1, marginBottom: 16}}>Internal Notes</h3>
            <InternalNotesSection sample={sample} />
          </div>
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
