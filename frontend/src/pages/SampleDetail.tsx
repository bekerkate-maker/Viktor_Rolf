import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { samplesAPI, photosAPI } from '../api';
import type { Sample, SamplePhoto } from '../types';
import SampleHeader from '../components/SampleHeader';
import EditSampleModal from '../components/EditSampleModal';

function SampleDetail() {
    const params = useParams<{ id: string; collectionId?: string }>();
    const id = params.id;
    const [sample, setSample] = useState<Sample | null>(null);
    const [photos, setPhotos] = useState<SamplePhoto[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [showEditModal, setShowEditModal] = useState(false);
    //

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
        // Reset file input
        const fileInput = document.getElementById('photo-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } catch (error: any) {
        console.error('Error uploading photos:', error);
        // Toon backend foutmelding indien beschikbaar
        const msg = error?.response?.data?.error || error?.message || 'Failed to upload photos';
        alert(msg);
      } finally {
        setUploading(false);
      }
    };

    //

    if (loading) {
      return <div className="loading">Loading sample...</div>;
    }
    if (!sample) {
      return <div className="empty-state">Sample not found.</div>;
    }

    return (
      <div>
        <SampleHeader
          sample={sample}
          onEdit={() => setShowEditModal(true)}
          onChangeStatus={() => {}}
          onAddReview={() => {}}
        />
        <EditSampleModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          sample={sample}
          onSampleUpdated={() => typeof sample.id === 'string' ? loadSample(sample.id) : undefined}
        />
        {/* Sample Photos */}
        <div className="card">
          <h3>Sample Photos</h3>
          <div className="mt-md">
            {/* Upload Section */}
            <div className="photo-upload-section">
              <input
                id="photo-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <label htmlFor="photo-upload" className="btn btn-secondary">
                Choose Photos
              </label>
              {selectedFiles.length > 0 && (
                <div className="selected-files">
                  <span>{selectedFiles.length} file(s) selected</span>
                  <button 
                    className="btn btn-primary"
                    onClick={handleUpload}
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : 'Upload Photos'}
                  </button>
                </div>
              )}
            </div>
            {/* Photo Gallery */}
            {photos.length > 0 ? (
              <div className="photo-gallery">
                {photos.map((photo) => (
                  <div key={photo.id} className={`photo-item ${photo.is_main_photo ? 'main-photo' : ''}`}>
                    <img 
                      src={photo.file_path} 
                      alt={photo.file_name}
                      className="photo-image"
                    />
                    {/* Add photo actions here if needed */}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">No photos uploaded yet.</div>
            )}
          </div>
        </div>
        {/* Sample Information Block (horizontal) */}
        <div className="card" style={{ marginBottom: 32, position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>Sample Information</h3>
            <button className="btn luxury-btn" style={{ fontSize: '0.95rem', padding: '0.3rem 1.1rem' }} onClick={() => setShowEditModal(true)}>
              Edit
            </button>
          </div>
          <div className="sample-header-meta" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', fontSize: '1.08rem', margin: '0.5rem 0 0.5rem 0' }}>
            <span><strong>Status:</strong> <span className={`badge badge-${
              sample.status === 'Approved' ? 'approved' :
              sample.status === 'Rejected' ? 'rejected' :
              sample.status === 'Changes Needed' ? 'pending' : 'progress'
            }`}>{sample.status}</span></span>
            <span style={{ color: '#bbb' }}>•</span>
            <span><strong>Round:</strong> {sample.sample_round}</span>
            <span style={{ color: '#bbb' }}>•</span>
            <span><strong>Type:</strong> {sample.product_type}</span>
            <span style={{ color: '#bbb' }}>•</span>
            <span><strong>Supplier:</strong> {sample.supplier_name}</span>
            <span style={{ color: '#bbb' }}>•</span>
            <span><strong>Responsible:</strong> {sample.responsible_user_name}</span>
            {sample.received_date && (<><span style={{ color: '#bbb' }}>•</span><span><strong>Received:</strong> {new Date(sample.received_date).toLocaleDateString()}</span></>)}
            {sample.feedback_deadline && (<><span style={{ color: '#bbb' }}>•</span><span><strong>Deadline:</strong> {new Date(sample.feedback_deadline).toLocaleDateString()}</span></>)}
            <span style={{ color: '#bbb' }}>•</span>
            <span><strong>Created:</strong> {new Date(sample.created_at).toLocaleDateString()}</span>
            <span style={{ color: '#bbb' }}>•</span>
            <span><strong>Last Updated:</strong> {new Date(sample.updated_at).toLocaleDateString()}</span>
          </div>
        </div>
        {/* Quality Reviews */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Quality Reviews</h2>
            <Link to={`/quality-control?sample_id=${sample.id}`} className="btn btn-small">
              View All Reviews
            </Link>
          </div>
          {sample.quality_reviews && sample.quality_reviews.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Reviewer</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sample.quality_reviews.map((review) => (
                  <tr key={review.id}>
                    <td>{review.quality_category}</td>
                    <td><span className={`badge badge-${review.severity.toLowerCase()}`}>{review.severity}</span></td>
                    <td><span className={`badge badge-${
                      review.review_status === 'Resolved' ? 'approved' :
                      review.review_status === 'Re-opened' ? 'rejected' : 'pending'
                    }`}>{review.review_status}</span></td>
                    <td>{review.reviewer_name}</td>
                    <td>{new Date(review.review_date || review.created_at).toLocaleDateString()}</td>
                    <td>
                      <Link to={`/quality-reviews/${review.id}`} className="btn btn-small">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">No quality reviews yet.</div>
          )}
        </div>
        {/* Action Points & Deadlines */}
        <div className="card">
          <h2 className="card-title">Action Points & Deadlines</h2>
          {sample.quality_reviews && sample.quality_reviews.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Issue</th>
                  <th>Action Holder</th>
                  <th>Deadline</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sample.quality_reviews.filter(r => r.review_status !== 'Resolved').map((review) => {
                  const isOverdue = review.review_date && new Date(review.review_date) < new Date();
                  return (
                    <tr key={review.id} className={isOverdue ? 'deadline-overdue' : ''}>
                      <td>{review.issue_description}</td>
                      <td>{review.action_required ? 'Supplier' : 'Internal'}</td>
                      <td>{review.review_date ? new Date(review.review_date).toLocaleDateString() : '-'}</td>
                      <td><span className={`badge badge-${review.review_status === 'Open' ? 'pending' : 'progress'}`}>{review.review_status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">No open action points.</div>
          )}
        </div>
        {/* Internal Notes (internal only) */}
        <div className="card">
          <h2 className="card-title">Internal Notes</h2>
          <textarea
            className="form-textarea"
            value={sample.internal_notes || ''}
            readOnly
            placeholder="Internal notes, decisions, context for next round..."
            rows={4}
          />
          <div className="note-hint">Not visible to suppliers</div>
        </div>
        {/* History / Activity Log */}
        {sample.audit_trail && sample.audit_trail.length > 0 && (
          <div className="card">
            <h2 className="card-title">History / Activity Log</h2>
            <div className="audit-trail mt-md">
              {sample.audit_trail.map((entry) => (
                <div key={entry.id} className="audit-entry">
                  <div className="audit-entry-header">
                    <span className="audit-entry-user">{entry.user_name}</span>
                    <span className="audit-entry-date">
                      {new Date(entry.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="audit-entry-action">{entry.changes}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
  );
}

export default SampleDetail;
