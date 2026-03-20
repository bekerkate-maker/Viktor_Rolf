import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supplierCommsAPI } from '../api';
import type { SupplierCommunication } from '../types';

function SupplierCommDetail() {
  const { id } = useParams<{ id: string }>();
  const [comm, setComm] = useState<SupplierCommunication | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      loadCommunication(parseInt(id));
    }
    // eslint-disable-next-line
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

  useEffect(() => {
    if (!loading && !comm) {
      navigate('/supplier-communications', { replace: true });
    }
    // eslint-disable-next-line
  }, [loading, comm]);

  if (loading) {
    return <div className="loading">Loading communication...</div>;
  }
  if (!comm) {
    return null;
  }

  return (
    <div>
      <div style={{ padding: '20px 16px' }}>
        <div
          onClick={() => navigate('/supplier-communications')}
          style={{
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '2px',
            color: '#999',
            textTransform: 'uppercase',
            cursor: 'pointer',
            marginBottom: 48,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#111'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#999'}
        >
          ← Back
        </div>
        <h1 className="page-title" style={{ margin: 0, fontSize: '48px', fontWeight: 300, color: '#111', letterSpacing: '-0.5px' }}>Supplier Communication #{comm.id}</h1>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', fontWeight: 700, letterSpacing: '2.5px', color: '#999', textTransform: 'uppercase' }}>
          {comm.sample_code} · {comm.supplier_name}
        </p>
      </div>

      {/* Communication Details */}
      <div className="card">
        <h2 className="card-title">Communication Details</h2>
        <div className="mt-md">
          <div className="grid grid-2">
            <div>
              <p><strong>Manufacturer:</strong> {comm.supplier_name}</p>
              <p className="mt-sm"><strong>Type:</strong> {comm.communication_type}</p>
              <p className="mt-sm"><strong>Date:</strong> {new Date(comm.communication_date).toLocaleDateString()}</p>
              <p className="mt-sm">
                <strong>Status:</strong>{' '}
                <span className={`badge badge-${comm.status === 'Completed' ? 'approved' :
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
        <h2 className="card-title">Related Article</h2>
        <div className="mt-md">
          <p><strong>Article Number:</strong> {comm.sample_code}</p>
          <p className="mt-sm"><strong>Article Description:</strong> {comm.sample_name}</p>
          <p className="mt-sm"><strong>Collection:</strong> {comm.collection_name}</p>
          <Link to={`/samples/${comm.sample_id}`} className="btn mt-md">
            View Article Details
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SupplierCommDetail;
