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
import { Player } from '../types';
import { loadPlayers, getPlayerFullName } from '../utils/storage';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/design';

type PlayerDetailScreenRouteProp = RouteProp<RootStackParamList, 'PlayerDetail'>;
type PlayerDetailScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PlayerDetail'
>;

const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52BE80',
];

export default function PlayerDetailScreen() {
  const route = useRoute<PlayerDetailScreenRouteProp>();
  const navigation = useNavigation<PlayerDetailScreenNavigationProp>();
  const { playerId } = route.params;

  const [player, setPlayer] = useState<Player | null>(null);

  useEffect(() => {
    loadPlayerData();
  }, [playerId]);

  const loadPlayerData = async () => {
    const players = await loadPlayers();
    const foundPlayer = players.find((p) => p.id === playerId);
    setPlayer(foundPlayer || null);
  };

  const getInitials = (player: Player): string => {
    const firstInitial = player.firstName.trim().charAt(0).toUpperCase() || '';
    const lastInitial = player.lastName?.trim().charAt(0).toUpperCase() || '';
    return firstInitial + lastInitial || firstInitial || '?';
  };

  const getAvatarColor = (player: Player): string => {
    const name = (player.firstName + (player.lastName || '')).toLowerCase();
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPlaceSuffix = (place: number): string => {
    if (place === 1) return 'st';
    if (place === 2) return 'nd';
    if (place === 3) return 'rd';
    return 'th';
  };

  if (!player) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading player...</Text>
      </View>
    );
  }

  const fullName = getPlayerFullName(player);
  const winRate = player.gamesPlayed > 0
    ? ((player.gamesWon / player.gamesPlayed) * 100).toFixed(1)
    : '0.0';
  const initials = getInitials(player);
  const avatarColor = getAvatarColor(player);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Player Details</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EditPlayer', { playerId: player.id })}
        >
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={true}
      >
        {/* Avatar and Name */}
        <View style={styles.profileSection}>
          {player.avatar ? (
            <Image source={{ uri: player.avatar }} style={styles.avatarImage} />
          ) : (
            <View
              style={[
                styles.avatarPlaceholder,
                { backgroundColor: avatarColor },
              ]}
            >
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <Text style={styles.playerName}>{fullName}</Text>
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{player.gamesPlayed}</Text>
              <Text style={styles.statLabel}>Games Played</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{player.gamesWon}</Text>
              <Text style={styles.statLabel}>Games Won</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{winRate}%</Text>
              <Text style={styles.statLabel}>Win Rate</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {player.averagePlace > 0 ? player.averagePlace.toFixed(1) : '—'}
              </Text>
              <Text style={styles.statLabel}>Avg. Place</Text>
            </View>
          </View>
          <View style={styles.totalScoreCard}>
            <Text style={styles.totalScoreLabel}>Total Score</Text>
            <Text style={styles.totalScoreValue}>{player.totalScore}</Text>
          </View>
        </View>

        {/* Game History */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game History</Text>
          {player.gameHistory.length === 0 ? (
            <Text style={styles.emptyText}>No games played yet</Text>
          ) : (
            player.gameHistory
              .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
              .map((game, index) => (
                <View key={index} style={styles.gameHistoryItem}>
                  <View style={styles.gameHistoryHeader}>
                    <Text style={styles.gameHistoryTemplate}>{game.templateName}</Text>
                    <View style={styles.placeBadge}>
                      <Text style={styles.placeText}>
                        {game.place}{getPlaceSuffix(game.place)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.gameHistoryDetails}>
                    <Text style={styles.gameHistoryScore}>Score: {game.finalScore}</Text>
                    <Text style={styles.gameHistoryDate}>{formatDate(game.completedAt)}</Text>
                  </View>
                </View>
              ))
          )}
        </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...Shadows.sm,
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: Typography.body,
    color: Colors.primary,
    fontWeight: Typography.semibold,
  },
  title: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  editButtonText: {
    color: Colors.surface,
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.xl,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.xl,
    ...Shadows.md,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: Colors.primary,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.primary,
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  avatarInitials: {
    fontSize: 48,
    fontWeight: Typography.bold,
    color: Colors.surface,
  },
  playerName: {
    fontSize: Typography.h2,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  section: {
    marginBottom: Spacing.xxxl,
  },
  sectionTitle: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  statCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '48%',
    alignItems: 'center',
    ...Shadows.md,
  },
  statValue: {
    fontSize: 36,
    fontWeight: Typography.bold,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  totalScoreCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.md,
  },
  totalScoreLabel: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
  },
  totalScoreValue: {
    fontSize: 40,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
  },
  gameHistoryItem: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  gameHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  gameHistoryTemplate: {
    fontSize: Typography.h5,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    flex: 1,
  },
  placeBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
    ...Shadows.sm,
  },
  placeText: {
    color: Colors.surface,
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
  },
  gameHistoryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  gameHistoryScore: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    fontWeight: Typography.medium,
  },
  gameHistoryDate: {
    fontSize: Typography.bodySmall,
    color: Colors.textTertiary,
  },
  emptyText: {
    fontSize: Typography.body,
    color: Colors.textTertiary,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: Spacing.xl,
  },
  loadingText: {
    fontSize: Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.huge,
  },
});

