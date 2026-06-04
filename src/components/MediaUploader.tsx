'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image as ImageIcon,
  Music,
  Upload,
  X,
  Plus,
  Play,
  Pause,
  Trash2,
  Lock,
  Loader2,
  AlertCircle,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MediaUploaderProps {
  eventId: string;
  heroMedia: { url: string; type: 'image' | 'video' }[];
  backgroundMusicUrl?: string;
  plan: 'essentiel' | 'pro' | 'premium';
  onUpdateMedia: (media: { url: string; type: 'image' | 'video' }[]) => void;
  onUpdateMusic: (url: string) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PLAN_IMAGE_LIMITS: Record<string, number> = {
  essentiel: 1,
  pro: 5,
  premium: 10,
};

const PLAN_LABELS: Record<string, string> = {
  essentiel: '1 image',
  pro: '5 images (diaporama)',
  premium: '10 images (diaporama)',
};

const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/webp';
const ACCEPTED_AUDIO_TYPES = '.mp3,.m4a,.ogg';
const MAX_AUDIO_SIZE_MB = 10;

// ---------------------------------------------------------------------------
// Upload helper
// ---------------------------------------------------------------------------

const uploadFile = async (file: File, eventId: string, path: string): Promise<string> => {
  const { createClient } = await import('@/lib/supabase/client');
  const supabase = createClient();

  const filePath = `${eventId}/${path}/${Date.now()}-${file.name}`;
  const { error } = await supabase.storage
    .from('event-media')
    .upload(filePath, file);

  if (error) throw error;

  const { data: { publicUrl } } = supabase.storage
    .from('event-media')
    .getPublicUrl(filePath);

  return publicUrl;
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeader({ icon: Icon, title, badge }: { icon: React.ElementType; title: string; badge?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={18} style={{ color: 'var(--gold, #D4AF37)' }} />
      </div>
      <h3 className="font-display" style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
        {title}
      </h3>
      {badge}
    </div>
  );
}

function UploadError({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem',
        padding: '0.6rem 0.85rem', borderRadius: 10, marginBottom: '0.75rem',
        background: 'rgba(220,53,69,0.08)', border: '1px solid rgba(220,53,69,0.2)',
        color: '#DC3545', fontSize: '0.78rem', fontWeight: 500,
      }}
    >
      <AlertCircle size={14} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onDismiss}
        style={{
          background: 'none', border: 'none', padding: 2,
          cursor: 'pointer', color: '#DC3545', flexShrink: 0,
        }}
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

function UploadSpinner() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.4rem',
      padding: '0.4rem 0.75rem', borderRadius: 8,
      background: 'rgba(200,169,110,0.08)',
      color: 'var(--gold, #D4AF37)', fontSize: '0.75rem', fontWeight: 600,
    }}>
      <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
      Envoi en cours…
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function MediaUploader({
  eventId,
  heroMedia,
  backgroundMusicUrl,
  plan,
  onUpdateMedia,
  onUpdateMusic,
}: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [audioPlaying, setAudioPlaying] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const maxImages = PLAN_IMAGE_LIMITS[plan] ?? 1;
  const canAddMore = heroMedia.length < maxImages;
  const isPremium = plan === 'premium';

  // ---- Image upload handler ----
  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = maxImages - heroMedia.length;
    if (remaining <= 0) {
      setUploadError(`Limite atteinte : ${maxImages} image${maxImages > 1 ? 's' : ''} maximum pour votre formule.`);
      e.target.value = '';
      return;
    }

    const toUpload = Array.from(files).slice(0, remaining);
    setUploading(true);
    setUploadError(null);

    try {
      const uploaded: { url: string; type: 'image' | 'video' }[] = [];

      for (const file of toUpload) {
        const publicUrl = await uploadFile(file, eventId, 'hero');
        uploaded.push({ url: publicUrl, type: 'image' });
      }

      onUpdateMedia([...heroMedia, ...uploaded]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'envoi';
      setUploadError(message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }, [eventId, heroMedia, maxImages, onUpdateMedia]);

  // ---- Image delete handler ----
  const handleDeleteImage = useCallback((index: number) => {
    const next = heroMedia.filter((_, i) => i !== index);
    onUpdateMedia(next);
  }, [heroMedia, onUpdateMedia]);

  // ---- Music upload handler ----
  const handleMusicUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_AUDIO_SIZE_MB * 1024 * 1024) {
      setUploadError(`Le fichier audio dépasse ${MAX_AUDIO_SIZE_MB} Mo.`);
      e.target.value = '';
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const publicUrl = await uploadFile(file, eventId, 'music');
      onUpdateMusic(publicUrl);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'envoi';
      setUploadError(message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }, [eventId, onUpdateMusic]);

  // ---- Music delete ----
  const handleDeleteMusic = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setAudioPlaying(false);
    }
    onUpdateMusic('');
  }, [onUpdateMusic]);

  // ---- Audio toggle ----
  const toggleAudio = useCallback(() => {
    if (!audioRef.current) return;
    if (audioPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setAudioPlaying(!audioPlaying);
  }, [audioPlaying]);

  // Extract file name from URL
  const musicFileName = backgroundMusicUrl
    ? decodeURIComponent(backgroundMusicUrl.split('/').pop() || '').replace(/^\d+-/, '')
    : null;

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: '1.25rem',
        overflow: 'hidden',
      }}
    >
      {/* ── Hero Images Section ─────────────────── */}
      <div style={{ padding: '1.5rem 1.75rem' }}>
        <SectionHeader
          icon={ImageIcon}
          title="Images du hero"
          badge={
            <span style={{
              fontSize: '0.65rem', fontWeight: 600,
              padding: '0.15rem 0.5rem', borderRadius: 20,
              background: 'rgba(200,169,110,0.1)', color: 'var(--gold, #D4AF37)',
              letterSpacing: '0.03em',
            }}>
              {heroMedia.length}/{maxImages} · {PLAN_LABELS[plan]}
            </span>
          }
        />

        <p style={{
          fontSize: '0.75rem', color: 'var(--text-muted, #9b9590)',
          marginTop: 0, marginBottom: '0.85rem', lineHeight: 1.5,
        }}>
          {plan === 'essentiel'
            ? 'Ajoutez l\'image principale de votre invitation.'
            : `Ajoutez jusqu'à ${maxImages} images pour le diaporama de votre invitation.`}
        </p>

        {/* Error display */}
        <AnimatePresence>
          {uploadError && (
            <UploadError message={uploadError} onDismiss={() => setUploadError(null)} />
          )}
        </AnimatePresence>

        {/* Uploading indicator */}
        <AnimatePresence>
          {uploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ marginBottom: '0.75rem' }}
            >
              <UploadSpinner />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Image grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 80px))',
          gap: '0.6rem',
        }}>
          <AnimatePresence mode="popLayout">
            {heroMedia.map((media, idx) => (
              <motion.div
                key={media.url}
                layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                style={{
                  position: 'relative',
                  width: 80, height: 80,
                  borderRadius: 12,
                  overflow: 'hidden',
                  border: '1px solid var(--border-light, rgba(255,255,255,0.08))',
                }}
              >
                <img
                  src={media.url}
                  alt={`Hero ${idx + 1}`}
                  style={{
                    width: '100%', height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.opacity = '0.3';
                  }}
                />
                {/* Order badge */}
                <div style={{
                  position: 'absolute', bottom: 4, left: 4,
                  width: 18, height: 18, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.6)',
                  color: '#fff', fontSize: '0.55rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {idx + 1}
                </div>
                {/* Delete button */}
                <button
                  onClick={() => handleDeleteImage(idx)}
                  style={{
                    position: 'absolute', top: 3, right: 3,
                    width: 20, height: 20, borderRadius: '50%',
                    background: 'rgba(220,50,50,0.85)', border: 'none',
                    color: '#fff', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'transform 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <X size={11} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add button */}
          {canAddMore && (
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => imageInputRef.current?.click()}
              disabled={uploading}
              style={{
                width: 80, height: 80,
                borderRadius: 12,
                border: '2px dashed var(--border-light, rgba(255,255,255,0.15))',
                background: 'transparent',
                cursor: uploading ? 'not-allowed' : 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '0.25rem',
                color: 'var(--text-muted, #9b9590)',
                transition: 'border-color 0.2s, color 0.2s',
                opacity: uploading ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!uploading) {
                  e.currentTarget.style.borderColor = 'var(--gold, #D4AF37)';
                  e.currentTarget.style.color = 'var(--gold, #D4AF37)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-light, rgba(255,255,255,0.15))';
                e.currentTarget.style.color = 'var(--text-muted, #9b9590)';
              }}
            >
              <Plus size={20} />
              <span style={{ fontSize: '0.55rem', fontWeight: 600, letterSpacing: '0.02em' }}>
                Ajouter
              </span>
            </motion.button>
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={imageInputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES}
          multiple={maxImages > 1}
          style={{ display: 'none' }}
          onChange={handleImageUpload}
        />
      </div>

      {/* Divider */}
      <div style={{
        height: 1,
        background: 'var(--border-light, rgba(255,255,255,0.08))',
        margin: '0 1.75rem',
      }} />

      {/* ── Background Music Section ───────────── */}
      <div style={{ padding: '1.5rem 1.75rem' }}>
        <SectionHeader icon={Music} title="Musique de fond" />

        {!isPremium ? (
          /* Locked state */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.75rem 1rem', borderRadius: 10,
              background: 'rgba(200,169,110,0.04)',
              border: '1px solid var(--border-light, rgba(255,255,255,0.08))',
            }}
          >
            <Lock size={14} style={{ color: 'var(--text-muted, #9b9590)', flexShrink: 0 }} />
            <span style={{
              fontSize: '0.78rem', color: 'var(--text-muted, #9b9590)',
              fontWeight: 500,
            }}>
              🔒 Disponible avec la formule Premium
            </span>
          </motion.div>
        ) : (
          /* Premium music controls */
          <div>
            {backgroundMusicUrl ? (
              /* Music loaded state */
              <div style={{
                display: 'flex', alignItems: 'center', gap: '0.65rem',
                padding: '0.75rem 1rem', borderRadius: 12,
                background: 'rgba(200,169,110,0.05)',
                border: '1px solid var(--border-light, rgba(255,255,255,0.08))',
              }}>
                {/* Play/Pause button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleAudio}
                  style={{
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--gold, #D4AF37), var(--gold-light, #e0c068))',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', flexShrink: 0,
                  }}
                >
                  {audioPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: 2 }} />}
                </motion.button>

                {/* File name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.8rem', fontWeight: 600,
                    color: 'var(--text-primary, #f0f0f0)',
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>
                    {musicFileName || 'Fichier audio'}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted, #9b9590)', marginTop: '0.1rem' }}>
                    Musique de fond
                  </div>
                </div>

                {/* Delete button */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleDeleteMusic}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: 'rgba(220,53,69,0.08)',
                    border: '1px solid rgba(220,53,69,0.15)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#DC3545', flexShrink: 0,
                  }}
                >
                  <Trash2 size={14} />
                </motion.button>

                {/* Hidden audio element */}
                <audio
                  ref={audioRef}
                  src={backgroundMusicUrl}
                  onEnded={() => setAudioPlaying(false)}
                  preload="none"
                />
              </div>
            ) : (
              /* No music state */
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '0.75rem', padding: '1.25rem',
                borderRadius: 12,
                border: '2px dashed var(--border-light, rgba(255,255,255,0.1))',
                textAlign: 'center',
              }}>
                <Music size={24} style={{ color: 'var(--text-muted, #9b9590)', opacity: 0.4 }} />
                <div>
                  <p style={{
                    margin: 0, fontSize: '0.8rem',
                    color: 'var(--text-muted, #9b9590)',
                    fontWeight: 500,
                  }}>
                    Aucune musique
                  </p>
                  <p style={{
                    margin: '0.2rem 0 0', fontSize: '0.65rem',
                    color: 'var(--text-muted, #9b9590)', opacity: 0.7,
                  }}>
                    Formats acceptés : MP3, M4A, OGG · Max {MAX_AUDIO_SIZE_MB} Mo
                  </p>
                </div>
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => audioInputRef.current?.click()}
                  disabled={uploading}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.4rem',
                    padding: '0.5rem 1rem', borderRadius: 10,
                    border: '1.5px dashed var(--gold, #D4AF37)',
                    background: 'rgba(200,169,110,0.06)',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    color: 'var(--gold, #D4AF37)', fontWeight: 600,
                    fontSize: '0.78rem',
                    opacity: uploading ? 0.5 : 1,
                  }}
                >
                  <Upload size={15} />
                  Charger une musique
                </motion.button>
              </div>
            )}

            {/* Hidden audio file input */}
            <input
              ref={audioInputRef}
              type="file"
              accept={ACCEPTED_AUDIO_TYPES}
              style={{ display: 'none' }}
              onChange={handleMusicUpload}
            />
          </div>
        )}
      </div>
    </div>
  );
}
