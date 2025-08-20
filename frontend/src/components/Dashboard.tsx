import React from 'react';
import { Player, GameSummary } from '../types';

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

  // Find players with highest win percentage (current winning streak approximation)
  const topPlayers = [...players]
    .filter(player => player.games_played > 0)
    .sort((a, b) => b.win_percentage - a.win_percentage)
    .slice(0, 10); // Get top 10 to find ties

  // Group players by win percentage to show ties
  // Handle both decimal (0.75) and percentage (75) formats from backend
  const winPercentageGroups: { [key: number]: Player[] } = {};
  topPlayers.forEach(player => {
    let winRate = player.win_percentage;
    // If win_percentage is greater than 1, it's already a percentage
    if (winRate > 1) {
      winRate = Math.round(winRate);
    } else {
      // If it's a decimal, convert to percentage
      winRate = Math.round(winRate * 100);
    }
    
    if (!winPercentageGroups[winRate]) {
      winPercentageGroups[winRate] = [];
    }
    winPercentageGroups[winRate].push(player);
  });

  // Get the highest win percentage and all players with that percentage
  const highestWinRate = topPlayers.length > 0 ? 
    (topPlayers[0].win_percentage > 1 ? 
      Math.round(topPlayers[0].win_percentage) : 
      Math.round(topPlayers[0].win_percentage * 100)) : 0;
  const topWinners = winPercentageGroups[highestWinRate] || [];

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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          👑 Current Win Rate Leaders 
        </h3>
        {topWinners.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topWinners.map((player) => (
              <div key={player.id} className="flex items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {player.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">{player.name}</p>
                  <p className="text-sm text-gray-600">
                    {player.games_won}/{player.games_played} games
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {player.win_percentage > 1 ? Math.round(player.win_percentage) : Math.round(player.win_percentage * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No games played yet. Start playing to see leaders!</p>
        )}
      </div>

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