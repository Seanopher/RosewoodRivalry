import React from 'react';
import { Player, GameSummary } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  players: Player[];
  games: GameSummary[];
}

const Dashboard: React.FC<DashboardProps> = ({ players, games }) => {
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
  
  // Find top 3 qualified players with highest win percentage
  const qualifiedPlayers = [...players]
    .filter(player => player.games_played >= minimumGamesRequired && player.games_played > 0)
    .sort((a, b) => b.win_percentage - a.win_percentage)
    .slice(0, 3); // Get top 3 qualified players

  // Calculate wins this week by player
  const weeklyWinsByPlayer: { [playerName: string]: number } = {};
  
  thisWeeksGames.forEach(game => {
    const winningTeam = game.winner_team;
    const winningPlayers = winningTeam === 1 ? game.team1_player_names : game.team2_player_names;
    
    winningPlayers.forEach(playerName => {
      weeklyWinsByPlayer[playerName] = (weeklyWinsByPlayer[playerName] || 0) + 1;
    });
  });

  // Convert to array and sort by wins
  const weeklyWinsData = Object.entries(weeklyWinsByPlayer)
    .map(([name, wins]) => ({ name, wins }))
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 8); // Show top 8 players

  const maxWins = Math.max(...weeklyWinsData.map(d => d.wins), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Dashboard </h2>
        <p className="text-gray-600">Welcome to the Rosewood Rivalry Game Tracker! Keep track of games, player stats, and weekly highlights all in one place!
        </p>
      </div>

      {/* Recent Games */}
      {games.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⏰ Recent Games</h3>
          <div className="space-y-4">
            {games.slice(0, 3).map((game) => (
              <div key={game.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm text-gray-500">
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
                      <span className="text-sm font-medium text-blue-600">Team 1</span>
                      <span className={`text-lg font-bold ${game.team1_score > game.team2_score ? 'text-green-600' : 'text-gray-600'}`}>
                        {game.team1_score}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-0.5">
                      {game.team1_player_names.map((name, idx) => (
                        <div key={idx}>{name}</div>
                      ))}
                    </div>
                  </div>

                  {/* VS */}
                  <div className="text-center">
                    <div className="text-gray-400 font-medium text-sm">VS</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {Math.abs(game.team1_score - game.team2_score)} pts
                    </div>
                  </div>

                  {/* Team 2 */}
                  <div className="text-center">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-red-600">Team 2</span>
                      <span className={`text-lg font-bold ${game.team2_score > game.team1_score ? 'text-green-600' : 'text-gray-600'}`}>
                        {game.team2_score}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 space-y-0.5">
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
              <p className="text-sm text-gray-500">
                Showing 3 of {games.length} games • View all in Game History
              </p>
            </div>
          )}
        </div>
      )}

      {/* Top Winners */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          👑 Current Win Rate Leaders 
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Top 3 players with at least {minimumGamesRequired} games played ({Math.round((minimumGamesRequired / totalGames) * 100)}% participation)
        </p>
        {qualifiedPlayers.length > 0 ? (
          <div className="space-y-3">
            {qualifiedPlayers.map((player, index) => {
              const rankColors = [
                { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-800' },
                { bg: 'bg-gray-50', border: 'border-gray-200', icon: 'bg-gray-500', badge: 'bg-gray-100 text-gray-800' },
                { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'bg-orange-500', badge: 'bg-orange-100 text-orange-800' }
              ];
              const colors = rankColors[index] || rankColors[2];
              const rankEmojis = ['🥇', '🥈', '🥉'];
              
              return (
                <div key={player.id} className={`flex items-center p-3 ${colors.bg} rounded-lg border ${colors.border}`}>
                  <div className="flex-shrink-0 mr-3">
                    <span className="text-2xl">{rankEmojis[index]}</span>
                  </div>
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 ${colors.icon} rounded-full flex items-center justify-center`}>
                      <span className="text-white font-bold text-lg">
                        {player.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900">{player.name}</p>
                    <p className="text-sm text-gray-600">
                      {player.games_won}/{player.games_played} games ({Math.round((player.games_played / totalGames) * 100)}% participation)
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors.badge}`}>
                      {player.win_percentage > 1 ? Math.round(player.win_percentage) : Math.round(player.win_percentage * 100)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            No qualified players yet. Players need at least {minimumGamesRequired} games played to qualify.
          </p>
        )}
      </div>

      {/* Recent Performers */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          🔥 Recent Performers
        </h3>
        <p className="text-sm text-gray-600 mb-4">
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

          return recentPerformers.length > 0 ? (
            <div className="space-y-3">
              {recentPerformers.map((player, index) => {
                const rankColors = [
                  { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: 'bg-yellow-500', badge: 'bg-yellow-100 text-yellow-800' },
                  { bg: 'bg-gray-50', border: 'border-gray-200', icon: 'bg-gray-500', badge: 'bg-gray-100 text-gray-800' },
                  { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'bg-orange-500', badge: 'bg-orange-100 text-orange-800' }
                ];
                const colors = rankColors[index] || rankColors[2];
                const rankEmojis = ['🔥', '⚡', '💪'];
                
                return (
                  <div key={player.id} className={`flex items-center p-3 ${colors.bg} rounded-lg border ${colors.border}`}>
                    <div className="flex-shrink-0 mr-3">
                      <span className="text-2xl">{rankEmojis[index]}</span>
                    </div>
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 ${colors.icon} rounded-full flex items-center justify-center`}>
                        <span className="text-white font-bold text-lg">
                          {player.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900">{player.name}</p>
                      <p className="text-sm text-gray-600">
                        {player.recentWins}/{player.recentGamesPlayed} in last {player.recentGamesPlayed} games
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors.badge}`}>
                        {Math.round(player.recentWinPercentage)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              No recent performers yet. Players need at least {minimumGamesRequired} total games to qualify.
            </p>
          );
        })()}
      </div>

      {/* Games Played Bar Chart */}
      {players.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Games Played & Win Percentage</h3>
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
                  left: 5,
                  bottom: 25,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  width={30}
                  tick={{ fontSize: 10 }}
                  label={{ value: 'Games Played', angle: -90, position: 'insideLeft', style: { fontSize: '10px' } }}
                />
                <Tooltip 
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
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📅 This Week's Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">🎲 Games Played:</span>
            <span className="font-semibold">{weeklyStats.totalGames}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">🤼 Active Players:</span>
            <span className="font-semibold">{weeklyStats.totalPlayers}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">🥤 Average Total PPG:</span>
            <span className="font-semibold">{weeklyStats.averageScore}</span>
          </div>
          {thisWeeksGames.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-sm text-gray-600">
                Most Recent: {new Date(thisWeeksGames[0].played_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">{players.length}</p>
            <p className="text-sm text-gray-600 mt-1">Total Players</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">{games.length}</p>
            <p className="text-sm text-gray-600 mt-1">Total Games</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-purple-600">{weeklyStats.totalGames}</p>
            <p className="text-sm text-gray-600 mt-1">This Week's Games</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;