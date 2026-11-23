import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Boxes,
  Check,
  ChevronRight,
  Clock,
  FileText,
  Folder,
  Gamepad2,
  LayoutGrid,
  Menu,
  Moon,
  Search,
  Signal,
  Sparkles,
  Sun,
  Trophy,
  X,
} from 'lucide-react';
import { ALL_LESSONS, COURSE_MODULES } from './data/curriculum';
import { IsometricStage } from './components/IsometricStage';
import { GuideRail } from './components/GuideRail';
import { PlayArena } from './components/PlayArena';
import { DesignLab } from './components/DesignLab';
import { CheatsheetsView } from './components/CheatsheetsView';
import { SearchModal } from './components/SearchModal';
import type { AppMode, ParamValues } from './types/course';

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('learn');
  const [dark, setDark] = useState<boolean>(() => readJson<'light' | 'dark'>('ds:theme', 'light') === 'dark');
  const [lessonId, setLessonId] = useState<string>(() => readJson('ds:lesson', ALL_LESSONS[0].id));
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [openMods, setOpenMods] = useState<string[]>(() => COURSE_MODULES.map((m) => m.id));
  const [doneLessons, setDoneLessons] = useState<string[]>(() => readJson('ds:done', []));
  const [solvedGames, setSolvedGames] = useState<string[]>(() => readJson('ds:games', []));
  const [feynmanDone, setFeynmanDone] = useState<string[]>(() => readJson('ds:feynman', []));
  const [progressOpen, setProgressOpen] = useState<boolean>(false);
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [paused, setPaused] = useState<boolean>(false);
  const [replayKey, setReplayKey] = useState<number>(0);
  const [stageFull, setStageFull] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);
  const [paramMap, setParamMap] = useState<Record<string, ParamValues>>({});

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  // Responsive layout attribute (`desktop`, `tablet`, `stack`)
  useEffect(() => {
    const updateLayout = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      document.documentElement.dataset.layout =
        w >= 1200 && h >= 560 ? 'desktop' : w >= 960 && h >= 600 ? 'tablet' : 'stack';
    };
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  // Theme sync
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('ds:theme', JSON.stringify(dark ? 'dark' : 'light'));
  }, [dark]);

  // Persist progress
  useEffect(() => {
    localStorage.setItem('ds:lesson', JSON.stringify(lessonId));
  }, [lessonId]);

  useEffect(() => {
    localStorage.setItem('ds:done', JSON.stringify(doneLessons));
  }, [doneLessons]);

  useEffect(() => {
    localStorage.setItem('ds:games', JSON.stringify(solvedGames));
  }, [solvedGames]);

  useEffect(() => {
    localStorage.setItem('ds:feynman', JSON.stringify(feynmanDone));
  }, [feynmanDone]);

  const lesson = useMemo(
    () => ALL_LESSONS.find((l) => l.id === lessonId) || ALL_LESSONS[0],
    [lessonId]
  );

  const currentModule = useMemo(
    () => COURSE_MODULES.find((m) => m.id === lesson.moduleId) || COURSE_MODULES[0],
    [lesson.moduleId]
  );

  const step = lesson.steps[Math.min(stepIndex, lesson.steps.length - 1)];

  const lessonParams: ParamValues = useMemo(() => {
    const defaults: ParamValues = {};
    lesson.controls.forEach((c) => {
      defaults[c.id] = c.defaultValue;
    });
    return { ...defaults, ...(paramMap[lesson.id] || {}) };
  }, [lesson, paramMap]);

  const handleParamChange = (id: string, val: number | string | boolean) => {
    setParamMap((prev) => ({
      ...prev,
      [lesson.id]: { ...(prev[lesson.id] || {}), [id]: val },
    }));
  };

  const evaluated = useMemo(() => step.evaluate(lessonParams), [step, lessonParams]);

  const selectLesson = useCallback((id: string, targetStep = 0) => {
    const found = ALL_LESSONS.find((l) => l.id === id);
    if (!found) return;
    setMode('learn');
    setLessonId(found.id);
    setOpenMods((prev) => (prev.includes(found.moduleId) ? prev : [...prev, found.moduleId]));
    setStepIndex(Math.max(0, Math.min(targetStep, found.steps.length - 1)));
    setDrawerOpen(false);
    setPaused(false);
  }, []);

  const markLessonDone = useCallback((id: string) => {
    setDoneLessons((prev) => (prev.includes(id) ? prev : [...prev, id]));
  }, []);

  const nextLesson = useMemo(() => {
    const idx = ALL_LESSONS.findIndex((l) => l.id === lesson.id);
    return idx >= 0 && idx < ALL_LESSONS.length - 1 ? ALL_LESSONS[idx + 1] : null;
  }, [lesson.id]);

  const handleNext = useCallback(() => {
    if (stepIndex < lesson.steps.length - 1) {
      const nextIdx = stepIndex + 1;
      setStepIndex(nextIdx);
      if (nextIdx === lesson.steps.length - 1) {
        markLessonDone(lesson.id);
      }
    } else {
      markLessonDone(lesson.id);
      if (nextLesson) {
        selectLesson(nextLesson.id, 0);
        showToast(`Completed "${lesson.title}" (+100 XP)`);
      } else {
        showToast(`All ${ALL_LESSONS.length} lessons completed! Try Play Mode or Design Lab.`);
      }
    }
  }, [stepIndex, lesson, nextLesson, markLessonDone, selectLesson, showToast]);

  const handlePrev = useCallback(() => {
    if (stepIndex > 0) setStepIndex((s) => s - 1);
  }, [stepIndex]);

  const handleFeynmanPass = useCallback(
    (id: string) => {
      if (!feynmanDone.includes(id)) {
        setFeynmanDone((prev) => [...prev, id]);
        showToast('Feynman check passed! (+50 XP)');
      }
    },
    [feynmanDone, showToast]
  );

  // Global Keyboard Shortcuts (`Ctrl/Cmd+K`, `ArrowLeft/Right`, `Space`, `R`)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((o) => !o);
        return;
      }
      if (searchOpen || mode !== 'learn') return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        setPaused((p) => !p);
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        setReplayKey((k) => k + 1);
        setPaused(false);
      } else if (e.key === 'Escape' && stageFull) {
        setStageFull(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [searchOpen, mode, handleNext, handlePrev, stageFull]);

  const totalXp = doneLessons.length * 100 + solvedGames.length * 150 + feynmanDone.length * 50;

  return (
    <div className="window">
      {/* Top Navigation Bar */}
      <header className="topbar">
        <button
          type="button"
          className="menu-btn"
          aria-label="Open course menu"
          onClick={() => setDrawerOpen(true)}
        >
          <Menu size={16} />
        </button>

        <a
          href="#top"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            setMode('learn');
          }}
        >
          <svg className="logo" width="26" height="26" viewBox="0 0 36 36" fill="none" aria-hidden="true">
            <rect x="2" y="2" width="32" height="32" rx="9" fill="var(--green)" stroke="var(--ink)" strokeWidth="2.2" />
            <path d="M18 7L27 12V22L18 27L9 22V12L18 7Z" fill="var(--sheet)" stroke="var(--ink)" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M18 7V17M18 17L27 12M18 17L9 12" stroke="var(--ink)" strokeWidth="1.5" strokeLinejoin="round" />
            <circle cx="18" cy="17" r="2.6" fill="var(--green-3)" stroke="var(--ink)" strokeWidth="1.3" />
          </svg>
          <span className="brand__name">
            Dev<span>Scale</span>
          </span>
        </a>

        <nav className="nav" aria-label="Primary modes">
          <button
            type="button"
            className={`nav__item ${mode === 'learn' ? 'btn-pop is-active' : ''}`}
            onClick={() => setMode('learn')}
          >
            <BookOpen size={15} />
            <span>Learn</span>
          </button>
          <button
            type="button"
            className={`nav__item ${mode === 'play' ? 'btn-pop is-active' : ''}`}
            onClick={() => setMode('play')}
          >
            <Gamepad2 size={15} />
            <span>Play</span>
            <span className="nav__badge">Game</span>
          </button>
          <button
            type="button"
            className={`nav__item ${mode === 'lab' ? 'btn-pop is-active' : ''}`}
            onClick={() => setMode('lab')}
          >
            <Boxes size={15} />
            <span>Design Lab</span>
          </button>
          <button
            type="button"
            className={`nav__item ${mode === 'cheatsheets' ? 'btn-pop is-active' : ''}`}
            onClick={() => setMode('cheatsheets')}
          >
            <LayoutGrid size={15} />
            <span>Cheatsheets</span>
          </button>
        </nav>

        <div className="topbar__right">
          <button type="button" className="search" onClick={() => setSearchOpen(true)} aria-label="Search course">
            <Search size={14} />
            <span className="search__hint">Search DSA, backend, RAG…</span>
            <kbd>Ctrl K</kbd>
          </button>

          <div className="xp-pill" title="Earned from lessons, games & Feynman checks">
            <Trophy size={13} />
            <span>{totalXp} XP</span>
          </div>

          <button
            type="button"
            className="icon-btn"
            aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
            title={dark ? 'Light theme' : 'Dark theme'}
            onClick={() => setDark((d) => !d)}
          >
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className={`body ${mode !== 'learn' ? 'is-wide' : ''}`}>
        {/* Left Course Tree Sidebar (in Learn mode or Slide Drawer on Tablet/Mobile) */}
        {(mode === 'learn' || drawerOpen) && (
          <>
            <div className={`drawer-backdrop ${drawerOpen ? 'is-open' : ''}`} onClick={() => setDrawerOpen(false)} />
            <aside className={`sidebar ${drawerOpen ? 'is-open' : ''}`} aria-label="Course curriculum">
              <div className="drawer-nav">
                <button type="button" className={`nav__item ${mode === 'learn' ? 'btn-pop is-active' : ''}`} onClick={() => { setMode('learn'); setDrawerOpen(false); }}>
                  <BookOpen size={14} /> Learn
                </button>
                <button type="button" className={`nav__item ${mode === 'play' ? 'btn-pop is-active' : ''}`} onClick={() => { setMode('play'); setDrawerOpen(false); }}>
                  <Gamepad2 size={14} /> Play
                </button>
                <button type="button" className={`nav__item ${mode === 'lab' ? 'btn-pop is-active' : ''}`} onClick={() => { setMode('lab'); setDrawerOpen(false); }}>
                  <Boxes size={14} /> Lab
                </button>
                <button type="button" className={`nav__item ${mode === 'cheatsheets' ? 'btn-pop is-active' : ''}`} onClick={() => { setMode('cheatsheets'); setDrawerOpen(false); }}>
                  <LayoutGrid size={14} /> Sheets
                </button>
              </div>

              <div className="tree-root">
                <Folder size={16} />
                <span>AI Full-Stack Path</span>
                <span className="tree-root__meta">{ALL_LESSONS.length} lessons</span>
                <button type="button" className="drawer-close" aria-label="Close menu" onClick={() => setDrawerOpen(false)}>
                  <X size={14} />
                </button>
              </div>

              <nav className="course">
                {COURSE_MODULES.map((mod) => {
                  const isOpen = openMods.includes(mod.id);
                  const doneInMod = mod.lessons.filter((l) => doneLessons.includes(l.id)).length;
                  return (
                    <section key={mod.id} className={`mod ${isOpen ? 'is-open' : ''}`}>
                      <button
                        type="button"
                        className="mod__head"
                        aria-expanded={isOpen}
                        onClick={() =>
                          setOpenMods((prev) =>
                            prev.includes(mod.id) ? prev.filter((x) => x !== mod.id) : [...prev, mod.id]
                          )
                        }
                      >
                        <ChevronRight size={13} className="mod__chev" />
                        <span className="mod__folder" style={{ background: mod.color }} />
                        <span>
                          {mod.num}. {mod.title}
                        </span>
                        <span className="mod__count">
                          {doneInMod}/{mod.lessons.length}
                        </span>
                      </button>
                      <ul className="mod__list">
                        {mod.lessons.map((l) => {
                          const isCurrent = l.id === lesson.id;
                          const isDone = doneLessons.includes(l.id);
                          return (
                            <li key={l.id} className="lesson" data-done={isDone}>
                              <button
                                type="button"
                                className={`lesson__btn ${isCurrent ? 'btn-pop' : ''}`}
                                onClick={() => selectLesson(l.id, 0)}
                              >
                                <span className="lesson__mark">
                                  {isDone ? <Check size={12} strokeWidth={3} /> : <FileText size={12} />}
                                </span>
                                <span>{l.title}</span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  );
                })}
              </nav>

              {/* Progress Card */}
              <section className="card progress">
                <button
                  type="button"
                  className="progress__head"
                  aria-expanded={progressOpen}
                  onClick={() => setProgressOpen((o) => !o)}
                >
                  <span>PROGRESS</span>
                  <span className="progress__stat">
                    {doneLessons.length} / {ALL_LESSONS.length}
                  </span>
                  <ChevronRight
                    size={13}
                    style={{ transform: progressOpen ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                  />
                </button>
                <div className="progress__bar">
                  <div
                    className="progress__fill"
                    style={{ width: `${Math.round((doneLessons.length / ALL_LESSONS.length) * 100)}%` }}
                  />
                </div>
                {progressOpen && (
                  <div className="progress__body">
                    {COURSE_MODULES.map((m) => {
                      const d = m.lessons.filter((l) => doneLessons.includes(l.id)).length;
                      return (
                        <div key={m.id} className="progress__row">
                          <span className="goal-box" style={d === m.lessons.length ? { background: 'var(--green)' } : undefined}>
                            {d === m.lessons.length && <Check size={10} />}
                          </span>
                          <span>{m.title}</span>
                          <span>
                            {d}/{m.lessons.length}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </aside>
          </>
        )}

        {/* Mode Views */}
        {mode === 'learn' && (
          <>
            <main className="sheet">
              <div className="lesson-head">
                <div className="crumb">
                  {currentModule.num}. {currentModule.title} / Lesson {lesson.num} of {currentModule.lessons.length}
                </div>
                <div className="lesson-head__row">
                  <h1 className="title">{lesson.title}</h1>
                  <div className="tags">
                    <span className="tag tag--sand">
                      <Clock size={12} /> {lesson.duration}
                    </span>
                    <span className="tag tag--mint">
                      <Signal size={12} /> {lesson.level}
                    </span>
                    <span className="tag tag--violet">
                      <Sparkles size={12} /> {lesson.steps.length} {lesson.steps.length === 1 ? 'step' : 'steps'}
                    </span>
                  </div>
                </div>
                <p className="subtitle">{lesson.subtitle}</p>
              </div>

              <IsometricStage
                metrics={evaluated.metrics}
                scene={evaluated.scene}
                controls={lesson.controls}
                params={lessonParams}
                onParamChange={handleParamChange}
                paused={paused}
                onTogglePause={() => setPaused((p) => !p)}
                replayKey={replayKey}
                onReplay={() => {
                  setReplayKey((k) => k + 1);
                  setPaused(false);
                }}
                isFullscreen={stageFull}
                onToggleFullscreen={() => setStageFull((f) => !f)}
                stepKey={`${lesson.id}-${step.id}`}
              />

              {/* Numbered Stepper Timeline */}
              <section className="card timeline">
                <div className="timeline__head">
                  <span className="eyebrow">IN THIS LESSON</span>
                  <span className="timeline__count">
                    Step {stepIndex + 1} of {lesson.steps.length}
                  </span>
                </div>
                <div className="timeline__track" style={{ '--n': lesson.steps.length } as React.CSSProperties}>
                  <div className="timeline__rail">
                    <span
                      style={{
                        width:
                          lesson.steps.length > 1
                            ? `${(stepIndex / (lesson.steps.length - 1)) * 100}%`
                            : '100%',
                      }}
                    />
                  </div>
                  <ol className="timeline__steps">
                    {lesson.steps.map((s, idx) => {
                      const cls =
                        idx === stepIndex ? 'is-current' : idx < stepIndex ? 'is-done' : '';
                      return (
                        <li key={s.id} className={cls}>
                          <button
                            type="button"
                            title={s.title}
                            onClick={() => {
                              setStepIndex(idx);
                              if (idx === lesson.steps.length - 1) markLessonDone(lesson.id);
                            }}
                          >
                            <span className="timeline__dot">{idx + 1}</span>
                            <span className="timeline__label">{s.short}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </section>
            </main>

            <GuideRail
              lesson={lesson}
              step={step}
              stepIndex={stepIndex}
              totalSteps={lesson.steps.length}
              nextLessonTitle={nextLesson?.title}
              onPrev={handlePrev}
              onNext={handleNext}
              onFeynmanPass={handleFeynmanPass}
            />
          </>
        )}

        {mode === 'play' && (
          <PlayArena
            solvedGames={solvedGames}
            onSolveGame={(id, xp) => {
              setSolvedGames((prev) => (prev.includes(id) ? prev : [...prev, id]));
              showToast(`Challenge cleared! +${xp} XP earned`);
            }}
          />
        )}

        {mode === 'lab' && <DesignLab />}

        {mode === 'cheatsheets' && <CheatsheetsView />}
      </div>

      {/* Command Palette Search */}
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} onSelectLesson={selectLesson} />

      {/* Toast Notification */}
      {toast && (
        <div className="toast" role="status" aria-live="polite">
          <span className="toast__icon">
            <Sparkles size={14} />
          </span>
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
};

export default App;
