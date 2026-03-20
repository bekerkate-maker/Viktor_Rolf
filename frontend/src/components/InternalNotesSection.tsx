import React, { useState } from 'react';
import type { Sample } from '../types';
import { X, Pencil, Save } from 'lucide-react';
import { samplesAPI } from '../api';

// Simuleer huidige gebruiker (in productie: haal uit auth)
const CURRENT_USER = 'Sophie Laurent';

interface NoteEntry {
  text: string;
  author: string;
  date: string;
}

const InternalNotesSection: React.FC<{ sample: Sample }> = ({ sample }) => {
  // Parse possible JSON structure from internal_notes
  let extractedNote = sample.internal_notes || '';
  try {
    const parsed = JSON.parse(sample.internal_notes || '{}');
    if (parsed && typeof parsed === 'object' && parsed._isJsonBlob) {
      extractedNote = parsed.notes || '';
    }
  } catch (e) {
    // Normal text note
  }

  const initialNote = extractedNote ? {
    text: extractedNote,
    author: CURRENT_USER,
    date: new Date().toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' }),
  } : null;

  const [savedNote, setSavedNote] = useState<NoteEntry | null>(initialNote);
  const [noteText, setNoteText] = useState(initialNote ? initialNote.text : '');
  const [isEditing, setIsEditing] = useState(!initialNote);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!noteText.trim()) return;
    setSaving(true);

    try {
      // Haal evt. de bestaande checklist op tegelijk
      let finalNotes = noteText;
      try {
        const parsed = JSON.parse(sample.internal_notes || '{}');
        if (parsed && typeof parsed === 'object' && parsed._isJsonBlob) {
          parsed.notes = noteText;
          finalNotes = JSON.stringify(parsed);
        } else {
          finalNotes = JSON.stringify({ _isJsonBlob: true, notes: noteText, fitChecks: {}, workChecks: {} });
        }
      } catch (e) {
        finalNotes = JSON.stringify({ _isJsonBlob: true, notes: noteText, fitChecks: {}, workChecks: {} });
      }

      await samplesAPI.update(String(sample.id), {
        internal_notes: finalNotes
      });

      const newEntry: NoteEntry = {
        text: noteText,
        author: CURRENT_USER,
        date: new Date().toLocaleString('nl-NL', { dateStyle: 'short', timeStyle: 'short' }),
      };

      setSavedNote(newEntry);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save notes:', error);
      alert('Failed to save notes to the server.');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete these notes?")) {
      try {
        let finalNotes = '';
        try {
          const parsed = JSON.parse(sample.internal_notes || '{}');
          if (parsed && typeof parsed === 'object' && parsed._isJsonBlob) {
            parsed.notes = '';
            finalNotes = JSON.stringify(parsed);
          }
        } catch (e) { }

        await samplesAPI.update(String(sample.id), {
          internal_notes: finalNotes
        });
        setSavedNote(null);
        setNoteText('');
        setIsEditing(true);
      } catch (error) {
        console.error('Failed to delete notes:', error);
        alert('Failed to delete notes from the server.');
      }
    }
  };

  return (
    <div>
      {isEditing ? (
        <div>
          <textarea
            className="form-textarea"
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="Decision after fitting, notes for next round, alignment with design…"
            rows={5}
            style={{ marginBottom: 16, width: '100%', boxSizing: 'border-box' }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="btn luxury-btn"
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 8, fontWeight: 500, background: '#111', color: '#fff', border: 'none', opacity: saving ? 0.7 : 1, cursor: saving ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
              onClick={handleSave}
              disabled={saving || !noteText.trim()}
              onMouseEnter={(e) => {
                if (!saving && noteText.trim()) e.currentTarget.style.background = '#333';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#111';
              }}
            >
              <Save size={16} />
              {saving ? 'Saving…' : 'Save Notes'}
            </button>
            {savedNote && (
              <button
                style={{ padding: '10px 24px', borderRadius: 8, fontWeight: 500, background: '#fff', color: '#555', border: '1px solid #ddd', cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={() => {
                  setNoteText(savedNote.text); // revert
                  setIsEditing(false);
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#fff'}
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          style={{
            background: '#fafbfc',
            border: '1px solid #eee',
            borderRadius: 12,
            padding: '20px 24px',
            position: 'relative',
          }}
          className="luxury-note-row"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', background: '#e9ecef', color: '#111', fontWeight: 600, fontSize: 13 }}>
                {savedNote?.author.split(' ').map(n => n[0]).join('')}
              </span>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>{savedNote?.author}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{savedNote?.date}</div>
              </div>
            </div>

            <div className="no-print" style={{ display: 'flex', gap: 8 }}>
              <button
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, background: '#fff', border: '1px solid #ddd', color: '#333', cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.2s' }}
                onClick={handleEdit}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f5f5f5'; e.currentTarget.style.borderColor = '#111'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#ddd'; }}
              >
                <Pencil size={14} />
                Edit
              </button>
              <button
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: 6, background: '#fff', border: '1px solid #ddd', color: '#e53935', cursor: 'pointer', transition: 'all 0.2s' }}
                onClick={handleDelete}
                title="Delete note"
                onMouseEnter={(e) => { e.currentTarget.style.background = '#ffeeee'; e.currentTarget.style.borderColor = '#e53935'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#ddd'; }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div style={{ fontSize: 15, color: '#222', lineHeight: 1.6, whiteSpace: 'pre-line', paddingLeft: 44 }}>
            {savedNote?.text}
          </div>
        </div>
      )}
    </div>
  );
};

export default InternalNotesSection;
