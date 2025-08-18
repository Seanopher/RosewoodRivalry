import React, { useState } from 'react';
import { Player, PlayerCreate } from '../types';
import { playerAPI } from '../services/api';

interface PlayerManagerProps {
  players: Player[];
  onPlayerCreated: (player: Player) => void;
  onPlayerSelect: (player: Player) => void;
}

const PlayerManager: React.FC<PlayerManagerProps> = ({ 
  players, 
  onPlayerCreated, 
  onPlayerSelect 
}) => {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreatePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    try {
      setIsCreating(true);
      setError(null);
      const playerData: PlayerCreate = { name: newPlayerName.trim() };
      const newPlayer = await playerAPI.createPlayer(playerData);
      onPlayerCreated(newPlayer);
      setNewPlayerName('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create player');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Player Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Add New Player</h2>
        <form onSubmit={handleCreatePlayer} className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Enter player name"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isCreating || !newPlayerName.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Adding...' : 'Add Player'}
          </button>
        </form>
        {error && (
          <div className="mt-2 text-sm text-red-600">{error}</div>
        )}
      </div>

      {/* Players List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Players</h2>
        </div>
        
        {players.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No players yet. Add your first player above!
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {players.map((player) => (
              <div
                key={player.id}
                className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onPlayerSelect(player)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {player.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Joined {new Date(player.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-900">
                      <span className="font-medium">{player.games_played}</span> games played
                    </div>
                    <div className="text-sm text-gray-500">
                      {player.games_played > 0 ? (
                        <>
                          <span className="font-medium">{player.win_percentage.toFixed(1)}%</span> win rate
                        </>
                      ) : (
                        'No games yet'
                      )}
                    </div>
                  </div>
                </div>
                
                {player.games_played > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Wins:</span>{' '}
                      <span className="font-medium text-green-600">{player.games_won}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Points For:</span>{' '}
                      <span className="font-medium">{player.total_points_scored}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Points Against:</span>{' '}
                      <span className="font-medium">{player.total_points_against}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayerManager;