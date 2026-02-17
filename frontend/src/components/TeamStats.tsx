import React, { useState } from 'react';
import { Team, TeamStats as TeamStatsType } from '../types';
import { teamAPI } from '../services/api';

interface TeamStatsProps {
  teams: Team[];
  onTeamSelect: (team: Team) => void;
  teamThreshold?: { total_games: number; min_games_required: number; threshold_percentage: number } | null;
}

const TeamStats: React.FC<TeamStatsProps> = ({ teams, onTeamSelect, teamThreshold }) => {
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamStats, setTeamStats] = useState<TeamStatsType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTeamSelect = async (team: Team) => {
    if (selectedTeam?.id === team.id) {
      setSelectedTeam(null);
      setTeamStats(null);
      return;
    }

    setSelectedTeam(team);
    setLoading(true);
    setError(null);

    try {
      const stats = await teamAPI.getTeamStats(team.id);
      setTeamStats(stats);
      onTeamSelect(team);
    } catch (err: any) {
      setError('Failed to load team stats');
      console.error('Error loading team stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (teams.length === 0) {
    return (
      <div className="rounded-lg p-6" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <h2 className="text-lg font-medium mb-4" style={{ color: '#f1f5f9' }}>Team Statistics</h2>
        <div className="text-center py-8">
          <p className="text-lg" style={{ color: '#94a3b8' }}>No teams found.</p>
          <p className="text-sm mt-2" style={{ color: '#64748b' }}>
            Teams are created when the same 3 players play at least{' '}
            {teamThreshold ? teamThreshold.min_games_required : 3} games together
            {teamThreshold && (
              <span> ({teamThreshold.threshold_percentage}% of {teamThreshold.total_games} total games)</span>
            )}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team List */}
      <div className="rounded-lg" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <div className="px-6 py-4" style={{ borderBottom: '1px solid #334155' }}>
          <h2 className="text-lg font-medium" style={{ color: '#f1f5f9' }}>Team Statistics</h2>
          <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
            {teams.length} team{teams.length !== 1 ? 's' : ''} with{' '}
            {teamThreshold ? `${teamThreshold.min_games_required}+` : '3+'} games
            {teamThreshold && (
              <span> ({teamThreshold.threshold_percentage}% of {teamThreshold.total_games} total games)</span>
            )}
          </p>
        </div>

        <div>
          {teams
            .sort((a, b) => b.win_percentage - a.win_percentage)
            .map((team, index) => {
              const getMedal = (rank: number) => {
                switch (rank) {
                  case 0: return '🥇';
                  case 1: return '🥈';
                  case 2: return '🥉';
                  default: return '';
                }
              };

              return (
            <div
              key={team.id}
              className="p-6 cursor-pointer transition-colors"
              style={{
                borderBottom: '1px solid #334155',
                backgroundColor: selectedTeam?.id === team.id ? 'rgba(244, 63, 94, 0.08)' : 'transparent',
                borderLeft: selectedTeam?.id === team.id ? '4px solid #f43f5e' : '4px solid transparent',
              }}
              onClick={() => handleTeamSelect(team)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2" style={{ color: '#f1f5f9' }}>
                    <span>{getMedal(index)}</span>
                    <span>{team.team_name}</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Large Win Rate Display */}
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-5xl font-bold" style={{
                        color: team.win_percentage >= 50 ? '#4ade80' : '#f87171'
                      }}>
                        {team.win_percentage.toFixed(1)}%
                      </div>
                      <div className="text-sm font-medium" style={{ color: '#94a3b8' }}>Win Rate</div>
                    </div>

                    {/* Games Stats */}
                    <div className="space-y-2 text-sm">
                      <div>
                        <span style={{ color: '#94a3b8' }}>Games: </span>
                        <span className="font-medium" style={{ color: '#f1f5f9' }}>{team.games_played}</span>
                      </div>
                      <div>
                        <span style={{ color: '#94a3b8' }}>Points For: </span>
                        <span className="font-medium" style={{ color: '#f1f5f9' }}>{team.total_points_scored}</span>
                      </div>
                      <div>
                        <span style={{ color: '#94a3b8' }}>Points Against: </span>
                        <span className="font-medium" style={{ color: '#f1f5f9' }}>{team.total_points_against}</span>
                      </div>
                      <div>
                        <span style={{ color: '#94a3b8' }}>Point Diff: </span>
                        <span className="font-medium" style={{
                          color: team.total_points_scored - team.total_points_against >= 0 ? '#4ade80' : '#f87171'
                        }}>
                          {team.total_points_scored - team.total_points_against > 0 ? '+' : ''}
                          {team.total_points_scored - team.total_points_against}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ml-4 text-right">
                  <div className="text-2xl font-bold" style={{
                    color: team.win_percentage >= 50 ? '#4ade80' : '#f87171'
                  }}>
                    {team.games_won}-{team.games_played - team.games_won}
                  </div>
                  <div className="text-xs" style={{ color: '#94a3b8' }}>W-L Record</div>
                </div>
              </div>
            </div>
              );
            })}
        </div>
      </div>

      {/* Team Details Modal */}
      {selectedTeam && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-[9999]"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onClick={() => {
            setSelectedTeam(null);
            setTeamStats(null);
          }}
        >
          <div
            className="rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            style={{ backgroundColor: '#1e293b', border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {loading && (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8" style={{ borderBottom: '2px solid #f43f5e' }}></div>
                <span className="ml-2" style={{ color: '#94a3b8' }}>Loading team details...</span>
              </div>
            )}

            {error && (
              <div className="p-8">
                <div className="text-center" style={{ color: '#f87171' }}>
                  <p>{error}</p>
                  <button
                    onClick={() => {
                      setSelectedTeam(null);
                      setTeamStats(null);
                    }}
                    style={{
                      marginTop: '1rem',
                      padding: '0.5rem 1rem',
                      backgroundColor: '#0f172a',
                      color: '#cbd5e1',
                      borderRadius: '0.375rem',
                      border: '1px solid #334155',
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {teamStats && (
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom: '1px solid #334155' }}>
                  <h3 className="text-2xl font-semibold" style={{ color: '#f1f5f9' }}>
                    {teamStats.team_name} Details
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedTeam(null);
                      setTeamStats(null);
                    }}
                    className="text-2xl leading-none"
                    style={{ color: '#64748b', backgroundColor: 'transparent', border: 'none' }}
                    title="Close details"
                  >
                    ✕
                  </button>
                </div>

                {/* Team Members */}
                <div className="mb-6">
                  <h4 className="text-lg font-medium mb-3" style={{ color: '#f1f5f9' }}>Team Members</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {teamStats.players.map((player) => (
                      <div key={player.id} className="p-3 rounded-lg" style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
                        <div className="font-medium" style={{ color: '#f1f5f9' }}>{player.name}</div>
                        <div className="text-sm" style={{ color: '#94a3b8' }}>
                          {player.games_played} games, {player.win_percentage.toFixed(1)}% win rate
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detailed Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <div className="text-2xl font-bold" style={{ color: '#60a5fa' }}>{teamStats.games_played}</div>
                    <div className="text-sm" style={{ color: '#93c5fd' }}>Games Played</div>
                  </div>
                  <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                    <div className="text-2xl font-bold" style={{ color: '#4ade80' }}>{teamStats.win_percentage.toFixed(1)}%</div>
                    <div className="text-sm" style={{ color: '#86efac' }}>Win Rate</div>
                  </div>
                  <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(167, 139, 250, 0.1)', border: '1px solid rgba(167, 139, 250, 0.2)' }}>
                    <div className="text-2xl font-bold" style={{ color: '#a78bfa' }}>{teamStats.avg_win_margin.toFixed(1)}</div>
                    <div className="text-sm" style={{ color: '#c4b5fd' }}>Avg Win Margin</div>
                  </div>
                  <div className="p-4 rounded-lg" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                    <div className="text-2xl font-bold" style={{ color: '#f87171' }}>{teamStats.avg_loss_margin.toFixed(1)}</div>
                    <div className="text-sm" style={{ color: '#fca5a5' }}>Avg Loss Margin</div>
                  </div>
                </div>

                {/* Recent Games */}
                {teamStats.recent_games && teamStats.recent_games.length > 0 && (
                  <div>
                    <h4 className="text-lg font-medium mb-3" style={{ color: '#f1f5f9' }}>Recent Games</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {teamStats.recent_games.slice(0, 5).map((game) => (
                        <div key={game.id} className="flex items-center justify-between p-3 rounded" style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
                          <div className="flex items-center space-x-4">
                            <div className="text-sm" style={{ color: '#94a3b8' }}>
                              {formatDate(game.played_at)}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium" style={{ color: '#f1f5f9' }}>{game.team1_score}-{game.team2_score}</span>
                            </div>
                          </div>
                          <div className="text-sm font-medium" style={{
                            color: game.winner_team === 1 ? '#4ade80' : '#f87171'
                          }}>
                            {game.winner_team === 1 ? 'W' : 'L'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamStats;
