import React, { useState, useMemo } from 'react';
import { GameSummary } from '../types';
import { parseUTC } from '../utils/dates';

interface GameHistoryProps {
  games: GameSummary[];
  onEditGame?: (gameId: number) => void;
}

// ── Game card ─────────────────────────────────────────────────
const GameCard: React.FC<{ game: GameSummary; onEditGame?: (id: number) => void }> = ({ game, onEditGame }) => {
  const [hovered, setHovered] = useState(false);
  const margin = Math.abs(game.team1_score - game.team2_score);
  const isClose = margin <= 2;
  const isBlowout = margin >= 8;
  const date = parseUTC(game.played_at);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: hovered ? '#1a2540' : '#1e293b',
        border: `1px solid ${hovered ? '#334155' : '#253047'}`,
        borderRadius: '0.75rem',
        overflow: 'hidden',
        transition: 'all 0.15s ease',
      }}
    >
      {/* Card header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.5rem 1rem',
        borderBottom: '1px solid rgba(0,0,0,0.2)',
        backgroundColor: 'rgba(0,0,0,0.12)',
        flexWrap: 'wrap',
        gap: '0.4rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{ color: '#334155', fontSize: '0.7rem', fontWeight: 700 }}>#{game.id}</span>
          <span style={{ color: '#1e293b', fontSize: '0.7rem' }}>·</span>
          <span style={{ color: '#64748b', fontSize: '0.7rem' }}>{dateStr} · {timeStr}</span>
          {game.location && (
            <>
              <span style={{ color: '#1e293b', fontSize: '0.7rem' }}>·</span>
              <span style={{ color: '#64748b', fontSize: '0.7rem' }}>📍 {game.location}</span>
            </>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {isClose && (
            <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#4ade80', backgroundColor: 'rgba(34,197,94,0.1)', padding: '0.15rem 0.45rem', borderRadius: '999px', border: '1px solid rgba(34,197,94,0.2)', whiteSpace: 'nowrap' }}>
              ⚡ Close
            </span>
          )}
          {isBlowout && (
            <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#fb923c', backgroundColor: 'rgba(249,115,22,0.1)', padding: '0.15rem 0.45rem', borderRadius: '999px', border: '1px solid rgba(249,115,22,0.2)', whiteSpace: 'nowrap' }}>
              💥 Blowout
            </span>
          )}
          {onEditGame && (
            <button
              onClick={() => onEditGame(game.id)}
              title="Edit game"
              style={{
                color: '#475569',
                background: 'none',
                border: '1px solid #334155',
                borderRadius: '0.375rem',
                padding: '0.15rem 0.5rem',
                fontSize: '0.75rem',
                cursor: 'pointer',
                lineHeight: 1.4,
                transition: 'all 0.15s ease',
              }}
            >
              ✎
            </button>
          )}
        </div>
      </div>

      {/* Score row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '0.875rem 1rem', gap: '0.5rem' }}>
        {/* Team 1 */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Team 1</span>
            {game.winner_team === 1 && <span style={{ fontSize: '0.7rem' }}>👑</span>}
          </div>
          {game.team1_player_names.map((name, i) => (
            <div key={i} style={{ color: game.winner_team === 1 ? '#e2e8f0' : '#64748b', fontSize: '0.8rem', fontWeight: 500, lineHeight: 1.4 }}>{name}</div>
          ))}
        </div>

        {/* Scores */}
        <div style={{ textAlign: 'center', padding: '0 0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <span style={{ fontSize: '2.25rem', fontWeight: 900, color: game.winner_team === 1 ? '#4ade80' : '#475569', lineHeight: 1 }}>
              {game.team1_score}
            </span>
            <span style={{ color: '#1e293b', fontWeight: 700, fontSize: '1.25rem', lineHeight: 1 }}>—</span>
            <span style={{ fontSize: '2.25rem', fontWeight: 900, color: game.winner_team === 2 ? '#4ade80' : '#475569', lineHeight: 1 }}>
              {game.team2_score}
            </span>
          </div>
          <div style={{ fontSize: '0.62rem', color: '#334155', marginTop: '0.25rem', fontWeight: 600, letterSpacing: '0.04em' }}>
            {margin} pt margin
          </div>
        </div>

        {/* Team 2 */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.3rem', marginBottom: '0.35rem' }}>
            {game.winner_team === 2 && <span style={{ fontSize: '0.7rem' }}>👑</span>}
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#f43f5e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Team 2</span>
          </div>
          {game.team2_player_names.map((name, i) => (
            <div key={i} style={{ color: game.winner_team === 2 ? '#e2e8f0' : '#64748b', fontSize: '0.8rem', fontWeight: 500, lineHeight: 1.4 }}>{name}</div>
          ))}
        </div>
      </div>
    </div>
  );
};


// ── Main component ────────────────────────────────────────────
const GameHistory: React.FC<GameHistoryProps> = ({ games, onEditGame }) => {
  const [search, setSearch] = useState('');

  const stats = useMemo(() => {
    if (games.length === 0) return null;
    const margins = games.map(g => Math.abs(g.team1_score - g.team2_score));
    const totals = games.map(g => g.team1_score + g.team2_score);
    return {
      total: games.length,
      avgTotal: Math.round(totals.reduce((a, b) => a + b, 0) / games.length),
      avgMargin: (margins.reduce((a, b) => a + b, 0) / games.length).toFixed(1),
      minMargin: Math.min(...margins),
      maxMargin: Math.max(...margins),
      closeGames: games.filter(g => Math.abs(g.team1_score - g.team2_score) <= 3).length,
    };
  }, [games]);

  const filtered = useMemo(() => {
    if (!search.trim()) return games;
    const q = search.toLowerCase();
    return games.filter(g =>
      [...g.team1_player_names, ...g.team2_player_names].some(n => n.toLowerCase().includes(q))
    );
  }, [games, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, GameSummary[]>();
    filtered.forEach(game => {
      const date = parseUTC(game.played_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(game);
    });
    return Array.from(map.keys())
      .sort((a, b) => b.localeCompare(a))
      .map(key => {
        const [year, month] = key.split('-');
        const label = new Date(parseInt(year), parseInt(month) - 1, 1)
          .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        return { key, label, games: map.get(key)! };
      });
  }, [filtered]);

  if (games.length === 0) {
    return (
      <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.75rem', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🎲</div>
        <p style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: 600, margin: '0 0 0.4rem' }}>No games yet</p>
        <p style={{ color: '#475569', fontSize: '0.85rem', margin: 0 }}>Create your first game and it'll show up here.</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* ── Summary strip ── */}
      {stats && (
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.75rem', padding: '1rem 1.25rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', textAlign: 'center' }}>
            {([
              { label: 'Total Games',  value: stats.total,        color: '#f1f5f9' },
              { label: 'Avg Score',    value: `${stats.avgTotal}`, color: '#60a5fa', sub: 'pts/game' },
              { label: 'Avg Margin',   value: `${stats.avgMargin}`, color: '#f43f5e', sub: 'pts' },
              { label: 'Closest',      value: `${stats.minMargin}pt`, color: '#4ade80' },
              { label: 'Biggest Win',  value: `${stats.maxMargin}pt`, color: '#fbbf24' },
            ] as { label: string; value: string | number; color: string; sub?: string }[]).map((s, i) => (
              <div key={i}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '0.58rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: '0.25rem' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Player search ── */}
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: '#475569', fontSize: '0.85rem', pointerEvents: 'none' }}>🔍</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter by player name…"
          style={{
            width: '100%',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '0.625rem',
            padding: '0.625rem 2.25rem',
            color: '#f1f5f9',
            fontSize: '0.875rem',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#475569', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, padding: 0 }}
          >
            ×
          </button>
        )}
      </div>

      {search && (
        <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '-0.25rem 0 0' }}>
          {filtered.length} game{filtered.length !== 1 ? 's' : ''} matching <em>"{search}"</em>
        </p>
      )}

      {/* ── Month groups ── */}
      {grouped.length === 0 ? (
        <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.75rem', padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>No games found for "{search}"</p>
        </div>
      ) : (
        grouped.map(group => (
          <div key={group.key}>
            {/* Month header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.625rem' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>
                {group.label}
              </span>
              <div style={{ flex: 1, height: '1px', backgroundColor: '#1e293b' }} />
              <span style={{ color: '#334155', fontSize: '0.7rem', whiteSpace: 'nowrap', fontWeight: 600 }}>
                {group.games.length} game{group.games.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {group.games.map(game => (
                <GameCard key={game.id} game={game} onEditGame={onEditGame} />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default GameHistory;
