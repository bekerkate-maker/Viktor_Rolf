import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collectionsAPI, samplesAPI, qualityReviewsAPI, supplierCommsAPI } from '../api';
import type { Collection, Sample } from '../types';

function Dashboard() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [recentSamples, setRecentSamples] = useState<Sample[]>([]);
  const [stats, setStats] = useState({
    totalCollections: 0,
    activeCollections: 0,
    totalSamples: 0,
    pendingReviews: 0,
    overdueComms: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [collectionsRes, samplesRes, qrStatsRes, scStatsRes] = await Promise.all([
        collectionsAPI.getAll(),
        samplesAPI.getAll(),
        qualityReviewsAPI.getStats(),
        supplierCommsAPI.getStats(),
      ]);

      const collectionsData = collectionsRes.data;
      const samplesData = samplesRes.data;

      setCollections(collectionsData.filter(c => c.status === 'Active').slice(0, 4));
      setRecentSamples(samplesData.slice(0, 5));

      setStats({
        totalCollections: collectionsData.length,
        activeCollections: collectionsData.filter(c => c.status === 'Active').length,
        totalSamples: samplesData.length,
        pendingReviews: qrStatsRes.data.pending_review,
        overdueComms: scStatsRes.data.overdue_samples,
      });

      setLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of Viktor & Rolf Quality Control System</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.activeCollections}</div>
          <div className="stat-label">Active Collections</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalSamples}</div>
          <div className="stat-label">Total Samples</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.pendingReviews}</div>
          <div className="stat-label">Pending Reviews</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.overdueComms}</div>
          <div className="stat-label">Overdue Communications</div>
        </div>
      </div>

      {/* Active Collections */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Active Collections</h2>
          <Link to="/collections" className="btn btn-small">
            View All
          </Link>
        </div>
        <div className="grid grid-2">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              to={`/collections/${collection.id}`}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="collection-card">
                <h3>{collection.name}</h3>
                <div className="collection-meta">
                  {collection.category} · {collection.season} {collection.year}
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
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Samples */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Samples</h2>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Sample Code</th>
              <th>Name</th>
              <th>Collection</th>
              <th>Status</th>
              <th>Responsible</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {recentSamples.map((sample) => (
              <tr
                key={sample.id}
                onClick={() => (window.location.href = `/samples/${sample.id}`)}
                style={{ cursor: 'pointer' }}
              >
                <td><strong>{sample.sample_code}</strong></td>
                <td>{sample.name}</td>
                <td>{sample.collection_name}</td>
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
                <td>{new Date(sample.updated_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Dashboard;
