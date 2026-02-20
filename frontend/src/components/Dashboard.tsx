import React, { useState, useEffect } from 'react';
import { Player, GameSummary, RivalryStats, PlayerStats } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { rivalryAPI, playerAPI } from '../services/api';

interface DashboardProps {
  players: Player[];
  games: GameSummary[];
}

const Dashboard: React.FC<DashboardProps> = ({ players, games }) => {
  const [rivalryStats, setRivalryStats] = useState<RivalryStats | null>(null);
  const [rivalryLoading, setRivalryLoading] = useState(false);
  const [winRateView, setWinRateView] = useState<'season' | 'alltime'>('season');
  const [seasonLeaderboard, setSeasonLeaderboard] = useState<PlayerStats[]>([]);
  const [seasonLeaderboardLoading, setSeasonLeaderboardLoading] = useState(false);

  // Load rivalry stats and 2026 season leaderboard on mount
  useEffect(() => {
    loadRivalryStats();
    loadSeasonLeaderboard();
  }, []);

  const loadSeasonLeaderboard = async () => {
    try {
      setSeasonLeaderboardLoading(true);
      const data = await playerAPI.getLeaderboard('2026');
      setSeasonLeaderboard(data);
    } catch (error) {
      console.error('Failed to load season leaderboard:', error);
    } finally {
      setSeasonLeaderboardLoading(false);
    }
  };

  const loadRivalryStats = async () => {
    try {
      setRivalryLoading(true);
      const stats = await rivalryAPI.getRivalryStats();
      setRivalryStats(stats);
    } catch (error) {
      console.error('Failed to load rivalry stats:', error);
    } finally {
      setRivalryLoading(false);
    }
  };

  // Calculate this week's games (last 7 days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const thisWeeksGames = games.filter(game =>
    new Date(game.played_at) >= oneWeekAgo
  );

  // Calculate weekly stats
  const weeklyStats = {
    totalGames: thisWeeksGames.length,
    totalPlayers: new Set(thisWeeksGames.flatMap(game => [
      ...game.team1_player_names,
      ...game.team2_player_names
    ])).size,
    averageScore: thisWeeksGames.length > 0
      ? Math.round((thisWeeksGames.reduce((sum, game) => sum + game.team1_score + game.team2_score, 0)) / thisWeeksGames.length)
      : 0
  };

  // Calculate total games played and find qualified players (33.3% participation)
  const totalGames = games.length;
  const minimumGamesRequired = Math.ceil(totalGames * 0.333); // 33.3% of total games

  // Find all qualified players with highest win percentage (all-time)
  const qualifiedPlayers = [...players]
    .filter(player => player.games_played >= minimumGamesRequired && player.games_played > 0)
    .sort((a, b) => b.win_percentage - a.win_percentage);

  // Season (2026) totals and qualified players
  const season2026TotalGames = games.filter(g => new Date(g.played_at).getFullYear() === 2026).length;
  const season2026MinGames = Math.ceil(season2026TotalGames * 0.333);
  const qualifiedSeasonPlayers = seasonLeaderboard.filter(p => p.games_played >= season2026MinGames);

  // Calculate wins this week by player
  const weeklyWinsByPlayer: { [playerName: string]: number } = {};

  thisWeeksGames.forEach(game => {
    const winningTeam = game.winner_team;
    const winningPlayers = winningTeam === 1 ? game.team1_player_names : game.team2_player_names;

    winningPlayers.forEach(playerName => {
      weeklyWinsByPlayer[playerName] = (weeklyWinsByPlayer[playerName] || 0) + 1;
    });
  });



  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#f8fafc' }}>Dashboard </h2>
        <p style={{ color: '#94a3b8' }}>Welcome to the Rosewood Rivalry Game Tracker! Check out the newly implemented Golf tracker!
        </p>
      </div>

      {/* Recent Games */}
      {games.length > 0 && (
        <div className="p-6 rounded-lg" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#f8fafc' }}>⏰ Recent Games</h3>
          <div className="space-y-4">
            {games.slice(0, 3).map((game) => (
              <div key={game.id} className="rounded-lg p-4 transition-colors" style={{ border: '1px solid #334155', backgroundColor: '#0f172a' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm" style={{ color: '#94a3b8' }}>
                    Game #{game.id} • {new Date(game.played_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                    {game.location && ` • ${game.location}`}
                  </div>
                  <div className={`text-sm font-medium ${game.winner_team === 1 ? 'text-blue-600' : 'text-red-600'}`}>
                    Team {game.winner_team} Wins!
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 items-center">
                  {/* Team 1 */}
                  <div className="text-center">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium" style={{ color: '#60a5fa' }}>Team 1</span>
                      <span className={`text-lg font-bold ${game.team1_score > game.team2_score ? 'text-green-600' : ''}`} style={game.team1_score <= game.team2_score ? { color: '#64748b' } : {}}>
                        {game.team1_score}
                      </span>
                    </div>
                    <div className="text-xs space-y-0.5" style={{ color: '#94a3b8' }}>
                      {game.team1_player_names.map((name, idx) => (
                        <div key={idx}>{name}</div>
                      ))}
                    </div>
                  </div>

                  {/* VS */}
                  <div className="text-center">
                    <div className="font-medium text-sm" style={{ color: '#475569' }}>VS</div>
                    <div className="text-xs mt-1" style={{ color: '#64748b' }}>
                      {Math.abs(game.team1_score - game.team2_score)} pts
                    </div>
                  </div>

                  {/* Team 2 */}
                  <div className="text-center">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium" style={{ color: '#f43f5e' }}>Team 2</span>
                      <span className={`text-lg font-bold ${game.team2_score > game.team1_score ? 'text-green-600' : ''}`} style={game.team2_score <= game.team1_score ? { color: '#64748b' } : {}}>
                        {game.team2_score}
                      </span>
                    </div>
                    <div className="text-xs space-y-0.5" style={{ color: '#94a3b8' }}>
                      {game.team2_player_names.map((name, idx) => (
                        <div key={idx}>{name}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {games.length > 3 && (
            <div className="text-center mt-4">
              <p className="text-sm" style={{ color: '#64748b' }}>
                Showing 3 of {games.length} games • View all in Game History
              </p>
            </div>
          )}
        </div>
      )}

      {/* The Rivalry */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: '#f8fafc' }}>⚔️ The Rivalry</h3>
        <p className="text-sm mb-4" style={{ color: '#94a3b8' }}>The Orchard vs Dreher - Historic Matchup</p>

        {rivalryLoading ? (
          <div className="text-center py-4">
            <div style={{ color: '#94a3b8' }}>Loading rivalry stats...</div>
          </div>
        ) : rivalryStats ? (
          <div className="space-y-6">
            {/* Overall Stats - Side by Side */}
            <div className="grid grid-cols-2 gap-6">
              {/* Orchard Stats */}
              <div className="text-center p-4 rounded-lg" style={{
                backgroundColor: rivalryStats.orchard_wins > rivalryStats.dreher_wins ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${rivalryStats.orchard_wins > rivalryStats.dreher_wins ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
              }}>
                <div className="text-4xl mb-2 h-12 flex items-center justify-center">
                  {rivalryStats.orchard_wins > rivalryStats.dreher_wins ? '👑' : '\u00A0'}
                </div>
                <div className={`text-3xl font-bold ${
                  rivalryStats.orchard_wins > rivalryStats.dreher_wins ? 'text-green-600' : 'text-red-600'
                }`}>{rivalryStats.orchard_wins}</div>
                <div className="text-sm font-bold mb-2" style={{ color: '#f1f5f9' }}>The Orchard</div>
                <div className={`text-xs mb-3 ${
                  rivalryStats.orchard_wins > rivalryStats.dreher_wins ? 'text-green-600' : 'text-red-600'
                }`}>{rivalryStats.orchard_win_percentage.toFixed(1)}%</div>
                <div className={`text-lg font-semibold ${
                  rivalryStats.orchard_wins > rivalryStats.dreher_wins ? 'text-green-600' : 'text-red-600'
                }`}>{rivalryStats.total_orchard_points}</div>
                <div className="text-xs" style={{ color: '#94a3b8' }}>Total Points</div>
              </div>

              {/* Dreher Stats */}
              <div className="text-center p-4 rounded-lg" style={{
                backgroundColor: rivalryStats.dreher_wins > rivalryStats.orchard_wins ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${rivalryStats.dreher_wins > rivalryStats.orchard_wins ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
              }}>
                <div className="text-4xl mb-2 h-12 flex items-center justify-center">
                  {rivalryStats.dreher_wins > rivalryStats.orchard_wins ? '👑' : '\u00A0'}
                </div>
                <div className={`text-3xl font-bold ${
                  rivalryStats.dreher_wins > rivalryStats.orchard_wins ? 'text-green-600' : 'text-red-600'
                }`}>{rivalryStats.dreher_wins}</div>
                <div className="text-sm font-bold mb-2" style={{ color: '#f1f5f9' }}>Dreher</div>
                <div className={`text-xs mb-3 ${
                  rivalryStats.dreher_wins > rivalryStats.orchard_wins ? 'text-green-600' : 'text-red-600'
                }`}>{rivalryStats.dreher_win_percentage.toFixed(1)}%</div>
                <div className={`text-lg font-semibold ${
                  rivalryStats.dreher_wins > rivalryStats.orchard_wins ? 'text-green-600' : 'text-red-600'
                }`}>{rivalryStats.total_dreher_points}</div>
                <div className="text-xs" style={{ color: '#94a3b8' }}>Total Points</div>
              </div>
            </div>

            {/* Point Differential */}
            <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
              <div className="text-lg font-semibold" style={{ color: '#f1f5f9' }}>
                Point Differential:
                <span className={`ml-2 ${rivalryStats.point_differential >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {rivalryStats.point_differential >= 0 ? '+' : ''}{rivalryStats.point_differential}
                </span>
                <span className="text-sm ml-1" style={{ color: '#94a3b8' }}>
                  ({rivalryStats.point_differential >= 0 ? 'Orchard' : 'Dreher'} advantage)
                </span>
              </div>
            </div>

            {/* Recent Games */}
            {rivalryStats.recent_games.length > 0 && (
              <div>
                <h4 className="font-medium mb-3" style={{ color: '#f1f5f9' }}>Recent Rivalry Games</h4>
                <div className="space-y-2">
                  {rivalryStats.recent_games.map((game) => (
                    <div key={game.id} className="flex items-center justify-between p-3 rounded" style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
                      <div className="flex items-center space-x-4">
                        <div className="text-sm" style={{ color: '#94a3b8' }}>
                          {new Date(game.played_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium" style={{ color: '#f1f5f9' }}>{game.orchard_score}-{game.dreher_score}</span>
                        </div>
                      </div>
                      <div className={`text-sm font-medium px-2 py-1 rounded`} style={{
                        backgroundColor: game.winner === 'Orchard' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: game.winner === 'Orchard' ? '#4ade80' : '#f87171'
                      }}>
                        {game.winner}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4" style={{ color: '#94a3b8' }}>
            No rivalry games found
          </div>
        )}
      </div>

      {/* Win Rate Leaders */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        {/* Header row with toggle */}
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold" style={{ color: '#f8fafc' }}>
            👑 Win Rate Leaders
          </h3>
          <div className="flex rounded-lg p-0.5" style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
            <button
              onClick={() => setWinRateView('season')}
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: winRateView === 'season' ? '#f43f5e' : 'transparent',
                color: winRateView === 'season' ? '#f8fafc' : '#94a3b8',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              2026 Season
            </button>
            <button
              onClick={() => setWinRateView('alltime')}
              style={{
                padding: '0.25rem 0.75rem',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: winRateView === 'alltime' ? '#f43f5e' : 'transparent',
                color: winRateView === 'alltime' ? '#f8fafc' : '#94a3b8',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              All Time
            </button>
          </div>
        </div>

        {winRateView === 'season' ? (
          <>
            <p className="text-sm mb-4" style={{ color: '#94a3b8' }}>
              2026 season — min {season2026MinGames} game{season2026MinGames !== 1 ? 's' : ''} required ({season2026TotalGames > 0 ? Math.round((season2026MinGames / season2026TotalGames) * 100) : 33}% participation)
            </p>
            {seasonLeaderboardLoading ? (
              <div className="text-center py-4" style={{ color: '#94a3b8' }}>Loading...</div>
            ) : qualifiedSeasonPlayers.length > 0 ? (
              <div className="space-y-3">
                {qualifiedSeasonPlayers.map((player, index) => {
                  const rankStyles = [
                    { bg: 'rgba(234, 179, 8, 0.1)', border: 'rgba(234, 179, 8, 0.3)', badgeBg: 'rgba(234, 179, 8, 0.15)', badgeColor: '#fde047' },
                    { bg: 'rgba(148, 163, 184, 0.1)', border: 'rgba(148, 163, 184, 0.3)', badgeBg: 'rgba(148, 163, 184, 0.15)', badgeColor: '#cbd5e1' },
                    { bg: 'rgba(249, 115, 22, 0.1)', border: 'rgba(249, 115, 22, 0.3)', badgeBg: 'rgba(249, 115, 22, 0.15)', badgeColor: '#fdba74' },
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
                          {player.games_won}/{player.games_played} games ({season2026TotalGames > 0 ? Math.round((player.games_played / season2026TotalGames) * 100) : 0}% participation)
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-2 py-1 rounded-full font-medium" style={{ backgroundColor: style.badgeBg, color: style.badgeColor }}>
                          {Math.round(player.win_percentage)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center py-4" style={{ color: '#94a3b8' }}>
                {season2026TotalGames === 0
                  ? 'No 2026 season games yet.'
                  : `No qualified players yet. Need at least ${season2026MinGames} game${season2026MinGames !== 1 ? 's' : ''} to qualify.`}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="text-sm mb-4" style={{ color: '#94a3b8' }}>
              All time — min {minimumGamesRequired} games required ({Math.round((minimumGamesRequired / totalGames) * 100)}% participation)
            </p>
            {qualifiedPlayers.length > 0 ? (
              <div className="space-y-3">
                {qualifiedPlayers.map((player, index) => {
                  const rankStyles = [
                    { bg: 'rgba(234, 179, 8, 0.1)', border: 'rgba(234, 179, 8, 0.3)', badgeBg: 'rgba(234, 179, 8, 0.15)', badgeColor: '#fde047' },
                    { bg: 'rgba(148, 163, 184, 0.1)', border: 'rgba(148, 163, 184, 0.3)', badgeBg: 'rgba(148, 163, 184, 0.15)', badgeColor: '#cbd5e1' },
                    { bg: 'rgba(249, 115, 22, 0.1)', border: 'rgba(249, 115, 22, 0.3)', badgeBg: 'rgba(249, 115, 22, 0.15)', badgeColor: '#fdba74' },
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
                          {player.games_won}/{player.games_played} games ({Math.round((player.games_played / totalGames) * 100)}% participation)
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-2 py-1 rounded-full font-medium" style={{ backgroundColor: style.badgeBg, color: style.badgeColor }}>
                          {player.win_percentage > 1 ? Math.round(player.win_percentage) : Math.round(player.win_percentage * 100)}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center py-4" style={{ color: '#94a3b8' }}>
                No qualified players yet. Players need at least {minimumGamesRequired} games played to qualify.
              </p>
            )}
          </>
        )}
      </div>

      {/* Recent Performers */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <h3 className="text-lg font-semibold mb-2" style={{ color: '#f8fafc' }}>
          🔥 Recent Performers
        </h3>
        <p className="text-sm mb-4" style={{ color: '#94a3b8' }}>
          Top 3 players based on win rate in their last 10 games (minimum {minimumGamesRequired} total games)
        </p>
        {(() => {
          // Calculate recent performance for qualified players
          type RecentPerformer = Player & {
            recentGamesPlayed: number;
            recentWins: number;
            recentWinPercentage: number;
          };

          const recentPerformers: RecentPerformer[] = players
            .filter(player => player.games_played >= minimumGamesRequired && player.games_played > 0)
            .map(player => {
              // Get last 10 games for this player
              const playerGames = games.filter(game =>
                game.team1_player_names.includes(player.name) ||
                game.team2_player_names.includes(player.name)
              ).slice(0, 10); // Take most recent 10 games

              if (playerGames.length === 0) return null;

              // Calculate wins in recent games
              const recentWins = playerGames.filter(game => {
                const isOnTeam1 = game.team1_player_names.includes(player.name);
                return (isOnTeam1 && game.winner_team === 1) || (!isOnTeam1 && game.winner_team === 2);
              }).length;

              return {
                ...player,
                recentGamesPlayed: playerGames.length,
                recentWins: recentWins,
                recentWinPercentage: (recentWins / playerGames.length) * 100
              } as RecentPerformer;
            })
            .filter((p): p is RecentPerformer => p !== null)
            .sort((a, b) => b.recentWinPercentage - a.recentWinPercentage)
            .slice(0, 3);

          const rankStyles = [
            { bg: 'rgba(234, 179, 8, 0.1)', border: 'rgba(234, 179, 8, 0.3)', iconBg: '#eab308', badgeBg: 'rgba(234, 179, 8, 0.15)', badgeColor: '#fde047' },
            { bg: 'rgba(148, 163, 184, 0.1)', border: 'rgba(148, 163, 184, 0.3)', iconBg: '#64748b', badgeBg: 'rgba(148, 163, 184, 0.15)', badgeColor: '#cbd5e1' },
            { bg: 'rgba(249, 115, 22, 0.1)', border: 'rgba(249, 115, 22, 0.3)', iconBg: '#f97316', badgeBg: 'rgba(249, 115, 22, 0.15)', badgeColor: '#fdba74' }
          ];

          return recentPerformers.length > 0 ? (
            <div className="space-y-3">
              {recentPerformers.map((player, index) => {
                const style = rankStyles[index] || rankStyles[2];
                const rankEmojis = ['🔥', '⚡', '💪'];

                return (
                  <div key={player.id} className="flex items-center p-3 rounded-lg" style={{ backgroundColor: style.bg, border: `1px solid ${style.border}` }}>
                    <div className="flex-shrink-0 mr-3">
                      <span className="text-2xl">{rankEmojis[index]}</span>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: style.iconBg }}>
                        <span className="font-bold text-lg" style={{ color: '#f8fafc' }}>
                          {player.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium" style={{ color: '#f1f5f9' }}>{player.name}</p>
                      <p className="text-sm" style={{ color: '#94a3b8' }}>
                        {player.recentWins}/{player.recentGamesPlayed} in last {player.recentGamesPlayed} games
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: style.badgeBg, color: style.badgeColor }}>
                        {Math.round(player.recentWinPercentage)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center py-4" style={{ color: '#94a3b8' }}>
              No recent performers yet. Players need at least {minimumGamesRequired} total games to qualify.
            </p>
          );
        })()}
      </div>

      {/* Games Played Bar Chart */}
      {players.length > 0 && (
        <div className="p-6 rounded-lg" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: '#f8fafc' }}>📊 Games Played & Win Percentage</h3>
          <div style={{ width: '100%', height: '320px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={players
                  .map(player => ({
                    name: player.name,
                    wins: player.games_won,
                    losses: player.games_played - player.games_won
                  }))
                  .sort((a, b) => {
                    const totalGamesA = a.wins + a.losses;
                    const totalGamesB = b.wins + b.losses;

                    // First sort by total games (descending)
                    if (totalGamesB !== totalGamesA) {
                      return totalGamesB - totalGamesA;
                    }

                    // If same total games, sort by wins (descending)
                    return b.wins - a.wins;
                  })
                }
                margin={{
                  top: 5,
                  right: 5,
                  left: 10,
                  bottom: 25,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  width={30}
                  tick={{ fontSize: 10, fill: '#94a3b8' }}
                  label={{ value: 'Games Played', angle: -90, position: 'insideLeft', style: { fontSize: '10px', fill: '#94a3b8' } }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '0.5rem', color: '#f1f5f9' }}
                  labelStyle={{ color: '#f1f5f9' }}
                  labelFormatter={(name) => `Player: ${name}`}
                  formatter={(value, name) => {
                    if (name === 'wins') return [value, 'Wins'];
                    if (name === 'losses') return [value, 'Losses'];
                    return [value, name];
                  }}
                />
                <Bar
                  dataKey="wins"
                  stackId="games"
                  fill="#22C55E"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="losses"
                  stackId="games"
                  fill="#EF4444"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}


      {/* This Week's Summary */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: '#f8fafc' }}>📅 This Week's Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span style={{ color: '#94a3b8' }}>🎲 Games Played:</span>
            <span className="font-semibold" style={{ color: '#f1f5f9' }}>{weeklyStats.totalGames}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: '#94a3b8' }}>🤼 Active Players:</span>
            <span className="font-semibold" style={{ color: '#f1f5f9' }}>{weeklyStats.totalPlayers}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: '#94a3b8' }}>🥤 Average Total PPG:</span>
            <span className="font-semibold" style={{ color: '#f1f5f9' }}>{weeklyStats.averageScore}</span>
          </div>
          {thisWeeksGames.length > 0 && (
            <div className="pt-2" style={{ borderTop: '1px solid #334155' }}>
              <p className="text-sm" style={{ color: '#94a3b8' }}>
                Most Recent: {new Date(thisWeeksGames[0].played_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="p-6 rounded-lg" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: '#f8fafc' }}>Overall Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
            <p className="text-3xl font-bold text-green-600">{games.length}</p>
            <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>Total Games</p>
          </div>
          <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
            <p className="text-3xl font-bold text-blue-600">{players.length}</p>
            <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>Total Players</p>
          </div>
          <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
            <p className="text-3xl font-bold text-purple-600">{weeklyStats.totalGames}</p>
            <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>Games played this week</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
