import React, { useState, useEffect } from 'react';
import { Player, GolfRoundSummary, GolfPlayerStats, GolfRound, GolfHoleResult } from '../types';
import { golfAPI } from '../services/api';

interface GolfDashboardProps {
  players: Player[];
  golfRounds: GolfRoundSummary[];
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

const GolfDashboard: React.FC<GolfDashboardProps> = ({ players, golfRounds }) => {
  const [leaderboard, setLeaderboard] = useState<GolfPlayerStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRoundId, setExpandedRoundId] = useState<number | null>(null);
  const [expandedRoundData, setExpandedRoundData] = useState<GolfRound | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const stats = await golfAPI.getLeaderboard();
      setLeaderboard(stats);
    } catch (error) {
      console.error('Failed to load golf leaderboard:', error);
    } finally {
      setLoading(false);
    }
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
    const parTotal = hasPar ? holes.reduce((s, h) => s + (h.par ?? 0), 0) : null;
    const cellBase: React.CSSProperties = { textAlign: 'center', padding: '6px 4px', fontSize: '0.75rem', minWidth: '2.2rem' };

    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed' }}>
          <tbody>
            <tr>
              <td style={{ ...cellBase, textAlign: 'left', color: '#64748b', fontWeight: 600, width: '3.5rem', paddingLeft: '2px' }}>HOLE</td>
              {holes.map(h => <td key={h.hole_number} style={{ ...cellBase, color: '#94a3b8', fontWeight: 600 }}>{h.hole_number}</td>)}
              {parTotal != null && <td style={{ ...cellBase, color: '#64748b', fontWeight: 700, borderLeft: '1px solid #334155' }}>{parTotal}</td>}
            </tr>
            {hasPar && (
              <tr>
                <td style={{ ...cellBase, textAlign: 'left', color: '#64748b', fontWeight: 600, paddingLeft: '2px' }}>PAR</td>
                {holes.map(h => <td key={h.hole_number} style={{ ...cellBase, color: '#cbd5e1' }}>{h.par ?? '—'}</td>)}
                <td style={{ ...cellBase, color: '#94a3b8', fontWeight: 700, borderLeft: '1px solid #334155' }}>{parTotal}</td>
              </tr>
            )}
            {hasYardage && (
              <tr>
                <td style={{ ...cellBase, textAlign: 'left', color: '#64748b', fontWeight: 600, paddingLeft: '2px' }}>YDS</td>
                {holes.map(h => <td key={h.hole_number} style={{ ...cellBase, color: '#475569', fontSize: '0.65rem' }}>{h.yardage ?? '—'}</td>)}
                <td style={{ ...cellBase, color: '#475569', fontSize: '0.65rem', borderLeft: '1px solid #334155' }}>{holes.reduce((s, h) => s + (h.yardage ?? 0), 0).toLocaleString()}</td>
              </tr>
            )}
            <tr>
              <td style={{ ...cellBase, textAlign: 'left', color: '#64748b', fontWeight: 600, paddingLeft: '2px' }}>RESULT</td>
              {holes.map(h => (
                <td key={h.hole_number} style={{ ...cellBase, padding: '4px 2px' }}>
                  <div style={{ backgroundColor: getResultBg(h.winner_team), color: getResultColor(h.winner_team), borderRadius: '4px', fontWeight: 700, fontSize: '0.7rem', padding: '2px 0' }}>
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

  const totalRounds = golfRounds.length;

  // Recent rounds (last 7 days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const recentRounds = golfRounds.filter(r => new Date(r.played_at) >= oneWeekAgo);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#f8fafc' }}>Golf Dashboard</h2>
        <p style={{ color: '#94a3b8' }}>2v2 Match Play Golf Tracker. Stroke play in development.</p>
      </div>

      {/* Recent Rounds */}
      {golfRounds.length > 0 && (
        <div className="p-6 rounded-lg" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#f8fafc' }}>Recent Rounds</h3>
          <div className="space-y-2">
            {golfRounds.slice(0, 3).map((round) => {
              const isExpanded = expandedRoundId === round.id;
              return (
                <div key={round.id} className="rounded-lg overflow-hidden" style={{ border: '1px solid #334155' }}>
                  {/* Summary row — clickable */}
                  <div
                    onClick={() => toggleExpand(round.id)}
                    style={{ backgroundColor: '#0f172a', padding: '0.875rem 1rem', cursor: 'pointer' }}
                  >
                    {/* Top: date + course + result */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.625rem' }}>
                      <div>
                        <div className="text-xs" style={{ color: '#64748b' }}>
                          {new Date(round.played_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>{round.course}</div>
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded-full" style={{
                        backgroundColor: round.winner_team === 1 ? 'rgba(96,165,250,0.15)' : round.winner_team === 2 ? 'rgba(244,63,94,0.15)' : 'rgba(250,204,21,0.15)',
                        color: getResultColor(round.winner_team),
                        border: `1px solid ${round.winner_team === 1 ? 'rgba(96,165,250,0.3)' : round.winner_team === 2 ? 'rgba(244,63,94,0.3)' : 'rgba(250,204,21,0.3)'}`,
                        whiteSpace: 'nowrap',
                        marginLeft: '0.5rem',
                      }}>
                        {round.winner_team ? `Team ${round.winner_team} Wins` : 'Draw'}
                      </span>
                    </div>

                    {/* Teams */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="text-sm font-semibold" style={{ color: '#60a5fa' }}>Team 1</span>
                          <span className="text-xl font-bold" style={{ color: round.team1_holes_won > round.team2_holes_won ? '#4ade80' : '#475569' }}>
                            {round.team1_holes_won}
                          </span>
                        </div>
                        <div className="text-xs" style={{ color: '#94a3b8' }}>{round.team1_player_names.join(' & ')}</div>
                      </div>
                      <div style={{ textAlign: 'center', flexShrink: 0 }}>
                        <div className="text-xs font-bold" style={{ color: '#475569' }}>VS</div>
                        <div className="text-xs" style={{ color: '#334155' }}>{round.halved_holes}H</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span className="text-sm font-semibold" style={{ color: '#f43f5e' }}>Team 2</span>
                          <span className="text-xl font-bold" style={{ color: round.team2_holes_won > round.team1_holes_won ? '#4ade80' : '#475569' }}>
                            {round.team2_holes_won}
                          </span>
                        </div>
                        <div className="text-xs" style={{ color: '#94a3b8' }}>{round.team2_player_names.join(' & ')}</div>
                      </div>
                    </div>

                    <div className="mt-2 text-center">
                      <span className="text-xs" style={{ color: '#475569' }}>{isExpanded ? '▲ collapse' : '▼ hole-by-hole detail'}</span>
                    </div>
                  </div>

                  {/* Expanded detail */}
                  {isExpanded && (
                    <div style={{ backgroundColor: '#060e1a', borderTop: '1px solid #334155' }}>
                      {loadingDetail ? (
                        <div className="text-center py-4 text-sm" style={{ color: '#94a3b8' }}>Loading details...</div>
                      ) : expandedRoundData?.id === round.id ? (
                        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                          {/* Par type breakdown */}
                          {(() => {
                            const breakdown = computeParBreakdown(expandedRoundData.hole_results);
                            if (!breakdown.length) return null;
                            const parColors: Record<number, { accent: string; bg: string; border: string }> = {
                              3: { accent: '#818cf8', bg: 'rgba(129,140,248,0.1)', border: 'rgba(129,140,248,0.25)' },
                              4: { accent: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.25)' },
                              5: { accent: '#fb923c', bg: 'rgba(251,146,60,0.1)', border: 'rgba(251,146,60,0.25)' },
                            };
                            return (
                              <div>
                                <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#64748b' }}>By Par Type</div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                  {breakdown.map(({ par, team1Wins, team2Wins, halved }) => {
                                    const c = parColors[par] ?? { accent: '#94a3b8', bg: 'rgba(148,163,184,0.1)', border: 'rgba(148,163,184,0.25)' };
                                    const total = team1Wins + team2Wins + halved;
                                    return (
                                      <div key={par} style={{ flex: 1, borderRadius: '0.625rem', padding: '0.625rem 0.75rem', backgroundColor: c.bg, border: `1px solid ${c.border}` }}>
                                        <div className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ color: c.accent }}>Par {par}</div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexWrap: 'wrap', marginBottom: '0.375rem' }}>
                                          <span className="text-sm font-semibold" style={{ color: '#60a5fa' }}>{team1Wins}W T1</span>
                                          <span className="text-xs" style={{ color: '#475569' }}>—</span>
                                          <span className="text-sm font-semibold" style={{ color: '#f43f5e' }}>{team2Wins}W T2</span>
                                          {halved > 0 && <><span className="text-xs" style={{ color: '#475569' }}>—</span><span className="text-xs" style={{ color: '#facc15' }}>{halved}H</span></>}
                                        </div>
                                        {total > 0 && (
                                          <div style={{ display: 'flex', height: '4px', borderRadius: '9999px', overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.06)' }}>
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
                            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#64748b' }}>Scorecard</div>
                            <div className="mb-2">
                              <div className="text-xs mb-1" style={{ color: '#475569' }}>Front 9</div>
                              <div style={{ backgroundColor: '#1e293b', borderRadius: '0.5rem', border: '1px solid #334155', overflow: 'hidden' }}>
                                {renderScorecard(expandedRoundData.hole_results.slice(0, 9))}
                              </div>
                            </div>
                            {expandedRoundData.hole_results.length > 9 && (
                              <div>
                                <div className="text-xs mb-1" style={{ color: '#475569' }}>Back 9</div>
                                <div style={{ backgroundColor: '#1e293b', borderRadius: '0.5rem', border: '1px solid #334155', overflow: 'hidden' }}>
                                  {renderScorecard(expandedRoundData.hole_results.slice(9, 18))}
                                </div>
                              </div>
                            )}
                            <div className="mt-2 flex gap-4 text-xs" style={{ color: '#475569' }}>
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
              );
            })}
          </div>
          {golfRounds.length > 3 && (
            <div className="text-center mt-4">
              <p className="text-sm" style={{ color: '#64748b' }}>
                Showing 3 of {golfRounds.length} rounds. View all in Rounds tab.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <h3 className="text-lg font-semibold mb-2" style={{ color: '#f8fafc' }}>Golf Leaderboard</h3>
        <p className="text-sm mb-4" style={{ color: '#94a3b8' }}>Players ranked by match play win percentage</p>

        {loading ? (
          <div className="text-center py-4" style={{ color: '#94a3b8' }}>Loading leaderboard...</div>
        ) : leaderboard.length > 0 ? (
          <div className="space-y-3">
            {leaderboard.map((player, index) => {
              const rankStyles = [
                { bg: 'rgba(234, 179, 8, 0.1)', border: 'rgba(234, 179, 8, 0.3)', badgeBg: 'rgba(234, 179, 8, 0.15)', badgeColor: '#fde047' },
                { bg: 'rgba(148, 163, 184, 0.1)', border: 'rgba(148, 163, 184, 0.3)', badgeBg: 'rgba(148, 163, 184, 0.15)', badgeColor: '#cbd5e1' },
                { bg: 'rgba(249, 115, 22, 0.1)', border: 'rgba(249, 115, 22, 0.3)', badgeBg: 'rgba(249, 115, 22, 0.15)', badgeColor: '#fdba74' }
              ];
              const defaultStyle = { bg: '#0f172a', border: '#334155', badgeBg: 'rgba(59, 130, 246, 0.15)', badgeColor: '#60a5fa' };
              const style = index < 3 ? rankStyles[index] : defaultStyle;
              const rankEmojis = ['🥇', '🥈', '🥉'];

              return (
                <div key={player.id} className="flex items-center p-3 rounded-lg" style={{ backgroundColor: style.bg, border: `1px solid ${style.border}` }}>
                  <div className="flex-shrink-0 mr-3 w-10 flex items-center justify-center">
                    {index < 3 ? (
                      <span className="text-2xl">{rankEmojis[index]}</span>
                    ) : (
                      <span className="text-xl font-bold" style={{ color: '#cbd5e1' }}>{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: '#f1f5f9' }}>{player.name}</p>
                    <p className="text-sm" style={{ color: '#94a3b8' }}>
                      {player.golf_rounds_won}W-{player.golf_rounds_lost}L-{player.golf_rounds_drawn}D ({player.golf_rounds_played} rounds)
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className="inline-flex items-center px-2 py-1 rounded-full font-medium" style={{ backgroundColor: style.badgeBg, color: style.badgeColor }}>
                      {Math.round(player.golf_win_percentage)}%
                    </span>
                    <div className="text-xs mt-1" style={{ color: '#94a3b8' }}>
                      {player.golf_holes_won} holes won
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center py-4" style={{ color: '#94a3b8' }}>
            No golf rounds recorded yet. Create your first round to see the leaderboard!
          </p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
          <p className="text-3xl font-bold text-green-600">{totalRounds}</p>
          <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>Total Rounds</p>
        </div>
        <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
          <p className="text-3xl font-bold text-blue-600">{leaderboard.length}</p>
          <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>Active Golfers</p>
        </div>
        <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
          <p className="text-3xl font-bold text-purple-600">{recentRounds.length}</p>
          <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>Rounds This Week</p>
        </div>
      </div>
    </div>
  );
};

export default GolfDashboard;
