export interface Player {
  id: string;
  firstName: string;
  lastName?: string; // Optional last name
  avatar?: string; // URI to image file or 'default' for default avatar
  createdAt: string;
  // Statistics
  gamesPlayed: number;
  gamesWon: number;
  totalScore: number; // Sum of all scores across all games
  averagePlace: number; // Average finishing position
  gameHistory: PlayerGameHistory[]; // History of games played
}

export interface PlayerGameHistory {
  gameId: string;
  templateName: string;
  place: number; // 1st, 2nd, 3rd, etc.
  finalScore: number;
  completedAt: string;
}

export type WinCondition = 'high' | 'low';
export type EndCondition = 'manual' | 'rounds' | 'target';
export type EndConditionTiming = 'immediately' | 'finishRound' | 'additionalTurn';

export interface GameTemplate {
  id: string;
  name: string;
  description?: string;
  minPlayers: number;
  maxPlayers?: number; // undefined means unlimited
  winCondition: WinCondition; // 'high' or 'low' score wins
  endCondition: EndCondition; // 'manual', 'rounds', or 'target'
  endConditionValue?: number; // Number of rounds or target score
  endConditionAbsoluteValue?: boolean; // If true, check absolute value of score for target
  endConditionTiming?: EndConditionTiming; // Only for target score: 'immediately', 'finishRound', or 'additionalTurn'
  createdAt: string;
}

export interface ScoreEntry {
  playerId: string;
  score: number;
}

export interface Game {
  id: string;
  templateId: string;
  templateName: string;
  playerIds: string[];
  playerNames: string[];
  scores: ScoreEntry[][]; // Array of rounds, each round has scores for all players
  winCondition: WinCondition; // From template
  endCondition: EndCondition; // From template
  endConditionValue?: number; // From template
  endConditionAbsoluteValue?: boolean; // From template
  endConditionTiming?: EndConditionTiming; // From template
  createdAt: string;
  completedAt?: string;
}

