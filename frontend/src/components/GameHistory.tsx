import React from 'react';
import { GameSummary } from '../types';

interface GameHistoryProps {
  games: GameSummary[];
  onEditGame?: (gameId: number) => void;
}

const GameHistory: React.FC<GameHistoryProps> = ({ games, onEditGame }) => {
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
    return winnerTeam === 1 ? '#60a5fa' : '#f43f5e';
  };

  const getScoreStyle = (score: number, otherScore: number) => {
    if (score > otherScore) return { color: '#4ade80', fontWeight: 700 };
    if (score < otherScore) return { color: '#64748b' };
    return { color: '#facc15', fontWeight: 700 };
  };

  if (games.length === 0) {
    return (
      <div className="rounded-lg p-6" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <h2 className="text-lg font-medium mb-4" style={{ color: '#f1f5f9' }}>Game History</h2>
        <div className="text-center py-8">
          <p className="text-lg" style={{ color: '#94a3b8' }}>No games played yet.</p>
          <p className="text-sm mt-2" style={{ color: '#64748b' }}>Create your first game to see it appear here!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg animate-fadeIn" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
      <div className="px-6 py-4" style={{ borderBottom: '1px solid #334155' }}>
        <h2 className="text-lg font-medium" style={{ color: '#f1f5f9' }}>Game History</h2>
        <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
          {games.length} game{games.length !== 1 ? 's' : ''} played
        </p>
      </div>

      <div>
        {games.map((game, index) => (
          <div key={game.id} className="p-6 transition-colors" style={{
            backgroundColor: index % 2 === 0 ? '#1e293b' : '#162032',
            borderBottom: index < games.length - 1 ? '1px solid #334155' : 'none',
          }}>
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-1">
                <div className="text-sm" style={{ color: '#94a3b8' }}>
                  Game #{game.id} • {formatDate(game.played_at)}
                </div>
                {game.location && (
                  <div className="text-sm" style={{ color: '#94a3b8' }}>
                    🏟️ {game.location}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium" style={{ color: getWinnerColor(game.winner_team) }}>
                  Team {game.winner_team} Wins!
                </div>
                {onEditGame && (
                  <button
                    onClick={() => onEditGame(game.id)}
                    style={{
                      color: '#f43f5e',
                      border: '1px solid rgba(244, 63, 94, 0.4)',
                      backgroundColor: 'transparent',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                    }}
                    title="Edit this game"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Team 1 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium" style={{ color: '#60a5fa' }}>Team 1</h3>
                  <span className="text-xl font-bold" style={getScoreStyle(game.team1_score, game.team2_score)}>
                    {game.team1_score}
                  </span>
                </div>
                <ul className="space-y-1 text-sm" style={{ color: '#cbd5e1' }}>
                  {game.team1_player_names.map((name, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#60a5fa' }}></span>
                      {name}
                    </li>
                  ))}
                </ul>
              </div>

              {/* VS Divider */}
              <div className="flex items-center justify-center">
                <div className="font-bold text-lg" style={{ color: '#475569' }}>VS</div>
              </div>

              {/* Team 2 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium" style={{ color: '#f43f5e' }}>Team 2</h3>
                  <span className="text-xl font-bold" style={getScoreStyle(game.team2_score, game.team1_score)}>
                    {game.team2_score}
                  </span>
                </div>
                <ul className="space-y-1 text-sm" style={{ color: '#cbd5e1' }}>
                  {game.team2_player_names.map((name, index) => (
                    <li key={index} className="flex items-center">
                      <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: '#f43f5e' }}></span>
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Game Stats */}
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid #334155' }}>
              <div className="grid grid-cols-3 gap-4 text-sm" style={{ color: '#94a3b8' }}>
                <div>
                  <span className="font-medium" style={{ color: '#cbd5e1' }}>Total Points:</span>{' '}
                  {game.team1_score + game.team2_score}
                </div>
                <div>
                  <span className="font-medium" style={{ color: '#cbd5e1' }}>Margin:</span>{' '}
                  {Math.abs(game.team1_score - game.team2_score)} points
                </div>
                <div>
                  <span className="font-medium" style={{ color: '#cbd5e1' }}>Winner:</span>{' '}
                  <span style={{ color: getWinnerColor(game.winner_team) }}>
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
