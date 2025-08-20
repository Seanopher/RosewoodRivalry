import axios from 'axios';
import { Player, PlayerCreate, Game, GameCreate, GameUpdate, GameSummary, PlayerStats } from '../types';

// API URL configuration for different environments
const getApiBaseUrl = () => {
  // Production environment - use environment variable
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Development - use localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8000';
  }
  
  // Fallback for local network access
  return `http://${window.location.hostname}:8000`;
};

const API_BASE_URL = getApiBaseUrl();

console.log('API Configuration:', {
  hostname: window.location.hostname,
  protocol: window.location.protocol,
  API_BASE_URL
});

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`
    });
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('API Response Success:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('API Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      responseData: error.response?.data,
      code: error.code
    });
    return Promise.reject(error);
  }
);

export const playerAPI = {
  // Create a new player
  createPlayer: async (playerData: PlayerCreate): Promise<Player> => {
    const response = await api.post('/players/', playerData);
    return response.data;
  },

  // Get all players
  getAllPlayers: async (): Promise<Player[]> => {
    const response = await api.get('/players/');
    return response.data;
  },

  // Get player by ID
  getPlayer: async (playerId: number): Promise<Player> => {
    const response = await api.get(`/players/${playerId}`);
    return response.data;
  },

  // Get detailed player stats
  getPlayerStats: async (playerId: number, limit?: number): Promise<PlayerStats> => {
    const params = limit ? { limit } : {};
    const response = await api.get(`/players/${playerId}/stats`, { params });
    return response.data;
  },
};

export const gameAPI = {
  // Create a new game
  createGame: async (gameData: GameCreate): Promise<Game> => {
    const response = await api.post('/games/', gameData);
    return response.data;
  },

  // Update a game
  updateGame: async (gameId: number, gameData: GameUpdate): Promise<Game> => {
    const response = await api.put(`/games/${gameId}`, gameData);
    return response.data;
  },

  // Get all games (recent)
  getAllGames: async (limit?: number): Promise<GameSummary[]> => {
    const params = limit ? { limit } : {};
    const response = await api.get('/games/', { params });
    return response.data;
  },

  // Get game by ID
  getGame: async (gameId: number): Promise<Game> => {
    const response = await api.get(`/games/${gameId}`);
    return response.data;
  },

  // Delete a game
  deleteGame: async (gameId: number): Promise<void> => {
    await api.delete(`/games/${gameId}`);
  },
};

export default api;