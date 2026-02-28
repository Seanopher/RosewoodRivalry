import React, { useState, useEffect } from 'react';
import { Player, GameCreate } from '../types';
import { gameAPI } from '../services/api';

interface GameCreatorProps {
  players: Player[];
  onGameCreated: (game: any) => void;
}

const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};


// ── Team panel ────────────────────────────────────────────────
interface TeamPanelProps {
  teamNum: 1 | 2;
  ids: number[];
  playerById: (id: number) => Player | undefined;
  onRemove: (id: number) => void;
  color: string;
  accentBg: string;
  accentBorder: string;
}

const TeamPanel: React.FC<TeamPanelProps> = ({ teamNum, ids, playerById, onRemove, color, accentBg, accentBorder }) => (
  <div style={{
    backgroundColor: '#1e293b',
    border: `1px solid ${ids.length > 0 ? accentBorder : '#253047'}`,
    borderRadius: '0.75rem',
    padding: '0.875rem',
    transition: 'border-color 0.2s ease',
    minWidth: 0,
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.625rem' }}>
      <span style={{ fontSize: '0.62rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Team {teamNum}</span>
      <span style={{ fontSize: '0.6rem', color: '#475569', fontWeight: 600 }}>{ids.length}/3</span>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      {[0, 1, 2].map(i => {
        const id = ids[i];
        const player = id !== undefined ? playerById(id) : undefined;
        return player ? (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: accentBg, borderRadius: '0.5rem', padding: '0.4rem 0.5rem' }}>
            <div style={{ width: '1.625rem', height: '1.625rem', borderRadius: '50%', backgroundColor: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
              {getInitials(player.name)}
            </div>
            <span style={{ flex: 1, color: '#f1f5f9', fontSize: '0.78rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {player.name}
            </span>
            <button
              type="button"
              onClick={() => onRemove(id)}
              style={{ color: '#475569', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: '0 0.1rem', flexShrink: 0 }}
            >
              ×
            </button>
          </div>
        ) : (
          <div key={i} style={{ height: '2.1rem', borderRadius: '0.5rem', border: '1px dashed #253047', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#334155', fontSize: '0.68rem', fontWeight: 600 }}>+ slot {i + 1}</span>
          </div>
        );
      })}
    </div>
  </div>
);


// ── Player chip ───────────────────────────────────────────────
interface PlayerChipProps {
  player: Player;
  team: 1 | 2 | null;
  disabled: boolean;
  onClick: () => void;
}

const PlayerChip: React.FC<PlayerChipProps> = ({ player, team, disabled, onClick }) => {
  const [hovered, setHovered] = useState(false);
  const teamColor = team === 1 ? '#60a5fa' : team === 2 ? '#f43f5e' : null;
  const teamBg = team === 1 ? 'rgba(96,165,250,0.1)' : team === 2 ? 'rgba(244,63,94,0.1)' : hovered ? '#1e293b' : '#0f172a';
  const border = team === 1 ? 'rgba(96,165,250,0.35)' : team === 2 ? 'rgba(244,63,94,0.35)' : hovered ? '#334155' : '#1e293b';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 0.625rem',
        backgroundColor: teamBg,
        border: `1px solid ${disabled ? '#1a2436' : border}`,
        borderRadius: '0.625rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.3 : 1,
        transition: 'all 0.15s ease',
        textAlign: 'left',
        width: '100%',
        minWidth: 0,
      }}
    >
      <div style={{
        width: '1.875rem',
        height: '1.875rem',
        borderRadius: '50%',
        backgroundColor: team ? (teamColor + '22') : 'rgba(255,255,255,0.04)',
        border: `1px solid ${teamColor || (hovered ? '#334155' : '#253047')}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.55rem',
        fontWeight: 800,
        color: teamColor || '#475569',
        flexShrink: 0,
        transition: 'all 0.15s ease',
      }}>
        {getInitials(player.name)}
      </div>
      <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
        <div style={{ color: teamColor || (hovered ? '#cbd5e1' : '#94a3b8'), fontSize: '0.78rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 0.15s ease' }}>
          {player.name}
        </div>
        <div style={{ fontSize: '0.6rem', color: team ? teamColor! : '#334155', fontWeight: 700, marginTop: '0.05rem', transition: 'color 0.15s ease' }}>
          {team ? `Team ${team}` : `${Math.round(player.win_percentage)}% WR`}
        </div>
      </div>
    </button>
  );
};


// ── Main component ────────────────────────────────────────────
const GameCreator: React.FC<GameCreatorProps> = ({ players, onGameCreated }) => {
  const [team1Ids, setTeam1Ids] = useState<number[]>([]);
  const [team2Ids, setTeam2Ids] = useState<number[]>([]);
  const [team1Score, setTeam1Score] = useState('');
  const [team2Score, setTeam2Score] = useState('');
  const [location, setLocation] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const getPlayerTeam = (id: number): 1 | 2 | null => {
    if (team1Ids.includes(id)) return 1;
    if (team2Ids.includes(id)) return 2;
    return null;
  };

  const handlePlayerClick = (playerId: number) => {
    const team = getPlayerTeam(playerId);
    if (team === 1) {
      // Move to Team 2 if space, else remove
      if (team2Ids.length < 3) {
        setTeam1Ids(prev => prev.filter(id => id !== playerId));
        setTeam2Ids(prev => [...prev, playerId]);
      } else {
        setTeam1Ids(prev => prev.filter(id => id !== playerId));
      }
    } else if (team === 2) {
      setTeam2Ids(prev => prev.filter(id => id !== playerId));
    } else if (team1Ids.length < 3) {
      setTeam1Ids(prev => [...prev, playerId]);
    } else if (team2Ids.length < 3) {
      setTeam2Ids(prev => [...prev, playerId]);
    }
  };

  const removeFromTeam = (team: 1 | 2, id: number) => {
    if (team === 1) setTeam1Ids(prev => prev.filter(x => x !== id));
    else setTeam2Ids(prev => prev.filter(x => x !== id));
  };

  const playerById = (id: number) => players.find(p => p.id === id);

  const t1Score = parseInt(team1Score);
  const t2Score = parseInt(team2Score);
  const scoresEntered = team1Score !== '' && team2Score !== '';
  const winnerTeam = scoresEntered && !isNaN(t1Score) && !isNaN(t2Score)
    ? t1Score > t2Score ? 1 : t2Score > t1Score ? 2 : 0
    : null;
  const margin = scoresEntered && !isNaN(t1Score) && !isNaN(t2Score) ? Math.abs(t1Score - t2Score) : 0;

  const playersNeeded = Math.max(0, 3 - team1Ids.length) + Math.max(0, 3 - team2Ids.length);
  const canSubmit = team1Ids.length === 3 && team2Ids.length === 3 && scoresEntered && !isCreating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    try {
      setIsCreating(true);
      setError(null);
      const gameData: GameCreate = {
        team1_score: t1Score,
        team2_score: t2Score,
        team1_players: team1Ids,
        team2_players: team2Ids,
        location: location.trim() || undefined,
      };
      const newGame = await gameAPI.createGame(gameData);
      onGameCreated(newGame);
      setSuccess(true);
      setTeam1Ids([]);
      setTeam2Ids([]);
      setTeam1Score('');
      setTeam2Score('');
      setLocation('');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create game');
    } finally {
      setIsCreating(false);
    }
  };

  const sortedPlayers = [...players].sort((a, b) => b.games_played - a.games_played);

  if (players.length < 6) {
    return (
      <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.75rem', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🎲</div>
        <p style={{ color: '#94a3b8', fontWeight: 600, margin: '0 0 0.4rem' }}>Not enough players</p>
        <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>You need at least 6 players. Add more in the New Player tab.</p>
      </div>
    );
  }

  // Score input shared style
  const scoreInputStyle = (winner: boolean): React.CSSProperties => ({
    width: isMobile ? '3rem' : '3.75rem',
    textAlign: 'center',
    fontSize: isMobile ? '1.375rem' : '1.75rem',
    fontWeight: 900,
    color: winner ? '#4ade80' : '#f1f5f9',
    backgroundColor: '#0f172a',
    border: `1px solid ${winner ? 'rgba(74,222,128,0.35)' : '#334155'}`,
    borderRadius: '0.5rem',
    padding: isMobile ? '0.4rem 0.2rem' : '0.5rem 0.25rem',
    outline: 'none',
    transition: 'all 0.15s ease',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="animate-fadeIn">

      {/* Header */}
      <div>
        <h2 style={{ color: '#f8fafc', fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>New Game</h2>
        <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0.2rem 0 0' }}>
          Tap players to assign them · tap again to move teams · tap a third time to remove
        </p>
      </div>

      {success && (
        <div style={{ backgroundColor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '0.625rem', padding: '0.75rem 1rem', color: '#4ade80', fontSize: '0.875rem', fontWeight: 600 }}>
          ✓ Game logged successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Teams + Score */}
        <div style={isMobile
          ? { display: 'flex', flexDirection: 'column', gap: '0.75rem' }
          : { display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.75rem', alignItems: 'start' }
        }>
          <TeamPanel
            teamNum={1} ids={team1Ids} playerById={playerById}
            onRemove={id => removeFromTeam(1, id)}
            color="#60a5fa" accentBg="rgba(96,165,250,0.08)" accentBorder="rgba(96,165,250,0.25)"
          />

          {/* Score section */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', padding: isMobile ? '0' : '0.25rem 0' }}>
            {!isMobile && (
              <span style={{ fontSize: '0.58rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Score</span>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <input
                type="number" min="0" value={team1Score}
                onChange={e => setTeam1Score(e.target.value)}
                placeholder="—"
                style={scoreInputStyle(winnerTeam === 1)}
              />
              <span style={{ color: '#253047', fontWeight: 800, fontSize: '1.25rem', lineHeight: 1, userSelect: 'none' }}>—</span>
              <input
                type="number" min="0" value={team2Score}
                onChange={e => setTeam2Score(e.target.value)}
                placeholder="—"
                style={scoreInputStyle(winnerTeam === 2)}
              />
            </div>
            {/* Winner preview */}
            {scoresEntered && (
              <div style={{ textAlign: 'center', minHeight: '1.1rem' }}>
                {winnerTeam === 0 ? (
                  <span style={{ fontSize: '0.65rem', color: '#fbbf24', fontWeight: 700 }}>Tie game</span>
                ) : (
                  <span style={{ fontSize: '0.65rem', color: winnerTeam === 1 ? '#60a5fa' : '#f43f5e', fontWeight: 700 }}>
                    Team {winnerTeam} wins · +{margin}
                  </span>
                )}
              </div>
            )}
          </div>

          <TeamPanel
            teamNum={2} ids={team2Ids} playerById={playerById}
            onRemove={id => removeFromTeam(2, id)}
            color="#f43f5e" accentBg="rgba(244,63,94,0.08)" accentBorder="rgba(244,63,94,0.25)"
          />
        </div>

        {/* Player pool */}
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.75rem', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <p style={{ color: '#475569', fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
              Players
            </p>
            <p style={{ color: '#334155', fontSize: '0.62rem', fontWeight: 600, margin: 0 }}>
              {team1Ids.length + team2Ids.length}/6 assigned
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(7.5rem, 1fr))', gap: '0.5rem' }}>
            {sortedPlayers.map(player => {
              const team = getPlayerTeam(player.id);
              const bothFull = team1Ids.length === 3 && team2Ids.length === 3;
              return (
                <PlayerChip
                  key={player.id}
                  player={player}
                  team={team}
                  disabled={!team && bothFull}
                  onClick={() => handlePlayerClick(player.id)}
                />
              );
            })}
          </div>
        </div>

        {/* Location */}
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.75rem', padding: '0.875rem 1rem' }}>
          <label style={{ fontSize: '0.62rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.625rem' }}>
            Location <span style={{ color: '#334155', textTransform: 'none', fontWeight: 500, letterSpacing: 0 }}>(optional)</span>
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['Dreher', 'King'].map(loc => (
              <button
                key={loc}
                type="button"
                onClick={() => setLocation(location === loc ? '' : loc)}
                style={{
                  padding: '0.45rem 1.25rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  border: `1px solid ${location === loc ? '#f43f5e' : '#334155'}`,
                  backgroundColor: location === loc ? 'rgba(244,63,94,0.1)' : 'transparent',
                  color: location === loc ? '#f43f5e' : '#64748b',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '0.625rem', padding: '0.75rem 1rem', color: '#f87171', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            backgroundColor: canSubmit ? '#f43f5e' : '#1e293b',
            color: canSubmit ? '#f8fafc' : '#475569',
            border: `1px solid ${canSubmit ? '#f43f5e' : '#334155'}`,
            padding: '0.875rem',
            borderRadius: '0.625rem',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
            letterSpacing: '0.01em',
          }}
        >
          {isCreating
            ? 'Logging game…'
            : canSubmit
            ? '🎲 Log Game'
            : playersNeeded > 0
            ? `${playersNeeded} more player${playersNeeded !== 1 ? 's' : ''} needed`
            : 'Enter scores to continue'
          }
        </button>
      </form>
    </div>
  );
};

export default GameCreator;
