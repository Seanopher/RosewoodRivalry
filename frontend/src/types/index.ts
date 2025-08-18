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
  played_at: string;
  team1_players: Player[];
  team2_players: Player[];
}

export interface GameCreate {
  team1_score: number;
  team2_score: number;
  team1_players: number[];
  team2_players: number[];
}

export interface GameSummary {
  id: number;
  team1_score: number;
  team2_score: number;
  winner_team: number;
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