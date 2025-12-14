import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Game } from '../types';
import { loadGames, saveGames, loadTemplates } from '../utils/storage';

type GameCompleteScreenRouteProp = RouteProp<RootStackParamList, 'GameComplete'>;
type GameCompleteScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'GameComplete'
>;

export default function GameCompleteScreen() {
  const route = useRoute<GameCompleteScreenRouteProp>();
  const navigation = useNavigation<GameCompleteScreenNavigationProp>();
  const { gameId } = route.params;

  const [game, setGame] = useState<Game | null>(null);
  const [winner, setWinner] = useState<{ name: string; score: number } | null>(null);
  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadGameData();
    // Celebration animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [gameId]);

  const loadGameData = async () => {
    const games = await loadGames();
    const foundGame = games.find((g) => g.id === gameId);
    if (foundGame) {
      // Add default values for backward compatibility
      const gameWithDefaults: Game = {
        ...foundGame,
        winCondition: foundGame.winCondition || 'high',
        endCondition: foundGame.endCondition || 'manual',
        endConditionValue: foundGame.endConditionValue,
        endConditionTiming: foundGame.endConditionTiming,
      };
      setGame(gameWithDefaults);
      calculateWinner(gameWithDefaults);
    }
  };

  const calculateWinner = (gameData: Game) => {
    if (!gameData || gameData.scores.length === 0) {
      setWinner(null);
      return;
    }

    const totals: { [playerId: string]: number } = {};
    gameData.playerIds.forEach((id) => {
      totals[id] = 0;
    });

    gameData.scores.forEach((round) => {
      round.forEach((entry) => {
        totals[entry.playerId] = (totals[entry.playerId] || 0) + entry.score;
      });
    });

    const winCondition = gameData.winCondition || 'high';
    const sorted = gameData.playerIds
      .map((id) => ({
        id,
        name: gameData.playerNames[gameData.playerIds.indexOf(id)],
        total: totals[id],
      }))
      .sort((a, b) =>
        winCondition === 'high' ? b.total - a.total : a.total - b.total
      );

    setWinner(sorted[0]);
  };

  const handlePlayAgain = async () => {
    if (!game) return;

    // Create a new game with the same template and players
    const newGame: Game = {
      id: Date.now().toString(),
      templateId: game.templateId,
      templateName: game.templateName,
      playerIds: game.playerIds,
      playerNames: game.playerNames,
      scores: [],
      winCondition: game.winCondition,
      endCondition: game.endCondition,
      endConditionValue: game.endConditionValue,
      endConditionAbsoluteValue: game.endConditionAbsoluteValue,
      endConditionTiming: game.endConditionTiming,
      createdAt: new Date().toISOString(),
    };

    const games = await loadGames();
    await saveGames([...games, newGame]);

    navigation.reset({
      index: 0,
      routes: [{ name: 'Game', params: { gameId: newGame.id } }],
    });
  };

  const handleReturnToMenu = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  };

  if (!game || !winner) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.celebrationContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.celebrationEmoji}>🎉</Text>
          <Text style={styles.celebrationText}>Game Complete!</Text>
          <Text style={styles.winnerLabel}>Winner</Text>
          <Text style={styles.winnerName}>{winner.name}</Text>
          <Text style={styles.winnerScore}>{winner.score} points</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.actionsContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.button, styles.playAgainButton]}
            onPress={handlePlayAgain}
          >
            <Text style={styles.playAgainButtonText}>Play Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.menuButton]}
            onPress={handleReturnToMenu}
          >
            <Text style={styles.menuButtonText}>Return to Main Menu</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
  celebrationContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  celebrationEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  celebrationText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  winnerLabel: {
    fontSize: 18,
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  winnerName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  winnerScore: {
    fontSize: 24,
    color: '#666',
    textAlign: 'center',
  },
  actionsContainer: {
    width: '100%',
    maxWidth: 300,
  },
  button: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  playAgainButton: {
    backgroundColor: '#007AFF',
  },
  playAgainButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  menuButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  menuButtonText: {
    color: '#007AFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

