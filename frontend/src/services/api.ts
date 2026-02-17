import axios from 'axios';
import { Player, PlayerCreate, Game, GameCreate, GameUpdate, GameSummary, PlayerStats, Team, TeamStats, TeamsListResponse, RivalryStats, GolfRound, GolfRoundCreate, GolfRoundUpdate, GolfRoundSummary, GolfPlayerStats } from '../types';

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
  timeout: 30000, // 30 second timeout for cold starts
});

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 2, // Retry once on failure
  retryDelay: 1000, // 1 seconds delay between retries
  retryCondition: (error: any) => {
    // Retry on network errors, timeouts, or 5xx server errors (cold start related)
    return (
      error.code === 'ECONNABORTED' || // Timeout
      error.code === 'NETWORK_ERROR' || // Network error
      error.message === 'Network Error' || // General network error
      !error.response || // No response (connection failed)
      (error.response && error.response.status >= 500) // Server errors
    );
  }
};

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

// Retry helper function
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Add response interceptor with retry logic
api.interceptors.response.use(
  (response) => {
    console.log('API Response Success:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if this is a retryable error and we haven't exceeded max retries
    if (RETRY_CONFIG.retryCondition(error) && !originalRequest._retry) {
      originalRequest._retry = true;
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

      if (originalRequest._retryCount <= RETRY_CONFIG.maxRetries) {
        console.warn(`API Request failed, retrying (${originalRequest._retryCount}/${RETRY_CONFIG.maxRetries})...`, {
          url: originalRequest.url,
          error: error.message,
          retryAfter: RETRY_CONFIG.retryDelay
        });

        // Wait before retrying
        await sleep(RETRY_CONFIG.retryDelay);

        // Retry the request
        return api(originalRequest);
      }
    }

    console.error('API Response Error (final):', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      responseData: error.response?.data,
      code: error.code,
      retries: originalRequest._retryCount || 0
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

export const teamAPI = {
  // Get all teams
  getAllTeams: async (): Promise<TeamsListResponse> => {
    const response = await api.get('/teams/');
    return response.data;
  },

  // Get team stats by ID
  getTeamStats: async (teamId: number): Promise<TeamStats> => {
    const response = await api.get(`/teams/${teamId}`);
    return response.data;
  },

  // Rebuild teams from games
  rebuildTeams: async (): Promise<{ message: string; teams_created: number }> => {
    const response = await api.get('/teams/rebuild');
    return response.data;
  },
};

export const rivalryAPI = {
  // Get rivalry stats
  getRivalryStats: async (): Promise<RivalryStats> => {
    const response = await api.get('/rivalry/');
    return response.data;
  },
};

export const golfAPI = {
  // Create a new golf round
  createRound: async (data: GolfRoundCreate): Promise<GolfRound> => {
    const response = await api.post('/golf/rounds/', data);
    return response.data;
  },

  // Get all golf rounds
  getAllRounds: async (limit?: number): Promise<GolfRoundSummary[]> => {
    const params = limit ? { limit } : {};
    const response = await api.get('/golf/rounds/', { params });
    return response.data;
  },

  // Get a single golf round
  getRound: async (roundId: number): Promise<GolfRound> => {
    const response = await api.get(`/golf/rounds/${roundId}`);
    return response.data;
  },

  // Update a golf round
  updateRound: async (roundId: number, data: GolfRoundUpdate): Promise<GolfRound> => {
    const response = await api.put(`/golf/rounds/${roundId}`, data);
    return response.data;
  },

  // Delete a golf round
  deleteRound: async (roundId: number): Promise<void> => {
    await api.delete(`/golf/rounds/${roundId}`);
  },

  // Get golf leaderboard
  getLeaderboard: async (): Promise<GolfPlayerStats[]> => {
    const response = await api.get('/golf/stats/');
    return response.data;
  },

  // Get golf stats for a specific player
  getPlayerStats: async (playerId: number): Promise<GolfPlayerStats> => {
    const response = await api.get(`/golf/stats/${playerId}`);
    return response.data;
  },
};

export default api;