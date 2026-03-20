import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { qualityReviewsAPI } from '../api';
import type { QualityReview } from '../types';

function QualityReviewDetail() {
  const { id } = useParams<{ id: string }>();
  const [review, setReview] = useState<QualityReview | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      loadReview(parseInt(id));
    }
    // eslint-disable-next-line
  }, [id]);

  const loadReview = async (reviewId: number) => {
    try {
      const response = await qualityReviewsAPI.getById(reviewId);
      setReview(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading review:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && !review) {
      navigate('/quality-control', { replace: true });
    }
    // eslint-disable-next-line
  }, [loading, review]);

  if (loading) {
    return <div className="loading">Loading quality review...</div>;
  }
  if (!review) {
    return null;
  }

  return (
    <div>
      <div style={{ padding: '20px 16px' }}>
        <div
          onClick={() => navigate('/quality-control')}
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
        <h1 className="page-title" style={{ margin: 0, fontSize: '48px', fontWeight: 300, color: '#111', letterSpacing: '-0.5px' }}>Quality Review #{review.id}</h1>
        <p style={{ margin: '4px 0 0 0', fontSize: '13px', fontWeight: 700, letterSpacing: '2.5px', color: '#999', textTransform: 'uppercase' }}>
          {review.sample_code} · {review.collection_name}
        </p>
      </div>

      {/* Review Details */}
      <div className="card">
        <h2 className="card-title">Review Details</h2>
        <div className="mt-md">
          <div className="grid grid-2">
            <div>
              <p><strong>Quality Category:</strong> {review.quality_category}</p>
              <p className="mt-sm"><strong>Severity:</strong> <span className={`badge badge-${review.severity.toLowerCase()}`}>{review.severity}</span></p>
              <p className="mt-sm"><strong>Status:</strong> <span className={`badge badge-${
                review.review_status === 'Resolved' ? 'approved' :
                review.review_status === 'Re-opened' ? 'rejected' : 'pending'
              }`}>{review.review_status}</span></p>
              <p className="mt-sm"><strong>Action Required:</strong> {review.action_required ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p><strong>Reviewer:</strong> {review.reviewer_name}</p>
              <p><strong>Review Date:</strong> {new Date(review.review_date || review.created_at).toLocaleString()}</p>
              <p className="mt-sm"><strong>Created:</strong> {new Date(review.created_at).toLocaleString()}</p>
              <p className="mt-sm"><strong>Last Updated:</strong> {new Date(review.updated_at).toLocaleString()}</p>
            </div>
          </div>
          
          <div className="mt-lg">
            <p><strong>Issue Description:</strong></p>
            <p className="mt-sm">{review.issue_description}</p>
          </div>
        </div>
      </div>

      {/* Photos */}
      {review.photos && review.photos.length > 0 && (
        <div className="card">
          <h2 className="card-title">Photos</h2>
          <div className="photo-gallery">
            {review.photos.map((photo) => (
              <div key={photo.id} className="photo-item">
                <img src={`/${photo.file_path}`} alt={photo.file_name} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comments */}
      {review.comments && review.comments.length > 0 && (
        <div className="card">
          <h2 className="card-title">Comments & History</h2>
          <div className="comments-section">
            {review.comments.map((comment) => (
              <div key={comment.id} className="comment">
                <div className="comment-author">{comment.user_name}</div>
                <div className="comment-date">{new Date(comment.created_at).toLocaleString()}</div>
                <div className="comment-text">{comment.comment}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default QualityReviewDetail;
