import React, { useState, useEffect } from 'react';
import { Player, Team, Season } from '../types';
import { teamAPI } from '../services/api';
import PlayerStats from './PlayerStats';
import TeamStats from './TeamStats';

interface StatsPageProps {
  players: Player[];
  selectedPlayer: Player | null;
  onPlayerSelect: (player: Player | null) => void;
}

type StatsView = 'players' | 'teams';

const SEASONS: { value: Season; label: string }[] = [
  { value: '2026', label: '2026' },
  { value: '2025', label: '2025' },
  { value: 'all',  label: 'All Time' },
];

const StatsPage: React.FC<StatsPageProps> = ({ players, selectedPlayer, onPlayerSelect }) => {
  const [view, setView] = useState<StatsView>('players');
  const [season, setSeason] = useState<Season>('2026');
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamThreshold, setTeamThreshold] = useState<{ total_games: number; min_games_required: number; threshold_percentage: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (view === 'teams') {
      loadTeams(season);
    }
  }, [view, season]);

  const loadTeams = async (s: Season) => {
    setLoading(true);
    setError(null);
    try {
      const response = await teamAPI.getAllTeams(s);
      setTeams(response.teams);
      setTeamThreshold({
        total_games: response.total_games,
        min_games_required: response.min_games_required,
        threshold_percentage: response.threshold_percentage,
      });
    } catch (err: any) {
      setError('Failed to load team stats');
      console.error('Error loading teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSeasonChange = (s: Season) => {
    setSeason(s);
    onPlayerSelect(null); // clear selected player so detail view reloads with new season
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* View switcher + Season switcher */}
      <div className="rounded-lg" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
        <div className="px-6 py-4 space-y-4">

          {/* Player / Team toggle */}
          <div className="flex justify-center">
            <div className="flex rounded-lg p-1" style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
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
                  cursor: 'pointer',
                }}
              >
                🧍 Player Stats
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
                  cursor: 'pointer',
                }}
              >
                👨‍👦‍👦 Team Stats
              </button>
            </div>
          </div>

          {/* Season switcher */}
          <div className="flex justify-center">
            <div className="flex rounded-lg p-1" style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
              {SEASONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => handleSeasonChange(value)}
                  style={{
                    padding: '0.375rem 1.125rem',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    backgroundColor: season === value ? '#f43f5e' : 'transparent',
                    color: season === value ? '#f8fafc' : '#94a3b8',
                    border: 'none',
                    transition: 'all 0.15s ease',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Loading / error states for teams */}
      {loading && view === 'teams' && (
        <div className="rounded-lg p-6" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8" style={{ borderBottom: '2px solid #f43f5e' }}></div>
            <span className="ml-2" style={{ color: '#94a3b8' }}>Loading team statistics...</span>
          </div>
        </div>
      )}
      {error && view === 'teams' && (
        <div className="rounded-lg p-6" style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}>
          <div className="text-center py-4" style={{ color: '#f87171' }}>
            <p>{error}</p>
            <button onClick={() => loadTeams(season)} style={{ marginTop: '0.5rem', padding: '0.5rem 1rem', backgroundColor: 'rgba(239,68,68,0.15)', color: '#f87171', borderRadius: '0.375rem', border: '1px solid rgba(239,68,68,0.3)', cursor: 'pointer' }}>
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
          season={season}
        />
      ) : (
        !loading && !error && (
          <TeamStats
            teams={teams}
            onTeamSelect={() => {}}
            teamThreshold={teamThreshold}
            season={season}
          />
        )
      )}
    </div>
  );
};

export default StatsPage;
