import React, { useState, useEffect, useRef } from 'react';
import { Player, PlayerStats as PlayerStatsType } from '../types';
import { playerAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface PlayerStatsProps {
  players: Player[];
  selectedPlayer: Player | null;
  onPlayerSelect: (player: Player | null) => void;
}

const PlayerStats: React.FC<PlayerStatsProps> = ({
  players,
  selectedPlayer,
  onPlayerSelect
}) => {
  const [playerStats, setPlayerStats] = useState<PlayerStatsType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const detailedStatsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedPlayer) {
      loadPlayerStats(selectedPlayer.id);
      // Auto-scroll to detailed stats section (to bottom)
      setTimeout(() => {
        detailedStatsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'end'
        });
      }, 100);
    } else {
      setPlayerStats(null);
    }
  }, [selectedPlayer]);

  const loadPlayerStats = async (playerId: number) => {
    try {
      setLoading(true);
      setError(null);
      const stats = await playerAPI.getPlayerStats(playerId, 10);
      setPlayerStats(stats);
    } catch (err) {
      setError('Failed to load player stats');
      console.error('Error loading player stats:', err);
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

  if (players.length === 0) {
    return (
      <div className="rounded-lg p-6" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <h2 className="text-lg font-medium mb-4" style={{ color: '#f1f5f9' }}>Player Statistics</h2>
        <div className="text-center py-8">
          <p className="text-lg" style={{ color: '#94a3b8' }}>No players yet.</p>
          <p className="text-sm mt-2" style={{ color: '#64748b' }}>Add some players to see their statistics!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Player Selection */}
      <div className="rounded-lg p-6" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <h2 className="text-lg font-medium mb-2" style={{ color: '#f1f5f9' }}>Player Statistics</h2>
        <p className="text-sm mb-4" style={{ color: '#94a3b8' }}>Select a player to view their full stats page.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {players
            .sort((a, b) => b.win_percentage - a.win_percentage)
            .map((player) => (
            <button
              key={player.id}
              onClick={() => onPlayerSelect(player)}
              style={{
                padding: '1rem',
                textAlign: 'left',
                borderRadius: '0.5rem',
                border: selectedPlayer?.id === player.id ? '2px solid #f43f5e' : '1px solid #334155',
                backgroundColor: selectedPlayer?.id === player.id ? 'rgba(244, 63, 94, 0.1)' : '#0f172a',
                transition: 'all 0.15s ease',
              }}
            >
              <div className="font-medium" style={{ color: '#f1f5f9' }}>{player.name}</div>
              <div className="text-sm mt-1" style={{ color: '#94a3b8' }}>
                {player.games_played} games
              </div>
              {player.games_played > 0 && (
                <div className="text-sm font-medium mt-1" style={{ color: getWinRateColor(player.win_percentage) }}>
                  {player.win_percentage.toFixed(1)}% wins
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Detailed Stats */}
      {selectedPlayer && (
        <div ref={detailedStatsRef} className="rounded-lg" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
          <div className="px-6 py-4" style={{ borderBottom: '1px solid #334155' }}>
            <h3 className="text-lg font-medium" style={{ color: '#f1f5f9' }}>
              {selectedPlayer.name}'s Statistics
            </h3>
            {selectedPlayer.name === "Brendan Meagher" && (
              <div className="mt-4 flex justify-center">
                <img src={require('../gifs/shaky-dog.gif')} alt="Brendan Meagher" className="rounded-lg object-contain" style={{ height: '150px' }} />
              </div>
            )}
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <div style={{ color: '#94a3b8' }}>Loading detailed stats...</div>
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
                    {playerStats.games_played}
                  </div>
                  <div className="text-sm" style={{ color: '#94a3b8' }}>Games Played</div>
                </div>
                <div className="text-center p-3 rounded-lg" style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
                  <div className="text-2xl font-bold" style={{ color: getWinRateColor(playerStats.win_percentage) }}>
                    {playerStats.win_percentage.toFixed(1)}%
                  </div>
                  <div className="text-sm" style={{ color: '#94a3b8' }}>Win Rate</div>
                </div>
                <div className="text-center p-3 rounded-lg" style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
                  <div className="text-2xl font-bold" style={{ color: '#4ade80' }}>
                    {playerStats.games_won}
                  </div>
                  <div className="text-sm" style={{ color: '#94a3b8' }}>Wins</div>
                </div>
                <div className="text-center p-3 rounded-lg" style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
                  <div className="text-2xl font-bold" style={{ color: '#f87171' }}>
                    {playerStats.games_played - playerStats.games_won}
                  </div>
                  <div className="text-sm" style={{ color: '#94a3b8' }}>Losses</div>
                </div>
              </div>

              {/* Detailed Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6" style={{ borderTop: '1px solid #334155' }}>
                <div className="space-y-4">
                  <h4 className="font-medium" style={{ color: '#f1f5f9' }}>Scoring</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: '#94a3b8' }}>Total Points Scored:</span>
                      <span className="font-medium" style={{ color: '#f1f5f9' }}>{playerStats.total_points_scored}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#94a3b8' }}>Total Points Against:</span>
                      <span className="font-medium" style={{ color: '#f1f5f9' }}>{playerStats.total_points_against}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#94a3b8' }}>Point Differential:</span>
                      <span className="font-medium" style={{
                        color: playerStats.total_points_scored - playerStats.total_points_against >= 0 ? '#4ade80' : '#f87171'
                      }}>
                        {playerStats.total_points_scored - playerStats.total_points_against > 0 ? '+' : ''}
                        {playerStats.total_points_scored - playerStats.total_points_against}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium" style={{ color: '#f1f5f9' }}>Margins</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: '#94a3b8' }}>Avg Win Margin:</span>
                      <span className="font-medium" style={{ color: '#4ade80' }}>
                        +{playerStats.avg_win_margin.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: '#94a3b8' }}>Avg Loss Margin:</span>
                      <span className="font-medium" style={{ color: '#f87171' }}>
                        -{playerStats.avg_loss_margin.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Your Win/Loss Margin vs Avg Chart */}
              <div className="pt-6" style={{ borderTop: '1px solid #334155' }}>
                <h4 className="font-medium mb-4" style={{ color: '#f1f5f9' }}>Your Win/Loss Margin vs Avg</h4>
                <div style={{ width: '100%', height: '200px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    {(() => {
                      // Calculate averages and domain outside of render
                      const avgWin = players.length > 0 ? players.reduce((sum, p) => sum + p.avg_win_margin, 0) / players.length : 0;
                      const avgLoss = players.length > 0 ? -(players.reduce((sum, p) => sum + p.avg_loss_margin, 0) / players.length) : 0;

                      // Get player's values
                      const playerWin = playerStats.avg_win_margin;
                      const playerLoss = -playerStats.avg_loss_margin;

                      // Calculate min and max with 20% padding
                      const allValues = [avgWin, avgLoss, playerWin, playerLoss, 0]; // Include 0 baseline
                      const minVal = Math.min(...allValues);
                      const maxVal = Math.max(...allValues);

                      // Simple 20% padding above highest and below lowest
                      const yMin = minVal - (Math.abs(minVal) * 0.2);
                      const yMax = maxVal + (Math.abs(maxVal) * 0.2);

                      const yDomain = [yMin, yMax];

                      return (
                        <BarChart
                          data={[{
                            name: playerStats.name,
                            winMargin: playerStats.avg_win_margin,
                            lossMargin: -playerStats.avg_loss_margin
                          }]}
                          margin={{
                            top: 5,
                            right: 5,
                            left: 0,
                            bottom: 25,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis
                            dataKey="name"
                            tick={{ fontSize: 12, fill: '#94a3b8' }}
                          />
                          <YAxis
                            width={35}
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                            label={{ value: 'Point Margin', angle: -90, position: 'insideLeft', style: { fontSize: '10px', fill: '#94a3b8' } }}
                          />
                          <ReferenceLine y={0} stroke="#64748b" strokeDasharray="2 2" />
                          <ReferenceLine
                            y={avgWin}
                            stroke="#22C55E"
                            strokeDasharray="3 3"
                            label={{
                              value: `Avg +${avgWin.toFixed(1)}`,
                              position: "insideTopRight",
                              fill: '#94a3b8'
                            }}
                          />
                          <ReferenceLine
                            y={avgLoss}
                            stroke="#EF4444"
                            strokeDasharray="2 2"
                            label={{
                              value: `Avg -${Math.abs(avgLoss).toFixed(1)}`,
                              position: "insideBottomLeft",
                              fill: '#94a3b8'
                            }}
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', color: '#f1f5f9' }}
                            labelStyle={{ color: '#f1f5f9' }}
                            labelFormatter={(name) => `Player: ${name}`}
                            formatter={(value, name) => {
                              const numValue = Number(value);
                              if (name === 'winMargin') return [`+${numValue.toFixed(1)}`, 'Your Win Margin'];
                              if (name === 'lossMargin') return [`-${Math.abs(numValue).toFixed(1)}`, 'Your Loss Margin'];
                              return [value, name];
                            }}
                          />
                          <Bar
                            dataKey="winMargin"
                            fill="#22C55E"
                            radius={[2, 2, 0, 0]}
                          />
                          <Bar
                            dataKey="lossMargin"
                            fill="#EF4444"
                            radius={[0, 0, 2, 2]}
                          />
                        </BarChart>
                      );
                    })()}
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Games */}
              {playerStats.recent_games.length > 0 && (
                <div className="pt-6" style={{ borderTop: '1px solid #334155' }}>
                  {(() => {
                    // Calculate recent games stats
                    let wins = 0;
                    let totalPointDifferential = 0;

                    playerStats.recent_games.forEach((game) => {
                      const isPlayerOnTeam1 = game.team1_player_names.includes(playerStats.name);
                      const playerTeam = isPlayerOnTeam1 ? 1 : 2;
                      const isWin = game.winner_team === playerTeam;
                      const playerScore = isPlayerOnTeam1 ? game.team1_score : game.team2_score;
                      const opponentScore = isPlayerOnTeam1 ? game.team2_score : game.team1_score;

                      if (isWin) wins++;
                      totalPointDifferential += (playerScore - opponentScore);
                    });

                    const losses = playerStats.recent_games.length - wins;
                    const recordColor = wins > losses ? '#4ade80' : wins < losses ? '#f87171' : '#facc15';
                    const differentialColor = totalPointDifferential > 0 ? '#4ade80' : totalPointDifferential < 0 ? '#f87171' : '#f1f5f9';
                    const differentialSign = totalPointDifferential > 0 ? '+' : '';

                    return (
                      <h4 className="font-medium mb-4" style={{ color: '#f1f5f9' }}>
                        Recent Games{' '}
                        <span style={{ color: recordColor }}>({wins}-{losses})</span>{' '}
                        <span style={{ color: differentialColor }}>{differentialSign}{totalPointDifferential} pts</span>
                      </h4>
                    );
                  })()}
                  <div className="space-y-3">
                    {playerStats.recent_games.map((game) => {
                      const isPlayerOnTeam1 = game.team1_player_names.includes(playerStats.name);
                      const playerTeam = isPlayerOnTeam1 ? 1 : 2;
                      const isWin = game.winner_team === playerTeam;
                      const playerScore = isPlayerOnTeam1 ? game.team1_score : game.team2_score;
                      const opponentScore = isPlayerOnTeam1 ? game.team2_score : game.team1_score;

                      return (
                        <div
                          key={game.id}
                          className="p-3 rounded-lg"
                          style={{
                            backgroundColor: isWin ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                            border: `1px solid ${isWin ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className="px-2 py-1 rounded text-xs font-medium" style={{
                                backgroundColor: isWin ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                color: isWin ? '#4ade80' : '#f87171',
                              }}>
                                {isWin ? 'W' : 'L'}
                              </span>
                              <span className="font-medium" style={{ color: '#f1f5f9' }}>
                                {playerScore} - {opponentScore}
                              </span>
                              <span className="text-sm" style={{ color: '#94a3b8' }}>
                                ({isWin ? '+' : '-'}{Math.abs(playerScore - opponentScore)})
                              </span>
                            </div>
                            <div className="text-sm" style={{ color: '#94a3b8' }}>
                              {formatDate(game.played_at)}
                            </div>
                          </div>
                          <div className="mt-2 text-xs" style={{ color: '#94a3b8' }}>
                            <span className="font-medium" style={{ color: '#cbd5e1' }}>Team {playerTeam}:</span>{' '}
                            {(isPlayerOnTeam1 ? game.team1_player_names : game.team2_player_names).join(', ')}
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
              Select a player to view detailed statistics
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlayerStats;
