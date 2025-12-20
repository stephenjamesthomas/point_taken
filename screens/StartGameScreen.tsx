import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Player, GameTemplate, Game } from '../types';
import { loadPlayers, loadTemplates, loadGames, saveGames, getPlayerFullName } from '../utils/storage';

type StartGameScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'StartGame'
>;

export default function StartGameScreen() {
  const navigation = useNavigation<StartGameScreenNavigationProp>();
  const [players, setPlayers] = useState<Player[]>([]);
  const [templates, setTemplates] = useState<GameTemplate[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<GameTemplate | null>(null);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
  const [templateSearch, setTemplateSearch] = useState('');
  const [playerSearch, setPlayerSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [loadedPlayers, loadedTemplates, loadedGames] = await Promise.all([
      loadPlayers(),
      loadTemplates(),
      loadGames(),
    ]);
    setPlayers(loadedPlayers);
    setTemplates(loadedTemplates);
    setGames(loadedGames);
  };

  // Get recently played templates (last 3-4)
  const recentTemplates = useMemo(() => {
    const recentTemplateIds = new Set<string>();
    const completedGames = games
      .filter((g) => g.completedAt)
      .sort((a, b) => {
        const dateA = new Date(a.completedAt || a.createdAt).getTime();
        const dateB = new Date(b.completedAt || b.createdAt).getTime();
        return dateB - dateA;
      })
      .slice(0, 4);

    completedGames.forEach((g) => {
      recentTemplateIds.add(g.templateId);
    });

    return templates.filter((t) => recentTemplateIds.has(t.id));
  }, [games, templates]);

  // Get recently played players (last 3-4 games)
  const recentPlayers = useMemo(() => {
    const recentPlayerIds = new Set<string>();
    const completedGames = games
      .filter((g) => g.completedAt)
      .sort((a, b) => {
        const dateA = new Date(a.completedAt || a.createdAt).getTime();
        const dateB = new Date(b.completedAt || b.createdAt).getTime();
        return dateB - dateA;
      })
      .slice(0, 4);

    completedGames.forEach((g) => {
      g.playerIds.forEach((id) => recentPlayerIds.add(id));
    });

    return players.filter((p) => recentPlayerIds.has(p.id));
  }, [games, players]);

  // Filter templates based on search
  const filteredTemplates = useMemo(() => {
    if (!templateSearch.trim()) {
      return templates;
    }
    const searchLower = templateSearch.toLowerCase();
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(searchLower) ||
        t.description?.toLowerCase().includes(searchLower)
    );
  }, [templates, templateSearch]);

  // Filter players based on search
  const filteredPlayers = useMemo(() => {
    if (!playerSearch.trim()) {
      return players;
    }
    const searchLower = playerSearch.toLowerCase();
    return players.filter((p) => {
      const fullName = getPlayerFullName(p);
      return fullName.toLowerCase().includes(searchLower);
    });
  }, [players, playerSearch]);

  // Avatar helper functions
  const AVATAR_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52BE80',
  ];

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

  const handleTemplateSelect = (template: GameTemplate) => {
    Keyboard.dismiss();
    setTemplateSearch('');
    setSelectedTemplate(template);
    setSelectedPlayerIds(new Set());
  };

  const handlePlayerToggle = (playerId: string) => {
    Keyboard.dismiss();
    setPlayerSearch('');
    const newSelected = new Set(selectedPlayerIds);
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId);
    } else {
      if (
        selectedTemplate &&
        selectedTemplate.maxPlayers !== undefined &&
        newSelected.size >= selectedTemplate.maxPlayers
      ) {
        Alert.alert(
          'Too Many Players',
          `This template allows a maximum of ${selectedTemplate.maxPlayers} players.`
        );
        return;
      }
      newSelected.add(playerId);
    }
    setSelectedPlayerIds(newSelected);
  };

  const handleStartGame = async () => {
    if (!selectedTemplate) {
      Alert.alert('Error', 'Please select a game template');
      return;
    }

    // Only enforce minimum if template has a maxPlayers (not unlimited)
    if (
      selectedTemplate.maxPlayers !== undefined &&
      selectedPlayerIds.size < selectedTemplate.minPlayers
    ) {
      Alert.alert(
        'Not Enough Players',
        `This template requires at least ${selectedTemplate.minPlayers} players.`
      );
      return;
    }

    if (selectedTemplate.maxPlayers !== undefined && selectedPlayerIds.size > selectedTemplate.maxPlayers) {
      Alert.alert(
        'Too Many Players',
        `This template allows a maximum of ${selectedTemplate.maxPlayers} players.`
      );
      return;
    }

    const selectedPlayers = players.filter((p) => selectedPlayerIds.has(p.id));
    const playerNames = selectedPlayers.map((p) => getPlayerFullName(p));

    const newGame: Game = {
      id: Date.now().toString(),
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      playerIds: Array.from(selectedPlayerIds),
      playerNames,
      scores: [],
      winCondition: selectedTemplate.winCondition,
      endCondition: selectedTemplate.endCondition,
      endConditionValue: selectedTemplate.endConditionValue,
      endConditionAbsoluteValue: selectedTemplate.endConditionAbsoluteValue,
      endConditionTiming: selectedTemplate.endConditionTiming,
      createdAt: new Date().toISOString(),
    };

    const existingGames = await loadGames();
    await saveGames([...existingGames, newGame]);

    navigation.navigate('Game', { gameId: newGame.id });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        scrollEventThrottle={16}
        bounces={true}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Start New Game</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Select Game Template</Text>
          
          {recentTemplates.length > 0 && (
            <>
              <Text style={styles.subsectionTitle}>Recently Played</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.horizontalScroll}
                contentContainerStyle={styles.horizontalScrollContent}
              >
                {recentTemplates.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.templateCard,
                      selectedTemplate?.id === item.id ? styles.templateCardSelected : null,
                    ]}
                    onPress={() => handleTemplateSelect(item)}
                  >
                    <Text
                      style={[
                        styles.templateCardName,
                        selectedTemplate?.id === item.id ? styles.templateCardNameSelected : null,
                      ]}
                    >
                      {item.name}
                    </Text>
                    <Text style={styles.templateCardPlayers}>
                      {item.minPlayers}-{item.maxPlayers !== undefined ? item.maxPlayers : '∞'} players
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}

          <Text style={styles.subsectionTitle}>Search Templates</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search templates..."
            value={templateSearch}
            onChangeText={setTemplateSearch}
          />

          {filteredTemplates.length === 0 ? (
            <Text style={styles.emptyText}>
              {templateSearch.trim()
                ? 'No templates found matching your search.'
                : 'No templates available. Create one in the Templates screen.'}
            </Text>
          ) : (
            <View style={styles.templateGrid}>
              {filteredTemplates.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.templateCard,
                    selectedTemplate?.id === item.id ? styles.templateCardSelected : null,
                  ]}
                  onPress={() => handleTemplateSelect(item)}
                >
                  <Text
                    style={[
                      styles.templateCardName,
                      selectedTemplate?.id === item.id ? styles.templateCardNameSelected : null,
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text style={styles.templateCardPlayers}>
                    {item.minPlayers}-{item.maxPlayers !== undefined ? item.maxPlayers : '∞'} players
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {selectedTemplate && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              2. Select Players ({selectedPlayerIds.size}
              {selectedTemplate.maxPlayers !== undefined
                ? `/${selectedTemplate.maxPlayers}`
                : ' selected'})
            </Text>
            {selectedTemplate.maxPlayers !== undefined && (
              <Text style={styles.requirementText}>
                Minimum: {selectedTemplate.minPlayers} players
              </Text>
            )}

            {recentPlayers.length > 0 && (
              <>
                <Text style={styles.subsectionTitle}>Recently Played</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.horizontalScroll}
                  contentContainerStyle={styles.horizontalScrollContent}
                >
                  {recentPlayers.map((item) => {
                    const isSelected = selectedPlayerIds.has(item.id);
                    const fullName = getPlayerFullName(item);
                    const initials = getInitials(item);
                    const avatarColor = getAvatarColor(item);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.playerCardHorizontal,
                          isSelected ? styles.playerCardSelected : null,
                        ]}
                        onPress={() => handlePlayerToggle(item.id)}
                      >
                        {item.avatar ? (
                          <Image source={{ uri: item.avatar }} style={styles.playerAvatarSmall} />
                        ) : (
                          <View style={[styles.playerAvatarPlaceholderSmall, { backgroundColor: avatarColor }]}>
                            <Text style={styles.playerAvatarInitialsSmall}>{initials}</Text>
                          </View>
                        )}
                        <Text
                          style={[
                            styles.playerCardName,
                            isSelected ? styles.playerCardNameSelected : null,
                          ]}
                        >
                          {fullName}
                        </Text>
                        {isSelected && <Text style={styles.checkmark}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            <Text style={styles.subsectionTitle}>Search Players</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search players..."
              value={playerSearch}
              onChangeText={setPlayerSearch}
            />

            {filteredPlayers.length === 0 ? (
              <Text style={styles.emptyText}>
                {playerSearch.trim()
                  ? 'No players found matching your search.'
                  : 'No players available. Add players in the Players screen.'}
              </Text>
            ) : (
              filteredPlayers.map((item) => {
                const isSelected = selectedPlayerIds.has(item.id);
                const fullName = getPlayerFullName(item);
                const initials = getInitials(item);
                const avatarColor = getAvatarColor(item);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.playerCard,
                      isSelected ? styles.playerCardSelected : null,
                    ]}
                    onPress={() => handlePlayerToggle(item.id)}
                  >
                    {item.avatar ? (
                      <Image source={{ uri: item.avatar }} style={styles.playerAvatar} />
                    ) : (
                      <View style={[styles.playerAvatarPlaceholder, { backgroundColor: avatarColor }]}>
                        <Text style={styles.playerAvatarInitials}>{initials}</Text>
                      </View>
                    )}
                    <Text
                      style={[
                        styles.playerCardName,
                        isSelected ? styles.playerCardNameSelected : null,
                      ]}
                    >
                      {fullName}
                    </Text>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {selectedTemplate &&
          (selectedTemplate.maxPlayers === undefined ||
            selectedPlayerIds.size >= selectedTemplate.minPlayers) &&
          selectedPlayerIds.size > 0 && (
            <TouchableOpacity style={styles.startButton} onPress={handleStartGame}>
              <Text style={styles.startButtonText}>Start Game</Text>
            </TouchableOpacity>
          )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    marginBottom: 20,
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
    marginBottom: 24,
    color: '#333',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  requirementText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  horizontalScroll: {
    marginBottom: 12,
  },
  horizontalScrollContent: {
    paddingRight: 20,
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  templateCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    minWidth: 150,
    flex: 1,
    maxWidth: '48%',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    marginBottom: 12,
    marginHorizontal: 6,
  },
  templateCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  templateCardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  templateCardNameSelected: {
    color: '#007AFF',
  },
  templateCardPlayers: {
    fontSize: 12,
    color: '#666',
  },
  playerCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  playerCardHorizontal: {
    backgroundColor: '#fff',
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    minWidth: 140,
  },
  playerCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  playerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  playerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playerAvatarInitials: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  playerAvatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  playerAvatarPlaceholderSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  playerAvatarInitialsSmall: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  playerCardName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  playerCardNameSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8,
  },
  startButton: {
    backgroundColor: '#34C759',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

