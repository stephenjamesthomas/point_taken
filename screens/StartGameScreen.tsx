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
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/design';

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

  // Get recently played players (ordered by most recent game participation)
  const recentPlayersOrdered = useMemo(() => {
    // Create a map of playerId -> most recent game date
    const playerLastPlayed = new Map<string, number>();
    
    games
      .filter((g) => g.completedAt)
      .forEach((g) => {
        const gameDate = new Date(g.completedAt || g.createdAt).getTime();
        g.playerIds.forEach((id) => {
          const currentDate = playerLastPlayed.get(id) || 0;
          if (gameDate > currentDate) {
            playerLastPlayed.set(id, gameDate);
          }
        });
      });

    // Sort players by most recent game date (players with no games go to end)
    return players.sort((a, b) => {
      const dateA = playerLastPlayed.get(a.id) || 0;
      const dateB = playerLastPlayed.get(b.id) || 0;
      if (dateA === 0 && dateB === 0) return 0; // Both have no games
      if (dateA === 0) return 1; // a has no games, goes to end
      if (dateB === 0) return -1; // b has no games, goes to end
      return dateB - dateA; // Most recent first
    });
  }, [games, players]);

  // Get displayed players list: selected first, then 5 most recent (excluding selected), ordered by most recent
  const displayedPlayers = useMemo(() => {
    // If searching, search through all players (ordered by most recent)
    if (playerSearch.trim()) {
      const searchLower = playerSearch.toLowerCase();
      const filtered = recentPlayersOrdered.filter((p) => {
        const fullName = getPlayerFullName(p);
        return fullName.toLowerCase().includes(searchLower);
      });
      
      // When searching, show selected first, then others
      const selected = filtered.filter((p) => selectedPlayerIds.has(p.id));
      const others = filtered.filter((p) => !selectedPlayerIds.has(p.id));
      return [...selected, ...others];
    }

    // When not searching: selected first, then 5 most recent (excluding selected)
    const selected = recentPlayersOrdered
      .filter((p) => selectedPlayerIds.has(p.id));

    const suggested = recentPlayersOrdered
      .filter((p) => !selectedPlayerIds.has(p.id))
      .slice(0, 5);

    return [...selected, ...suggested];
  }, [recentPlayersOrdered, selectedPlayerIds, playerSearch]);

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
    setPlayerSearch('');
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
          
          {selectedTemplate ? (
            <View style={styles.selectedTemplateContainer}>
              <TouchableOpacity
                style={[styles.templateCard, styles.templateCardSelected, styles.selectedTemplateCard]}
                onPress={() => {
                  setSelectedTemplate(null);
                  setTemplateSearch('');
                }}
              >
                <Text style={styles.templateCardNameSelected}>
                  {selectedTemplate.name}
                </Text>
                <Text style={styles.templateCardPlayers}>
                  {selectedTemplate.minPlayers}-{selectedTemplate.maxPlayers !== undefined ? selectedTemplate.maxPlayers : '∞'} players
                </Text>
                {selectedTemplate.description && (
                  <Text style={styles.templateCardDescription}>
                    {selectedTemplate.description}
                  </Text>
                )}
                <Text style={styles.changeTemplateText}>Tap to change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
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
                        style={styles.templateCard}
                        onPress={() => handleTemplateSelect(item)}
                      >
                        <Text style={styles.templateCardName}>
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
                      style={styles.templateCard}
                      onPress={() => handleTemplateSelect(item)}
                    >
                      <Text style={styles.templateCardName}>
                        {item.name}
                      </Text>
                      <Text style={styles.templateCardPlayers}>
                        {item.minPlayers}-{item.maxPlayers !== undefined ? item.maxPlayers : '∞'} players
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
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

            <Text style={styles.subsectionTitle}>Search Players</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search players..."
              value={playerSearch}
              onChangeText={setPlayerSearch}
            />

            {displayedPlayers.length === 0 ? (
              <Text style={styles.emptyText}>
                {playerSearch.trim()
                  ? 'No players found matching your search.'
                  : 'No players available. Add players in the Players screen.'}
              </Text>
            ) : (
              displayedPlayers.map((item) => {
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
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.xl,
    paddingTop: 60,
    paddingBottom: Spacing.huge,
  },
  backButton: {
    marginBottom: Spacing.xl,
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
    marginBottom: Spacing.xxl,
    color: Colors.textPrimary,
  },
  section: {
    marginBottom: Spacing.xxxl,
  },
  sectionTitle: {
    fontSize: Typography.h4,
    fontWeight: Typography.semibold,
    marginBottom: Spacing.md,
    color: Colors.textPrimary,
  },
  requirementText: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  subsectionTitle: {
    fontSize: Typography.body,
    fontWeight: Typography.medium,
    color: Colors.textSecondary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    fontSize: Typography.body,
    marginBottom: Spacing.md,
    color: Colors.textPrimary,
    ...Shadows.sm,
  },
  horizontalScroll: {
    marginBottom: Spacing.md,
  },
  horizontalScrollContent: {
    paddingRight: Spacing.xl,
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.sm,
  },
  templateCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    minWidth: 150,
    flex: 1,
    maxWidth: '48%',
    borderWidth: 2,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.sm,
    ...Shadows.md,
  },
  templateCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
    ...Shadows.colored,
  },
  templateCardName: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  templateCardNameSelected: {
    color: Colors.primary,
  },
  templateCardPlayers: {
    fontSize: Typography.caption,
    color: Colors.textSecondary,
  },
  templateCardDescription: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  changeTemplateText: {
    fontSize: Typography.caption,
    color: Colors.primary,
    marginTop: Spacing.sm,
    fontWeight: Typography.medium,
  },
  selectedTemplateContainer: {
    marginTop: Spacing.md,
  },
  selectedTemplateCard: {
    maxWidth: '100%',
    width: '100%',
  },
  playerCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadows.md,
  },
  playerCardHorizontal: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    minWidth: 140,
    ...Shadows.sm,
  },
  playerCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
    ...Shadows.colored,
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
  playerAvatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  playerAvatarPlaceholderSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  playerAvatarInitialsSmall: {
    fontSize: Typography.bodySmall,
    fontWeight: Typography.bold,
    color: Colors.surface,
  },
  playerCardName: {
    fontSize: Typography.body,
    fontWeight: Typography.medium,
    color: Colors.textPrimary,
    flex: 1,
  },
  playerCardNameSelected: {
    color: Colors.primary,
    fontWeight: Typography.semibold,
  },
  checkmark: {
    fontSize: 22,
    color: Colors.primary,
    fontWeight: Typography.bold,
  },
  emptyText: {
    fontSize: Typography.bodySmall,
    color: Colors.textTertiary,
    fontStyle: 'italic',
    marginTop: Spacing.sm,
  },
  startButton: {
    backgroundColor: Colors.success,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.huge,
    borderWidth: 2,
    borderColor: Colors.successLight,
    ...Shadows.lg,
  },
  startButtonText: {
    color: Colors.surface,
    fontSize: Typography.h5,
    fontWeight: Typography.bold,
    letterSpacing: 0.3,
  },
});

