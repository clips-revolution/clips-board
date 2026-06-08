'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Send,
  Image as ImageIcon,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  Film,
  Clock,
  ChevronDown,
  Clapperboard,
  Zap,
} from 'lucide-react';

/* ──────────────────────────────────────────
   Type Definitions
────────────────────────────────────────── */
interface TimelineScene {
  scene_number: number;
  time_start: string;
  time_end: string;
  duration_seconds: number;
  scene_title_hebrew: string;
  narrative_description_hebrew: string;
  visual_prompt_english: string;
  imageUrl?: string;
}

interface StoryboardTimeline {
  total_duration_requested: number;
  pacing_analysis: string;
  recommended_scene_count: number;
  scenes: TimelineScene[];
}

interface DurationOption {
  seconds: number;
  label: string;
  description: string;
}

/* ──────────────────────────────────────────
   Constants
────────────────────────────────────────── */
const DURATION_OPTIONS: DurationOption[] = [
  { seconds: 15, label: '15s', description: 'אולטרה קצר' },
  { seconds: 30, label: '30s', description: 'קצר' },
  { seconds: 60, label: '60s', description: 'סטנדרטי' },
  { seconds: 120, label: '120s', description: 'סינמטי' },
];

const LOADING_PHASES = [
  'מנתח את הקונספט...',
  'בוחן את משך הסרטון...',
  'בונה ציר זמן מקצועי...',
  'מתכנן סצנות ופייסינג...',
  'כותב תסריט ויזואלי...',
  'ממלא פרטי הנחיה למנוע התמונות...',
  'מסיים את לוח הסטוריבורד...',
];

