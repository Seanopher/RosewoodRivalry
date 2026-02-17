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
  const [teamThreshold, setTeamThreshold] = useState<{ total_games: number; min_games_required: number; threshold_percentage: number } | null>(null);
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
      const response = await teamAPI.getAllTeams();
      setTeams(response.teams);
      setTeamThreshold({
        total_games: response.total_games,
        min_games_required: response.min_games_required,
        threshold_percentage: response.threshold_percentage
      });
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
    <div className="space-y-6 animate-fadeIn">
      {/* Toggle Buttons */}
      <div className="rounded-lg" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-center">
            <div className="flex rounded-lg p-1" style={{ backgroundColor: '#0f172a' }}>
              <button
                onClick={() => setView('players')}
                style={{
                  padding: '0.5rem 1.5rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  backgroundColor: view === 'players' ? '#f43f5e' : 'transparent',
                  color: view === 'players' ? '#f8fafc' : '#94a3b8',
                  border: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                🧍Player Stats
              </button>
              <button
                onClick={() => setView('teams')}
                style={{
                  padding: '0.5rem 1.5rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  backgroundColor: view === 'teams' ? '#f43f5e' : 'transparent',
                  color: view === 'teams' ? '#f8fafc' : '#94a3b8',
                  border: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                👨‍👦‍👦Team Stats
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && view === 'teams' && (
        <div className="rounded-lg p-6" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8" style={{ borderBottom: '2px solid #f43f5e' }}></div>
            <span className="ml-2" style={{ color: '#94a3b8' }}>Loading team statistics...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && view === 'teams' && (
        <div className="rounded-lg p-6" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
          <div className="text-center py-4" style={{ color: '#f87171' }}>
            <p>{error}</p>
            <button
              onClick={loadTeams}
              style={{
                marginTop: '0.5rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                borderRadius: '0.375rem',
                border: '1px solid rgba(239, 68, 68, 0.3)',
              }}
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
          <TeamStats teams={teams} onTeamSelect={handleTeamSelect} teamThreshold={teamThreshold} />
        )
      )}
    </div>
  );
};

export default StatsPage;
