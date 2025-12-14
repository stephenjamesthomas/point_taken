import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
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
  const [winner, setWinner] = useState<{ id: string; name: string; total: number } | null>(null);
  const [allPlayers, setAllPlayers] = useState<{ id: string; name: string; total: number }[]>([]);
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
      setAllPlayers([]);
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
    setAllPlayers(sorted);
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
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
          <Text style={styles.winnerScore}>{winner.total} points</Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.resultsContainer,
            {
              opacity: fadeAnim,
            },
          ]}
        >
          <Text style={styles.resultsTitle}>Final Standings</Text>
          {allPlayers.map((player, index) => {
            const isWinner = player.id === winner.id;
            return (
              <View
                key={player.id}
                style={[
                  styles.playerResultItem,
                  isWinner && styles.playerResultItemWinner,
                ]}
              >
                <View style={styles.playerResultRank}>
                  <Text
                    style={[
                      styles.playerResultRankText,
                      isWinner && styles.playerResultRankTextWinner,
                    ]}
                  >
                    #{index + 1}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.playerResultName,
                    isWinner && styles.playerResultNameWinner,
                  ]}
                >
                  {player.name}
                </Text>
                <Text
                  style={[
                    styles.playerResultScore,
                    isWinner && styles.playerResultScoreWinner,
                  ]}
                >
                  {player.total}
                </Text>
              </View>
            );
          })}
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
  celebrationContainer: {
    alignItems: 'center',
    marginBottom: 40,
    width: '100%',
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
    fontWeight: '600',
  },
  resultsContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  playerResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  playerResultItemWinner: {
    backgroundColor: '#E8F4FD',
    borderRadius: 8,
    borderBottomWidth: 0,
    marginBottom: 4,
  },
  playerResultRank: {
    width: 40,
    alignItems: 'center',
  },
  playerResultRankText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  playerResultRankTextWinner: {
    color: '#007AFF',
  },
  playerResultName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  playerResultNameWinner: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  playerResultScore: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    minWidth: 60,
    textAlign: 'right',
  },
  playerResultScoreWinner: {
    color: '#007AFF',
    fontSize: 20,
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

