import React from 'react';
import { Link } from 'react-router-dom';
import type { Sample } from '../types';
import { BadgeCheck, XCircle, AlertCircle, Loader2, Edit, RefreshCw, MessageCircle } from 'lucide-react';

interface SampleHeaderProps {
  sample: Sample;
  onEdit: () => void;
  onChangeStatus: () => void;
  onAddReview: () => void;
}

export const getStatusBadge = (status: string) => {
  let color = '#888', bg = '#f5f5f5', dot = '#bbb', label = status;
  switch (status) {
    case 'Approved':
      color = '#1a7f37'; bg = '#eafbe7'; dot = '#1a7f37'; label = 'Approved'; break;
    case 'Rejected':
      color = '#d92d20'; bg = '#fbeaea'; dot = '#d92d20'; label = 'Rejected'; break;
    case 'Changes Needed':
      color = '#b68400'; bg = '#fffbe6'; dot = '#b68400'; label = 'Changes Needed'; break;
    case 'In Review':
    default:
      color = '#2563eb'; bg = '#eaf0fb'; dot = '#2563eb'; label = 'In Review'; break;
  }
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      background: bg,
      color,
      fontWeight: 700,
      fontSize: 18,
      borderRadius: 22,
      padding: '6px 22px 6px 12px',
      letterSpacing: 0.8,
      boxShadow: '0 2px 8px 0 rgba(37,99,235,0.08)',
      marginRight: 10,
      gap: 10,
      border: `1.5px solid ${color}`,
      transition: 'box-shadow 0.2s',
    }}>
      <span style={{width: 12, height: 12, borderRadius: '50%', background: dot, display: 'inline-block', marginRight: 10, boxShadow: `0 0 0 2px ${bg}`}}></span>
      {label}
    </span>
  );
};

const getNextActionHint = (sample: Sample) => {
  if (sample.quality_reviews && sample.quality_reviews.length > 0) {
    const open = sample.quality_reviews.filter(r => r.review_status !== 'Resolved');
    if (open.some(r => r.action_required)) {
      return 'Waiting for supplier update';
    }
    if (open.length > 0) {
      return 'Waiting for internal QC';
    }
  }
  if (sample.status === 'Approved') return 'No further action needed';
  if (sample.status === 'Rejected') return 'Review and resolve issues';
  return 'Waiting for internal QC';
};

const SampleHeader: React.FC<SampleHeaderProps> = ({ sample, onEdit, onChangeStatus, onAddReview }) => {
  return (
    <div className="sample-header luxury-header" style={{
      position: 'relative',
      fontFamily: 'Inter, Geist, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
      borderRadius: 18,
      padding: '36px 5vw 28px 5vw',
      background: '#fff',
      boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
      border: '1px solid #eee',
      marginBottom: 16,
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-start',
      width: '100%',
      minHeight: 110,
      gap: 48,
    }}>
      <Link
        to={sample.collection_id ? `/collections/${sample.collection_id}/samples` : "/collections"}
        className="back-arrow-button"
        title="Back to collection samples"
        style={{
          position: 'absolute',
          left: 18,
          top: 18,
          fontSize: 28,
          color: '#222',
          background: 'rgba(255,255,255,0.85)',
          borderRadius: '50%',
          width: 38,
          height: 38,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          border: '1px solid #eee',
          zIndex: 2,
          textDecoration: 'none',
          transition: 'background 0.2s',
        }}
      >
        ←
      </Link>
      <div style={{flex: 1, minWidth: 0, width: '100%'}}>
        <h1 className="sample-header-title" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 32,
          fontWeight: 700,
          fontSize: 36,
          letterSpacing: 1.5,
          margin: 0,
          color: '#111',
          width: '100%',
          justifyContent: 'flex-start',
          wordBreak: 'break-word',
        }}>
          <span style={{whiteSpace: 'normal', overflow: 'visible', textOverflow: 'clip'}}>{sample.sample_code.split('-').pop()} — {sample.name}</span>
        </h1>
      </div>
    </div>
  );
};

export default SampleHeader;
