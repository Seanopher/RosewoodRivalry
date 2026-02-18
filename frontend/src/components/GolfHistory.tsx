import React, { useState } from 'react';
import { GolfRoundSummary, GolfRound, GolfHoleResult } from '../types';
import { golfAPI } from '../services/api';

interface GolfHistoryProps {
  rounds: GolfRoundSummary[];
  onEditRound?: (roundId: number) => void;
}

interface ParBreakdown {
  par: number;
  team1Wins: number;
  team2Wins: number;
  halved: number;
}

function computeParBreakdown(holes: GolfHoleResult[]): ParBreakdown[] {
  const map: Record<number, ParBreakdown> = {};
  for (const h of holes) {
    if (h.par == null) continue;
    const p = h.par;
    if (!map[p]) map[p] = { par: p, team1Wins: 0, team2Wins: 0, halved: 0 };
    if (h.winner_team === 1) map[p].team1Wins++;
    else if (h.winner_team === 2) map[p].team2Wins++;
    else map[p].halved++;
  }
  return [3, 4, 5].filter(p => map[p]).map(p => map[p]);
}

const GolfHistory: React.FC<GolfHistoryProps> = ({ rounds, onEditRound }) => {
  const [expandedRoundId, setExpandedRoundId] = useState<number | null>(null);
  const [expandedRoundData, setExpandedRoundData] = useState<GolfRound | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const toggleExpand = async (roundId: number) => {
    if (expandedRoundId === roundId) {
      setExpandedRoundId(null);
      setExpandedRoundData(null);
      return;
    }
    try {
      setLoadingDetail(true);
      setExpandedRoundId(roundId);
      const data = await golfAPI.getRound(roundId);
      setExpandedRoundData(data);
    } catch (err) {
      console.error('Failed to load round detail:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const getResultColor = (winnerTeam: number | null) => {
    if (winnerTeam === 1) return '#60a5fa';
    if (winnerTeam === 2) return '#f43f5e';
    return '#facc15';
  };

  const getResultBg = (winnerTeam: number | null) => {
    if (winnerTeam === 1) return 'rgba(96,165,250,0.18)';
    if (winnerTeam === 2) return 'rgba(244,63,94,0.18)';
    return 'rgba(250,204,21,0.12)';
  };

  const renderScorecard = (holes: GolfHoleResult[]) => {
    const hasPar = holes.some(h => h.par != null);
    const hasYardage = holes.some(h => h.yardage != null);

    const parTotal = hasPar
      ? holes.reduce((sum, h) => sum + (h.par ?? 0), 0)
      : null;

    const cellBase: React.CSSProperties = {
      textAlign: 'center',
      padding: '6px 4px',
      fontSize: '0.75rem',
      minWidth: '2.2rem',
    };

    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed' }}>
          <tbody>
            {/* Hole number row */}
            <tr>
              <td style={{ ...cellBase, textAlign: 'left', color: '#64748b', fontWeight: 600, width: '3.5rem', paddingLeft: '2px' }}>HOLE</td>
              {holes.map(h => (
                <td key={h.hole_number} style={{ ...cellBase, color: '#94a3b8', fontWeight: 600 }}>
                  {h.hole_number}
                </td>
              ))}
              {parTotal != null && (
                <td style={{ ...cellBase, color: '#64748b', fontWeight: 700, borderLeft: '1px solid #334155' }}>
                  {parTotal}
                </td>
              )}
            </tr>

            {/* Par row */}
            {hasPar && (
              <tr>
                <td style={{ ...cellBase, textAlign: 'left', color: '#64748b', fontWeight: 600, paddingLeft: '2px' }}>PAR</td>
                {holes.map(h => (
                  <td key={h.hole_number} style={{ ...cellBase, color: '#cbd5e1' }}>
                    {h.par ?? '—'}
                  </td>
                ))}
                <td style={{ ...cellBase, color: '#94a3b8', fontWeight: 700, borderLeft: '1px solid #334155' }}>
                  {parTotal}
                </td>
              </tr>
            )}

            {/* Yardage row */}
            {hasYardage && (
              <tr>
                <td style={{ ...cellBase, textAlign: 'left', color: '#64748b', fontWeight: 600, paddingLeft: '2px' }}>YDS</td>
                {holes.map(h => (
                  <td key={h.hole_number} style={{ ...cellBase, color: '#475569', fontSize: '0.65rem' }}>
                    {h.yardage ?? '—'}
                  </td>
                ))}
                <td style={{ ...cellBase, color: '#475569', fontSize: '0.65rem', borderLeft: '1px solid #334155' }}>
                  {holes.reduce((s, h) => s + (h.yardage ?? 0), 0).toLocaleString()}
                </td>
              </tr>
            )}

            {/* Result row */}
            <tr>
              <td style={{ ...cellBase, textAlign: 'left', color: '#64748b', fontWeight: 600, paddingLeft: '2px' }}>RESULT</td>
              {holes.map(h => (
                <td key={h.hole_number} style={{ ...cellBase, padding: '4px 2px' }}>
                  <div style={{
                    backgroundColor: getResultBg(h.winner_team),
                    color: getResultColor(h.winner_team),
                    borderRadius: '4px',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    padding: '2px 0',
                  }}>
                    {h.winner_team === 1 ? 'T1' : h.winner_team === 2 ? 'T2' : '—'}
                  </div>
                </td>
              ))}
              <td style={{ ...cellBase, borderLeft: '1px solid #334155' }} />
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  if (rounds.length === 0) {
    return (
      <div className="rounded-lg p-6" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <h2 className="text-lg font-medium mb-4" style={{ color: '#f1f5f9' }}>Golf Round History</h2>
        <div className="text-center py-8">
          <p className="text-lg" style={{ color: '#94a3b8' }}>No golf rounds played yet.</p>
          <p className="text-sm mt-2" style={{ color: '#64748b' }}>Create your first round to see it appear here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg animate-fadeIn" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
      <div className="px-6 py-4" style={{ borderBottom: '1px solid #334155' }}>
        <h2 className="text-lg font-medium" style={{ color: '#f1f5f9' }}>Golf Round History</h2>
        <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
          {rounds.length} round{rounds.length !== 1 ? 's' : ''} played
        </p>
      </div>

      <div>
        {rounds.map((round, index) => (
          <div key={round.id}>
            {/* ── Summary card ── */}
            <div
              className="transition-colors"
              style={{
                padding: '1.25rem 1.5rem',
                backgroundColor: index % 2 === 0 ? '#1e293b' : '#162032',
                borderBottom: '1px solid #334155',
                cursor: 'pointer',
              }}
              onClick={() => toggleExpand(round.id)}
            >
              {/* Header row: round meta + result badge + edit */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-xs font-medium mb-0.5" style={{ color: '#64748b' }}>
                    Round #{round.id} · {formatDate(round.played_at)}
                  </div>
                  <div className="text-base font-semibold" style={{ color: '#e2e8f0' }}>
                    {round.course}
                  </div>
                </div>
                <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-bold"
                    style={{
                      backgroundColor: round.winner_team === 1 ? 'rgba(96,165,250,0.15)' :
                                       round.winner_team === 2 ? 'rgba(244,63,94,0.15)' :
                                       'rgba(250,204,21,0.15)',
                      color: getResultColor(round.winner_team),
                      border: `1px solid ${round.winner_team === 1 ? 'rgba(96,165,250,0.35)' :
                                            round.winner_team === 2 ? 'rgba(244,63,94,0.35)' :
                                            'rgba(250,204,21,0.35)'}`,
                    }}
                  >
                    {round.winner_team ? `Team ${round.winner_team} Wins` : 'Draw'}
                  </span>
                  {onEditRound && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onEditRound(round.id); }}
                      style={{
                        color: '#f43f5e',
                        border: '1px solid rgba(244,63,94,0.4)',
                        backgroundColor: 'transparent',
                        padding: '0.25rem 0.625rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                      }}
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>

              {/* Teams + score */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {/* Team 1 */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                    <span className="text-sm font-semibold" style={{ color: '#60a5fa' }}>Team 1</span>
                    <span className="text-2xl font-bold" style={{
                      color: round.team1_holes_won > round.team2_holes_won ? '#4ade80' : '#475569',
                      lineHeight: 1,
                    }}>
                      {round.team1_holes_won}
                    </span>
                  </div>
                  <div className="text-sm" style={{ color: '#cbd5e1' }}>
                    {round.team1_player_names.join(' & ')}
                  </div>
                </div>

                {/* Score divider */}
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div className="text-xs font-bold" style={{ color: '#475569' }}>VS</div>
                  <div className="text-xs mt-0.5" style={{ color: '#334155' }}>
                    {round.halved_holes}H
                  </div>
                </div>

                {/* Team 2 */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                    <span className="text-sm font-semibold" style={{ color: '#f43f5e' }}>Team 2</span>
                    <span className="text-2xl font-bold" style={{
                      color: round.team2_holes_won > round.team1_holes_won ? '#4ade80' : '#475569',
                      lineHeight: 1,
                    }}>
                      {round.team2_holes_won}
                    </span>
                  </div>
                  <div className="text-sm" style={{ color: '#cbd5e1' }}>
                    {round.team2_player_names.join(' & ')}
                  </div>
                </div>
              </div>

              <div className="mt-3 text-center">
                <span className="text-xs" style={{ color: '#475569' }}>
                  {expandedRoundId === round.id ? '▲ collapse' : '▼ hole-by-hole detail'}
                </span>
              </div>
            </div>

            {/* ── Expanded detail ── */}
            {expandedRoundId === round.id && (
              <div style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #334155' }}>
                {loadingDetail ? (
                  <div className="text-center py-6" style={{ color: '#94a3b8' }}>Loading details...</div>
                ) : expandedRoundData ? (
                  <div className="px-6 py-5 space-y-5">

                    {/* Par type breakdown */}
                    {(() => {
                      const breakdown = computeParBreakdown(expandedRoundData.hole_results);
                      if (breakdown.length === 0) return null;

                      const parColors: Record<number, { accent: string; bg: string; border: string }> = {
                        3: { accent: '#818cf8', bg: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.25)' },
                        4: { accent: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.25)' },
                        5: { accent: '#fb923c', bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.25)' },
                      };

                      return (
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#64748b' }}>
                            Performance by Par Type
                          </div>
                          <div style={{ display: 'flex', gap: '0.75rem' }}>
                            {breakdown.map(({ par, team1Wins, team2Wins, halved }) => {
                              const c = parColors[par] ?? { accent: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.25)' };
                              const total = team1Wins + team2Wins + halved;
                              return (
                                <div
                                  key={par}
                                  style={{
                                    flex: 1,
                                    borderRadius: '0.75rem',
                                    padding: '0.875rem 1rem',
                                    backgroundColor: c.bg,
                                    border: `1px solid ${c.border}`,
                                  }}
                                >
                                  <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: c.accent }}>
                                    Par {par}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                                    <span className="text-sm font-semibold" style={{ color: '#60a5fa' }}>
                                      {team1Wins}W T1
                                    </span>
                                    <span className="text-xs" style={{ color: '#475569' }}>—</span>
                                    <span className="text-sm font-semibold" style={{ color: '#f43f5e' }}>
                                      {team2Wins}W T2
                                    </span>
                                    {halved > 0 && (
                                      <>
                                        <span className="text-xs" style={{ color: '#475569' }}>—</span>
                                        <span className="text-xs" style={{ color: '#facc15' }}>{halved}H</span>
                                      </>
                                    )}
                                  </div>
                                  {/* Split bar */}
                                  {total > 0 && (
                                    <div style={{ display: 'flex', height: '5px', borderRadius: '9999px', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.06)' }}>
                                      <div style={{ width: `${(team1Wins / total) * 100}%`, backgroundColor: '#60a5fa' }} />
                                      <div style={{ width: `${(halved / total) * 100}%`, backgroundColor: '#facc15' }} />
                                      <div style={{ width: `${(team2Wins / total) * 100}%`, backgroundColor: '#f43f5e' }} />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Scorecard */}
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#64748b' }}>
                        Scorecard
                      </div>

                      {/* Front 9 */}
                      <div className="mb-3">
                        <div className="text-xs mb-1" style={{ color: '#475569' }}>Front 9</div>
                        <div style={{ backgroundColor: '#1e293b', borderRadius: '0.5rem', border: '1px solid #334155', overflow: 'hidden' }}>
                          {renderScorecard(expandedRoundData.hole_results.slice(0, 9))}
                        </div>
                      </div>

                      {/* Back 9 */}
                      {expandedRoundData.hole_results.length > 9 && (
                        <div>
                          <div className="text-xs mb-1" style={{ color: '#475569' }}>Back 9</div>
                          <div style={{ backgroundColor: '#1e293b', borderRadius: '0.5rem', border: '1px solid #334155', overflow: 'hidden' }}>
                            {renderScorecard(expandedRoundData.hole_results.slice(9, 18))}
                          </div>
                        </div>
                      )}

                      {/* Legend */}
                      <div className="mt-3 flex gap-4 text-xs" style={{ color: '#475569' }}>
                        <span><span style={{ color: '#60a5fa' }}>T1</span> = Team 1</span>
                        <span><span style={{ color: '#f43f5e' }}>T2</span> = Team 2</span>
                        <span><span style={{ color: '#facc15' }}>—</span> = Halved</span>
                      </div>
                    </div>

                  </div>
                ) : null}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GolfHistory;
