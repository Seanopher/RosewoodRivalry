import React, { useState } from 'react';
import { Player, GameCreate } from '../types';
import { gameAPI } from '../services/api';

interface GameCreatorProps {
  players: Player[];
  onGameCreated: (game: any) => void;
}

const GameCreator: React.FC<GameCreatorProps> = ({ players, onGameCreated }) => {
  // Team roster spots (3 per team)
  const [team1Player1, setTeam1Player1] = useState<number | null>(null);
  const [team1Player2, setTeam1Player2] = useState<number | null>(null);
  const [team1Player3, setTeam1Player3] = useState<number | null>(null);

  const [team2Player1, setTeam2Player1] = useState<number | null>(null);
  const [team2Player2, setTeam2Player2] = useState<number | null>(null);
  const [team2Player3, setTeam2Player3] = useState<number | null>(null);

  const [team1Score, setTeam1Score] = useState<string>('');
  const [team2Score, setTeam2Score] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleCreateGame = async (e: React.FormEvent) => {
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

    const team1ScoreNum = parseInt(team1Score) || 0;
    const team2ScoreNum = parseInt(team2Score) || 0;

    if (team1ScoreNum < 0 || team2ScoreNum < 0) {
      setError('Scores cannot be negative');
      return;
    }

    if (team1Score === '' || team2Score === '') {
      setError('Please enter scores for both teams');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      const gameData: GameCreate = {
        team1_score: team1ScoreNum,
        team2_score: team2ScoreNum,
        team1_players: team1Players,
        team2_players: team2Players,
        location: location.trim() || undefined,
      };

      const newGame = await gameAPI.createGame(gameData);
      onGameCreated(newGame);

      // Reset form
      setTeam1Player1(null);
      setTeam1Player2(null);
      setTeam1Player3(null);
      setTeam2Player1(null);
      setTeam2Player2(null);
      setTeam2Player3(null);
      setTeam1Score('');
      setTeam2Score('');
      setLocation('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create game');
    } finally {
      setIsCreating(false);
    }
  };

  const getPlayerName = (playerId: number | null) => {
    if (!playerId) return 'Unknown';
    return players.find(p => p.id === playerId)?.name || 'Unknown';
  };

  const team1Players = [team1Player1, team1Player2, team1Player3].filter(id => id !== null);
  const team2Players = [team2Player1, team2Player2, team2Player3].filter(id => id !== null);
  const canCreateGame = team1Players.length === 3 && team2Players.length === 3 && !isCreating;

  const selectStyle = {
    display: 'block',
    width: '100%',
    borderRadius: '0.375rem',
    border: '1px solid #334155',
    backgroundColor: '#0f172a',
    color: '#f1f5f9',
    padding: '0.5rem 1rem',
  };

  const inputStyle = {
    display: 'block',
    width: '100%',
    borderRadius: '0.375rem',
    border: '1px solid #334155',
    backgroundColor: '#0f172a',
    color: '#f1f5f9',
    padding: '0.5rem 1rem',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#cbd5e1',
    marginBottom: '0.5rem',
  };

  if (players.length < 6) {
    return (
      <div className="rounded-lg p-6" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <h2 className="text-lg font-medium mb-4" style={{ color: '#f1f5f9' }}>Create New Game</h2>
        <div className="text-center py-8">
          <p className="text-lg" style={{ color: '#94a3b8' }}>You need at least 6 players to create a game.</p>
          <p className="text-sm mt-2" style={{ color: '#64748b' }}>Go to the New Player tab to add more players.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="rounded-lg p-6" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <h2 className="text-lg font-medium mb-6" style={{ color: '#f1f5f9' }}>Create New Game</h2>

        <form onSubmit={handleCreateGame} className="space-y-6">
          {/* Team Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Team 1 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium" style={{ color: '#60a5fa' }}>Team 1</h3>

              {/* Player 1 */}
              <div>
                <label style={labelStyle}>Player 1</label>
                <select
                  value={team1Player1 || ''}
                  onChange={(e) => setTeam1Player1(e.target.value ? parseInt(e.target.value) : null)}
                  style={selectStyle}
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
                <label style={labelStyle}>Player 2</label>
                <select
                  value={team1Player2 || ''}
                  onChange={(e) => setTeam1Player2(e.target.value ? parseInt(e.target.value) : null)}
                  style={selectStyle}
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
                <label style={labelStyle}>Player 3</label>
                <select
                  value={team1Player3 || ''}
                  onChange={(e) => setTeam1Player3(e.target.value ? parseInt(e.target.value) : null)}
                  style={selectStyle}
                >
                  <option value="">Select a player...</option>
                  {getAvailablePlayersFor(team1Player3).map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name} ({Math.round(player.win_percentage > 1 ? player.win_percentage : player.win_percentage * 100)}% win rate)
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-sm" style={{ color: '#94a3b8' }}>
                Selected: {team1Players.length}/3 players
              </div>
            </div>

            {/* Team 2 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium" style={{ color: '#f43f5e' }}>Team 2</h3>

              {/* Player 1 */}
              <div>
                <label style={labelStyle}>Player 1</label>
                <select
                  value={team2Player1 || ''}
                  onChange={(e) => setTeam2Player1(e.target.value ? parseInt(e.target.value) : null)}
                  style={selectStyle}
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
                <label style={labelStyle}>Player 2</label>
                <select
                  value={team2Player2 || ''}
                  onChange={(e) => setTeam2Player2(e.target.value ? parseInt(e.target.value) : null)}
                  style={selectStyle}
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
                <label style={labelStyle}>Player 3</label>
                <select
                  value={team2Player3 || ''}
                  onChange={(e) => setTeam2Player3(e.target.value ? parseInt(e.target.value) : null)}
                  style={selectStyle}
                >
                  <option value="">Select a player...</option>
                  {getAvailablePlayersFor(team2Player3).map(player => (
                    <option key={player.id} value={player.id}>
                      {player.name} ({Math.round(player.win_percentage > 1 ? player.win_percentage : player.win_percentage * 100)}% win rate)
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-sm" style={{ color: '#94a3b8' }}>
                Selected: {team2Players.length}/3 players
              </div>
            </div>
          </div>

          {/* Selected Teams Summary */}
          {(team1Players.length > 0 || team2Players.length > 0) && (
            <div className="rounded-lg p-4" style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
              <h4 className="font-medium mb-3" style={{ color: '#f1f5f9' }}>Current Teams</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium" style={{ color: '#60a5fa' }}>Team 1:</span>
                  <ul className="mt-1 space-y-1">
                    {team1Players.map(id => (
                      <li key={id} style={{ color: '#cbd5e1' }}>{getPlayerName(id)}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="font-medium" style={{ color: '#f43f5e' }}>Team 2:</span>
                  <ul className="mt-1 space-y-1">
                    {team2Players.map(id => (
                      <li key={id} style={{ color: '#cbd5e1' }}>{getPlayerName(id)}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Scores */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Team 1 Score</label>
              <input
                type="number"
                min="0"
                value={team1Score}
                onChange={(e) => setTeam1Score(e.target.value)}
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
                onChange={(e) => setTeam2Score(e.target.value)}
                style={inputStyle}
                required
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label style={labelStyle}>Location</label>
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
          {(team1Score !== '' || team2Score !== '') && (
            <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.25)' }}>
              <div className="text-sm" style={{ color: '#fde047' }}>
                <strong>Winner:</strong>{' '}
                {parseInt(team1Score) > parseInt(team2Score)
                  ? 'Team 1'
                  : parseInt(team2Score) > parseInt(team1Score)
                  ? 'Team 2'
                  : 'Tie Game'
                }
                {parseInt(team1Score) !== parseInt(team2Score) && (
                  <span className="ml-2">
                    (by {Math.abs(parseInt(team1Score) - parseInt(team2Score))} points)
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

          <button
            type="submit"
            disabled={!canCreateGame}
            style={{
              width: '100%',
              backgroundColor: '#f43f5e',
              color: '#f8fafc',
              padding: '0.75rem 1rem',
              borderRadius: '0.375rem',
              fontWeight: 600,
              border: 'none',
              opacity: canCreateGame ? 1 : 0.5,
              cursor: canCreateGame ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s ease',
            }}
          >
            {isCreating ? 'Creating Game...' : 'Create Game'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GameCreator;
