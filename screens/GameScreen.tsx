import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Game, ScoreEntry } from '../types';
import { loadGames, saveGames } from '../utils/storage';

type GameScreenRouteProp = RouteProp<RootStackParamList, 'Game'>;
type GameScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Game'>;

export default function GameScreen() {
  const route = useRoute<GameScreenRouteProp>();
  const navigation = useNavigation<GameScreenNavigationProp>();
  const { gameId } = route.params;

  const [game, setGame] = useState<Game | null>(null);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [roundScores, setRoundScores] = useState<{ [playerId: string]: string }>({});
  const [scoreModalVisible, setScoreModalVisible] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [scoreInput, setScoreInput] = useState('');

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
      setCurrentRound(gameWithDefaults.scores.length);
      if (gameWithDefaults.scores.length > 0) {
        const lastRound = gameWithDefaults.scores[gameWithDefaults.scores.length - 1];
        const scores: { [playerId: string]: string } = {};
        lastRound.forEach((entry) => {
          scores[entry.playerId] = entry.score.toString();
        });
        setRoundScores(scores);
      } else {
        const initialScores: { [playerId: string]: string } = {};
        gameWithDefaults.playerIds.forEach((id) => {
          initialScores[id] = '0';
        });
        setRoundScores(initialScores);
      }
    }
  };

  const handleScoreInput = (playerId: string) => {
    setEditingPlayerId(playerId);
    setScoreInput(roundScores[playerId] || '0');
    setScoreModalVisible(true);
  };

  const handleSaveScore = () => {
    if (editingPlayerId === null) return;

    const score = parseFloat(scoreInput);
    if (isNaN(score)) {
      Alert.alert('Error', 'Please enter a valid number');
      return;
    }

    setRoundScores({ ...roundScores, [editingPlayerId]: scoreInput });
    setScoreModalVisible(false);
    setEditingPlayerId(null);
    setScoreInput('');
  };

  const handleAddRound = async () => {
    if (!game) return;

    const allScoresEntered = game.playerIds.every((id) => roundScores[id] !== undefined);
    if (!allScoresEntered) {
      Alert.alert('Error', 'Please enter scores for all players');
      return;
    }

    const roundEntries: ScoreEntry[] = game.playerIds.map((id) => ({
      playerId: id,
      score: parseFloat(roundScores[id]) || 0,
    }));

    const updatedScores = [...game.scores, roundEntries];
    const updatedGame: Game = {
      ...game,
      scores: updatedScores,
    };

    // Check if game should end based on end condition
    let shouldEndGame = false;
    let endReason = '';

    if (game.endCondition === 'rounds' && game.endConditionValue) {
      if (updatedScores.length >= game.endConditionValue) {
        shouldEndGame = true;
        endReason = `Reached ${game.endConditionValue} rounds`;
      }
    } else if (game.endCondition === 'target' && game.endConditionValue) {
      const totals: { [playerId: string]: number } = {};
      game.playerIds.forEach((id) => {
        totals[id] = 0;
      });
      updatedScores.forEach((round) => {
        round.forEach((entry) => {
          totals[entry.playerId] = (totals[entry.playerId] || 0) + entry.score;
        });
      });

      const targetValue = game.endConditionValue;
      const useAbsolute = game.endConditionAbsoluteValue || false;
      
      const reachedTarget = game.playerIds.some((id) => {
        const total = totals[id];
        if (useAbsolute) {
          return Math.abs(total) >= targetValue;
        } else {
          return total >= targetValue;
        }
      });

      if (reachedTarget) {
        if (game.endConditionTiming === 'immediately') {
          shouldEndGame = true;
          endReason = 'Target score reached';
        } else if (game.endConditionTiming === 'finishRound') {
          shouldEndGame = true;
          endReason = 'Target score reached (finishing round)';
        } else if (game.endConditionTiming === 'additionalTurn') {
          // For additional turn, we'd need to track whose turn it is
          // For now, just finish the round
          shouldEndGame = true;
          endReason = 'Target score reached (additional turn completed)';
        }
      }
    }

    const games = await loadGames();
    let finalGame = updatedGame;
    
    if (shouldEndGame) {
      finalGame = {
        ...updatedGame,
        completedAt: new Date().toISOString(),
      };
    }
    
    const updatedGames = games.map((g) => (g.id === gameId ? finalGame : g));
    await saveGames(updatedGames);

    setGame(finalGame);
    setCurrentRound(updatedScores.length);

    if (shouldEndGame) {
      navigation.navigate('GameComplete', { gameId: finalGame.id });
      return;
    }

    // Reset for next round
    const nextRoundScores: { [playerId: string]: string } = {};
    game.playerIds.forEach((id) => {
      nextRoundScores[id] = '0';
    });
    setRoundScores(nextRoundScores);
  };

  const handleFinishGame = async () => {
    if (!game) return;

    Alert.alert(
      'Finish Game',
      'Are you sure you want to finish this game?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finish',
          onPress: async () => {
            const games = await loadGames();
            const updatedGames = games.map((g) =>
              g.id === gameId ? { ...g, completedAt: new Date().toISOString() } : g
            );
            await saveGames(updatedGames);
            navigation.navigate('GameComplete', { gameId });
          },
        },
      ]
    );
  };

  const getTotalScore = (playerId: string): number => {
    if (!game) return 0;
    return game.scores.reduce((total, round) => {
      const entry = round.find((e) => e.playerId === playerId);
      return total + (entry?.score || 0);
    }, 0);
  };

  const getCurrentRoundScore = (playerId: string): number => {
    return parseFloat(roundScores[playerId]) || 0;
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
        <Text style={styles.gameTitle}>{game.templateName}</Text>
        <Text style={styles.roundText}>Round {currentRound + 1}</Text>
        <TouchableOpacity style={styles.finishButton} onPress={handleFinishGame}>
          <Text style={styles.finishButtonText}>Finish Game</Text>
        </TouchableOpacity>
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
          <Text style={styles.leaderboardTitle}>Current Standings</Text>
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

        <View style={styles.scoresSection}>
          <Text style={styles.scoresSectionTitle}>Round {currentRound + 1} Scores</Text>
          {game.playerIds.map((playerId) => {
            const playerName = game.playerNames[game.playerIds.indexOf(playerId)];
            const currentScore = getCurrentRoundScore(playerId);
            return (
              <TouchableOpacity
                key={playerId}
                style={styles.scoreCard}
                onPress={() => handleScoreInput(playerId)}
              >
                <Text style={styles.scoreCardName}>{playerName}</Text>
                <Text style={styles.scoreCardValue}>{currentScore}</Text>
                <Text style={styles.tapToEdit}>Tap to edit</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity style={styles.addRoundButton} onPress={handleAddRound}>
          <Text style={styles.addRoundButtonText}>Add Round</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={scoreModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          Keyboard.dismiss();
          setScoreModalVisible(false);
          setEditingPlayerId(null);
          setScoreInput('');
        }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                  {editingPlayerId &&
                    game.playerNames[game.playerIds.indexOf(editingPlayerId)]}
                </Text>
                <TextInput
                  style={styles.scoreInput}
                  placeholder="Enter score"
                  value={scoreInput}
                  onChangeText={(text) => {
                    // Allow negative numbers and clear "0" when typing a new digit
                    if (text === '-' || text === '') {
                      setScoreInput(text);
                    } else if (scoreInput === '0' && text.length > 1 && text[0] === '0' && text[1] !== '.') {
                      // If current value is "0" and user types a digit, replace "0" with the new digit
                      setScoreInput(text.substring(1));
                    } else if (text.startsWith('0') && text.length > 1 && text[1] !== '.' && text[1] !== '-') {
                      // Clear leading zero when typing a new digit (but allow "0.")
                      setScoreInput(text.substring(1));
                    } else if (/^-?\d*\.?\d*$/.test(text)) {
                      // Allow numbers, decimals, and negative sign
                      setScoreInput(text);
                    }
                  }}
                  keyboardType="numeric"
                  autoFocus={true}
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton, styles.modalButtonSpacing]}
                    onPress={() => {
                      Keyboard.dismiss();
                      setScoreModalVisible(false);
                      setEditingPlayerId(null);
                      setScoreInput('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.saveButton]}
                    onPress={() => {
                      Keyboard.dismiss();
                      handleSaveScore();
                    }}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  gameTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  roundText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  finishButton: {
    backgroundColor: '#FF3B30',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  finishButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  scoresSection: {
    marginBottom: 20,
  },
  scoresSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  scoreCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  scoreCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  scoreCardValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  tapToEdit: {
    fontSize: 12,
    color: '#999',
  },
  addRoundButton: {
    backgroundColor: '#34C759',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 40,
  },
  addRoundButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  scoreInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 24,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButtonSpacing: {
    marginRight: 12,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

