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
  const [isNegative, setIsNegative] = useState(false);

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
      // Always initialize round scores to 0 when loading/resuming a game
      // The game's historical scores are already saved in game.scores
      const initialScores: { [playerId: string]: string } = {};
      gameWithDefaults.playerIds.forEach((id) => {
        initialScores[id] = '0';
      });
      setRoundScores(initialScores);
    }
  };

  const handleScoreInput = (playerId: string) => {
    setEditingPlayerId(playerId);
    const currentScore = roundScores[playerId] || '';
    // Check if current score is negative
    const scoreValue = parseFloat(currentScore) || 0;
    setIsNegative(scoreValue < 0);
    // Clear '0' if it's the default, otherwise keep current score (absolute value)
    setScoreInput(currentScore === '0' ? '' : Math.abs(scoreValue).toString());
    setScoreModalVisible(true);
  };

  const handleSaveScore = () => {
    if (editingPlayerId === null) return;

    const score = parseFloat(scoreInput);
    if (isNaN(score) && scoreInput !== '') {
      Alert.alert('Error', 'Please enter a valid number');
      return;
    }

    // Apply negative sign if toggle is on
    const finalScore = isNegative && score !== 0 ? -Math.abs(score) : Math.abs(score);
    const scoreString = finalScore.toString();

    setRoundScores({ ...roundScores, [editingPlayerId]: scoreString });
    setScoreModalVisible(false);
    setEditingPlayerId(null);
    setScoreInput('');
    setIsNegative(false);
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
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.nextRoundButton} onPress={handleAddRound}>
            <Text style={styles.nextRoundButtonText}>Next Round</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.finishButton} onPress={handleFinishGame}>
            <Text style={styles.finishButtonText}>Finish Game</Text>
          </TouchableOpacity>
        </View>
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
          <Text style={styles.leaderboardTitle}>Round {currentRound + 1}</Text>
          {sortedPlayers.map((player, index) => {
            const roundScore = getCurrentRoundScore(player.id);
            return (
              <View key={player.id} style={styles.leaderboardItem}>
                <View style={styles.rankContainer}>
                  <Text style={styles.rank}>#{index + 1}</Text>
                </View>
                <Text style={styles.leaderboardName}>{player.name}</Text>
                <Text style={styles.leaderboardScore}>{player.total}</Text>
                <TouchableOpacity
                  style={styles.roundScoreButton}
                  onPress={() => handleScoreInput(player.id)}
                >
                  <Text style={styles.roundScoreButtonText}>
                    {roundScore === 0 && !roundScores[player.id] ? 'Enter' : roundScore}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

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
          setIsNegative(false);
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
                <View style={styles.scoreInputContainer}>
                  <TouchableOpacity
                    style={[styles.negativeButton, isNegative && styles.negativeButtonActive]}
                    onPress={() => setIsNegative(!isNegative)}
                  >
                    <Text style={[styles.negativeButtonText, isNegative && styles.negativeButtonTextActive]}>
                      {isNegative ? '−' : '+'}
                    </Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.scoreInput}
                    placeholder="Enter score"
                    value={scoreInput}
                    onChangeText={(text) => {
                      // Clear "0" when typing a new digit
                      if (text === '') {
                        setScoreInput('');
                      } else if (scoreInput === '0' && text.length > 1 && text[0] === '0' && text[1] !== '.') {
                        // If current value is "0" and user types a digit, replace "0" with the new digit
                        setScoreInput(text.substring(1));
                      } else if (text.startsWith('0') && text.length > 1 && text[1] !== '.') {
                        // Clear leading zero when typing a new digit (but allow "0.")
                        setScoreInput(text.substring(1));
                      } else if (/^\d*\.?\d*$/.test(text)) {
                        // Allow only numbers and decimal point
                        setScoreInput(text);
                      }
                    }}
                    keyboardType="decimal-pad"
                    autoFocus={true}
                  />
                </View>
                <Text style={styles.scorePreview}>
                  Score: {isNegative ? '-' : ''}{scoreInput || '0'}
                </Text>
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton, styles.modalButtonSpacing]}
                    onPress={() => {
                      Keyboard.dismiss();
                      setScoreModalVisible(false);
                      setEditingPlayerId(null);
                      setScoreInput('');
                      setIsNegative(false);
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
    padding: 12,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  headerButtons: {
    flexDirection: 'row',
  },
  nextRoundButton: {
    backgroundColor: '#34C759',
    padding: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
    marginRight: 8,
  },
  nextRoundButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  finishButton: {
    backgroundColor: '#FF3B30',
    padding: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
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
    width: 80,
    textAlign: 'right',
    marginRight: 12,
  },
  roundScoreButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  roundScoreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  scoreInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  negativeButton: {
    width: 50,
    height: 50,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  negativeButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  negativeButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
  },
  negativeButtonTextActive: {
    color: '#007AFF',
  },
  scoreInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 24,
    textAlign: 'center',
  },
  scorePreview: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
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

