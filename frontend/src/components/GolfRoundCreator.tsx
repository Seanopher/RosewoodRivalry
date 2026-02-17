import React, { useState } from 'react';
import { Player, GolfRoundCreate, GolfHoleInput } from '../types';
import { golfAPI } from '../services/api';

interface GolfRoundCreatorProps {
  players: Player[];
  onRoundCreated: (round: any) => void;
}

const GolfRoundCreator: React.FC<GolfRoundCreatorProps> = ({ players, onRoundCreated }) => {
  const [team1Player1, setTeam1Player1] = useState<number | null>(null);
  const [team1Player2, setTeam1Player2] = useState<number | null>(null);
  const [team2Player1, setTeam2Player1] = useState<number | null>(null);
  const [team2Player2, setTeam2Player2] = useState<number | null>(null);
  const [course, setCourse] = useState('');
  const [holeResults, setHoleResults] = useState<(number | null)[]>(Array(18).fill(null));
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getSelectedPlayers = () => {
    return [team1Player1, team1Player2, team2Player1, team2Player2]
      .filter(id => id !== null) as number[];
  };

  const getAvailablePlayersFor = (currentSelection: number | null) => {
    const selectedPlayers = getSelectedPlayers();
    return players.filter(player =>
      !selectedPlayers.includes(player.id) || player.id === currentSelection
    );
  };

  const setHoleResult = (holeIndex: number, winnerTeam: number | null) => {
    setHoleResults(prev => {
      const next = [...prev];
      // Toggle: if already set to this value, unset it (set to null for halved)
      next[holeIndex] = prev[holeIndex] === winnerTeam ? null : winnerTeam;
      return next;
    });
  };

  const team1HolesWon = holeResults.filter(r => r === 1).length;
  const team2HolesWon = holeResults.filter(r => r === 2).length;
  const halvedHoles = holeResults.filter(r => r === null).length;

  const team1Players = [team1Player1, team1Player2].filter(id => id !== null);
  const team2Players = [team2Player1, team2Player2].filter(id => id !== null);
  const canCreate = team1Players.length === 2 && team2Players.length === 2 && course.trim() !== '' && !isCreating;

  const getPlayerName = (playerId: number | null) => {
    if (!playerId) return 'Unknown';
    return players.find(p => p.id === playerId)?.name || 'Unknown';
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (team1Players.length !== 2 || team2Players.length !== 2) {
      setError('Each team must have exactly 2 players');
      return;
    }

    if (!course.trim()) {
      setError('Please enter a course name');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      const holes: GolfHoleInput[] = holeResults.map((winner, idx) => ({
        hole_number: idx + 1,
        winner_team: winner,
      }));

      const roundData: GolfRoundCreate = {
        team1_players: team1Players as number[],
        team2_players: team2Players as number[],
        course: course.trim(),
        holes,
      };

      const newRound = await golfAPI.createRound(roundData);
      onRoundCreated(newRound);

      // Reset form
      setTeam1Player1(null);
      setTeam1Player2(null);
      setTeam2Player1(null);
      setTeam2Player2(null);
      setCourse('');
      setHoleResults(Array(18).fill(null));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create round');
    } finally {
      setIsCreating(false);
    }
  };

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

  if (players.length < 4) {
    return (
      <div className="rounded-lg p-6" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <h2 className="text-lg font-medium mb-4" style={{ color: '#f1f5f9' }}>New Golf Round</h2>
        <div className="text-center py-8">
          <p className="text-lg" style={{ color: '#94a3b8' }}>You need at least 4 players to create a golf round.</p>
          <p className="text-sm mt-2" style={{ color: '#64748b' }}>Go to the New Player tab to add more players.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="rounded-lg p-6" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <h2 className="text-lg font-medium mb-6" style={{ color: '#f1f5f9' }}>New Golf Round</h2>

        <form onSubmit={handleCreate} className="space-y-6">
          {/* Course */}
          <div>
            <label style={labelStyle}>Course / Location</label>
            <input
              type="text"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="e.g., Pine Valley, Augusta National..."
              style={inputStyle}
              required
            />
          </div>

          {/* Team Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Team 1 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium" style={{ color: '#60a5fa' }}>Team 1</h3>
              {[
                { value: team1Player1, setter: setTeam1Player1, label: 'Player 1' },
                { value: team1Player2, setter: setTeam1Player2, label: 'Player 2' },
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
                      <option key={player.id} value={player.id}>{player.name}</option>
                    ))}
                  </select>
                </div>
              ))}
              <div className="text-sm" style={{ color: '#94a3b8' }}>Selected: {team1Players.length}/2 players</div>
            </div>

            {/* Team 2 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium" style={{ color: '#f43f5e' }}>Team 2</h3>
              {[
                { value: team2Player1, setter: setTeam2Player1, label: 'Player 1' },
                { value: team2Player2, setter: setTeam2Player2, label: 'Player 2' },
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
                      <option key={player.id} value={player.id}>{player.name}</option>
                    ))}
                  </select>
                </div>
              ))}
              <div className="text-sm" style={{ color: '#94a3b8' }}>Selected: {team2Players.length}/2 players</div>
            </div>
          </div>

          {/* Teams Summary */}
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

          {/* Hole-by-Hole Scorecard */}
          <div>
            <h3 className="text-lg font-medium mb-4" style={{ color: '#f1f5f9' }}>Hole-by-Hole Results</h3>
            <p className="text-sm mb-4" style={{ color: '#94a3b8' }}>
              Click Team 1 or Team 2 to mark the winner of each hole. Leave unselected for a halved hole.
            </p>

            <div className="rounded-lg overflow-hidden" style={{ border: '1px solid #334155' }}>
              {/* Front 9 */}
              <div className="px-4 py-2" style={{ backgroundColor: '#334155' }}>
                <span className="text-sm font-medium" style={{ color: '#f1f5f9' }}>Front 9</span>
              </div>
              {Array.from({ length: 9 }, (_, i) => i).map(i => (
                <div key={i} className="flex items-center px-4 py-2" style={{
                  backgroundColor: i % 2 === 0 ? '#1e293b' : '#162032',
                  borderBottom: i < 8 ? '1px solid #334155' : 'none',
                }}>
                  <span className="w-16 text-sm font-medium" style={{ color: '#cbd5e1' }}>Hole {i + 1}</span>
                  <div className="flex gap-2 flex-1 justify-center">
                    <button
                      type="button"
                      onClick={() => setHoleResult(i, 1)}
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: holeResults[i] === 1 ? '2px solid #60a5fa' : '1px solid #334155',
                        backgroundColor: holeResults[i] === 1 ? 'rgba(96, 165, 250, 0.2)' : 'transparent',
                        color: holeResults[i] === 1 ? '#60a5fa' : '#94a3b8',
                      }}
                    >
                      T1
                    </button>
                    <button
                      type="button"
                      onClick={() => setHoleResult(i, 2)}
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: holeResults[i] === 2 ? '2px solid #f43f5e' : '1px solid #334155',
                        backgroundColor: holeResults[i] === 2 ? 'rgba(244, 63, 94, 0.2)' : 'transparent',
                        color: holeResults[i] === 2 ? '#f43f5e' : '#94a3b8',
                      }}
                    >
                      T2
                    </button>
                  </div>
                  <span className="w-16 text-right text-xs" style={{
                    color: holeResults[i] === 1 ? '#60a5fa' : holeResults[i] === 2 ? '#f43f5e' : '#facc15',
                  }}>
                    {holeResults[i] === 1 ? 'Team 1' : holeResults[i] === 2 ? 'Team 2' : 'Halved'}
                  </span>
                </div>
              ))}

              {/* Back 9 */}
              <div className="px-4 py-2" style={{ backgroundColor: '#334155' }}>
                <span className="text-sm font-medium" style={{ color: '#f1f5f9' }}>Back 9</span>
              </div>
              {Array.from({ length: 9 }, (_, i) => i + 9).map(i => (
                <div key={i} className="flex items-center px-4 py-2" style={{
                  backgroundColor: i % 2 === 0 ? '#1e293b' : '#162032',
                  borderBottom: i < 17 ? '1px solid #334155' : 'none',
                }}>
                  <span className="w-16 text-sm font-medium" style={{ color: '#cbd5e1' }}>Hole {i + 1}</span>
                  <div className="flex gap-2 flex-1 justify-center">
                    <button
                      type="button"
                      onClick={() => setHoleResult(i, 1)}
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: holeResults[i] === 1 ? '2px solid #60a5fa' : '1px solid #334155',
                        backgroundColor: holeResults[i] === 1 ? 'rgba(96, 165, 250, 0.2)' : 'transparent',
                        color: holeResults[i] === 1 ? '#60a5fa' : '#94a3b8',
                      }}
                    >
                      T1
                    </button>
                    <button
                      type="button"
                      onClick={() => setHoleResult(i, 2)}
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: holeResults[i] === 2 ? '2px solid #f43f5e' : '1px solid #334155',
                        backgroundColor: holeResults[i] === 2 ? 'rgba(244, 63, 94, 0.2)' : 'transparent',
                        color: holeResults[i] === 2 ? '#f43f5e' : '#94a3b8',
                      }}
                    >
                      T2
                    </button>
                  </div>
                  <span className="w-16 text-right text-xs" style={{
                    color: holeResults[i] === 1 ? '#60a5fa' : holeResults[i] === 2 ? '#f43f5e' : '#facc15',
                  }}>
                    {holeResults[i] === 1 ? 'Team 1' : holeResults[i] === 2 ? 'Team 2' : 'Halved'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.25)' }}>
            <div className="text-sm" style={{ color: '#fde047' }}>
              <strong>Summary:</strong>{' '}
              <span style={{ color: '#60a5fa' }}>Team 1: {team1HolesWon}</span>
              {' - '}
              <span style={{ color: '#f43f5e' }}>Team 2: {team2HolesWon}</span>
              {' - '}
              <span style={{ color: '#facc15' }}>Halved: {halvedHoles}</span>
              <span className="ml-4">
                {team1HolesWon > team2HolesWon
                  ? 'Team 1 Wins!'
                  : team2HolesWon > team1HolesWon
                  ? 'Team 2 Wins!'
                  : 'Draw!'}
              </span>
            </div>
          </div>

          {error && (
            <div className="text-sm rounded-lg p-3" style={{ color: '#f87171', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!canCreate}
            style={{
              width: '100%',
              backgroundColor: '#f43f5e',
              color: '#f8fafc',
              padding: '0.75rem 1rem',
              borderRadius: '0.375rem',
              fontWeight: 600,
              border: 'none',
              opacity: canCreate ? 1 : 0.5,
              cursor: canCreate ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s ease',
            }}
          >
            {isCreating ? 'Creating Round...' : 'Create Round'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GolfRoundCreator;
