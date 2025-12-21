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
  Image,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Game, ScoreEntry, Player } from '../types';
import { loadGames, saveGames, loadPlayers, getPlayerFullName } from '../utils/storage';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/design';

type GameScreenRouteProp = RouteProp<RootStackParamList, 'Game'>;
type GameScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Game'>;

export default function GameScreen() {
  const route = useRoute<GameScreenRouteProp>();
  const navigation = useNavigation<GameScreenNavigationProp>();
  const { gameId } = route.params;

  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
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
    const [games, loadedPlayers] = await Promise.all([
      loadGames(),
      loadPlayers(),
    ]);
    setPlayers(loadedPlayers);
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

  const handleExitGame = () => {
    Alert.alert(
      'Exit Game',
      'Are you sure you want to exit? Your progress will be saved and you can resume later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Exit',
          onPress: () => {
            navigation.navigate('Home');
          },
        },
      ]
    );
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

  // Avatar helper functions
  const AVATAR_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52BE80',
  ];

  const getPlayerById = (playerId: string): Player | undefined => {
    return players.find((p) => p.id === playerId);
  };

  const getInitials = (player: Player | undefined): string => {
    if (!player) return '?';
    const firstInitial = player.firstName.trim().charAt(0).toUpperCase() || '';
    const lastInitial = player.lastName?.trim().charAt(0).toUpperCase() || '';
    return firstInitial + lastInitial || firstInitial || '?';
  };

  const getAvatarColor = (player: Player | undefined): string => {
    if (!player) return AVATAR_COLORS[0];
    const name = (player.firstName + (player.lastName || '')).toLowerCase();
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
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
    .map((id) => {
      const player = getPlayerById(id);
      // Use player's actual name from the player object if available, otherwise fall back to stored name
      const name = player ? getPlayerFullName(player) : (game.playerNames[game.playerIds.indexOf(id)] || 'Unknown Player');
      return {
        id,
        name,
        player, // Include full player object for avatar
        total: getTotalScore(id),
      };
    })
    .sort((a, b) => winCondition === 'high' ? b.total - a.total : a.total - b.total);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.exitButton} onPress={handleExitGame}>
          <Text style={styles.exitButtonText}>← Exit</Text>
        </TouchableOpacity>
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
            const playerObj = player.player;
            const initials = getInitials(playerObj);
            const avatarColor = getAvatarColor(playerObj);
            const hasScore = roundScore !== 0 || (roundScores[player.id] && roundScores[player.id] !== '0');
            return (
              <View key={player.id} style={styles.leaderboardItem}>
                {playerObj?.avatar ? (
                  <Image source={{ uri: playerObj.avatar }} style={styles.playerAvatar} />
                ) : (
                  <View style={[styles.playerAvatarPlaceholder, { backgroundColor: avatarColor }]}>
                    <Text style={styles.playerAvatarInitials}>{initials}</Text>
                  </View>
                )}
                <Text style={styles.leaderboardName}>{player.name}</Text>
                <TouchableOpacity
                  style={[styles.roundScoreButton, hasScore && styles.roundScoreButtonFilled]}
                  onPress={() => handleScoreInput(player.id)}
                >
                  <Text style={styles.roundScoreButtonText}>
                    {roundScore === 0 && !roundScores[player.id] ? 'Enter' : roundScore}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.leaderboardScore}>{player.total}</Text>
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
                  {editingPlayerId && (() => {
                    const player = getPlayerById(editingPlayerId);
                    return player 
                      ? getPlayerFullName(player)
                      : (game.playerNames[game.playerIds.indexOf(editingPlayerId)] || 'Unknown Player');
                  })()}
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
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    paddingTop: 50,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.sm,
  },
  exitButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginRight: Spacing.md,
  },
  exitButtonText: {
    fontSize: Typography.body,
    color: Colors.primary,
    fontWeight: Typography.semibold,
  },
  gameTitle: {
    fontSize: Typography.h5,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  nextRoundButton: {
    backgroundColor: Colors.success,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  nextRoundButtonText: {
    color: Colors.surface,
    fontSize: Typography.bodySmall,
    fontWeight: Typography.semibold,
  },
  finishButton: {
    backgroundColor: Colors.error,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  finishButtonText: {
    color: Colors.surface,
    fontSize: Typography.bodySmall,
    fontWeight: Typography.semibold,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.xl,
    paddingBottom: Spacing.huge,
  },
  leaderboard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    ...Shadows.md,
  },
  leaderboardTitle: {
    fontSize: Typography.h5,
    fontWeight: Typography.semibold,
    marginBottom: Spacing.md,
    color: Colors.textPrimary,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  playerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  playerAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  playerAvatarInitials: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: Colors.surface,
  },
  leaderboardName: {
    flex: 1,
    fontSize: Typography.body,
    fontWeight: Typography.medium,
    color: Colors.textPrimary,
  },
  leaderboardScore: {
    fontSize: Typography.h5,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    width: 80,
    textAlign: 'right',
    marginLeft: Spacing.md,
  },
  roundScoreButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  roundScoreButtonFilled: {
    backgroundColor: Colors.primaryLight,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  roundScoreButtonText: {
    color: Colors.surface,
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
  },
  loadingText: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.huge,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xxl,
    width: '80%',
    maxWidth: 400,
    ...Shadows.xl,
  },
  modalTitle: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    marginBottom: Spacing.lg,
    color: Colors.textPrimary,
  },
  scoreInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  negativeButton: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  negativeButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  negativeButtonText: {
    fontSize: 28,
    fontWeight: Typography.bold,
    color: Colors.textSecondary,
  },
  negativeButtonTextActive: {
    color: Colors.primary,
  },
  scoreInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: 28,
    textAlign: 'center',
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
  },
  scorePreview: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    fontWeight: Typography.medium,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
  },
  modalButtonSpacing: {
    // Using gap instead
  },
  modalButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  cancelButton: {
    backgroundColor: Colors.surfaceSecondary,
  },
  cancelButtonText: {
    color: Colors.textPrimary,
    fontWeight: Typography.semibold,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    ...Shadows.sm,
  },
  saveButtonText: {
    color: Colors.surface,
    fontWeight: Typography.semibold,
  },
});

