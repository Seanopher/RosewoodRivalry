import React, { useState, useEffect } from 'react';
import { Player, Game, GameUpdate } from '../types';
import { gameAPI } from '../services/api';

interface EditGameProps {
  gameId: number;
  players: Player[];
  onGameUpdated: (game: Game) => void;
  onGameDeleted: () => void;
  onCancel: () => void;
}

const EditGame: React.FC<EditGameProps> = ({ gameId, players, onGameUpdated, onGameDeleted, onCancel }) => {
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Team roster spots (3 per team)
  const [team1Player1, setTeam1Player1] = useState<number | null>(null);
  const [team1Player2, setTeam1Player2] = useState<number | null>(null);
  const [team1Player3, setTeam1Player3] = useState<number | null>(null);
  
  const [team2Player1, setTeam2Player1] = useState<number | null>(null);
  const [team2Player2, setTeam2Player2] = useState<number | null>(null);
  const [team2Player3, setTeam2Player3] = useState<number | null>(null);
  
  const [team1Score, setTeam1Score] = useState<number>(0);
  const [team2Score, setTeam2Score] = useState<number>(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load game data
  useEffect(() => {
    const loadGame = async () => {
      try {
        setLoading(true);
        const gameData = await gameAPI.getGame(gameId);
        setGame(gameData);
        
        // Set scores
        setTeam1Score(gameData.team1_score);
        setTeam2Score(gameData.team2_score);
        
        // Set team players
        if (gameData.team1_players.length >= 3) {
          setTeam1Player1(gameData.team1_players[0].id);
          setTeam1Player2(gameData.team1_players[1].id);
          setTeam1Player3(gameData.team1_players[2].id);
        }
        
        if (gameData.team2_players.length >= 3) {
          setTeam2Player1(gameData.team2_players[0].id);
          setTeam2Player2(gameData.team2_players[1].id);
          setTeam2Player3(gameData.team2_players[2].id);
        }
      } catch (err) {
        setError('Failed to load game data');
      } finally {
        setLoading(false);
      }
    };

    loadGame();
  }, [gameId]);

  // Get all selected players
  const getSelectedPlayers = () => {
    return [team1Player1, team1Player2, team1Player3, team2Player1, team2Player2, team2Player3]
      .filter(id => id !== null) as number[];
  };

  // Get available players for a dropdown (excluding already selected players, except the current selection)
  const getAvailablePlayersFor = (currentSelection: number | null) => {
    const selectedPlayers = getSelectedPlayers();
    return players.filter(player => 
      !selectedPlayers.includes(player.id) || player.id === currentSelection
    );
  };

  const handleUpdateGame = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const team1Players = [team1Player1, team1Player2, team1Player3].filter(id => id !== null) as number[];
    const team2Players = [team2Player1, team2Player2, team2Player3].filter(id => id !== null) as number[];
    
    if (team1Players.length !== 3 || team2Players.length !== 3) {
      setError('Each team must have exactly 3 players');
      return;
    }

    // Check for duplicate players
    const allPlayers = [...team1Players, ...team2Players];
    const uniquePlayers = new Set(allPlayers);
    if (uniquePlayers.size !== allPlayers.length) {
      setError('Players cannot be on both teams or selected multiple times');
      return;
    }

    if (team1Score < 0 || team2Score < 0) {
      setError('Scores cannot be negative');
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);
      
      const updateData: GameUpdate = {
        team1_score: team1Score,
        team2_score: team2Score,
        team1_players: team1Players,
        team2_players: team2Players,
      };
      
      const updatedGame = await gameAPI.updateGame(gameId, updateData);
      onGameUpdated(updatedGame);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update game');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteGame = async () => {
    try {
      setIsDeleting(true);
      setError(null);
      
      await gameAPI.deleteGame(gameId);
      onGameDeleted();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete game');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const getPlayerName = (playerId: number | null) => {
    if (!playerId) return 'Unknown';
    return players.find(p => p.id === playerId)?.name || 'Unknown';
  };

  const team1PlayersSelected = [team1Player1, team1Player2, team1Player3].filter(id => id !== null);
  const team2PlayersSelected = [team2Player1, team2Player2, team2Player3].filter(id => id !== null);
  const canUpdateGame = team1PlayersSelected.length === 3 && team2PlayersSelected.length === 3 && !isUpdating;

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center">Loading game data...</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center text-red-600">Failed to load game data</div>
        <div className="text-center mt-4">
          <button
            onClick={onCancel}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Back to Games
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-900">Edit Game #{game.id}</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕ Cancel
          </button>
        </div>
        
        <form onSubmit={handleUpdateGame} className="space-y-6">
          {/* Team Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Team 1 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-blue-600">Team 1</h3>
              
              {/* Player 1 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Player 1
                </label>
                <select
                  value={team1Player1 || ''}
                  onChange={(e) => setTeam1Player1(e.target.value ? parseInt(e.target.value) : null)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select a player...</option>
                  {getAvailablePlayersFor(team1Player1).map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name} ({Math.round(player.win_percentage > 1 ? player.win_percentage : player.win_percentage * 100)}% win rate)
                    </option>
                  ))}
                </select>
              </div>

              {/* Player 2 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Player 2
                </label>
                <select
                  value={team1Player2 || ''}
                  onChange={(e) => setTeam1Player2(e.target.value ? parseInt(e.target.value) : null)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select a player...</option>
                  {getAvailablePlayersFor(team1Player2).map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name} ({Math.round(player.win_percentage > 1 ? player.win_percentage : player.win_percentage * 100)}% win rate)
                    </option>
                  ))}
                </select>
              </div>

              {/* Player 3 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Player 3
                </label>
                <select
                  value={team1Player3 || ''}
                  onChange={(e) => setTeam1Player3(e.target.value ? parseInt(e.target.value) : null)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select a player...</option>
                  {getAvailablePlayersFor(team1Player3).map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name} ({Math.round(player.win_percentage > 1 ? player.win_percentage : player.win_percentage * 100)}% win rate)
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-sm text-gray-500">
                Selected: {team1PlayersSelected.length}/3 players
              </div>
            </div>

            {/* Team 2 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-red-600">Team 2</h3>
              
              {/* Player 1 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Player 1
                </label>
                <select
                  value={team2Player1 || ''}
                  onChange={(e) => setTeam2Player1(e.target.value ? parseInt(e.target.value) : null)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                >
                  <option value="">Select a player...</option>
                  {getAvailablePlayersFor(team2Player1).map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name} ({Math.round(player.win_percentage > 1 ? player.win_percentage : player.win_percentage * 100)}% win rate)
                    </option>
                  ))}
                </select>
              </div>

              {/* Player 2 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Player 2
                </label>
                <select
                  value={team2Player2 || ''}
                  onChange={(e) => setTeam2Player2(e.target.value ? parseInt(e.target.value) : null)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                >
                  <option value="">Select a player...</option>
                  {getAvailablePlayersFor(team2Player2).map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name} ({Math.round(player.win_percentage > 1 ? player.win_percentage : player.win_percentage * 100)}% win rate)
                    </option>
                  ))}
                </select>
              </div>

              {/* Player 3 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Player 3
                </label>
                <select
                  value={team2Player3 || ''}
                  onChange={(e) => setTeam2Player3(e.target.value ? parseInt(e.target.value) : null)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                >
                  <option value="">Select a player...</option>
                  {getAvailablePlayersFor(team2Player3).map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name} ({Math.round(player.win_percentage > 1 ? player.win_percentage : player.win_percentage * 100)}% win rate)
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-sm text-gray-500">
                Selected: {team2PlayersSelected.length}/3 players
              </div>
            </div>
          </div>

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

          <div className="space-y-4">
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={!canUpdateGame}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUpdating ? 'Updating Game...' : 'Update Game'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
            
            {/* Delete Button */}
            <div className="pt-4 border-t border-gray-200">
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full bg-red-600 text-white py-3 px-4 rounded-md font-medium hover:bg-red-700 transition-colors"
                >
                  Delete Game
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="text-center text-red-800 bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="font-medium">Are you sure you want to delete this game?</p>
                    <p className="text-sm mt-1">This action cannot be undone and will update all player statistics.</p>
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={handleDeleteGame}
                      disabled={isDeleting}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isDeleting ? 'Deleting...' : 'Yes, Delete Game'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md font-medium hover:bg-gray-300 disabled:opacity-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGame;