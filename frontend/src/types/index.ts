// API Types matching backend schemas
export interface Player {
  id: number;
  name: string;
  created_at: string;
  games_played: number;
  games_won: number;
  total_points_scored: number;
  total_points_against: number;
  win_percentage: number;
  avg_loss_margin: number;
  avg_win_margin: number;
}

export interface PlayerCreate {
  name: string;
}

export interface Game {
  id: number;
  team1_score: number;
  team2_score: number;
  winner_team: number;
  location?: string;
  played_at: string;
  team1_players: Player[];
  team2_players: Player[];
}

export interface GameCreate {
  team1_score: number;
  team2_score: number;
  team1_players: number[];
  team2_players: number[];
  location?: string;
}

export interface GameUpdate {
  team1_score?: number;
  team2_score?: number;
  team1_players?: number[];
  team2_players?: number[];
  location?: string;
}

export interface GameSummary {
  id: number;
  team1_score: number;
  team2_score: number;
  winner_team: number;
  location?: string;
  played_at: string;
  team1_player_names: string[];
  team2_player_names: string[];
}

export interface PlayerStats {
  id: number;
  name: string;
  games_played: number;
  games_won: number;
  win_percentage: number;
  avg_win_margin: number;
  avg_loss_margin: number;
  total_points_scored: number;
  total_points_against: number;
  recent_games: GameSummary[];
}

// Team Types
export interface Team {
  id: number;
  player1_id: number;
  player2_id: number;
  player3_id: number;
  team_name: string;
  created_at: string;
  games_played: number;
  games_won: number;
  total_points_scored: number;
  total_points_against: number;
  win_percentage: number;
  avg_loss_margin: number;
  avg_win_margin: number;
  player1: Player;
  player2: Player;
  player3: Player;
}

export interface TeamsListResponse {
  teams: Team[];
  total_games: number;
  min_games_required: number;
  threshold_percentage: number;
}

export interface TeamStats {
  id: number;
  team_name: string;
  games_played: number;
  games_won: number;
  win_percentage: number;
  avg_win_margin: number;
  avg_loss_margin: number;
  total_points_scored: number;
  total_points_against: number;
  players: Player[];
  recent_games: GameSummary[];
}

export interface RivalryGame {
  id: number;
  played_at: string;
  location?: string;
  orchard_team: number;
  dreher_team: number;
  orchard_players: string[];
  dreher_players: string[];
  orchard_score: number;
  dreher_score: number;
  winner: string;
}

export interface RivalryStats {
  total_games: number;
  orchard_wins: number;
  dreher_wins: number;
  orchard_win_percentage: number;
  dreher_win_percentage: number;
  total_orchard_points: number;
  total_dreher_points: number;
  point_differential: number;
  recent_games: RivalryGame[];
}