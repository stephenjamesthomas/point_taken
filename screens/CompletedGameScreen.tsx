import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Game, Player } from '../types';
import { loadGames, loadPlayers, getPlayerFullName } from '../utils/storage';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/design';

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
  const [players, setPlayers] = useState<Player[]>([]);

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
          {sortedPlayers.map((player, index) => {
            const playerObj = player.player;
            const initials = getInitials(playerObj);
            const avatarColor = getAvatarColor(playerObj);
            return (
              <View key={player.id} style={styles.leaderboardItem}>
                <View style={styles.rankContainer}>
                  <Text style={styles.rank}>#{index + 1}</Text>
                </View>
                {playerObj?.avatar ? (
                  <Image source={{ uri: playerObj.avatar }} style={styles.playerAvatar} />
                ) : (
                  <View style={[styles.playerAvatarPlaceholder, { backgroundColor: avatarColor }]}>
                    <Text style={styles.playerAvatarInitials}>{initials}</Text>
                  </View>
                )}
                <Text style={styles.leaderboardName}>{player.name}</Text>
                <Text style={styles.leaderboardScore}>{player.total}</Text>
              </View>
            );
          })}
        </View>

        {game.scores.length > 0 && (
          <View style={styles.roundsSection}>
            <Text style={styles.roundsSectionTitle}>Round-by-Round Scores</Text>
            {game.scores.map((round, roundIndex) => (
              <View key={roundIndex} style={styles.roundCard}>
                <Text style={styles.roundNumber}>Round {roundIndex + 1}</Text>
                {round.map((entry) => {
                  const player = getPlayerById(entry.playerId);
                  const playerName = player ? getPlayerFullName(player) : (game.playerNames[game.playerIds.indexOf(entry.playerId)] || 'Unknown Player');
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
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    ...Shadows.sm,
  },
  backButton: {
    marginBottom: Spacing.md,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: Typography.body,
    color: Colors.primary,
    fontWeight: Typography.semibold,
  },
  gameTitle: {
    fontSize: Typography.h3,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  completedText: {
    fontSize: Typography.body,
    color: Colors.success,
    fontWeight: Typography.semibold,
    marginBottom: Spacing.xs,
  },
  completedDate: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  gameDate: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  roundCount: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
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
  rankContainer: {
    width: 40,
  },
  rank: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: Colors.primary,
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
  },
  roundsSection: {
    marginBottom: Spacing.xl,
  },
  roundsSectionTitle: {
    fontSize: Typography.h5,
    fontWeight: Typography.semibold,
    marginBottom: Spacing.md,
    color: Colors.textPrimary,
  },
  roundCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  roundNumber: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  roundScoreItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  roundScoreName: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
  },
  roundScoreValue: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
  },
  loadingText: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.huge,
  },
});

