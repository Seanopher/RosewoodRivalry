import React, { useState } from 'react';
import { Player, PlayerCreate } from '../types';
import { playerAPI } from '../services/api';

interface NewPlayerProps {
  onPlayerCreated: (player: Player) => void;
}

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const NewPlayer: React.FC<NewPlayerProps> = ({ onPlayerCreated }) => {
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdPlayer, setCreatedPlayer] = useState<Player | null>(null);

  const trimmed = playerName.trim();
  const hasName = trimmed.length > 0;
  const initials = hasName ? getInitials(trimmed) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmed) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const newPlayerData: PlayerCreate = { name: trimmed };
      const player = await playerAPI.createPlayer(newPlayerData);
      onPlayerCreated(player);
      setCreatedPlayer(player);
      setPlayerName('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create player');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAnother = () => {
    setCreatedPlayer(null);
    setError(null);
  };

  return (
    <div style={{ maxWidth: '26rem', margin: '0 auto' }} className="animate-fadeIn">

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ color: '#f8fafc', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>New Player</h2>
        <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>
          Add someone to the roster — they'll be ready to play immediately.
        </p>
      </div>

      {/* ── Success state ── */}
      {createdPlayer ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.25rem' }}>
          {/* Created card */}
          <div style={{
            backgroundColor: '#1e293b',
            border: '1px solid rgba(34,197,94,0.3)',
            borderRadius: '0.875rem',
            padding: '1.75rem 2rem',
            textAlign: 'center',
            width: '100%',
            boxSizing: 'border-box',
            boxShadow: '0 0 24px rgba(34,197,94,0.08)',
          }}>
            {/* Check badge */}
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1rem' }}>
              <div style={{
                width: '4rem', height: '4rem', borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(244,63,94,0.25), rgba(244,63,94,0.1))',
                border: '2px solid rgba(244,63,94,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.25rem', fontWeight: 900, color: '#f43f5e',
                letterSpacing: '0.03em',
              }}>
                {getInitials(createdPlayer.name)}
              </div>
              <div style={{
                position: 'absolute', bottom: '-2px', right: '-2px',
                width: '1.25rem', height: '1.25rem', borderRadius: '50%',
                backgroundColor: '#22c55e', border: '2px solid #0f172a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.55rem', color: '#fff', fontWeight: 800,
              }}>
                ✓
              </div>
            </div>
            <div style={{ color: '#f8fafc', fontSize: '1.125rem', fontWeight: 700, marginBottom: '0.3rem' }}>
              {createdPlayer.name}
            </div>
            <div style={{ color: '#4ade80', fontSize: '0.8rem', fontWeight: 600 }}>
              Added to the roster
            </div>
          </div>

          {/* Add another */}
          <button
            onClick={handleAddAnother}
            style={{
              width: '100%',
              backgroundColor: '#f43f5e',
              color: '#f8fafc',
              border: 'none',
              borderRadius: '0.625rem',
              padding: '0.875rem',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              transition: 'opacity 0.15s ease',
            }}
          >
            + Add Another Player
          </button>
        </div>
      ) : (
        /* ── Form state ── */
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Live preview card */}
          <div style={{
            backgroundColor: '#1e293b',
            border: `1px solid ${hasName ? 'rgba(244,63,94,0.25)' : '#253047'}`,
            borderRadius: '0.875rem',
            padding: '1.75rem',
            textAlign: 'center',
            transition: 'border-color 0.2s ease',
          }}>
            {/* Initials emblem */}
            <div style={{
              width: '4rem', height: '4rem', borderRadius: '50%', margin: '0 auto 0.875rem',
              background: hasName
                ? 'linear-gradient(135deg, rgba(244,63,94,0.25), rgba(244,63,94,0.1))'
                : 'rgba(255,255,255,0.03)',
              border: `2px solid ${hasName ? 'rgba(244,63,94,0.3)' : '#253047'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.25rem', fontWeight: 900,
              color: hasName ? '#f43f5e' : '#334155',
              letterSpacing: '0.03em',
              transition: 'all 0.2s ease',
            }}>
              {initials || '?'}
            </div>

            {/* Name preview */}
            <div style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: hasName ? '#f8fafc' : '#334155',
              transition: 'color 0.2s ease',
              minHeight: '1.5rem',
            }}>
              {trimmed || 'Player Name'}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#334155', marginTop: '0.3rem', fontWeight: 500 }}>
              preview
            </div>
          </div>

          {/* Name input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
              Full Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              placeholder="e.g. Jane Doe"
              maxLength={100}
              disabled={isSubmitting}
              autoFocus
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: `1px solid ${hasName ? 'rgba(244,63,94,0.3)' : '#334155'}`,
                borderRadius: '0.625rem',
                backgroundColor: '#0f172a',
                color: '#f1f5f9',
                fontSize: '1rem',
                fontWeight: 600,
                outline: 'none',
                transition: 'border-color 0.15s ease',
                boxSizing: 'border-box',
              }}
            />
            <p style={{ color: '#334155', fontSize: '0.7rem', margin: '0.4rem 0 0', fontWeight: 500 }}>
              Use first and last name for best initials
            </p>
          </div>

          {error && (
            <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '0.625rem', padding: '0.75rem 1rem', color: '#f87171', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !hasName}
            style={{
              width: '100%',
              backgroundColor: hasName && !isSubmitting ? '#f43f5e' : '#1e293b',
              color: hasName && !isSubmitting ? '#f8fafc' : '#475569',
              border: `1px solid ${hasName && !isSubmitting ? '#f43f5e' : '#334155'}`,
              padding: '0.875rem',
              borderRadius: '0.625rem',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: hasName && !isSubmitting ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
            }}
          >
            {isSubmitting ? 'Adding…' : hasName ? `Add ${trimmed.split(' ')[0]} to the roster` : 'Enter a name to continue'}
          </button>
        </form>
      )}
    </div>
  );
};

export default NewPlayer;
