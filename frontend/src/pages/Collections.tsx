import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collectionsAPI } from '../api';
import type { Collection } from '../types';

function Collections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      const response = await collectionsAPI.getAll();
      setCollections(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading collections:', error);
      setLoading(false);
    }
  };

  const filteredCollections = collections.filter((c) => {
    if (filter === 'active') return c.status === 'Active';
    if (filter === 'archived') return c.status === 'Archived';
    return true;
  });

  if (loading) {
    return <div className="loading">Loading collections...</div>;
  }

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">Collections</h1>
          <p className="page-subtitle">Manage collections and seasons</p>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <div className="btn-group">
          <button
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('all')}
          >
            All Collections
          </button>
          <button
            className={`btn ${filter === 'active' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button
            className={`btn ${filter === 'archived' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter('archived')}
          >
            Archived
          </button>
        </div>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-2">
        {filteredCollections.map((collection) => (
          <Link
            key={collection.id}
            to={`/collections/${collection.id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div className="collection-card">
              <h3>{collection.name}</h3>
              <div className="collection-meta">
                {collection.category} · {collection.season} {collection.year}
                {collection.status === 'Archived' && (
                  <span className="badge badge-low ml-sm">Archived</span>
                )}
              </div>
              <div className="collection-stats">
                <div className="collection-stat">
                  <span className="badge badge-progress">{collection.in_progress_count || 0}</span>
                  <span>In Progress</span>
                </div>
                <div className="collection-stat">
                  <span className="badge badge-pending">{collection.review_needed_count || 0}</span>
                  <span>Review Needed</span>
                </div>
                <div className="collection-stat">
                  <span className="badge badge-approved">{collection.approved_count || 0}</span>
                  <span>Approved</span>
                </div>
                <div className="collection-stat">
                  <span className="badge badge-rejected">{collection.rejected_count || 0}</span>
                  <span>Rejected</span>
                </div>
              </div>
              <div className="mt-md" style={{ fontSize: '0.875rem', color: 'var(--vr-gray)' }}>
                {collection.sample_count || 0} samples total
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredCollections.length === 0 && (
        <div className="empty-state">No collections found.</div>
      )}
    </div>
  );
}

export default Collections;
