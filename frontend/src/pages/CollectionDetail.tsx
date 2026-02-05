import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { collectionsAPI } from '../api';
import type { Collection } from '../types';

function CollectionDetail() {
  const { id } = useParams<{ id: string }>();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      loadCollection(id);
    }
    // eslint-disable-next-line
  }, [id]);

  const loadCollection = async (collectionId: string) => {
    try {
      const response = await collectionsAPI.getById(collectionId);
      setCollection(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading collection:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && !collection) {
      navigate('/collections', { replace: true });
    }
    // eslint-disable-next-line
  }, [loading, collection]);

  if (loading) {
    return <div className="loading">Loading collection...</div>;
  }
  if (!collection) {
    return null;
  }

  const samples = collection.samples || [];

  return (
    <div>
      <div className="page-header" style={{ position: 'relative' }}>
        <Link
          to="/collections"
          className="back-arrow"
          style={{
            position: 'absolute',
            left: 0,
            top: 16,
            textDecoration: 'none',
            color: '#333',
            fontSize: 32,
            background: 'rgba(255,255,255,0.85)',
            borderRadius: '0 18px 18px 0',
            padding: '8px 18px 8px 8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            transition: 'background 0.2s',
          }}
          title="Back to collections"
        >
          ←
        </Link>
        <h1 className="page-title" style={{ marginLeft: 48 }}>{collection.name}</h1>
        <p className="page-subtitle" style={{ marginLeft: 48 }}>
          {collection.category} · {collection.season} {collection.year}
        </p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{samples.length}</div>
          <div className="stat-label">Total Samples</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{collection.in_progress_count || 0}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{collection.review_needed_count || 0}</div>
          <div className="stat-label">Review Needed</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{collection.approved_count || 0}</div>
          <div className="stat-label">Approved</div>
        </div>
      </div>

      {/* Samples Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Samples</h2>
        </div>
        {samples.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Sample Code</th>
                <th>Name</th>
                <th>Sample Round</th>
                <th>Status</th>
                <th>Responsible</th>
                <th>QC Reviews</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {samples.map((sample) => (
                <tr
                  key={sample.id}
                  onClick={() => (window.location.href = `/samples/${sample.id}`)}
                  className="sample-row"
                >
                  <td>
                    <strong>{sample.sample_code}</strong>
                  </td>
                  <td>{sample.name}</td>
                  <td>{sample.sample_round}</td>
                  <td>
                    <span
                      className={`badge badge-${
                        sample.status === 'Approved'
                          ? 'approved'
                          : sample.status === 'Rejected'
                          ? 'rejected'
                          : sample.status === 'Changes Needed'
                          ? 'pending'
                          : 'progress'
                      }`}
                    >
                      {sample.status}
                    </span>
                  </td>
                  <td>{sample.responsible_user_name}</td>
                  <td>{sample.quality_review_count || 0}</td>
                  <td>{new Date(sample.updated_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">No samples yet in this collection.</div>
        )}
      </div>
    </div>
  );
}

export default CollectionDetail;
