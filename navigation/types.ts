import { Game, GameTemplate, Player } from '../types';

export type RootStackParamList = {
  Home: undefined;
  Players: undefined;
  EditPlayer: { playerId?: string }; // playerId is optional for new players
  PlayerDetail: { playerId: string };
  Templates: undefined;
  EditTemplate: { templateId?: string };
  StartGame: undefined;
  Game: { gameId: string };
  GameComplete: { gameId: string };
  CompletedGame: { gameId: string };
  GameHistory: undefined;
};

