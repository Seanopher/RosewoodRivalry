import React, { useState, useEffect } from 'react';
import { Player, GameSummary, Game } from './types';
import { playerAPI, gameAPI } from './services/api';
import Dashboard from './components/Dashboard';
import NewPlayer from './components/NewPlayer';
import GameCreator from './components/GameCreator';
import GameHistory from './components/GameHistory';
import StatsPage from './components/StatsPage';
import EditGame from './components/EditGame';

type Tab = 'dashboard' | 'stats' | 'history' | 'newplayer' | 'game' | 'edit';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<GameSummary[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [editingGameId, setEditingGameId] = useState<number | null>(null);
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
        gameAPI.getAllGames()
      ]);
      
      const [playersData, gamesData] = await Promise.race([dataPromise, timeoutPromise]) as [any, any];
      
      setPlayers(playersData);
      setGames(gamesData);
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
    // Reload data to get updated player stats and game list
    loadData();
    // Force refresh of PlayerStats component by incrementing key
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
    // Reload data to get updated player stats and game list
    loadData();
    // Go back to game history
    setEditingGameId(null);
    setActiveTab('history');
  };

  const handleGameDeleted = () => {
    // Reload data to get updated player stats and game list
    loadData();
    // Go back to game history
    setEditingGameId(null);
    setActiveTab('history');
  };

  const handleCancelEdit = () => {
    setEditingGameId(null);
    setActiveTab('history');
  };

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
          </div>

          {/* Navigation Tabs */}
          <div style={{ borderBottom: '1px solid #334155' }}>
            <nav className="-mb-px flex space-x-4">
              {[
                { key: 'dashboard', label: '🏠 Home' },
                { key: 'stats', label: '📊 Stats' },
                { key: 'history', label: '📜 History' },
                { key: 'game', label: '🎲 New Game' },
                { key: 'newplayer', label: '🧑 New Player' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as Tab)}
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
        
        {activeTab === 'newplayer' && (
          <NewPlayer 
            onPlayerCreated={handlePlayerCreated}
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
      </div>
    </div>
  );
}

export default App;
