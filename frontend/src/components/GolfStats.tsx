import React, { useState, useEffect, useRef } from 'react';
import { Player, GolfPlayerStats, GolfParTypeStat, GolfRoundSummary } from '../types';
import { golfAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface GolfStatsProps {
  players: Player[];
}

const GolfStats: React.FC<GolfStatsProps> = ({ players }) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [playerStats, setPlayerStats] = useState<GolfPlayerStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<GolfPlayerStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const detailedStatsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  useEffect(() => {
    if (selectedPlayerId) {
      loadPlayerStats(selectedPlayerId);
      setTimeout(() => {
        detailedStatsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    } else {
      setPlayerStats(null);
    }
  }, [selectedPlayerId]);

  const loadLeaderboard = async () => {
    try {
      setLeaderboardLoading(true);
      const stats = await golfAPI.getLeaderboard();
      setLeaderboard(stats);
    } catch (err) {
      console.error('Failed to load golf leaderboard:', err);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const loadPlayerStats = async (playerId: number) => {
    try {
      setLoading(true);
      setError(null);
      const stats = await golfAPI.getPlayerStats(playerId);
      setPlayerStats(stats);
    } catch (err) {
      setError('Failed to load player golf stats');
      console.error('Error loading golf stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getWinRateColor = (percentage: number) => {
    if (percentage >= 55) return '#4ade80';
    if (percentage >= 50) return '#facc15';
    return '#f87171';
  };

  // Combine players with their golf stats for the selection grid
  const playersWithGolf = players.map(p => {
    const stats = leaderboard.find(s => s.id === p.id);
    return { ...p, golfStats: stats || null };
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Player Selection */}
      <div className="rounded-lg p-6" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <h2 className="text-lg font-medium mb-2" style={{ color: '#f1f5f9' }}>Golf Player Statistics</h2>
        <p className="text-sm mb-4" style={{ color: '#94a3b8' }}>Select a player to view their golf stats.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {playersWithGolf
            .sort((a, b) => (b.golfStats?.golf_win_percentage || 0) - (a.golfStats?.golf_win_percentage || 0))
            .map((player) => (
            <button
              key={player.id}
              onClick={() => setSelectedPlayerId(player.id)}
              style={{
                padding: '1rem',
                textAlign: 'left',
                borderRadius: '0.5rem',
                border: selectedPlayerId === player.id ? '2px solid #f43f5e' : '1px solid #334155',
                backgroundColor: selectedPlayerId === player.id ? 'rgba(244, 63, 94, 0.1)' : '#0f172a',
                transition: 'all 0.15s ease',
              }}
            >
              <div className="font-medium" style={{ color: '#f1f5f9' }}>{player.name}</div>
              {player.golfStats ? (
                <>
                  <div className="text-sm mt-1" style={{ color: '#94a3b8' }}>
                    {player.golfStats.golf_rounds_played} rounds
                  </div>
                  <div className="text-sm font-medium mt-1" style={{ color: getWinRateColor(player.golfStats.golf_win_percentage) }}>
                    {player.golfStats.golf_win_percentage.toFixed(1)}% wins
                  </div>
                </>
              ) : (
                <div className="text-sm mt-1" style={{ color: '#64748b' }}>No golf rounds</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Detailed Stats */}
      {selectedPlayerId && (
        <div ref={detailedStatsRef} className="rounded-lg" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid #334155' }}>
            <h3 className="text-lg font-medium" style={{ color: '#f1f5f9' }}>
              {players.find(p => p.id === selectedPlayerId)?.name}'s Golf Statistics
            </h3>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <div style={{ color: '#94a3b8' }}>Loading golf stats...</div>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <div style={{ color: '#f87171' }}>{error}</div>
            </div>
          ) : playerStats ? (
            <div className="p-6 space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center p-3 rounded-lg" style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
                  <div className="text-2xl font-bold" style={{ color: '#f1f5f9' }}>
                    {playerStats.golf_rounds_played}
                  </div>
                  <div className="text-sm" style={{ color: '#94a3b8' }}>Rounds Played</div>
                </div>
                <div className="text-center p-3 rounded-lg" style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
                  <div className="text-2xl font-bold" style={{ color: getWinRateColor(playerStats.golf_win_percentage) }}>
                    {playerStats.golf_win_percentage.toFixed(1)}%
                  </div>
                  <div className="text-sm" style={{ color: '#94a3b8' }}>Win Rate</div>
                </div>
                <div className="text-center p-3 rounded-lg" style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
                  <div className="text-2xl font-bold" style={{ color: '#4ade80' }}>
                    {playerStats.golf_rounds_won}
                  </div>
                  <div className="text-sm" style={{ color: '#94a3b8' }}>Wins</div>
                </div>
                <div className="text-center p-3 rounded-lg" style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
                  <div className="text-2xl font-bold" style={{ color: '#f87171' }}>
                    {playerStats.golf_rounds_lost}
                  </div>
                  <div className="text-sm" style={{ color: '#94a3b8' }}>Losses</div>
                </div>
              </div>

              {/* Detailed Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6" style={{ borderTop: '1px solid #334155' }}>
                <div className="space-y-4">
                  <h4 className="font-medium" style={{ color: '#f1f5f9' }}>Record</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: '#94a3b8' }}>W-L-D:</span>
                      <span className="font-medium" style={{ color: '#f1f5f9' }}>
                        {playerStats.golf_rounds_won}-{playerStats.golf_rounds_lost}-{playerStats.golf_rounds_drawn}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#94a3b8' }}>Draws:</span>
                      <span className="font-medium" style={{ color: '#facc15' }}>
                        {playerStats.golf_rounds_drawn}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium" style={{ color: '#f1f5f9' }}>Holes</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: '#94a3b8' }}>Total Holes Won:</span>
                      <span className="font-medium" style={{ color: '#4ade80' }}>{playerStats.golf_holes_won}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#94a3b8' }}>Total Holes Lost:</span>
                      <span className="font-medium" style={{ color: '#f87171' }}>{playerStats.golf_holes_lost}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#94a3b8' }}>Hole Differential:</span>
                      <span className="font-medium" style={{
                        color: playerStats.golf_holes_won - playerStats.golf_holes_lost >= 0 ? '#4ade80' : '#f87171'
                      }}>
                        {playerStats.golf_holes_won - playerStats.golf_holes_lost > 0 ? '+' : ''}
                        {playerStats.golf_holes_won - playerStats.golf_holes_lost}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Par Type Breakdown */}
              {(playerStats.par3.won + playerStats.par3.lost + playerStats.par4.won + playerStats.par4.lost + playerStats.par5.won + playerStats.par5.lost) > 0 && (
                <div className="pt-6" style={{ borderTop: '1px solid #334155' }}>
                  <h4 className="font-medium mb-4" style={{ color: '#f1f5f9' }}>Performance by Par Type</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {([
                      { label: 'Par 3', stat: playerStats.par3, accent: '#818cf8', accentBg: 'rgba(129, 140, 248, 0.12)', accentBorder: 'rgba(129, 140, 248, 0.3)' },
                      { label: 'Par 4', stat: playerStats.par4, accent: '#34d399', accentBg: 'rgba(52, 211, 153, 0.12)', accentBorder: 'rgba(52, 211, 153, 0.3)' },
                      { label: 'Par 5', stat: playerStats.par5, accent: '#fb923c', accentBg: 'rgba(251, 146, 60, 0.12)', accentBorder: 'rgba(251, 146, 60, 0.3)' },
                    ] as { label: string; stat: GolfParTypeStat; accent: string; accentBg: string; accentBorder: string }[]).map(({ label, stat, accent, accentBg, accentBorder }) => {
                      const total = stat.won + stat.lost;
                      const hasData = total > 0;
                      return (
                        <div
                          key={label}
                          className="rounded-xl p-4"
                          style={{ backgroundColor: accentBg, border: `1px solid ${accentBorder}` }}
                        >
                          {/* Par label */}
                          <div className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: accent }}>
                            {label}
                          </div>

                          {/* Win % */}
                          <div className="text-3xl font-bold mb-1" style={{ color: hasData ? accent : '#475569' }}>
                            {hasData ? `${stat.win_percentage.toFixed(0)}%` : '—'}
                          </div>
                          <div className="text-xs mb-3" style={{ color: '#64748b' }}>
                            {hasData ? 'win rate' : 'no data'}
                          </div>

                          {/* W-L record */}
                          {hasData && (
                            <>
                              <div className="text-sm font-medium mb-3" style={{ color: '#cbd5e1' }}>
                                {stat.won}W – {stat.lost}L
                              </div>

                              {/* Progress bar */}
                              <div className="rounded-full overflow-hidden" style={{ height: '6px', backgroundColor: 'rgba(255,255,255,0.08)' }}>
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${stat.win_percentage}%`,
                                    backgroundColor: accent,
                                  }}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Holes Won Per Round Chart */}
              {playerStats.recent_rounds.length > 0 && (
                <div className="pt-6" style={{ borderTop: '1px solid #334155' }}>
                  <h4 className="font-medium mb-4" style={{ color: '#f1f5f9' }}>Holes Won Per Round</h4>
                  <div style={{ width: '100%', height: '200px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[...playerStats.recent_rounds].reverse().map((round) => {
                          const isTeam1 = round.team1_player_names.includes(playerStats.name);
                          return {
                            name: formatDate(round.played_at),
                            holesWon: isTeam1 ? round.team1_holes_won : round.team2_holes_won,
                            holesLost: isTeam1 ? round.team2_holes_won : round.team1_holes_won,
                          };
                        })}
                        margin={{ top: 5, right: 5, left: 0, bottom: 25 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} angle={-45} textAnchor="end" height={50} />
                        <YAxis width={30} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', color: '#f1f5f9' }}
                          labelStyle={{ color: '#f1f5f9' }}
                        />
                        <Bar dataKey="holesWon" fill="#22C55E" name="Holes Won" radius={[2, 2, 0, 0]} />
                        <Bar dataKey="holesLost" fill="#EF4444" name="Holes Lost" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Recent Rounds */}
              {playerStats.recent_rounds.length > 0 && (
                <div className="pt-6" style={{ borderTop: '1px solid #334155' }}>
                  <h4 className="font-medium mb-4" style={{ color: '#f1f5f9' }}>Recent Rounds</h4>
                  <div className="space-y-3">
                    {playerStats.recent_rounds.map((round) => {
                      const isTeam1 = round.team1_player_names.includes(playerStats.name);
                      const playerTeam = isTeam1 ? 1 : 2;
                      const isWin = round.winner_team === playerTeam;
                      const isDraw = round.winner_team === null;
                      const holesWon = isTeam1 ? round.team1_holes_won : round.team2_holes_won;
                      const holesLost = isTeam1 ? round.team2_holes_won : round.team1_holes_won;

                      return (
                        <div
                          key={round.id}
                          className="p-3 rounded-lg"
                          style={{
                            backgroundColor: isDraw ? 'rgba(250, 204, 21, 0.08)' :
                                           isWin ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                            border: `1px solid ${isDraw ? 'rgba(250, 204, 21, 0.25)' :
                                                 isWin ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="px-2 py-1 rounded text-xs font-medium" style={{
                                backgroundColor: isDraw ? 'rgba(250, 204, 21, 0.2)' :
                                               isWin ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                color: isDraw ? '#facc15' : isWin ? '#4ade80' : '#f87171',
                              }}>
                                {isDraw ? 'D' : isWin ? 'W' : 'L'}
                              </span>
                              <span className="font-medium" style={{ color: '#f1f5f9' }}>
                                {holesWon}-{holesLost}-{round.halved_holes}
                              </span>
                              <span className="text-sm" style={{ color: '#94a3b8' }}>
                                {round.course}
                              </span>
                            </div>
                            <div className="text-sm" style={{ color: '#94a3b8' }}>
                              {formatDate(round.played_at)}
                            </div>
                          </div>
                          <div className="mt-2 text-xs" style={{ color: '#94a3b8' }}>
                            <span className="font-medium" style={{ color: '#cbd5e1' }}>Team {playerTeam}:</span>{' '}
                            {(isTeam1 ? round.team1_player_names : round.team2_player_names).join(', ')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 text-center" style={{ color: '#94a3b8' }}>
              {players.find(p => p.id === selectedPlayerId)?.name} hasn't played any golf rounds yet.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GolfStats;
