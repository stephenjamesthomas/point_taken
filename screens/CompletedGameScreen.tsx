import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Game } from '../types';
import { loadGames } from '../utils/storage';

type CompletedGameScreenRouteProp = RouteProp<RootStackParamList, 'CompletedGame'>;
type CompletedGameScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'CompletedGame'
>;

export default function CompletedGameScreen() {
  const route = useRoute<CompletedGameScreenRouteProp>();
  const navigation = useNavigation<CompletedGameScreenNavigationProp>();
  const { gameId } = route.params;

  const [game, setGame] = useState<Game | null>(null);

  useEffect(() => {
    loadGameData();
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
        endConditionAbsoluteValue: foundGame.endConditionAbsoluteValue,
        endConditionTiming: foundGame.endConditionTiming,
      };
      setGame(gameWithDefaults);
    }
  };

  const getTotalScore = (playerId: string): number => {
    if (!game) return 0;
    return game.scores.reduce((total, round) => {
      const entry = round.find((e) => e.playerId === playerId);
      return total + (entry?.score || 0);
    }, 0);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!game) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading game...</Text>
      </View>
    );
  }

  const winCondition = game.winCondition || 'high';
  const sortedPlayers = game.playerIds
    .map((id) => ({
      id,
      name: game.playerNames[game.playerIds.indexOf(id)],
      total: getTotalScore(id),
    }))
    .sort((a, b) => winCondition === 'high' ? b.total - a.total : a.total - b.total);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('GameHistory')}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.gameTitle}>{game.templateName}</Text>
        <Text style={styles.completedText}>Game Completed</Text>
        {game.completedAt && (
          <Text style={styles.completedDate}>
            Completed: {formatDate(game.completedAt)}
          </Text>
        )}
        <Text style={styles.gameDate}>Started: {formatDate(game.createdAt)}</Text>
        <Text style={styles.roundCount}>Total Rounds: {game.scores.length}</Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        scrollEventThrottle={16}
        bounces={true}
      >
        <View style={styles.leaderboard}>
          <Text style={styles.leaderboardTitle}>Final Standings</Text>
          {sortedPlayers.map((player, index) => (
            <View key={player.id} style={styles.leaderboardItem}>
              <View style={styles.rankContainer}>
                <Text style={styles.rank}>#{index + 1}</Text>
              </View>
              <Text style={styles.leaderboardName}>{player.name}</Text>
              <Text style={styles.leaderboardScore}>{player.total}</Text>
            </View>
          ))}
        </View>

        {game.scores.length > 0 && (
          <View style={styles.roundsSection}>
            <Text style={styles.roundsSectionTitle}>Round-by-Round Scores</Text>
            {game.scores.map((round, roundIndex) => (
              <View key={roundIndex} style={styles.roundCard}>
                <Text style={styles.roundNumber}>Round {roundIndex + 1}</Text>
                {round.map((entry) => {
                  const playerName = game.playerNames[game.playerIds.indexOf(entry.playerId)];
                  return (
                    <View key={entry.playerId} style={styles.roundScoreItem}>
                      <Text style={styles.roundScoreName}>{playerName}</Text>
                      <Text style={styles.roundScoreValue}>{entry.score}</Text>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  gameTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  completedText: {
    fontSize: 16,
    color: '#34C759',
    fontWeight: '600',
    marginBottom: 4,
  },
  completedDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  gameDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  roundCount: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  leaderboard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rankContainer: {
    width: 40,
  },
  rank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  leaderboardName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  leaderboardScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  roundsSection: {
    marginBottom: 20,
  },
  roundsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  roundCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  roundNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  roundScoreItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  roundScoreName: {
    fontSize: 14,
    color: '#666',
  },
  roundScoreValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
});

