import React, { useState, useEffect } from 'react';
import { Player, GolfRoundSummary, GolfPlayerStats } from '../types';
import { golfAPI } from '../services/api';

interface GolfDashboardProps {
  players: Player[];
  golfRounds: GolfRoundSummary[];
}

const GolfDashboard: React.FC<GolfDashboardProps> = ({ players, golfRounds }) => {
  const [leaderboard, setLeaderboard] = useState<GolfPlayerStats[]>([]);
  const [loading, setLoading] = useState(false);

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
        <p style={{ color: '#94a3b8' }}>2v2 Match Play Golf Tracker. Track rounds, holes, and bragging rights!</p>
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

      {/* Recent Rounds */}
      {golfRounds.length > 0 && (
        <div className="p-6 rounded-lg" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#f8fafc' }}>Recent Rounds</h3>
          <div className="space-y-4">
            {golfRounds.slice(0, 3).map((round) => (
              <div key={round.id} className="rounded-lg p-4 transition-colors" style={{ border: '1px solid #334155', backgroundColor: '#0f172a' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm" style={{ color: '#94a3b8' }}>
                    Round #{round.id} {' '} {new Date(round.played_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    {' '} {round.course}
                  </div>
                  <div className="text-sm font-medium" style={{
                    color: round.winner_team === 1 ? '#60a5fa' : round.winner_team === 2 ? '#f43f5e' : '#facc15'
                  }}>
                    {round.winner_team ? `Team ${round.winner_team} Wins!` : 'Draw!'}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 items-center">
                  {/* Team 1 */}
                  <div className="text-center">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium" style={{ color: '#60a5fa' }}>Team 1</span>
                      <span className="text-lg font-bold" style={{
                        color: round.team1_holes_won > round.team2_holes_won ? '#4ade80' : '#64748b'
                      }}>
                        {round.team1_holes_won}
                      </span>
                    </div>
                    <div className="text-xs space-y-0.5" style={{ color: '#94a3b8' }}>
                      {round.team1_player_names.map((name, idx) => (
                        <div key={idx}>{name}</div>
                      ))}
                    </div>
                  </div>

                  {/* VS */}
                  <div className="text-center">
                    <div className="font-medium text-sm" style={{ color: '#475569' }}>VS</div>
                    <div className="text-xs mt-1" style={{ color: '#64748b' }}>
                      {round.halved_holes} halved
                    </div>
                  </div>

                  {/* Team 2 */}
                  <div className="text-center">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium" style={{ color: '#f43f5e' }}>Team 2</span>
                      <span className="text-lg font-bold" style={{
                        color: round.team2_holes_won > round.team1_holes_won ? '#4ade80' : '#64748b'
                      }}>
                        {round.team2_holes_won}
                      </span>
                    </div>
                    <div className="text-xs space-y-0.5" style={{ color: '#94a3b8' }}>
                      {round.team2_player_names.map((name, idx) => (
                        <div key={idx}>{name}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
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
    </div>
  );
};

export default GolfDashboard;
