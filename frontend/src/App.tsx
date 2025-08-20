import React, { useState, useEffect } from 'react';
import { Player, GameSummary, Game } from './types';
import { playerAPI, gameAPI } from './services/api';
import Dashboard from './components/Dashboard';
import NewPlayer from './components/NewPlayer';
import GameCreator from './components/GameCreator';
import GameHistory from './components/GameHistory';
import PlayerStats from './components/PlayerStats';
import EditGame from './components/EditGame';

type Tab = 'dashboard' | 'stats' | 'history' | 'newplayer' | 'game' | 'edit';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<GameSummary[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [editingGameId, setEditingGameId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [playersData, gamesData] = await Promise.all([
        playerAPI.getAllPlayers(),
        gameAPI.getAllGames(20)
      ]);
      setPlayers(playersData);
      setGames(gamesData);
      setError(null);
    } catch (err) {
      setError('Failed to load data. Make sure the backend is running.');
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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">{error}</div>
          <button 
            onClick={loadData}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <img 
                src="/rosewood-logo.png" 
                alt="Rosewood Rivalry" 
                className="h-8 w-auto"
              />
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">Rosewood Rivalry</h1>
                <span className="text-sm text-gray-500">Die Game Tracker</span>
              </div>
            </div>
          </div>
          
          {/* Navigation Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
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
                  className={`${
                    activeTab === key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
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
          <PlayerStats 
            players={players} 
            selectedPlayer={selectedPlayer}
            onPlayerSelect={setSelectedPlayer}
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
