import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Code2,
  Lightbulb,
  MessageSquare,
  Mic,
  MicOff,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { Lesson, LessonStep } from '../types/course';

interface GuideRailProps {
  lesson: Lesson;
  step: LessonStep;
  stepIndex: number;
  totalSteps: number;
  nextLessonTitle?: string;
  onPrev: () => void;
  onNext: () => void;
  onFeynmanPass: (lessonId: string) => void;
}

const CHAPTER_LABEL: Record<string, string> = {
  setup: 'SETUP',
  problem: 'PROBLEM',
  solution: 'SOLUTION',
  technique: 'TECHNIQUE',
  tradeoff: 'TRADE-OFF',
  compare: 'COMPARE',
  insight: 'INSIGHT',
  recap: 'RECAP',
};

export const GuideRail: React.FC<GuideRailProps> = ({
  lesson,
  step,
  stepIndex,
  totalSteps,
  nextLessonTitle,
  onPrev,
  onNext,
  onFeynmanPass,
}) => {
  const [tab, setTab] = useState<'story' | 'code' | 'say'>('story');
  const [codeLang, setCodeLang] = useState<'ts' | 'py'>('ts');
  const [readingIdx, setReadingIdx] = useState<number | null>(null);
  const [speaking, setSpeaking] = useState(false);

  // Feynman ("Understand by Saying") state
  const [answer, setAnswer] = useState('');
  const [listening, setListening] = useState(false);
  const [showSample, setShowSample] = useState(false);

  // Stop speech when step/lesson changes
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
    setReadingIdx(null);
  }, [lesson.id, step.id]);

  useEffect(() => {
    setAnswer('');
    setShowSample(false);
  }, [lesson.id]);

  const toggleSpeak = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setReadingIdx(null);
      return;
    }

    const stripHtml = (s: string) => s.replace(/<[^>]+>/g, '');
    const items = [step.title, ...step.paragraphs.map(stripHtml)];
    if (step.callout) items.push(`${step.callout.title}: ${step.callout.text}`);

    setSpeaking(true);
    let idx = 0;
    const speakNext = () => {
      if (idx >= items.length) {
        setSpeaking(false);
        setReadingIdx(null);
        return;
      }
      setReadingIdx(idx === 0 ? -1 : idx - 1);
      const u = new SpeechSynthesisUtterance(items[idx]);
      u.rate = 1.02;
      u.onend = () => {
        idx += 1;
        speakNext();
      };
      u.onerror = () => {
        setSpeaking(false);
        setReadingIdx(null);
      };
      window.speechSynthesis.speak(u);
    };
    speakNext();
  };

  const toggleMic = () => {
    const SpeechRec =
      (window as unknown as { SpeechRecognition?: new () => any; webkitSpeechRecognition?: new () => any })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => any }).webkitSpeechRecognition;

    if (!SpeechRec) {
      setAnswer((prev) => prev || lesson.feynman.sampleAnswer);
      return;
    }

    if (listening) {
      setListening(false);
      return;
    }

    const rec = new SpeechRec();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.onresult = (e: any) => {
      const txt = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join(' ');
      setAnswer(txt);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    setListening(true);
    rec.start();
  };

  const checkpointHits = lesson.feynman.checkpoints.map((cp) => {
    const low = answer.toLowerCase();
    return cp.keywords.some((kw) => low.includes(kw));
  });
  const allCheckpointsHit = checkpointHits.every(Boolean);

  useEffect(() => {
    if (allCheckpointsHit && answer.trim().length > 15) {
      onFeynmanPass(lesson.id);
    }
  }, [allCheckpointsHit, answer, lesson.id, onFeynmanPass]);

  const isLast = stepIndex === totalSteps - 1;
  const nextLabel = isLast
    ? nextLessonTitle
      ? `Next: ${nextLessonTitle}`
      : 'Finish Course'
    : `Next: ${lesson.steps[stepIndex + 1].short}`;

  const lines = codeLang === 'ts' ? lesson.codeTrace.ts : lesson.codeTrace.py;
  const activeRange = step.activeCodeLines?.[codeLang];

  return (
    <aside className="rail">
      <section className="card guide">
        {/* Step Meta + Read Aloud */}
        <div className="guide__meta">
          <span className="eyebrow">
            STEP {stepIndex + 1} / {totalSteps}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button
              type="button"
              className={`tool ${speaking ? 'is-on' : ''}`}
              style={{ height: 24, padding: '0 8px', fontSize: 11 }}
              title="Read step aloud"
              onClick={toggleSpeak}
            >
              {speaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
              <span>{speaking ? 'Stop' : 'Listen'}</span>
            </button>
            <span className={`chapter chapter--${step.chapter}`}>{CHAPTER_LABEL[step.chapter]}</span>
          </div>
        </div>

        {/* Guide Sub-Tabs: Story | Code Trace | Say It */}
        <div className="guide__tabs" role="tablist">
          <button type="button" className={tab === 'story' ? 'is-on' : ''} onClick={() => setTab('story')}>
            <BookOpen size={12} /> Story
          </button>
          <button type="button" className={tab === 'code' ? 'is-on' : ''} onClick={() => setTab('code')}>
            <Code2 size={12} /> Code Trace
          </button>
          <button type="button" className={tab === 'say' ? 'is-on' : ''} onClick={() => setTab('say')}>
            <MessageSquare size={12} /> Say It
          </button>
        </div>

        {/* Content Body */}
        <div className="guide__content" key={`${lesson.id}-${step.id}-${tab}`}>
          {tab === 'story' && (
            <>
              <h2 className="guide__title">{step.title}</h2>
              <div className="guide__body">
                {step.paragraphs.map((html, i) => (
                  <p
                    key={i}
                    className={readingIdx === i ? 'is-reading' : ''}
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                ))}

                {step.compare && (
                  <table className="compare">
                    <thead>
                      <tr>
                        {step.compare.headers.map((h) => (
                          <th key={h}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {step.compare.rows.map((row, ri) => (
                        <tr key={ri}>
                          {row.map((cell, ci) => (
                            <td key={ci}>{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {step.callout && (
                  <div className={`callout callout--${step.callout.kind}`}>
                    <div className="callout__icon">
                      {step.callout.kind === 'warn' ? (
                        <AlertTriangle size={14} />
                      ) : step.callout.kind === 'tip' ? (
                        <Lightbulb size={14} />
                      ) : step.callout.kind === 'insight' ? (
                        <Sparkles size={14} />
                      ) : (
                        <ArrowRight size={14} />
                      )}
                    </div>
                    <div>
                      <div className="callout__title">{step.callout.title}</div>
                      <p>{step.callout.text}</p>
                    </div>
                  </div>
                )}

                {step.changes && step.changes.length > 0 && (
                  <div className="changes">
                    <div className="eyebrow">WHAT CHANGED</div>
                    <ul>
                      {step.changes.map((ch, idx) => (
                        <li key={idx}>
                          <span className={`change-badge change-badge--${ch.kind}`}>
                            {ch.kind === 'add' ? '+' : ch.kind === 'warn' ? '!' : '~'}
                          </span>
                          <span>{ch.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}

          {tab === 'code' && (
            <div style={{ marginTop: 8 }}>
              <div className="code-trace">
                <div className="code-trace__bar">
                  <span>{lesson.codeTrace.title}</span>
                  <div className="sim-seg">
                    <button type="button" className={codeLang === 'ts' ? 'is-on' : ''} onClick={() => setCodeLang('ts')}>
                      TS
                    </button>
                    <button type="button" className={codeLang === 'py' ? 'is-on' : ''} onClick={() => setCodeLang('py')}>
                      Py
                    </button>
                  </div>
                </div>
                {lines.map((line, i) => {
                  const lineNum = i + 1;
                  const active = activeRange && lineNum >= activeRange[0] && lineNum <= activeRange[1];
                  return (
                    <div key={i} className={`code-line ${active ? 'is-active' : ''}`}>
                      <span className="code-line__num">{lineNum}</span>
                      <span>{line || ' '}</span>
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 8, lineHeight: 1.5 }}>
                Highlighted lines correspond directly to Step {stepIndex + 1} ({step.short}) in the diagram.
              </p>
            </div>
          )}

          {tab === 'say' && (
            <div className="feynman-box" style={{ marginTop: 8 }}>
              <div className="callout callout--insight">
                <div className="callout__icon">
                  <Mic size={14} />
                </div>
                <div>
                  <div className="callout__title">UNDERSTAND BY SAYING (FEYNMAN CHECK)</div>
                  <p>{lesson.feynman.prompt}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" className={`btn-ghost ${listening ? 'is-on' : ''}`} style={{ height: 30, fontSize: 11.5 }} onClick={toggleMic}>
                  {listening ? <MicOff size={13} /> : <Mic size={13} />}
                  {listening ? 'Listening…' : 'Speak Answer'}
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ height: 30, fontSize: 11.5 }}
                  onClick={() => setShowSample((s) => !s)}
                >
                  {showSample ? 'Hide Model Answer' : 'Show Model Answer'}
                </button>
              </div>

              <textarea
                placeholder="Explain it in your own words (type or use Speak Answer)…"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              />

              <div className="feynman-checks">
                {lesson.feynman.checkpoints.map((cp, i) => {
                  const hit = checkpointHits[i];
                  return (
                    <div key={cp.label} className={`feynman-check ${hit ? 'is-hit' : ''}`}>
                      <span className="goal-box" style={hit ? { background: 'var(--green)', borderColor: 'var(--ink)' } : undefined}>
                        {hit && <Check size={10} />}
                      </span>
                      <span>{cp.label}</span>
                    </div>
                  );
                })}
              </div>

              {showSample && (
                <div className="callout callout--tip">
                  <div>
                    <div className="callout__title">REFERENCE EXPLANATION</div>
                    <p>{lesson.feynman.sampleAnswer}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="guide__nav">
          <button type="button" className="btn-ghost" disabled={stepIndex === 0} onClick={onPrev}>
            <ArrowLeft size={14} /> Back
          </button>
          <button type="button" className="btn-pop btn-next" onClick={onNext}>
            <span className="btn-next__label">{nextLabel}</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="guide__hint">
          <kbd>←</kbd> <kbd>→</kbd> step · <kbd>R</kbd> replay · <kbd>Space</kbd> pause
        </div>
      </section>

      {/* Bottom Goals Checklist */}
      <section className="card goals">
        <div className="eyebrow">YOU’LL LEARN</div>
        <ul>
          {lesson.goals.map((g, idx) => {
            const hit = step.goalHits.includes(idx);
            return (
              <li key={idx} className={hit ? 'is-hit' : ''}>
                <span className="goal-box">{hit && <Check size={10} strokeWidth={3} />}</span>
                <span>{g}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </aside>
  );
};
