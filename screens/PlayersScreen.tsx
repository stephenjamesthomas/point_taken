import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Player } from '../types';
import { loadPlayers, getPlayerFullName } from '../utils/storage';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/design';

const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52BE80',
];

type PlayersScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Players'>;

export default function PlayersScreen() {
  const navigation = useNavigation<PlayersScreenNavigationProp>();
  const [players, setPlayers] = useState<Player[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      loadPlayersData();
    }, [])
  );

  const loadPlayersData = async () => {
    const loadedPlayers = await loadPlayers();
    // Sort players alphabetically by last name (if exists), then first name
    const sortedPlayers = [...loadedPlayers].sort((a, b) => {
      const aLastName = a.lastName || '';
      const bLastName = b.lastName || '';
      const lastNameCompare = aLastName.localeCompare(bLastName);
      if (lastNameCompare !== 0) return lastNameCompare;
      return a.firstName.localeCompare(b.firstName);
    });
    setPlayers(sortedPlayers);
  };

  const handleAddPlayer = () => {
    navigation.navigate('EditPlayer', {});
  };

  const handleEditPlayer = (player: Player) => {
    navigation.navigate('EditPlayer', { playerId: player.id });
  };

  const handleViewPlayer = (player: Player) => {
    navigation.navigate('PlayerDetail', { playerId: player.id });
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Players</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddPlayer}>
          <Text style={styles.addButtonText}>+ Add Player</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={players}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const fullName = getPlayerFullName(item);
          const initials = getInitials(item);
          const avatarColor = getAvatarColor(item);
          return (
            <TouchableOpacity
              style={styles.playerItem}
              onPress={() => handleViewPlayer(item)}
            >
              {item.avatar ? (
                <Image source={{ uri: item.avatar }} style={styles.avatarImage} />
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
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{fullName}</Text>
                {item.gamesPlayed > 0 && (
                  <Text style={styles.playerStats}>
                    {item.gamesPlayed} games • {item.gamesWon} wins
                  </Text>
                )}
              </View>
              <View style={styles.playerActions}>
                <TouchableOpacity
                  style={[styles.editButton, styles.buttonSpacing]}
                  onPress={() => handleEditPlayer(item)}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No players yet. Add your first player!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.xl,
    paddingTop: 60,
    backgroundColor: Colors.surface,
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
  title: {
    fontSize: Typography.h2,
    fontWeight: Typography.bold,
    marginBottom: Spacing.lg,
    color: Colors.textPrimary,
  },
  addButton: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    ...Shadows.sm,
  },
  addButtonText: {
    color: Colors.surface,
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
  },
  playerItem: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    borderRadius: BorderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.md,
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarInitials: {
    fontSize: Typography.h5,
    fontWeight: Typography.bold,
    color: Colors.surface,
  },
  playerInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  playerName: {
    fontSize: Typography.h5,
    fontWeight: Typography.medium,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  playerStats: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
  },
  playerActions: {
    flexDirection: 'row',
  },
  buttonSpacing: {
    marginRight: Spacing.sm,
  },
  editButton: {
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    ...Shadows.sm,
  },
  editButtonText: {
    color: Colors.surface,
    fontSize: Typography.bodySmall,
    fontWeight: Typography.semibold,
  },
  deleteButton: {
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    ...Shadows.sm,
  },
  deleteButtonText: {
    color: Colors.surface,
    fontSize: Typography.bodySmall,
    fontWeight: Typography.semibold,
  },
  emptyContainer: {
    padding: Spacing.huge,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.body,
    color: Colors.textTertiary,
    textAlign: 'center',
  },
});

