import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supplierCommsAPI } from '../api';
import type { SupplierCommunication } from '../types';

function SupplierCommDetail() {
  const { id } = useParams<{ id: string }>();
  const [comm, setComm] = useState<SupplierCommunication | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadCommunication(parseInt(id));
    }
  }, [id]);

  const loadCommunication = async (commId: number) => {
    try {
      const response = await supplierCommsAPI.getById(commId);
      setComm(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading communication:', error);
      setLoading(false);
    }
  };

  const isOverdue = (date: string | null) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  if (loading) {
    return <div className="loading">Loading communication...</div>;
  }

  if (!comm) {
    return <div className="empty-state">Communication not found.</div>;
  }

  return (
    <div>
      <div className="page-header">
        <Link to="/supplier-communications" className="btn btn-small mb-md">
          ← Back to Supplier Communications
        </Link>
        <h1 className="page-title">Supplier Communication #{comm.id}</h1>
        <p className="page-subtitle">
          {comm.sample_code} · {comm.supplier_name}
        </p>
      </div>

      {/* Communication Details */}
      <div className="card">
        <h2 className="card-title">Communication Details</h2>
        <div className="mt-md">
          <div className="grid grid-2">
            <div>
              <p><strong>Supplier:</strong> {comm.supplier_name}</p>
              <p className="mt-sm"><strong>Type:</strong> {comm.communication_type}</p>
              <p className="mt-sm"><strong>Date:</strong> {new Date(comm.communication_date).toLocaleDateString()}</p>
              <p className="mt-sm">
                <strong>Status:</strong>{' '}
                <span className={`badge badge-${
                  comm.status === 'Completed' ? 'approved' :
                  comm.status === 'Waiting for Supplier' ? 'pending' : 'progress'
                }`}>
                  {comm.status}
                </span>
              </p>
              {comm.is_important && (
                <p className="mt-sm important-flag">⭐ Important</p>
              )}
            </div>
            <div>
              <p><strong>Sample Due Date:</strong> {comm.sample_due_date ? (
                <span className={isOverdue(comm.sample_due_date) && comm.status !== 'Completed' ? 'deadline overdue' : ''}>
                  {new Date(comm.sample_due_date).toLocaleDateString()}
                  {isOverdue(comm.sample_due_date) && comm.status !== 'Completed' && ' ⚠️ OVERDUE'}
                </span>
              ) : '-'}</p>
              <p className="mt-sm"><strong>Feedback Due Date:</strong> {comm.feedback_due_date ? new Date(comm.feedback_due_date).toLocaleDateString() : '-'}</p>
              <p className="mt-sm"><strong>Created By:</strong> {comm.created_by_name}</p>
              <p className="mt-sm"><strong>Created:</strong> {new Date(comm.created_at).toLocaleString()}</p>
            </div>
          </div>
          
          <div className="mt-lg">
            <p><strong>Summary:</strong></p>
            <p className="mt-sm" style={{ whiteSpace: 'pre-wrap' }}>{comm.summary}</p>
          </div>
        </div>
      </div>

      {/* Attachments */}
      {comm.attachments && comm.attachments.length > 0 && (
        <div className="card">
          <h2 className="card-title">Attachments</h2>
          <div className="mt-md">
            {comm.attachments.map((attachment) => (
              <div key={attachment.id} className="flex-between mb-sm" style={{ padding: 'var(--spacing-sm)', border: '1px solid var(--vr-border)' }}>
                <div>
                  <strong>{attachment.file_name}</strong>
                  <br />
                  <small style={{ color: 'var(--vr-gray)' }}>
                    Uploaded: {new Date(attachment.uploaded_at).toLocaleDateString()}
                  </small>
                </div>
                <a href={`/${attachment.file_path}`} target="_blank" rel="noopener noreferrer" className="btn btn-small">
                  Download
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Related Sample */}
      <div className="card">
        <h2 className="card-title">Related Sample</h2>
        <div className="mt-md">
          <p><strong>Sample Code:</strong> {comm.sample_code}</p>
          <p className="mt-sm"><strong>Sample Name:</strong> {comm.sample_name}</p>
          <p className="mt-sm"><strong>Collection:</strong> {comm.collection_name}</p>
          <Link to={`/samples/${comm.sample_id}`} className="btn mt-md">
            View Sample Details
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SupplierCommDetail;
