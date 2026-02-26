import React, { useEffect, useState } from 'react';
import { Player } from '../types';

interface WelcomeScreenProps {
  players: Player[];
  onEnter: (player: Player | null) => void; // null = guest
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ players, onEnter }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '3rem 1.5rem 2.5rem',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.4s ease',
    }}>

      {/* ── Branding ── */}
      <div style={{
        textAlign: 'center',
        animation: 'slideUp 0.5s ease both',
      }}>
        {/* Logo with glow */}
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: '1.25rem' }}>
          <div style={{
            position: 'absolute',
            inset: '-16px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(244,63,94,0.2) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <img
            src="/rosewood-logo.png"
            alt="Rosewood Rivalry"
            style={{ width: '5.5rem', height: '5.5rem', position: 'relative', display: 'block' }}
          />
        </div>

        <h1 style={{
          color: '#f8fafc',
          fontSize: '2rem',
          fontWeight: 800,
          letterSpacing: '-0.02em',
          margin: '0 0 0.3rem',
          lineHeight: 1.1,
        }}>
          Rosewood Rivalry
        </h1>
        <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0, fontWeight: 500 }}>
          Community Sports Analytics
        </p>

        {/* Rose accent line */}
        <div style={{
          width: '2.5rem',
          height: '2px',
          background: 'linear-gradient(90deg, transparent, #f43f5e, transparent)',
          margin: '1.25rem auto 0',
          borderRadius: '1px',
        }} />
      </div>

      {/* ── Player picker ── */}
      <div style={{
        width: '100%',
        maxWidth: '26rem',
        animation: 'slideUp 0.5s ease 0.12s both',
      }}>
        <p style={{
          color: '#475569',
          fontSize: '0.7rem',
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          textAlign: 'center',
          marginBottom: '1rem',
        }}>
          Who are you?
        </p>

        {/* Player grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '0.625rem',
          marginBottom: '0.75rem',
        }}>
          {[...players]
            .sort((a, b) => b.games_played - a.games_played)
            .map(player => (
              <PlayerCard key={player.id} player={player} onSelect={onEnter} />
            ))}
        </div>

        {/* Guest option */}
        <GuestButton onEnter={onEnter} />
      </div>
    </div>
  );
};


// ── Player card ──────────────────────────────────────────────
interface PlayerCardProps {
  player: Player;
  onSelect: (player: Player) => void;
}

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const PlayerCard: React.FC<PlayerCardProps> = ({ player, onSelect }) => {
  const [hovered, setHovered] = useState(false);
  const initials = getInitials(player.name);

  return (
    <button
      onClick={() => onSelect(player)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: hovered ? '#1e293b' : '#172032',
        border: `1px solid ${hovered ? '#f43f5e' : '#1e293b'}`,
        borderRadius: '0.75rem',
        padding: '1.125rem 0.875rem',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        boxShadow: hovered ? '0 0 16px rgba(244,63,94,0.12)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.625rem',
      }}
    >
      {/* Initials emblem */}
      <div style={{
        width: '3rem',
        height: '3rem',
        borderRadius: '50%',
        background: hovered ? 'rgba(244,63,94,0.2)' : 'rgba(244,63,94,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.875rem',
        fontWeight: 800,
        color: '#f43f5e',
        letterSpacing: '0.03em',
        transition: 'background 0.15s ease',
        flexShrink: 0,
      }}>
        {initials}
      </div>

      {/* Full name */}
      <div style={{
        color: '#f1f5f9',
        fontWeight: 600,
        fontSize: '0.875rem',
        lineHeight: 1.25,
      }}>
        {player.name}
      </div>
    </button>
  );
};


// ── Guest button ──────────────────────────────────────────────
const GuestButton: React.FC<{ onEnter: (p: null) => void }> = ({ onEnter }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={() => onEnter(null)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%',
        backgroundColor: 'transparent',
        border: `1px solid ${hovered ? '#475569' : '#1e293b'}`,
        borderRadius: '0.75rem',
        padding: '0.875rem',
        color: hovered ? '#fb7185' : '#f43f5e',
        fontSize: '0.8rem',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        textAlign: 'center',
        marginTop: '0.625rem',
        letterSpacing: '0.01em',
      }}
    >
      Continue as Guest
    </button>
  );
};


export default WelcomeScreen;
