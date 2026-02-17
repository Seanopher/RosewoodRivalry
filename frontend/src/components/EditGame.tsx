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
  const [location, setLocation] = useState<string>('');
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

        // Set location
        setLocation(gameData.location || '');

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
        location: location.trim() || undefined,
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

  const selectStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    borderRadius: '0.375rem',
    border: '1px solid #334155',
    backgroundColor: '#0f172a',
    color: '#f1f5f9',
    padding: '0.5rem 1rem',
  };

  const inputStyle: React.CSSProperties = {
    display: 'block',
    width: '100%',
    borderRadius: '0.375rem',
    border: '1px solid #334155',
    backgroundColor: '#0f172a',
    color: '#f1f5f9',
    padding: '0.5rem 1rem',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#cbd5e1',
    marginBottom: '0.5rem',
  };

  if (loading) {
    return (
      <div className="rounded-lg p-6" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <div className="text-center" style={{ color: '#94a3b8' }}>Loading game data...</div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="rounded-lg p-6" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <div className="text-center" style={{ color: '#f87171' }}>Failed to load game data</div>
        <div className="text-center mt-4">
          <button
            onClick={onCancel}
            style={{ backgroundColor: '#334155', color: '#f1f5f9', padding: '0.5rem 1rem', borderRadius: '0.375rem', border: 'none' }}
          >
            Back to Games
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="rounded-lg p-6" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium" style={{ color: '#f1f5f9' }}>Edit Game #{game.id}</h2>
          <button
            onClick={onCancel}
            style={{ color: '#94a3b8', backgroundColor: 'transparent', border: 'none' }}
          >
            ✕ Cancel
          </button>
        </div>

        <form onSubmit={handleUpdateGame} className="space-y-6">
          {/* Team Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Team 1 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium" style={{ color: '#60a5fa' }}>Team 1</h3>

              {[
                { value: team1Player1, setter: setTeam1Player1, label: 'Player 1' },
                { value: team1Player2, setter: setTeam1Player2, label: 'Player 2' },
                { value: team1Player3, setter: setTeam1Player3, label: 'Player 3' },
              ].map(({ value, setter, label }) => (
                <div key={label}>
                  <label style={labelStyle}>{label}</label>
                  <select
                    value={value || ''}
                    onChange={(e) => setter(e.target.value ? parseInt(e.target.value) : null)}
                    style={selectStyle}
                  >
                    <option value="">Select a player...</option>
                    {getAvailablePlayersFor(value).map(player => (
                      <option key={player.id} value={player.id}>
                        {player.name} ({Math.round(player.win_percentage > 1 ? player.win_percentage : player.win_percentage * 100)}% win rate)
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              <div className="text-sm" style={{ color: '#94a3b8' }}>
                Selected: {team1PlayersSelected.length}/3 players
              </div>
            </div>

            {/* Team 2 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium" style={{ color: '#f43f5e' }}>Team 2</h3>

              {[
                { value: team2Player1, setter: setTeam2Player1, label: 'Player 1' },
                { value: team2Player2, setter: setTeam2Player2, label: 'Player 2' },
                { value: team2Player3, setter: setTeam2Player3, label: 'Player 3' },
              ].map(({ value, setter, label }) => (
                <div key={label}>
                  <label style={labelStyle}>{label}</label>
                  <select
                    value={value || ''}
                    onChange={(e) => setter(e.target.value ? parseInt(e.target.value) : null)}
                    style={selectStyle}
                  >
                    <option value="">Select a player...</option>
                    {getAvailablePlayersFor(value).map(player => (
                      <option key={player.id} value={player.id}>
                        {player.name} ({Math.round(player.win_percentage > 1 ? player.win_percentage : player.win_percentage * 100)}% win rate)
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              <div className="text-sm" style={{ color: '#94a3b8' }}>
                Selected: {team2PlayersSelected.length}/3 players
              </div>
            </div>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Team 1 Score</label>
              <input
                type="number"
                min="0"
                value={team1Score}
                onChange={(e) => setTeam1Score(parseInt(e.target.value) || 0)}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>Team 2 Score</label>
              <input
                type="number"
                min="0"
                value={team2Score}
                onChange={(e) => setTeam2Score(parseInt(e.target.value) || 0)}
                style={inputStyle}
                required
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label style={labelStyle}>Location (Optional)</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={selectStyle}
            >
              <option value="">Select location...</option>
              <option value="Dreher">Dreher</option>
              <option value="King">King</option>
            </select>
            <p className="mt-1 text-xs" style={{ color: '#64748b' }}>
              Where was this game played?
            </p>
          </div>

          {/* Winner Preview */}
          {(team1Score > 0 || team2Score > 0) && (
            <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.25)' }}>
              <div className="text-sm" style={{ color: '#fde047' }}>
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
            <div className="text-sm rounded-lg p-3" style={{ color: '#f87171', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={!canUpdateGame}
                style={{
                  flex: 1,
                  backgroundColor: '#f43f5e',
                  color: '#f8fafc',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.375rem',
                  fontWeight: 600,
                  border: 'none',
                  opacity: canUpdateGame ? 1 : 0.5,
                  cursor: canUpdateGame ? 'pointer' : 'not-allowed',
                }}
              >
                {isUpdating ? 'Updating Game...' : 'Update Game'}
              </button>
              <button
                type="button"
                onClick={onCancel}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '1px solid #334155',
                  borderRadius: '0.375rem',
                  color: '#cbd5e1',
                  backgroundColor: 'transparent',
                }}
              >
                Cancel
              </button>
            </div>

            {/* Delete Button */}
            <div className="pt-4" style={{ borderTop: '1px solid #334155' }}>
              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{
                    width: '100%',
                    backgroundColor: '#dc2626',
                    color: '#f8fafc',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.375rem',
                    fontWeight: 600,
                    border: 'none',
                  }}
                >
                  Delete Game
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="text-center rounded-lg p-3" style={{ color: '#fca5a5', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                    <p className="font-medium">Are you sure you want to delete this game?</p>
                    <p className="text-sm mt-1">This action cannot be undone and will update all player statistics.</p>
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={handleDeleteGame}
                      disabled={isDeleting}
                      style={{
                        flex: 1,
                        backgroundColor: '#dc2626',
                        color: '#f8fafc',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.375rem',
                        fontWeight: 600,
                        border: 'none',
                        opacity: isDeleting ? 0.5 : 1,
                        cursor: isDeleting ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {isDeleting ? 'Deleting...' : 'Yes, Delete Game'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      style={{
                        flex: 1,
                        backgroundColor: '#334155',
                        color: '#f1f5f9',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.375rem',
                        fontWeight: 600,
                        border: 'none',
                        opacity: isDeleting ? 0.5 : 1,
                      }}
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
