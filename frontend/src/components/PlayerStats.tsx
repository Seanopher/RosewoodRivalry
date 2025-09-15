import React, { useState, useEffect, useRef } from 'react';
import { Player, PlayerStats as PlayerStatsType } from '../types';
import { playerAPI } from '../services/api';

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
    if (percentage >= 55) return 'text-green-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (players.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Player Statistics</h2>
        <div className="text-center text-gray-500 py-8">
          <p className="text-lg">No players yet.</p>
          <p className="text-sm mt-2">Add some players to see their statistics!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Player Selection */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-2">Player Statistics</h2>
        <p className="text-gray-600 text-sm mb-4">Select a player to view their full stats page.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {players
            .sort((a, b) => b.win_percentage - a.win_percentage)
            .map((player) => (
            <button
              key={player.id}
              onClick={() => onPlayerSelect(player)}
              className={`p-4 text-left rounded-lg border transition-colors ${
                selectedPlayer?.id === player.id
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium">{player.name}</div>
              <div className="text-sm text-gray-500 mt-1">
                {player.games_played} games
              </div>
              {player.games_played > 0 && (
                <div className={`text-sm font-medium mt-1 ${getWinRateColor(player.win_percentage)}`}>
                  {player.win_percentage.toFixed(1)}% wins
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Detailed Stats */}
      {selectedPlayer && (
        <div ref={detailedStatsRef} className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              {selectedPlayer.name}'s Statistics
            </h3>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <div className="text-gray-500">Loading detailed stats...</div>
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <div className="text-red-600">{error}</div>
            </div>
          ) : playerStats ? (
            <div className="p-6 space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {playerStats.games_played}
                  </div>
                  <div className="text-sm text-gray-500">Games Played</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getWinRateColor(playerStats.win_percentage)}`}>
                    {playerStats.win_percentage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-500">Win Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {playerStats.games_won}
                  </div>
                  <div className="text-sm text-gray-500">Wins</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {playerStats.games_played - playerStats.games_won}
                  </div>
                  <div className="text-sm text-gray-500">Losses</div>
                </div>
              </div>

              {/* Detailed Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Scoring</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Points Scored:</span>
                      <span className="font-medium">{playerStats.total_points_scored}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Points Against:</span>
                      <span className="font-medium">{playerStats.total_points_against}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Point Differential:</span>
                      <span className={`font-medium ${
                        playerStats.total_points_scored - playerStats.total_points_against >= 0
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}>
                        {playerStats.total_points_scored - playerStats.total_points_against > 0 ? '+' : ''}
                        {playerStats.total_points_scored - playerStats.total_points_against}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Margins</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Win Margin:</span>
                      <span className="font-medium text-green-600">
                        +{playerStats.avg_win_margin.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Loss Margin:</span>
                      <span className="font-medium text-red-600">
                        -{playerStats.avg_loss_margin.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Games */}
              {playerStats.recent_games.length > 0 && (
                <div className="pt-6 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-4">Recent Games</h4>
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
                          className={`p-3 rounded-lg border ${
                            isWin ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                isWin 
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {isWin ? 'W' : 'L'}
                              </span>
                              <span className="font-medium">
                                {playerScore} - {opponentScore}
                              </span>
                              <span className="text-sm text-gray-600">
                                ({isWin ? '+' : '-'}{Math.abs(playerScore - opponentScore)})
                              </span>
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatDate(game.played_at)}
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-600">
                            <span className="font-medium">Team {playerTeam}:</span>{' '}
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
            <div className="p-6 text-center text-gray-500">
              Select a player to view detailed statistics
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlayerStats;