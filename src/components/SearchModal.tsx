import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bookmark, Folder, Search } from 'lucide-react';
import { ALL_LESSONS, CONCEPT_INDEX, COURSE_MODULES } from '../data/curriculum';

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelectLesson: (lessonId: string, stepIndex?: number) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({ open, onClose, onSelectLesson }) => {
  const [query, setQuery] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const lessons = ALL_LESSONS.filter(
      (l) => !q || `${l.title} ${l.subtitle} ${l.goals.join(' ')}`.toLowerCase().includes(q)
    ).map((l) => ({
      type: 'lesson' as const,
      id: l.id,
      title: l.title,
      sub: l.subtitle,
      meta: `${l.steps.length} steps`,
      color: COURSE_MODULES.find((m) => m.id === l.moduleId)?.color || '#cfe3b2',
      stepIndex: 0,
    }));

    const concepts = CONCEPT_INDEX.filter(
      (c) => !q || `${c.term} ${c.summary}`.toLowerCase().includes(q)
    ).map((c) => ({
      type: 'concept' as const,
      id: `${c.lessonId}:${c.stepIndex}:${c.term}`,
      lessonId: c.lessonId,
      title: c.term,
      sub: c.summary,
      meta: `Step ${c.stepIndex + 1}`,
      color: '#e7ddf5',
      stepIndex: c.stepIndex,
    }));

    return { lessons, concepts, all: [...lessons, ...concepts] };
  }, [query]);

  useEffect(() => {
    setSel(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSel((s) => Math.min(results.all.length - 1, s + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSel((s) => Math.max(0, s - 1));
      } else if (e.key === 'Enter' && results.all[sel]) {
        e.preventDefault();
        const item = results.all[sel];
        onSelectLesson(item.type === 'lesson' ? item.id : item.lessonId, item.stepIndex);
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, results.all, sel, onClose, onSelectLesson]);

  if (!open) return null;

  let flatIdx = -1;

  return (
    <div className="sx" role="dialog" aria-modal="true" aria-label="Search course">
      <div className="sx__backdrop" onClick={onClose} />
      <div className="sx__dialog">
        <div className="sx__bar">
          <Search size={16} />
          <input
            ref={inputRef}
            className="sx__input"
            placeholder="Search DSA, backend, RAG, caching, HNSW…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button type="button" className="sx__btn" onClick={() => setQuery('')}>
              Clear
            </button>
          )}
          <button type="button" className="sx__btn" onClick={onClose}>
            esc
          </button>
        </div>

        <div className="sx__list">
          {results.lessons.length > 0 && (
            <>
              <div className="sx__group">Lessons ({results.lessons.length})</div>
              {results.lessons.map((item) => {
                flatIdx += 1;
                const idx = flatIdx;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`sx__item ${sel === idx ? 'is-sel' : ''}`}
                    onMouseEnter={() => setSel(idx)}
                    onClick={() => {
                      onSelectLesson(item.id, 0);
                      onClose();
                    }}
                  >
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        border: '1.3px solid var(--ink)',
                        background: item.color,
                        display: 'grid',
                        placeItems: 'center',
                        flex: 'none',
                      }}
                    >
                      <Folder size={14} color="#1d1b18" />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 13 }}>{item.title}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.sub}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>{item.meta}</span>
                  </button>
                );
              })}
            </>
          )}

          {results.concepts.length > 0 && (
            <>
              <div className="sx__group">Concepts ({results.concepts.length})</div>
              {results.concepts.map((item) => {
                flatIdx += 1;
                const idx = flatIdx;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`sx__item ${sel === idx ? 'is-sel' : ''}`}
                    onMouseEnter={() => setSel(idx)}
                    onClick={() => {
                      onSelectLesson(item.lessonId, item.stepIndex);
                      onClose();
                    }}
                  >
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        border: '1.3px solid var(--ink)',
                        background: 'var(--violet)',
                        display: 'grid',
                        placeItems: 'center',
                        flex: 'none',
                      }}
                    >
                      <Bookmark size={14} />
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 13 }}>{item.title}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.sub}
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700 }}>{item.meta}</span>
                  </button>
                );
              })}
            </>
          )}

          {results.all.length === 0 && (
            <div style={{ padding: 28, textAlign: 'center', color: 'var(--muted)' }}>
              No matching lessons or concepts for “{query}”.
            </div>
          )}
        </div>

        <div className="sx__foot">
          <span><kbd>↑</kbd> <kbd>↓</kbd> move</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>esc</kbd> close</span>
          <span className="sx__count">{results.all.length} results</span>
        </div>
      </div>
    </div>
  );
};
