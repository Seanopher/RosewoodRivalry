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
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Team Statistics</h2>
        <div className="text-center text-gray-500 py-8">
          <p className="text-lg">No teams found.</p>
          <p className="text-sm mt-2">
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
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Team Statistics</h2>
          <p className="text-sm text-gray-500 mt-1">
            {teams.length} team{teams.length !== 1 ? 's' : ''} with{' '}
            {teamThreshold ? `${teamThreshold.min_games_required}+` : '3+'} games
            {teamThreshold && (
              <span> ({teamThreshold.threshold_percentage}% of {teamThreshold.total_games} total games)</span>
            )}
          </p>
        </div>

        <div className="divide-y divide-gray-200">
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
              className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${
                selectedTeam?.id === team.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
              }`}
              onClick={() => handleTeamSelect(team)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <span>{getMedal(index)}</span>
                    <span>{team.team_name}</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Large Win Rate Display */}
                    <div className="flex flex-col items-center justify-center">
                      <div className={`text-5xl font-bold ${
                        team.win_percentage >= 50 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {team.win_percentage.toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-500 font-medium">Win Rate</div>
                    </div>
                    
                    {/* Games Stats */}
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-500">Games: </span>
                        <span className="font-medium">{team.games_played}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Points For: </span>
                        <span className="font-medium">{team.total_points_scored}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Points Against: </span>
                        <span className="font-medium">{team.total_points_against}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Point Diff: </span>
                        <span className={`font-medium ${
                          team.total_points_scored - team.total_points_against >= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {team.total_points_scored - team.total_points_against > 0 ? '+' : ''}
                          {team.total_points_scored - team.total_points_against}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="ml-4 text-right">
                  <div className={`text-2xl font-bold ${
                    team.win_percentage >= 50 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {team.games_won}-{team.games_played - team.games_won}
                  </div>
                  <div className="text-xs text-gray-500">W-L Record</div>
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
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]"
          onClick={() => {
            setSelectedTeam(null);
            setTeamStats(null);
          }}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {loading && (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading team details...</span>
              </div>
            )}

            {error && (
              <div className="p-8">
                <div className="text-red-600 text-center">
                  <p>{error}</p>
                  <button
                    onClick={() => {
                      setSelectedTeam(null);
                      setTeamStats(null);
                    }}
                    className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {teamStats && (
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b">
                  <h3 className="text-2xl font-semibold text-gray-900">
                    {teamStats.team_name} Details
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedTeam(null);
                      setTeamStats(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                    title="Close details"
                  >
                    ✕
                  </button>
                </div>

                {/* Team Members */}
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Team Members</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {teamStats.players.map((player) => (
                      <div key={player.id} className="bg-gray-50 p-3 rounded-lg">
                        <div className="font-medium text-gray-900">{player.name}</div>
                        <div className="text-sm text-gray-600">
                          {player.games_played} games, {player.win_percentage.toFixed(1)}% win rate
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Detailed Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{teamStats.games_played}</div>
                    <div className="text-sm text-blue-800">Games Played</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{teamStats.win_percentage.toFixed(1)}%</div>
                    <div className="text-sm text-green-800">Win Rate</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{teamStats.avg_win_margin.toFixed(1)}</div>
                    <div className="text-sm text-purple-800">Avg Win Margin</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{teamStats.avg_loss_margin.toFixed(1)}</div>
                    <div className="text-sm text-red-800">Avg Loss Margin</div>
                  </div>
                </div>

                {/* Recent Games */}
                {teamStats.recent_games && teamStats.recent_games.length > 0 && (
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Recent Games</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {teamStats.recent_games.slice(0, 5).map((game) => (
                        <div key={game.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="flex items-center space-x-4">
                            <div className="text-sm text-gray-500">
                              {formatDate(game.played_at)}
                            </div>
                            <div className="text-sm">
                              <span className="font-medium">{game.team1_score}-{game.team2_score}</span>
                            </div>
                          </div>
                          <div className={`text-sm font-medium ${
                            game.winner_team === 1 ? 'text-green-600' : 'text-red-600'
                          }`}>
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