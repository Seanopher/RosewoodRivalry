import React from 'react';
import { GameSummary } from '../types';

interface GameHistoryProps {
  games: GameSummary[];
}

const GameHistory: React.FC<GameHistoryProps> = ({ games }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getWinnerColor = (winnerTeam: number) => {
    return winnerTeam === 1 ? 'text-blue-600' : 'text-red-600';
  };

  const getScoreColor = (score: number, otherScore: number) => {
    if (score > otherScore) return 'text-green-600 font-bold';
    if (score < otherScore) return 'text-gray-600';
    return 'text-yellow-600 font-bold';
  };

  if (games.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Game History</h2>
        <div className="text-center text-gray-500 py-8">
          <p className="text-lg">No games played yet.</p>
          <p className="text-sm mt-2">Create your first game to see it appear here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Game History</h2>
        <p className="text-sm text-gray-500 mt-1">
          {games.length} game{games.length !== 1 ? 's' : ''} played
        </p>
      </div>
      
      <div className="divide-y divide-gray-200">
        {games.map((game) => (
          <div key={game.id} className="p-6 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-500">
                Game #{game.id} • {formatDate(game.played_at)}
              </div>
              <div className={`text-sm font-medium ${getWinnerColor(game.winner_team)}`}>
                Team {game.winner_team} Wins!
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Team 1 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-blue-600">Team 1</h3>
                  <span className={`text-xl font-bold ${getScoreColor(game.team1_score, game.team2_score)}`}>
                    {game.team1_score}
                  </span>
                </div>
                <ul className="space-y-1 text-sm text-gray-700">
                  {game.team1_player_names.map((name, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                      {name}
                    </li>
                  ))}
                </ul>
              </div>

              {/* VS Divider */}
              <div className="flex items-center justify-center">
                <div className="text-gray-400 font-bold text-lg">VS</div>
              </div>

              {/* Team 2 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-red-600">Team 2</h3>
                  <span className={`text-xl font-bold ${getScoreColor(game.team2_score, game.team1_score)}`}>
                    {game.team2_score}
                  </span>
                </div>
                <ul className="space-y-1 text-sm text-gray-700">
                  {game.team2_player_names.map((name, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Game Stats */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Total Points:</span>{' '}
                  {game.team1_score + game.team2_score}
                </div>
                <div>
                  <span className="font-medium">Margin:</span>{' '}
                  {Math.abs(game.team1_score - game.team2_score)} points
                </div>
                <div>
                  <span className="font-medium">Winner:</span>{' '}
                  <span className={getWinnerColor(game.winner_team)}>
                    Team {game.winner_team}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameHistory;