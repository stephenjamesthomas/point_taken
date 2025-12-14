import AsyncStorage from '@react-native-async-storage/async-storage';
import { Player, GameTemplate, Game } from '../types';

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
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading players:', error);
    return [];
  }
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

