import React, { useState } from 'react';
import { Player, PlayerCreate } from '../types';
import { playerAPI } from '../services/api';

interface NewPlayerProps {
  onPlayerCreated: (player: Player) => void;
}

const NewPlayer: React.FC<NewPlayerProps> = ({ onPlayerCreated }) => {
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!playerName.trim()) {
      setError('Player name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const newPlayerData: PlayerCreate = {
        name: playerName.trim()
      };

      const createdPlayer = await playerAPI.createPlayer(newPlayerData);
      onPlayerCreated(createdPlayer);
      setPlayerName('');
      setSuccess(`Player "${createdPlayer.name}" created successfully!`);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error creating player:', err);
      setError(err.response?.data?.detail || 'Failed to create player');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fadeIn">
      <div className="rounded-lg" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <div className="px-6 py-4" style={{ borderBottom: '1px solid #334155' }}>
          <h2 className="text-lg font-semibold" style={{ color: '#f1f5f9' }}>Add New Player</h2>
          <p className="text-sm" style={{ color: '#94a3b8' }}>Create a new player profile for the game tracker</p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="playerName" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#cbd5e1', marginBottom: '0.5rem' }}>
                Player Name
              </label>
              <input
                type="text"
                id="playerName"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #334155',
                  borderRadius: '0.375rem',
                  backgroundColor: '#0f172a',
                  color: '#f1f5f9',
                }}
                placeholder="Enter player name..."
                disabled={isSubmitting}
                maxLength={100}
              />
            </div>

            {error && (
              <div className="rounded-md p-3" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>
              </div>
            )}

            {success && (
              <div className="rounded-md p-3" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.25)' }}>
                <p className="text-sm" style={{ color: '#4ade80' }}>{success}</p>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !playerName.trim()}
                style={{
                  backgroundColor: '#f43f5e',
                  color: '#f8fafc',
                  padding: '0.5rem 1.5rem',
                  borderRadius: '0.375rem',
                  fontWeight: 600,
                  border: 'none',
                  opacity: (isSubmitting || !playerName.trim()) ? 0.5 : 1,
                  cursor: (isSubmitting || !playerName.trim()) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {isSubmitting ? 'Creating...' : 'Create Player'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="mt-6 rounded-lg p-4" style={{ backgroundColor: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.25)' }}>
        <h3 className="text-sm font-medium mb-2" style={{ color: '#f43f5e' }}>💡 Tips</h3>
        <ul className="text-sm space-y-1" style={{ color: '#94a3b8' }}>
          <li>Player names should be unique and easy to identify</li>
          <li>Once created, players will appear in the Player Stats tab</li>
          <li>Players can immediately participate in games after creation</li>
        </ul>
      </div>
    </div>
  );
};

export default NewPlayer;
