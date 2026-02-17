import React, { useState, useEffect } from 'react';
import { Player, GameSummary, Game, GolfRoundSummary, GolfRound } from './types';
import { playerAPI, gameAPI, golfAPI } from './services/api';
import Dashboard from './components/Dashboard';
import NewPlayer from './components/NewPlayer';
import GameCreator from './components/GameCreator';
import GameHistory from './components/GameHistory';
import StatsPage from './components/StatsPage';
import EditGame from './components/EditGame';
import GolfDashboard from './components/GolfDashboard';
import GolfRoundCreator from './components/GolfRoundCreator';
import GolfHistory from './components/GolfHistory';
import GolfStats from './components/GolfStats';
import EditGolfRound from './components/EditGolfRound';

type Sport = 'dice' | 'golf';
type DiceTab = 'dashboard' | 'stats' | 'history' | 'game' | 'newplayer' | 'edit';
type GolfTab = 'golf-dashboard' | 'golf-stats' | 'golf-history' | 'golf-round' | 'newplayer' | 'golf-edit';
type Tab = DiceTab | GolfTab;

function App() {
  const [activeSport, setActiveSport] = useState<Sport>('dice');
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<GameSummary[]>([]);
  const [golfRounds, setGolfRounds] = useState<GolfRoundSummary[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [editingGameId, setEditingGameId] = useState<number | null>(null);
  const [editingGolfRoundId, setEditingGolfRoundId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | React.ReactElement | null>(null);
  const [dataRefreshKey, setDataRefreshKey] = useState(0);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Add timeout to API calls
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout')), 10000)
      );

      const dataPromise = Promise.all([
        playerAPI.getAllPlayers(),
        gameAPI.getAllGames(),
        golfAPI.getAllRounds(),
      ]);

      const [playersData, gamesData, golfData] = await Promise.race([dataPromise, timeoutPromise]) as [any, any, any];

      setPlayers(playersData);
      setGames(gamesData);
      setGolfRounds(golfData);
      setError(null);
    } catch (err: any) {
      if (err.message === 'Connection timeout') {
        setError(
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <img
                src="/rosewood-logo.png"
                alt="Rosewood Rivalry"
                className="h-12 w-auto mr-4"
              />
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#f1f5f9' }}>Rosewood Rivalry</h1>
                <span className="text-lg" style={{ color: '#94a3b8' }}>Tailgate Game Tracker</span>
              </div>
            </div>
            <div>Connection timeout. Unable to reach the server.</div>
          </div>
        );
      } else {
        setError(`Failed to load data. Please try again. If the problem persists, contact an administrator. Error: ${err.message || err}`);
      }
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayerCreated = (newPlayer: Player) => {
    setPlayers(prev => [...prev, newPlayer]);
  };

  const handleGameCreated = (newGame: any) => {
    loadData();
    setDataRefreshKey(prev => prev + 1);
  };

  const handlePlayerSelect = (player: Player) => {
    setSelectedPlayer(player);
    setActiveTab('stats');
  };

  const handleEditGame = (gameId: number) => {
    setEditingGameId(gameId);
    setActiveTab('edit');
  };

  const handleGameUpdated = (updatedGame: Game) => {
    loadData();
    setEditingGameId(null);
    setActiveTab('history');
  };

  const handleGameDeleted = () => {
    loadData();
    setEditingGameId(null);
    setActiveTab('history');
  };

  const handleCancelEdit = () => {
    setEditingGameId(null);
    setActiveTab('history');
  };

  // Golf handlers
  const handleGolfRoundCreated = (newRound: any) => {
    loadData();
    setDataRefreshKey(prev => prev + 1);
  };

  const handleEditGolfRound = (roundId: number) => {
    setEditingGolfRoundId(roundId);
    setActiveTab('golf-edit');
  };

  const handleGolfRoundUpdated = (updatedRound: GolfRound) => {
    loadData();
    setEditingGolfRoundId(null);
    setActiveTab('golf-history');
  };

  const handleGolfRoundDeleted = () => {
    loadData();
    setEditingGolfRoundId(null);
    setActiveTab('golf-history');
  };

  const handleCancelGolfEdit = () => {
    setEditingGolfRoundId(null);
    setActiveTab('golf-history');
  };

  const handleSportSwitch = (sport: Sport) => {
    setActiveSport(sport);
    if (sport === 'dice') {
      setActiveTab('dashboard');
    } else {
      setActiveTab('golf-dashboard');
    }
  };

  const diceTabs = [
    { key: 'dashboard' as Tab, label: '🏠 Home' },
    { key: 'stats' as Tab, label: '📊 Stats' },
    { key: 'history' as Tab, label: '📜 History' },
    { key: 'game' as Tab, label: '🎲 New Game' },
    { key: 'newplayer' as Tab, label: '🧑 New Player' },
  ];

  const golfTabs = [
    { key: 'golf-dashboard' as Tab, label: '🏠 Home' },
    { key: 'golf-stats' as Tab, label: '📊 Stats' },
    { key: 'golf-history' as Tab, label: '📜 Rounds' },
    { key: 'golf-round' as Tab, label: '⛳ New Round' },
    { key: 'newplayer' as Tab, label: '🧑 New Player' },
  ];

  const currentTabs = activeSport === 'dice' ? diceTabs : golfTabs;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0f172a' }}>
        <div className="text-center">
          <img
            src="/rosewood-logo.png"
            alt="Rosewood Rivalry"
            className="w-32 h-32 animate-pulse mx-auto mb-6"
          />
          <div className="text-lg font-medium" style={{ color: '#f1f5f9' }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0f172a' }}>
        <div className="text-center" style={{ maxWidth: '500px', padding: '2rem' }}>
          <div className="text-red-600 text-lg mb-4">{typeof error === 'string' ? error : error}</div>
          <button
            onClick={loadData}
            style={{ backgroundColor: '#f43f5e', color: '#f8fafc', padding: '0.5rem 1.5rem', borderRadius: '0.375rem', border: 'none' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0f172a' }}>
      <div style={{ background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', borderBottom: '2px solid #f43f5e', boxShadow: '0 2px 20px rgba(244, 63, 94, 0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <img
                src="/rosewood-logo.png"
                alt="Rosewood Rivalry"
                className="h-8 w-auto"
              />
              <div className="ml-4">
                <h1 className="text-2xl font-bold leading-tight" style={{ color: '#f8fafc' }}>Rosewood Rivalry</h1>
                <span className="text-sm" style={{ color: '#94a3b8' }}>Tailgate Game Tracker</span>
              </div>
            </div>

            {/* Sport Switcher */}
            <div className="flex rounded-lg p-1" style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}>
              <button
                onClick={() => handleSportSwitch('dice')}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  backgroundColor: activeSport === 'dice' ? '#f43f5e' : 'transparent',
                  color: activeSport === 'dice' ? '#f8fafc' : '#94a3b8',
                  border: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                🎲 Dice
              </button>
              <button
                onClick={() => handleSportSwitch('golf')}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  backgroundColor: activeSport === 'golf' ? '#f43f5e' : 'transparent',
                  color: activeSport === 'golf' ? '#f8fafc' : '#94a3b8',
                  border: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                ⛳ Golf
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ borderBottom: '1px solid #334155' }}>
            <nav className="-mb-px flex space-x-4">
              {currentTabs.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  style={{
                    backgroundColor: activeTab === key ? 'rgba(244, 63, 94, 0.15)' : 'transparent',
                    color: activeTab === key ? '#f43f5e' : '#94a3b8',
                    borderBottom: activeTab === key ? '2px solid #f43f5e' : '2px solid transparent',
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    padding: '0.75rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: activeTab === key ? 600 : 500,
                    borderRadius: '0.375rem 0.375rem 0 0',
                    transition: 'all 0.15s ease',
                  }}
                  className="whitespace-nowrap flex items-center"
                >
                  {label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dice Views */}
        {activeTab === 'dashboard' && (
          <Dashboard
            players={players}
            games={games}
          />
        )}

        {activeTab === 'stats' && (
          <StatsPage
            players={players}
            selectedPlayer={selectedPlayer}
            onPlayerSelect={setSelectedPlayer}
            key={`stats-${dataRefreshKey}`}
          />
        )}

        {activeTab === 'history' && (
          <GameHistory
            games={games}
            onEditGame={handleEditGame}
          />
        )}

        {activeTab === 'game' && (
          <GameCreator
            players={players}
            onGameCreated={handleGameCreated}
          />
        )}

        {activeTab === 'edit' && editingGameId && (
          <EditGame
            gameId={editingGameId}
            players={players}
            onGameUpdated={handleGameUpdated}
            onGameDeleted={handleGameDeleted}
            onCancel={handleCancelEdit}
          />
        )}

        {/* Golf Views */}
        {activeTab === 'golf-dashboard' && (
          <GolfDashboard
            players={players}
            golfRounds={golfRounds}
          />
        )}

        {activeTab === 'golf-stats' && (
          <GolfStats
            players={players}
            key={`golf-stats-${dataRefreshKey}`}
          />
        )}

        {activeTab === 'golf-history' && (
          <GolfHistory
            rounds={golfRounds}
            onEditRound={handleEditGolfRound}
          />
        )}

        {activeTab === 'golf-round' && (
          <GolfRoundCreator
            players={players}
            onRoundCreated={handleGolfRoundCreated}
          />
        )}

        {activeTab === 'golf-edit' && editingGolfRoundId && (
          <EditGolfRound
            roundId={editingGolfRoundId}
            players={players}
            onRoundUpdated={handleGolfRoundUpdated}
            onRoundDeleted={handleGolfRoundDeleted}
            onCancel={handleCancelGolfEdit}
          />
        )}

        {/* Shared Views */}
        {activeTab === 'newplayer' && (
          <NewPlayer
            onPlayerCreated={handlePlayerCreated}
          />
        )}
      </div>
    </div>
  );
}

export default App;
