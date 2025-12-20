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
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
    paddingVertical: 20,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#007AFF',
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#007AFF',
    marginBottom: 16,
  },
  avatarInitials: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  playerName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  totalScoreCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalScoreLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  totalScoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#333',
  },
  gameHistoryItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gameHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  gameHistoryTemplate: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  placeBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  placeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  gameHistoryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  gameHistoryScore: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  gameHistoryDate: {
    fontSize: 14,
    color: '#999',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
});

