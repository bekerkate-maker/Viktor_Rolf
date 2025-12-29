import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { samplesAPI, photosAPI } from '../api';
import type { Sample, SamplePhoto } from '../types';

function SampleDetail() {
  const { id } = useParams<{ id: string }>();
  const [sample, setSample] = useState<Sample | null>(null);
  const [photos, setPhotos] = useState<SamplePhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    if (id) {
      loadSample(parseInt(id));
      loadPhotos(parseInt(id));
    }
  }, [id]);

  const loadSample = async (sampleId: number) => {
    try {
      const response = await samplesAPI.getById(sampleId);
      setSample(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading sample:', error);
      setLoading(false);
    }
  };

  const loadPhotos = async (sampleId: number) => {
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
      await photosAPI.uploadPhotos(parseInt(id), selectedFiles);
      setSelectedFiles([]);
      await loadPhotos(parseInt(id));
      // Reset file input
      const fileInput = document.getElementById('photo-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Error uploading photos:', error);
      alert('Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const handleSetMainPhoto = async (photoId: number) => {
    try {
      await photosAPI.setMainPhoto(photoId);
      if (id) await loadPhotos(parseInt(id));
    } catch (error) {
      console.error('Error setting main photo:', error);
      alert('Failed to set main photo');
    }
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!confirm('Are you sure you want to delete this photo?')) return;
    
    try {
      await photosAPI.deletePhoto(photoId);
      if (id) await loadPhotos(parseInt(id));
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Failed to delete photo');
    }
  };

  if (loading) {
    return <div className="loading">Loading sample...</div>;
  }

  if (!sample) {
    return <div className="empty-state">Sample not found.</div>;
  }

  return (
    <div>
      <div className="page-header">
        <Link to={`/collections/${sample.collection_id}`} className="back-arrow-button">
          ←
        </Link>
        <h1 className="page-title">{sample.sample_code}</h1>
        <p className="page-subtitle">
          {sample.name} · {sample.sample_round} · {sample.collection_name}
        </p>
      </div>

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
                  <div className="photo-actions">
                    {!photo.is_main_photo && (
                      <button 
                        className="btn-icon"
                        onClick={() => handleSetMainPhoto(photo.id)}
                        title="Set as main photo"
                      >
                        ⭐
                      </button>
                    )}
                    {photo.is_main_photo && (
                      <span className="main-badge">Main Photo</span>
                    )}
                    <button 
                      className="btn-icon btn-danger"
                      onClick={() => handleDeletePhoto(photo.id)}
                      title="Delete photo"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No photos uploaded yet</div>
          )}
        </div>
      </div>

      {/* Sample Info */}
      <div className="grid grid-2">
        <div className="card">
          <h3>Sample Information</h3>
          <div className="mt-md">
            <p><strong>Status:</strong> <span className={`badge badge-${
              sample.status === 'Approved' ? 'approved' :
              sample.status === 'Rejected' ? 'rejected' :
              sample.status === 'Changes Needed' ? 'pending' : 'progress'
            }`}>{sample.status}</span></p>
            <p className="mt-sm"><strong>Sample Round:</strong> {sample.sample_round}</p>
            <p className="mt-sm"><strong>Product Type:</strong> {sample.product_type}</p>
            <p className="mt-sm"><strong>Supplier:</strong> {sample.supplier_name}</p>
            <p className="mt-sm"><strong>Responsible:</strong> {sample.responsible_user_name}</p>
            {sample.received_date && <p className="mt-sm"><strong>Received:</strong> {new Date(sample.received_date).toLocaleDateString()}</p>}
            {sample.feedback_deadline && <p className="mt-sm"><strong>Deadline:</strong> {new Date(sample.feedback_deadline).toLocaleDateString()}</p>}
            <p className="mt-sm"><strong>Created:</strong> {new Date(sample.created_at).toLocaleDateString()}</p>
            <p className="mt-sm"><strong>Last Updated:</strong> {new Date(sample.updated_at).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="card">
          <h3>Overview</h3>
          <div className="mt-md">
            <p><strong>Quality Reviews:</strong> {sample.quality_reviews?.length || 0}</p>
            <p className="mt-sm"><strong>Supplier Communications:</strong> {sample.supplier_communications?.length || 0}</p>
          </div>
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

      {/* Supplier Communications */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Supplier Communications</h2>
          <Link to={`/supplier-communications?sample_id=${sample.id}`} className="btn btn-small">
            View All Communications
          </Link>
        </div>
        {sample.supplier_communications && sample.supplier_communications.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Type</th>
                <th>Date</th>
                <th>Status</th>
                <th>Sample Due</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sample.supplier_communications.map((comm) => (
                <tr key={comm.id}>
                  <td>
                    {comm.supplier_name}
                    {comm.is_important && <span className="important-flag ml-sm">⭐</span>}
                  </td>
                  <td>{comm.communication_type}</td>
                  <td>{new Date(comm.communication_date).toLocaleDateString()}</td>
                  <td><span className={`badge badge-${
                    comm.status === 'Completed' ? 'approved' :
                    comm.status === 'Waiting for Supplier' ? 'pending' : 'progress'
                  }`}>{comm.status}</span></td>
                  <td>{comm.sample_due_date ? new Date(comm.sample_due_date).toLocaleDateString() : '-'}</td>
                  <td>
                    <Link to={`/supplier-communications/${comm.id}`} className="btn btn-small">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">No supplier communications yet.</div>
        )}
      </div>

      {/* Audit Trail */}
      {sample.audit_trail && sample.audit_trail.length > 0 && (
        <div className="card">
          <h2 className="card-title">Audit Trail</h2>
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
