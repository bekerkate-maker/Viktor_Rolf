import React, { useState } from 'react';
import type { Sample } from '../types';
import { X } from 'lucide-react';

// Simuleer huidige gebruiker (in productie: haal uit auth)
const CURRENT_USER = 'Sophie Laurent';

interface NoteEntry {
  text: string;
  author: string;
  date: string;
}

const InternalNotesSection: React.FC<{ sample: Sample }> = ({ sample }) => {
  // Simuleer bestaande notes als array (in productie: uit backend)
  const [noteEntries, setNoteEntries] = useState<NoteEntry[]>(sample.internal_notes_thread || []);
  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    if (!noteText.trim()) return;
    setSaving(true);
    const newEntry: NoteEntry = {
      text: noteText,
      author: CURRENT_USER,
      date: new Date().toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' }),
    };
    setTimeout(() => {
      setNoteEntries([newEntry, ...noteEntries]);
      setNoteText('');
      setSaving(false);
      // In productie: API call om op te slaan
    }, 500);
  };

  const handleDelete = (idx: number) => {
    setNoteEntries(noteEntries.filter((_, i) => i !== idx));
    // In productie: API call om te verwijderen
  };

  return (
    <div>
      <textarea
        className="form-textarea"
        value={noteText}
        onChange={e => setNoteText(e.target.value)}
        placeholder="Decision after fitting, notes for next round, alignment with design…"
        rows={4}
        style={{marginBottom: 8}}
      />
      <div style={{display:'flex',alignItems:'center',gap:12, marginBottom: 18}}>
        <button
          className="btn luxury-btn"
          style={{padding: '8px 20px', borderRadius: 8, fontWeight: 500, background: '#222', color: '#fff', border: 'none', opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer'}}
          onClick={handleSave}
          disabled={saving || !noteText.trim()}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
      {/* Timeline van notes */}
      <div style={{marginTop: 8, display: 'flex', flexDirection: 'column', gap: 18}}>
        {noteEntries.length === 0 ? (
          <div style={{textAlign: 'center', color: '#bbb', fontSize: 15, padding: 24}}>
            <span style={{fontSize: 22, opacity: 0.5, marginRight: 8}}>📝</span>
            No notes yet
          </div>
        ) : (
          noteEntries.map((entry, idx) => (
            <div
              key={idx}
              style={{
                background: '#fafbfc',
                border: '1px solid #eee',
                borderRadius: 10,
                padding: '14px 18px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
                position: 'relative',
                transition: 'box-shadow 0.2s',
              }}
              className="luxury-note-row"
              onMouseEnter={e => {
                const btn = e.currentTarget.querySelector('.delete-note-btn');
                if (btn) (btn as HTMLElement).style.opacity = '1';
              }}
              onMouseLeave={e => {
                const btn = e.currentTarget.querySelector('.delete-note-btn');
                if (btn) (btn as HTMLElement).style.opacity = '0';
              }}
            >
              <div style={{fontSize: 15, color: '#222', marginBottom: 6, whiteSpace: 'pre-line'}}>{entry.text}</div>
              <div style={{fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', gap: 10}}>
                <span style={{fontWeight: 500}}>{entry.author}</span>
                <span style={{fontSize: 11, color: '#bbb'}}>{entry.date}</span>
              </div>
              <button
                className="delete-note-btn"
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  background: 'none',
                  border: 'none',
                  color: '#bbb',
                  cursor: 'pointer',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  padding: 2,
                  zIndex: 2,
                }}
                onClick={() => handleDelete(idx)}
                title="Verwijder deze notitie"
              >
                <X size={18} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default InternalNotesSection;
