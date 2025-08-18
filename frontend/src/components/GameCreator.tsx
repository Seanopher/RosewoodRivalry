import React, { useState } from 'react';
import { Player, GameCreate } from '../types';
import { gameAPI } from '../services/api';

interface GameCreatorProps {
  players: Player[];
  onGameCreated: (game: any) => void;
}

const GameCreator: React.FC<GameCreatorProps> = ({ players, onGameCreated }) => {
  const [team1Players, setTeam1Players] = useState<number[]>([]);
  const [team2Players, setTeam2Players] = useState<number[]>([]);
  const [team1Score, setTeam1Score] = useState<number>(0);
  const [team2Score, setTeam2Score] = useState<number>(0);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlayerToggle = (playerId: number, team: 1 | 2) => {
    const currentTeam = team === 1 ? team1Players : team2Players;
    const setTeam = team === 1 ? setTeam1Players : setTeam2Players;
    const otherTeam = team === 1 ? team2Players : team1Players;
    const setOtherTeam = team === 1 ? setTeam2Players : setTeam1Players;

    // Remove from other team if present
    if (otherTeam.includes(playerId)) {
      setOtherTeam(prev => prev.filter(id => id !== playerId));
    }

    // Toggle in current team
    if (currentTeam.includes(playerId)) {
      setTeam(prev => prev.filter(id => id !== playerId));
    } else if (currentTeam.length < 3) {
      setTeam(prev => [...prev, playerId]);
    }
  };

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (team1Players.length !== 3 || team2Players.length !== 3) {
      setError('Each team must have exactly 3 players');
      return;
    }

    if (team1Score < 0 || team2Score < 0) {
      setError('Scores cannot be negative');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);
      
      const gameData: GameCreate = {
        team1_score: team1Score,
        team2_score: team2Score,
        team1_players: team1Players,
        team2_players: team2Players,
      };
      
      const newGame = await gameAPI.createGame(gameData);
      onGameCreated(newGame);
      
      // Reset form
      setTeam1Players([]);
      setTeam2Players([]);
      setTeam1Score(0);
      setTeam2Score(0);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create game');
    } finally {
      setIsCreating(false);
    }
  };

  const getPlayerName = (playerId: number) => {
    return players.find(p => p.id === playerId)?.name || 'Unknown';
  };

  const canCreateGame = team1Players.length === 3 && team2Players.length === 3 && !isCreating;

  if (players.length < 6) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Create New Game</h2>
        <div className="text-center text-gray-500 py-8">
          <p className="text-lg">You need at least 6 players to create a game.</p>
          <p className="text-sm mt-2">Go to the Players tab to add more players.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">Create New Game</h2>
        
        <form onSubmit={handleCreateGame} className="space-y-6">
          {/* Team Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Team 1 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-blue-600">Team 1</h3>
              <div className="space-y-2">
                {players.map((player) => (
                  <label
                    key={`team1-${player.id}`}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      team1Players.includes(player.id)
                        ? 'bg-blue-50 border-blue-300'
                        : team2Players.includes(player.id)
                        ? 'bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed'
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={team1Players.includes(player.id)}
                      onChange={() => handlePlayerToggle(player.id, 1)}
                      disabled={
                        team2Players.includes(player.id) || 
                        (team1Players.length >= 3 && !team1Players.includes(player.id))
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-3 flex-1">{player.name}</span>
                    <span className="text-sm text-gray-500">
                      {player.win_percentage.toFixed(0)}% win rate
                    </span>
                  </label>
                ))}
              </div>
              <div className="text-sm text-gray-500">
                Selected: {team1Players.length}/3 players
              </div>
            </div>

            {/* Team 2 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-red-600">Team 2</h3>
              <div className="space-y-2">
                {players.map((player) => (
                  <label
                    key={`team2-${player.id}`}
                    className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      team2Players.includes(player.id)
                        ? 'bg-red-50 border-red-300'
                        : team1Players.includes(player.id)
                        ? 'bg-gray-100 border-gray-300 opacity-50 cursor-not-allowed'
                        : 'bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={team2Players.includes(player.id)}
                      onChange={() => handlePlayerToggle(player.id, 2)}
                      disabled={
                        team1Players.includes(player.id) || 
                        (team2Players.length >= 3 && !team2Players.includes(player.id))
                      }
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <span className="ml-3 flex-1">{player.name}</span>
                    <span className="text-sm text-gray-500">
                      {player.win_percentage.toFixed(0)}% win rate
                    </span>
                  </label>
                ))}
              </div>
              <div className="text-sm text-gray-500">
                Selected: {team2Players.length}/3 players
              </div>
            </div>
          </div>

          {/* Selected Teams Summary */}
          {(team1Players.length > 0 || team2Players.length > 0) && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Current Teams</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-600 font-medium">Team 1:</span>
                  <ul className="mt-1 space-y-1">
                    {team1Players.map(id => (
                      <li key={id} className="text-gray-700">• {getPlayerName(id)}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-red-600 font-medium">Team 2:</span>
                  <ul className="mt-1 space-y-1">
                    {team2Players.map(id => (
                      <li key={id} className="text-gray-700">• {getPlayerName(id)}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Scores */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team 1 Score
              </label>
              <input
                type="number"
                min="0"
                value={team1Score}
                onChange={(e) => setTeam1Score(parseInt(e.target.value) || 0)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Team 2 Score
              </label>
              <input
                type="number"
                min="0"
                value={team2Score}
                onChange={(e) => setTeam2Score(parseInt(e.target.value) || 0)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                required
              />
            </div>
          </div>

          {/* Winner Preview */}
          {(team1Score > 0 || team2Score > 0) && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-sm text-yellow-800">
                <strong>Winner:</strong>{' '}
                {team1Score > team2Score
                  ? 'Team 1'
                  : team2Score > team1Score
                  ? 'Team 2'
                  : 'Tie Game'
                }
                {team1Score !== team2Score && (
                  <span className="ml-2">
                    (by {Math.abs(team1Score - team2Score)} points)
                  </span>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!canCreateGame}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-md font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isCreating ? 'Creating Game...' : 'Create Game'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GameCreator;