/* ──────────────────────────────────────────
   Component
────────────────────────────────────────── */
export default function StoryboardCreator() {
  // Input state
  const [concept, setConcept] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<number>(60);
  const [isCustomDuration, setIsCustomDuration] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(1);
  const [customSeconds, setCustomSeconds] = useState(30);

  // Sync custom duration
  useEffect(() => {
    if (isCustomDuration) {
      setSelectedDuration(customMinutes * 60 + customSeconds);
    }
  }, [isCustomDuration, customMinutes, customSeconds]);


  // API & loading state
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // Storyboard result state
  const [storyboard, setStoryboard] = useState<StoryboardTimeline | null>(null);
  const [activeTimelineBlock, setActiveTimelineBlock] = useState<number | null>(null);
  const [expandedPrompts, setExpandedPrompts] = useState<Record<number, boolean>>({});

  // Image generation state
  const [generatingImages, setGeneratingImages] = useState<Record<number, boolean>>({});

  // Toast
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    isError: boolean;
  }>({ show: false, message: '', isError: false });

  const sceneRefs = useRef<Record<number, HTMLDivElement | null>>({});

  /* ── Toast ── */
  const showToast = useCallback((message: string, isError = false) => {
    setToast({ show: true, message, isError });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  }, []);

  /* ── Cinematic Loading Phase Cycle ── */
  useEffect(() => {
    if (!isLoading) return;

    setLoadingPhase(0);
    setLoadingProgress(5);

    const phaseInterval = setInterval(() => {
      setLoadingPhase((prev) => {
        const next = prev + 1;
        if (next >= LOADING_PHASES.length) {
          return LOADING_PHASES.length - 1; // stay on last phase
        }
        return next;
      });
    }, 2800);

    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 92) return prev; // cap near end
        return prev + Math.random() * 8 + 2;
      });
    }, 1400);

    return () => {
      clearInterval(phaseInterval);
      clearInterval(progressInterval);
    };
  }, [isLoading]);

  /* ── Generate Storyboard ── */
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept.trim()) return;

    setIsLoading(true);
    setStoryboard(null);
    setExpandedPrompts({});
    setActiveTimelineBlock(null);

    try {
      const response = await fetch('/api/generate-storyboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-App-Password': sessionStorage.getItem('app_password') || '',
        },
        body: JSON.stringify({
          user_concept: concept,
          duration_seconds: selectedDuration,
        }),
      });

      if (response.status === 401) {
        sessionStorage.removeItem('app_password');
        window.location.reload();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'אירעה שגיאה בתהליך יצירת הסטוריבורד');
      }

      setLoadingProgress(100);
      // Brief pause to let progress bar fill
      await new Promise((r) => setTimeout(r, 500));

      setStoryboard(data);
      showToast(`הסטוריבורד נוצר בהצלחה! ${data.scenes.length} סצנות ב-${data.total_duration_requested} שניות`);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'כשל בחיבור לשרת', true);
    } finally {
      setIsLoading(false);
      setLoadingProgress(0);
    }
  };

  /* ── Generate Image for a Scene ── */
  const generateImage = async (sceneNumber: number) => {
    if (!storyboard) return;
    const scene = storyboard.scenes.find((s) => s.scene_number === sceneNumber);
    if (!scene) return;

    setGeneratingImages((prev) => ({ ...prev, [sceneNumber]: true }));

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-App-Password': sessionStorage.getItem('app_password') || '',
        },
        body: JSON.stringify({
          imagePrompt: scene.visual_prompt_english,
          style: 'Cinematic commercial video production still, consistent character appearance and art direction throughout',
          sceneNumber: scene.scene_number,
        }),
      });

      if (response.status === 401) {
        sessionStorage.removeItem('app_password');
        window.location.reload();
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'אירעה שגיאה ביצירת התמונה');
      }

      setStoryboard((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          scenes: prev.scenes.map((s) =>
            s.scene_number === sceneNumber ? { ...s, imageUrl: data.imageUrl } : s
          ),
        };
      });

      showToast(`תמונה עבור סצנה ${sceneNumber} נוצרה בהצלחה!`);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'כשל ביצירת תמונה', true);
    } finally {
      setGeneratingImages((prev) => ({ ...prev, [sceneNumber]: false }));
    }
  };

  /* ── Generate All Images ── */
  const generateAllImages = async () => {
    if (!storyboard) return;
    showToast('מתחיל יצירת תמונות רציפה עבור כל הסצנות...');
    for (const scene of storyboard.scenes) {
      if (!scene.imageUrl) {
        await generateImage(scene.scene_number);
      }
    }
  };

  /* ── Send to Production ── */
  const sendToProduction = async () => {
    if (!storyboard) return;
    try {
      // 1. Send to server for logging
      const response = await fetch('/api/send-to-production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept,
          duration: storyboard.total_duration_requested,
          pacing: storyboard.pacing_analysis,
          scenes: storyboard.scenes,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'שגיאה בשליחה להפקה');
      
      // Show success message
      showToast('הסטוריבורד נשלח למערכת ומעביר אותך לוואטסאפ...');

      // 2. Format the message for WhatsApp
      const scenesText = storyboard.scenes
        .map((s) => {
          let sceneStr = `*סצנה ${s.scene_number}* (${s.time_start} - ${s.time_end}):\n*כותרת:* ${s.scene_title_hebrew}\n*תיאור:* ${s.narrative_description_hebrew}`;
          if (s.imageUrl) {
            sceneStr += `\n*קישור לתמונה:* ${s.imageUrl}`;
          }
          return sceneStr;
        })
        .join('\n\n');

      const whatsappText = `שלום, ברצוני לשלוח את הסטוריבורד הבא להפקה:

🎬 *קונספט:* ${concept.trim()}
⏱️ *אורך מבוקש:* ${storyboard.total_duration_requested} שניות
⚡ *פייסינג:* ${storyboard.pacing_analysis}

*פירוט הסצנות:*
${scenesText}`;

      // 3. Open WhatsApp chat with pre-populated message
      const whatsappUrl = `https://wa.me/972549445274?text=${encodeURIComponent(whatsappText)}`;
      window.open(whatsappUrl, '_blank');

    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'שליחה להפקה נכשלה', true);
    }
  };

  /* ── Toggle Prompt Visibility ── */
  const togglePrompt = (sceneNumber: number) => {
    setExpandedPrompts((prev) => ({
      ...prev,
      [sceneNumber]: !prev[sceneNumber],
    }));
  };

  /* ── Scroll to Scene Card ── */
  const scrollToScene = (sceneNumber: number) => {
    setActiveTimelineBlock(sceneNumber);
    const el = sceneRefs.current[sceneNumber];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  /* ── Format seconds to display ── */
  const formatDuration = (seconds: number) => {
    if (seconds >= 60) {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return s > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${m}:00`;
    }
    return `0:${String(seconds).padStart(2, '0')}`;
  };

  /* ════════════════════════════════════════
     RENDER
  ════════════════════════════════════════ */
  return (
    <div style={{ position: 'relative', zIndex: 10, width: '100%' }}>

      {/* ═══ STATE 1: Input Concept + Duration Form ═══ */}
      <div className="workspace-card">
        <div className="preview-glow" />
        <div className="card-bar" />

        <form onSubmit={handleGenerate} className="form-group">
          <label className="form-label" htmlFor="concept-input">
            <Sparkles size={18} style={{ color: 'var(--primary-hover)' }} />
            הזן את רעיון הסרטון שלך (עברית)
          </label>
          <textarea
            id="concept-input"
            className="textarea-field"
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            placeholder="תאר את הקונספט הכללי לסרטון שלך... לדוגמה: פרסומת לרשת חדרי כושר יוקרתית. הגיבור מתחיל את יומו עייף במשרד אפור, מקבל הודעה בטלפון, מגיע להתאמן בחדר כושר עתידני ומואר בתאורת ניאון סגולה, ויוצא מלא מוטיבציה לעולם צבעוני ותוסס."
            disabled={isLoading}
            required
          />

          {/* ── Duration Selector ── */}
          <div style={{ marginTop: '1.25rem' }}>
            <label
              className="form-label"
              style={{ marginBottom: '0.6rem', display: 'flex' }}
            >
              <Clock size={16} style={{ color: 'var(--primary-hover)' }} />
              בחר משך סרטון
            </label>
            <div className="duration-selector">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.seconds}
                  type="button"
                  className={`duration-chip${!isCustomDuration && selectedDuration === opt.seconds ? ' active' : ''}`}
                  onClick={() => {
                    setIsCustomDuration(false);
                    setSelectedDuration(opt.seconds);
                  }}
                  disabled={isLoading}
                >
                  <span className="duration-chip-time">{opt.label}</span>
                  <span className="duration-chip-label">{opt.description}</span>
                </button>
              ))}

              {/* Manual Input Chip */}
              <button
                type="button"
                className={`duration-chip${isCustomDuration ? ' active' : ''}`}
                onClick={() => {
                  setIsCustomDuration(true);
                  setSelectedDuration(customMinutes * 60 + customSeconds);
                }}
                disabled={isLoading}
              >
                <span className="duration-chip-time">ידני</span>
                <span className="duration-chip-label">רשום אורך ידני</span>
              </button>
            </div>

            {/* Custom Manual Duration Input Fields */}
            {isCustomDuration && (
              <div 
                style={{ 
                  marginTop: '1rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  width: 'fit-content'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>דקות</label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                    disabled={isLoading}
                    style={{
                      width: '70px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '6px',
                      color: '#fff',
                      padding: '0.4rem',
                      textAlign: 'center',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>
                
                <span style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginTop: '1rem' }}>:</span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>שניות</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={customSeconds}
                    onChange={(e) => setCustomSeconds(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                    disabled={isLoading}
                    style={{
                      width: '70px',
                      background: 'rgba(0, 0, 0, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '6px',
                      color: '#fff',
                      padding: '0.4rem',
                      textAlign: 'center',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ marginRight: '0.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--primary-hover)', fontWeight: 600, marginTop: '0.8rem' }}>
                    סה״כ: {customMinutes * 60 + customSeconds} שניות
                  </span>
                </div>
              </div>
            )}
          </div>


          {/* ── Submit ── */}
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading || !concept.trim() || selectedDuration <= 0}
            >
              <Film size={16} />
              <span>צור סטוריבורד מתוזמן</span>
            </button>

            {storyboard && (
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setStoryboard(null);
                  setExpandedPrompts({});
                  setActiveTimelineBlock(null);
                }}
                disabled={isLoading}
              >
                נקה לוח
              </button>
            )}
          </div>
        </form>
      </div>

      {/* ═══ CINEMATIC LOADING OVERLAY ═══ */}
      {isLoading && (
        <div className="cinematic-loader" id="cinematic-loader">
          <div className="film-grain" />
          <div className="cinematic-inner">
            {/* Rotating rings */}
            <div className="loader-ring-container">
              <div className="loader-ring" />
              <div className="loader-ring-2" />
              <div className="loader-ring-3" />
              <div className="loader-ring-icon">
                <Clapperboard size={32} />
              </div>
            </div>

            {/* Title */}
            <div className="loader-title">
              הבמאי הווירטואלי שלך עובד
            </div>

            {/* Phase text */}
            <div className="loader-phase" key={loadingPhase}>
              {LOADING_PHASES[loadingPhase]}
            </div>

            {/* Progress bar */}
            <div className="loader-progress-bar">
              <div
                className="loader-progress-fill"
                style={{ width: `${Math.min(loadingProgress, 100)}%` }}
              />
            </div>

            <div className="loader-hint">
              {selectedDuration >= 60 ? `${formatDuration(selectedDuration)} דקות` : `${selectedDuration} שניות`} · {isCustomDuration ? 'אורך ידני' : DURATION_OPTIONS.find((o) => o.seconds === selectedDuration)?.description || ''}
            </div>
          </div>
        </div>
      )}

      {/* ═══ STATE 2: Storyboard Timeline Results ═══ */}
      {storyboard && (
        <div className="storyboard-container reveal visible">

          {/* ── Storyboard Header ── */}
          <div className="storyboard-header">
            <h2 className="storyboard-title">
              <Film size={22} style={{ color: 'var(--primary)' }} />
              <span>ציר הזמן — {storyboard.scenes.length} סצנות · {formatDuration(storyboard.total_duration_requested)}</span>
            </h2>
          </div>


          {/* ── Visual Timeline Strip ── */}
          <div className="timeline-strip">
            <div className="timeline-total">
              <span>סה״כ {formatDuration(storyboard.total_duration_requested)}</span>
              <span>{storyboard.scenes.length} סצנות</span>
            </div>

            <div className="timeline-track">
              {storyboard.scenes.map((scene) => {
                const widthPercent =
                  (scene.duration_seconds / storyboard.total_duration_requested) * 100;
                return (
                  <div
                    key={scene.scene_number}
                    className={`timeline-block${activeTimelineBlock === scene.scene_number ? ' active' : ''}`}
                    style={{ width: `${widthPercent}%` }}
                    onClick={() => scrollToScene(scene.scene_number)}
                    title={`סצנה ${scene.scene_number}: ${scene.time_start} — ${scene.time_end}`}
                  >
                    <span className="timeline-block-label">
                      {scene.scene_number}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="timeline-markers">
              <span>0:00</span>
              {storyboard.scenes.length > 2 && (
                <span>
                  {formatDuration(Math.floor(storyboard.total_duration_requested / 2))}
                </span>
              )}
              <span>{formatDuration(storyboard.total_duration_requested)}</span>
            </div>
          </div>

          {/* ── Scene Cards ── */}
          <div className="storyboard-grid">
            {storyboard.scenes.map((scene, index) => {
              const isGenerating = generatingImages[scene.scene_number] || false;
              const isPromptOpen = expandedPrompts[scene.scene_number] || false;

              return (
                <div
                  className="scene-card-timeline"
                  key={scene.scene_number}
                  ref={(el) => { sceneRefs.current[scene.scene_number] = el; }}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => setActiveTimelineBlock(scene.scene_number)}
                >
                  {/* ── Header: Number + Title + Time ── */}
                  <div className="scene-card-header">
                    <div className="scene-number-badge">
                      {scene.scene_number}
                    </div>
                    <div className="scene-card-title">
                      {scene.scene_title_hebrew}
                    </div>
                    <div className="time-pill">
                      <Clock size={13} />
                      <span>{scene.time_start}</span>
                      <div className="time-divider" />
                      <span>{scene.time_end}</span>
                    </div>
                    <div className="duration-tag">
                      {scene.duration_seconds}s
                    </div>
                  </div>

                  {/* ── Narrative Description ── */}
                  <div className="scene-body-section">
                    <span className="scene-body-label">תיאור הנרטיב</span>
                    <div className="scene-narrative-box">
                      {scene.narrative_description_hebrew}
                    </div>
                  </div>

                  {/* ── Image Area (Only shown if generated or loading) ── */}
                  {(scene.imageUrl || isGenerating) && (
                    <div className="image-frame" style={{ marginTop: '1rem', maxHeight: '240px' }}>
                      {isGenerating ? (
                        <div className="card-loader">
                          <RefreshCw className="loader-spinner" />
                          <span>מייצר תמונה...</span>
                        </div>
                      ) : (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={scene.imageUrl}
                            alt={scene.scene_title_hebrew}
                            className="scene-image"
                          />
                          <div className="image-overlay">
                            <button
                              type="button"
                              className="btn-action-small"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(scene.imageUrl, '_blank');
                              }}
                            >
                              <Eye size={12} />
                              <span>הגדל</span>
                            </button>
                            <button
                              type="button"
                              className="btn-action-small primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                generateImage(scene.scene_number);
                              }}
                            >
                              <RefreshCw size={12} />
                              <span>צור מחדש</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* ── Visual Prompt (Expandable) & Optional Image Trigger ── */}
                  <div className="scene-card-actions" style={{ marginTop: '1rem' }}>
                    <button
                      type="button"
                      className={`prompt-toggle${isPromptOpen ? ' open' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePrompt(scene.scene_number);
                      }}
                    >
                      <ChevronDown size={14} />
                      <span>הנחיה למנוע התמונות</span>
                    </button>

                    {!scene.imageUrl && !isGenerating && (
                      <button
                        type="button"
                        className="btn-action-small"
                        style={{
                          background: 'rgba(168, 85, 247, 0.05)',
                          border: '1px dashed rgba(168, 85, 247, 0.3)',
                          color: 'var(--primary-hover)',
                          fontSize: '0.75rem',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          generateImage(scene.scene_number);
                        }}
                      >
                        <Sparkles size={12} />
                        <span>ייצר תמונה (בונוס אופציונלי)</span>
                      </button>
                    )}
                  </div>


                  <div className={`prompt-reveal${isPromptOpen ? ' open' : ''}`}>
                    <div className="prompt-code">
                      {scene.visual_prompt_english}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Send to Production ── */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem', marginBottom: '2rem' }}>
            <button
              type="button"
              className="btn-primary"
              onClick={sendToProduction}
              style={{ padding: '1.2rem 3rem', fontSize: '1.1rem' }}
            >
              <Send size={18} />
              <span>שלח להפקה</span>
            </button>
          </div>
        </div>
      )}

      {/* ═══ Toast Alert ═══ */}
      <div className={`toast ${toast.show ? 'show' : ''} ${toast.isError ? 'error' : ''}`}>
        {toast.isError ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
        <span>{toast.message}</span>
      </div>
    </div>
  );
}
