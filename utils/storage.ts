import AsyncStorage from '@react-native-async-storage/async-storage';
import { Player, GameTemplate, Game, PlayerGameHistory } from '../types';

const STORAGE_KEYS = {
  PLAYERS: '@card_score_tracker:players',
  TEMPLATES: '@card_score_tracker:templates',
  GAMES: '@card_score_tracker:games',
};

// Player storage
export const savePlayers = async (players: Player[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
  } catch (error) {
    console.error('Error saving players:', error);
    throw error;
  }
};

export const loadPlayers = async (): Promise<Player[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.PLAYERS);
    if (!data) return [];
    
    const players = JSON.parse(data);
    // Migrate old players that only have 'name' field
    return players.map((player: any) => {
      // If player has old 'name' field but no firstName/lastName, migrate it
      if (player.name && !player.firstName && !player.lastName) {
        const nameParts = player.name.trim().split(/\s+/);
        return {
          ...player,
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || undefined, // Optional
          gamesPlayed: player.gamesPlayed || 0,
          gamesWon: player.gamesWon || 0,
          totalScore: player.totalScore || 0,
          averagePlace: player.averagePlace || 0,
          gameHistory: player.gameHistory || [],
        };
      }
      // Ensure new fields exist even if player was partially migrated
      return {
        ...player,
        firstName: player.firstName || '',
        lastName: player.lastName || undefined, // Optional
        gamesPlayed: player.gamesPlayed || 0,
        gamesWon: player.gamesWon || 0,
        totalScore: player.totalScore || 0,
        averagePlace: player.averagePlace || 0,
        gameHistory: player.gameHistory || [],
      };
    });
  } catch (error) {
    console.error('Error loading players:', error);
    return [];
  }
};

// Helper function to get full name from player
export const getPlayerFullName = (player: Player): string => {
  if (player.lastName) {
    return `${player.firstName} ${player.lastName}`.trim();
  }
  return player.firstName.trim() || 'Unknown Player';
};

// Update player statistics when a game completes
export const updatePlayerStatistics = async (game: Game): Promise<void> => {
  if (!game.completedAt || game.scores.length === 0) return;

  const players = await loadPlayers();
  const winCondition = game.winCondition || 'high';

  // Calculate final scores and places
  const totals: { [playerId: string]: number } = {};
  game.playerIds.forEach((id) => {
    totals[id] = 0;
  });

  game.scores.forEach((round) => {
    round.forEach((entry) => {
      totals[entry.playerId] = (totals[entry.playerId] || 0) + entry.score;
    });
  });

  // Sort players by score to determine places
  const sortedPlayers = game.playerIds
    .map((id) => ({
      id,
      total: totals[id],
    }))
    .sort((a, b) =>
      winCondition === 'high' ? b.total - a.total : a.total - b.total
    );

  // Update each player's statistics
  const updatedPlayers = players.map((player) => {
    const playerIndex = game.playerIds.indexOf(player.id);
    if (playerIndex === -1) return player; // Player not in this game

    const place = sortedPlayers.findIndex((p) => p.id === player.id) + 1;
    const finalScore = totals[player.id];
    const isWinner = place === 1;

    // Check if this game is already in player's history
    const existingHistoryIndex = player.gameHistory.findIndex(
      (h) => h.gameId === game.id
    );

    const gameHistoryEntry: PlayerGameHistory = {
      gameId: game.id,
      templateName: game.templateName,
      place,
      finalScore,
      completedAt: game.completedAt,
    };

    let newGameHistory = [...player.gameHistory];
    if (existingHistoryIndex >= 0) {
      // Update existing entry
      newGameHistory[existingHistoryIndex] = gameHistoryEntry;
    } else {
      // Add new entry
      newGameHistory.push(gameHistoryEntry);
    }

    // Recalculate statistics
    const gamesPlayed = newGameHistory.length;
    const gamesWon = newGameHistory.filter((h) => h.place === 1).length;
    const totalScore = newGameHistory.reduce((sum, h) => sum + h.finalScore, 0);
    const averagePlace =
      gamesPlayed > 0
        ? newGameHistory.reduce((sum, h) => sum + h.place, 0) / gamesPlayed
        : 0;

    return {
      ...player,
      gamesPlayed,
      gamesWon,
      totalScore,
      averagePlace,
      gameHistory: newGameHistory,
    };
  });

  await savePlayers(updatedPlayers);
};

// Template storage
export const saveTemplates = async (templates: GameTemplate[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  } catch (error) {
    console.error('Error saving templates:', error);
    throw error;
  }
};

export const loadTemplates = async (): Promise<GameTemplate[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.TEMPLATES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading templates:', error);
    return [];
  }
};

// Game storage
export const saveGames = async (games: Game[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(games));
  } catch (error) {
    console.error('Error saving games:', error);
    throw error;
  }
};

export const loadGames = async (): Promise<Game[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.GAMES);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading games:', error);
    return [];
  }
};

