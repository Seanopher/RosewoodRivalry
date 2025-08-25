import React, { useState, useEffect } from 'react';
import { Player, Team } from '../types';
import { teamAPI } from '../services/api';
import PlayerStats from './PlayerStats';
import TeamStats from './TeamStats';

interface StatsPageProps {
  players: Player[];
  selectedPlayer: Player | null;
  onPlayerSelect: (player: Player | null) => void;
}

type StatsView = 'players' | 'teams';

const StatsPage: React.FC<StatsPageProps> = ({ players, selectedPlayer, onPlayerSelect }) => {
  const [view, setView] = useState<StatsView>('players');
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load teams when switching to team view
  useEffect(() => {
    if (view === 'teams' && teams.length === 0) {
      loadTeams();
    }
  }, [view, teams.length]);

  const loadTeams = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const teamsData = await teamAPI.getAllTeams();
      setTeams(teamsData);
    } catch (err: any) {
      setError('Failed to load team stats');
      console.error('Error loading teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTeamSelect = (team: Team) => {
    // You can add specific team selection logic here if needed
  };

  return (
    <div className="space-y-6">
      {/* Toggle Buttons */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-center">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setView('players')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === 'players'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                🧍Player Stats
              </button>
              <button
                onClick={() => setView('teams')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  view === 'teams'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                👨‍👦‍👦Team Stats
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && view === 'teams' && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading team statistics...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && view === 'teams' && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-red-600 text-center py-4">
            <p>{error}</p>
            <button
              onClick={loadTeams}
              className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {view === 'players' ? (
        <PlayerStats 
          players={players} 
          selectedPlayer={selectedPlayer}
          onPlayerSelect={onPlayerSelect} 
        />
      ) : (
        !loading && !error && (
          <TeamStats teams={teams} onTeamSelect={handleTeamSelect} />
        )
      )}
    </div>
  );
};

export default StatsPage;