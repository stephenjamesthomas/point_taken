import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Game } from '../types';
import { loadGames, saveGames } from '../utils/storage';

type GameHistoryScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'GameHistory'
>;

export default function GameHistoryScreen() {
  const navigation = useNavigation<GameHistoryScreenNavigationProp>();
  const [games, setGames] = useState<Game[]>([]);

  useEffect(() => {
    loadGamesData();
  }, []);

  const loadGamesData = async () => {
    const loadedGames = await loadGames();
    // Sort by most recent first
    const sorted = loadedGames.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    setGames(sorted);
  };

  const handleDeleteGame = (game: Game) => {
    Alert.alert(
      'Delete Game',
      `Are you sure you want to delete this game?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedGames = games.filter((g) => g.id !== game.id);
            await saveGames(updatedGames);
            setGames(updatedGames);
          },
        },
      ]
    );
  };

  const getLeader = (game: Game): string => {
    if (game.scores.length === 0) return 'No rounds played';
    
    const totals: { [playerId: string]: number } = {};
    game.playerIds.forEach((id) => {
      totals[id] = 0;
    });

    game.scores.forEach((round) => {
      round.forEach((entry) => {
        totals[entry.playerId] = (totals[entry.playerId] || 0) + entry.score;
      });
    });

    const winCondition = game.winCondition || 'high';
    const sorted = Object.entries(totals).sort((a, b) => 
      winCondition === 'high' ? b[1] - a[1] : a[1] - b[1]
    );
    const leaderId = sorted[0][0];
    const leaderName = game.playerNames[game.playerIds.indexOf(leaderId)];
    const leaderScore = sorted[0][1];
    
    return `${leaderName} (${leaderScore})`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
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
        <Text style={styles.title}>Game History</Text>
      </View>

      <FlatList
        data={games}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.gameItem}>
            <View style={styles.gameInfo}>
              <Text style={styles.gameName}>{item.templateName}</Text>
              <Text style={styles.gameDate}>{formatDate(item.createdAt)}</Text>
              <Text style={styles.gamePlayers}>
                Players: {item.playerNames.join(', ')}
              </Text>
              <Text style={styles.gameRounds}>
                Rounds: {item.scores.length}
              </Text>
              <Text style={styles.gameWinner}>
                {item.completedAt ? 'Winner: ' : 'Leads: '}{getLeader(item)}
              </Text>
              {item.completedAt && (
                <Text style={styles.gameCompleted}>
                  Completed: {formatDate(item.completedAt)}
                </Text>
              )}
            </View>
            <View style={styles.gameActions}>
              <TouchableOpacity
                style={[styles.viewButton, styles.buttonSpacing]}
                onPress={() => {
                  if (item.completedAt) {
                    navigation.navigate('CompletedGame', { gameId: item.id });
                  } else {
                    navigation.navigate('Game', { gameId: item.id });
                  }
                }}
              >
                <Text style={styles.viewButtonText}>
                  {item.completedAt ? 'View' : 'Resume'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteGame(item)}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No games yet. Start your first game!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  gameItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
  },
  gameInfo: {
    marginBottom: 12,
  },
  gameName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  gameDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  gamePlayers: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  gameRounds: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  gameWinner: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
    marginBottom: 4,
  },
  gameCompleted: {
    fontSize: 12,
    color: '#999',
  },
  gameActions: {
    flexDirection: 'row',
  },
  buttonSpacing: {
    marginRight: 8,
  },
  viewButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  viewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

