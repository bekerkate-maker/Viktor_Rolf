import { useState, useEffect, useRef } from 'react';
import InternalNotesSection from '../components/InternalNotesSection';
import { useParams } from 'react-router-dom';
import { samplesAPI, photosAPI } from '../api';
import type { Sample, SamplePhoto } from '../types';
import { getStatusBadge } from '../components/SampleHeader';
import EditSampleModal from '../components/EditSampleModal';
import { Plus, Move, Lock, Unlock } from 'lucide-react';

type WidgetConfig = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

const defaultLayout: WidgetConfig[] = [
  { id: 'photo', x: 0, y: 0, width: 55, height: 60 },
  { id: 'info', x: 57, y: 0, width: 42, height: 45 },
  { id: 'notes', x: 57, y: 47, width: 42, height: 40 },
];

function SampleDetailGrid() {
  const params = useParams<{ id: string; collectionId?: string }>();
  const id = params.id;
  const [sample, setSample] = useState<Sample | null>(null);
  const [photos, setPhotos] = useState<SamplePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [widgets, setWidgets] = useState<WidgetConfig[]>(defaultLayout);
  const [dragging, setDragging] = useState<string | null>(null);
  const [resizing, setResizing] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number; y: number; widgetX: number; widgetY: number }>({ x: 0, y: 0, widgetX: 0, widgetY: 0 });
  const resizeStart = useRef<{ x: number; y: number; width: number; height: number }>({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    if (id) {
      loadSample(id);
      loadPhotos(id);
    }
  }, [id]);

  const loadSample = async (sampleId: string) => {
    try {
      const response = await samplesAPI.getById(sampleId);
      setSample(response.data);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const loadPhotos = async (sampleId: string) => {
    try {
      const response = await photosAPI.getPhotos(sampleId);
      setPhotos(response.data);
    } catch { /* ignore */ }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFiles(Array.from(event.target.files));
    }
  };

  const handleUpload = async () => {
    if (!id || selectedFiles.length === 0) return;
    setUploading(true);
    try {
      await photosAPI.uploadPhotos(id, selectedFiles);
      setSelectedFiles([]);
      await loadPhotos(id);
      const fileInput = document.getElementById('photo-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } finally {
      setUploading(false);
    }
  };

  // Drag handlers
  const handleDragStart = (widgetId: string, e: React.MouseEvent) => {
    if (!editMode) return;
    e.preventDefault();
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;
    setDragging(widgetId);
    dragStart.current = { x: e.clientX, y: e.clientY, widgetX: widget.x, widgetY: widget.y };
  };

  const handleResizeStart = (widgetId: string, e: React.MouseEvent) => {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();
    const widget = widgets.find(w => w.id === widgetId);
    if (!widget) return;
    setResizing(widgetId);
    resizeStart.current = { x: e.clientX, y: e.clientY, width: widget.width, height: widget.height };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragging) {
        const dx = ((e.clientX - dragStart.current.x) / (containerRef.current?.offsetWidth || 1)) * 100;
        const dy = ((e.clientY - dragStart.current.y) / (containerRef.current?.offsetHeight || 1)) * 100;
        setWidgets(prev => prev.map(w =>
          w.id === dragging
            ? { ...w, x: Math.max(0, Math.min(100 - w.width, dragStart.current.widgetX + dx)), y: Math.max(0, dragStart.current.widgetY + dy) }
            : w
        ));
      }
      if (resizing) {
        const dw = ((e.clientX - resizeStart.current.x) / (containerRef.current?.offsetWidth || 1)) * 100;
        const dh = ((e.clientY - resizeStart.current.y) / (containerRef.current?.offsetHeight || 1)) * 100;
        setWidgets(prev => prev.map(w =>
          w.id === resizing
            ? { ...w, width: Math.max(15, resizeStart.current.width + dw), height: Math.max(15, resizeStart.current.height + dh) }
            : w
        ));
      }
    };
    const handleMouseUp = () => {
      setDragging(null);
      setResizing(null);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, resizing]);

  if (loading) return <div className="loading luxury-font">Loading sample...</div>;
  if (!sample) return <div className="empty-state luxury-font">Sample not found.</div>;

  const getWidget = (widgetId: string) => widgets.find(w => w.id === widgetId)!;

  const widgetStyle = (widgetId: string): React.CSSProperties => {
    const w = getWidget(widgetId);
    return {
      position: 'absolute',
      left: `${w.x}%`,
      top: `${w.y}%`,
      width: `${w.width}%`,
      height: `${w.height}%`,
      transition: dragging === widgetId || resizing === widgetId ? 'none' : 'all 0.15s',
      cursor: editMode ? 'move' : 'default',
      zIndex: dragging === widgetId ? 10 : 1,
    };
  };

  return (
    <div style={{ width: '100vw', minHeight: '100vh', background: '#faf9f8', padding: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, marginBottom: 24, padding: '32px 5vw 0 5vw' }}>
        <div style={{ fontWeight: 700, fontSize: 36, letterSpacing: 1.5, color: '#111', wordBreak: 'break-word' }}>
          {sample.sample_code.split('-').pop()} — {sample.name}
        </div>
        <div>{getStatusBadge(sample.status)}</div>
        <button
          onClick={() => setEditMode(e => !e)}
          style={{
            padding: '10px 22px',
            borderRadius: 10,
            fontWeight: 600,
            background: editMode ? '#222' : '#f5f5f5',
            color: editMode ? '#fff' : '#222',
            border: '1.5px solid #ddd',
            marginLeft: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 16,
            boxShadow: editMode ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          {editMode ? <Lock size={18} /> : <Unlock size={18} />}
          {editMode ? 'Vergrendel layout' : 'Bewerk layout'}
        </button>
      </div>
      {editMode && (
        <div style={{ padding: '0 5vw', marginBottom: 16 }}>
          <div style={{ background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 8, padding: '10px 18px', color: '#7c6a00', fontSize: 15, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Move size={18} /> Sleep de widgets om ze te verplaatsen. Sleep de rechterbenedenhoek om de grootte aan te passen.
          </div>
        </div>
      )}
      {/* Widgets container */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: '90vw',
          minHeight: '70vh',
          margin: '0 auto',
          background: editMode ? 'repeating-linear-gradient(0deg, #f0f0f0 0 1px, transparent 1px 32px), repeating-linear-gradient(90deg, #f0f0f0 0 1px, transparent 1px 32px)' : 'none',
          borderRadius: 18,
          padding: 0,
        }}
      >
        {/* Photo widget */}
        <div
          style={widgetStyle('photo')}
          onMouseDown={e => handleDragStart('photo', e)}
        >
          <div className="luxury-card" style={{ border: editMode ? '2px dashed #bbb' : '1px solid #eee', borderRadius: 18, background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', padding: 0, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'stretch' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120 }}>
              {photos.length > 0 ? (
                <img
                  src={photos[0].file_path}
                  alt={photos[0].file_name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#f5f5f5' }}
                />
              ) : (
                <div className="luxury-empty-state" style={{ textAlign: 'center', color: '#bbb', fontSize: 18, padding: 48 }}>
                  <Plus size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
                  <div>No photos yet</div>
                </div>
              )}
            </div>
            <div style={{ padding: 18, width: '100%', borderTop: '1px solid #f0f0f0', background: '#fafbfc' }}>
              <input
                id="photo-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <label htmlFor="photo-upload" className="btn luxury-btn" style={{ padding: '8px 20px', fontWeight: 500, borderRadius: 8, background: '#f5f5f5', border: '1px solid #eee', cursor: 'pointer', marginRight: 12 }}>
                Choose Photos
              </label>
              {selectedFiles.length > 0 && (
                <span style={{ marginRight: 12 }}>{selectedFiles.length} file(s) selected</span>
              )}
              <button
                className="btn luxury-btn"
                onClick={handleUpload}
                disabled={uploading}
                style={{ padding: '8px 20px', fontWeight: 500, borderRadius: 8, background: '#222', color: '#fff', border: 'none', marginLeft: 8, opacity: uploading ? 0.7 : 1, cursor: uploading ? 'not-allowed' : 'pointer' }}
              >
                {uploading ? 'Uploading...' : 'Upload Photos'}
              </button>
            </div>
          </div>
          {editMode && (
            <div
              onMouseDown={e => handleResizeStart('photo', e)}
              style={{ position: 'absolute', right: 0, bottom: 0, width: 22, height: 22, cursor: 'nwse-resize', background: '#222', borderRadius: '8px 0 12px 0', zIndex: 20 }}
            />
          )}
        </div>
        {/* Info widget */}
        <div
          style={widgetStyle('info')}
          onMouseDown={e => handleDragStart('info', e)}
        >
          <div className="luxury-card" style={{ border: editMode ? '2px dashed #bbb' : '1px solid #eee', borderRadius: 18, background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', padding: 28, height: '100%', overflow: 'auto' }}>
            <h3 className="luxury-card-title" style={{ fontWeight: 600, fontSize: 22, letterSpacing: 1, marginBottom: 20 }}>Sample Information</h3>
            <div className="luxury-info-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 32px' }}>
              <div>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 2 }}>Status</div>
                <div style={{ fontWeight: 600, color: '#111' }}>{sample.status}</div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 2 }}>Sample Round</div>
                <div style={{ fontWeight: 600, color: '#111' }}>{sample.sample_round}</div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 2 }}>Type</div>
                <div style={{ fontWeight: 600, color: '#111' }}>{sample.product_type}</div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 2 }}>Responsible</div>
                <div style={{ fontWeight: 600, color: '#111' }}>{sample.responsible_user_name}</div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 2 }}>QC Reviews</div>
                <div style={{ fontWeight: 600, color: '#111' }}>{sample.quality_review_count || 0}</div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 2 }}>Last Updated</div>
                <div style={{ fontWeight: 600, color: '#111' }}>{new Date(sample.updated_at).toLocaleDateString()}</div>
              </div>
            </div>
          </div>
          {editMode && (
            <div
              onMouseDown={e => handleResizeStart('info', e)}
              style={{ position: 'absolute', right: 0, bottom: 0, width: 22, height: 22, cursor: 'nwse-resize', background: '#222', borderRadius: '8px 0 12px 0', zIndex: 20 }}
            />
          )}
        </div>
        {/* Notes widget */}
        <div
          style={widgetStyle('notes')}
          onMouseDown={e => handleDragStart('notes', e)}
        >
          <div className="luxury-card" style={{ border: editMode ? '2px dashed #bbb' : '1px solid #eee', borderRadius: 18, background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.03)', padding: 24, height: '100%', overflow: 'auto' }}>
            <h3 className="luxury-card-title" style={{ fontWeight: 600, fontSize: 20, letterSpacing: 1, marginBottom: 16 }}>Internal Notes</h3>
            <InternalNotesSection sample={sample} />
          </div>
          {editMode && (
            <div
              onMouseDown={e => handleResizeStart('notes', e)}
              style={{ position: 'absolute', right: 0, bottom: 0, width: 22, height: 22, cursor: 'nwse-resize', background: '#222', borderRadius: '8px 0 12px 0', zIndex: 20 }}
            />
          )}
        </div>
      </div>
      <EditSampleModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        sample={sample}
        onSampleUpdated={() => typeof sample.id === 'string' ? loadSample(sample.id) : undefined}
      />
    </div>
  );
}

export default SampleDetailGrid;
