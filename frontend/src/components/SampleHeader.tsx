import React from 'react';
import { Link } from 'react-router-dom';
import type { Sample } from '../types';

interface SampleHeaderProps {
  sample: Sample;
}

export const getStatusBadge = (status: string) => {
  let color = '#111', bg = '#f8f8f8', dot = '#111', label = status;
  switch (status) {
    case 'Approved':
      color = '#065f46'; bg = '#f0fdf4'; dot = '#065f46'; break;
    case 'Rejected':
      color = '#991b1b'; bg = '#fef2f2'; dot = '#991b1b'; break;
    case 'Changes Needed':
      color = '#b45309'; bg = '#fffbeb'; dot = '#b45309'; break;
    case 'None':
      return null;
    case 'In Review':
    default:
      color = '#111'; bg = '#f5f5f5'; dot = '#111'; label = 'In Review'; break;
  }
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      background: bg,
      color,
      fontWeight: 700,
      fontSize: 13,
      borderRadius: 4,
      padding: '6px 12px',
      letterSpacing: '1px',
      textTransform: 'uppercase',
      marginRight: 10,
      gap: 8,
      border: `1px solid ${color}20`,
      transition: 'all 0.2s',
    }}>
      <span style={{
        width: 8, 
        height: 8, 
        borderRadius: '50%', 
        background: dot, 
        display: 'inline-block',
        boxShadow: `0 0 0 2px ${bg}`
      }}></span>
      {label}
    </span>
  );
};

const SampleHeader: React.FC<SampleHeaderProps> = ({ sample }) => {
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
          <span style={{whiteSpace: 'normal', overflow: 'visible', textOverflow: 'clip'}}>{sample.sample_code} — {sample.name}</span>
        </h1>
      </div>
    </div>
  );
};

export default SampleHeader;
