import React from 'react';
import type { Sample } from '../types';

interface SampleHeaderProps {
  sample: Sample;
  onEdit: () => void;
  onChangeStatus: () => void;
  onAddReview: () => void;
}

const SampleHeader: React.FC<SampleHeaderProps> = ({ sample, onEdit, onChangeStatus, onAddReview }) => {
  return (
    <div className="sample-header luxury-header">
      <div className="sample-header-main">
        <div>
          <h1 className="sample-header-title">{sample.sample_code.split('-').pop()} — {sample.name}</h1>
        </div>
        <div className="sample-header-actions">
          <button className="btn luxury-btn" onClick={onChangeStatus}>Change Status</button>
          <button className="btn luxury-btn" onClick={onEdit}>Edit Sample</button>
          <button className="btn luxury-btn" onClick={onAddReview}>Add Quality Review</button>
        </div>
      </div>
    </div>
  );
};

export default SampleHeader;
