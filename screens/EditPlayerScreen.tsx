import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../navigation/types';
import { Player } from '../types';
import { loadPlayers, savePlayers } from '../utils/storage';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/design';

type EditPlayerScreenRouteProp = RouteProp<RootStackParamList, 'EditPlayer'>;
type EditPlayerScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'EditPlayer'
>;

// Default avatar colors for initials
const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52BE80',
];

export default function EditPlayerScreen() {
  const route = useRoute<EditPlayerScreenRouteProp>();
  const navigation = useNavigation<EditPlayerScreenNavigationProp>();
  const { playerId } = route.params;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatar, setAvatar] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (playerId) {
      loadPlayerData();
    } else {
      // Reset form for new player
      setFirstName('');
      setLastName('');
      setAvatar(undefined);
    }
  }, [playerId]);

  const loadPlayerData = async () => {
    if (!playerId) return;
    const players = await loadPlayers();
    const player = players.find((p) => p.id === playerId);
    if (player) {
      setFirstName(player.firstName || '');
      setLastName(player.lastName || '');
      setAvatar(player.avatar);
    }
  };

  const handleTakePhoto = async () => {
    try {
      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to take a photo.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleChooseFromLibrary = async () => {
    try {
      // Request media library permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Photo library permission is required to select an image.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  const handleRemoveAvatar = () => {
    setAvatar(undefined);
  };

  const getInitials = (first: string, last?: string): string => {
    const firstInitial = first.trim().charAt(0).toUpperCase() || '';
    const lastInitial = last?.trim().charAt(0).toUpperCase() || '';
    return firstInitial + lastInitial || firstInitial || '?';
  };

  const getAvatarColor = (first: string, last?: string): string => {
    const name = (first + (last || '')).toLowerCase();
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  };

  const handleSave = async () => {
    if (!firstName.trim()) {
      Alert.alert('Error', 'Please enter a first name');
      return;
    }

    const players = await loadPlayers();
    let updatedPlayers: Player[];

    if (playerId) {
      // Update existing player
      updatedPlayers = players.map((p) =>
        p.id === playerId
          ? {
              ...p,
              firstName: firstName.trim(),
              lastName: lastName.trim() || undefined, // Optional
              avatar: avatar,
            }
          : p
      );
    } else {
          // Create new player
          const newPlayer: Player = {
            id: Date.now().toString(),
            firstName: firstName.trim(),
            lastName: lastName.trim() || undefined, // Optional
            avatar: avatar,
            createdAt: new Date().toISOString(),
            gamesPlayed: 0,
            gamesWon: 0,
            totalScore: 0,
            averagePlace: 0,
            gameHistory: [],
          };
      updatedPlayers = [...players, newPlayer];
    }

    // Sort players alphabetically by last name (if exists), then first name
    const sortedPlayers = [...updatedPlayers].sort((a, b) => {
      const aLastName = a.lastName || '';
      const bLastName = b.lastName || '';
      const lastNameCompare = aLastName.localeCompare(bLastName);
      if (lastNameCompare !== 0) return lastNameCompare;
      return a.firstName.localeCompare(b.firstName);
    });

    await savePlayers(sortedPlayers);
    navigation.goBack();
  };

  const initials = getInitials(firstName, lastName);
  const avatarColor = getAvatarColor(firstName, lastName);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {playerId ? 'Edit Player' : 'New Player'}
        </Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
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
        {/* Avatar Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Avatar</Text>
          <View style={styles.avatarContainer}>
            {avatar ? (
              <View style={styles.avatarWrapper}>
                <Image source={{ uri: avatar }} style={styles.avatarImage} />
                <TouchableOpacity
                  style={styles.removeAvatarButton}
                  onPress={handleRemoveAvatar}
                >
                  <Text style={styles.removeAvatarButtonText}>×</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View
                style={[
                  styles.avatarPlaceholder,
                  { backgroundColor: avatarColor },
                ]}
              >
                <Text style={styles.avatarInitials}>
                  {initials || '??'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.avatarOptions}>
            <TouchableOpacity
              style={[styles.avatarOptionButton, styles.avatarOptionSpacing]}
              onPress={handleTakePhoto}
            >
              <Text style={styles.avatarOptionText}>📷 Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.avatarOptionButton}
              onPress={handleChooseFromLibrary}
            >
              <Text style={styles.avatarOptionText}>🖼️ Choose from Library</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarHint}>
            {!avatar && 'Avatar will show initials if no image is selected'}
          </Text>
        </View>

        {/* Name Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Name</Text>
          <Text style={styles.label}>First Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="First name"
            value={firstName}
            onChangeText={setFirstName}
          />
          <Text style={styles.label}>Last Name (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Last name"
            value={lastName}
            onChangeText={setLastName}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  saveButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  saveButtonText: {
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
  section: {
    marginBottom: Spacing.xxxl,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    ...Shadows.md,
  },
  sectionTitle: {
    fontSize: Typography.h4,
    fontWeight: Typography.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: Colors.primary,
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
    ...Shadows.md,
  },
  avatarInitials: {
    fontSize: 48,
    fontWeight: Typography.bold,
    color: Colors.surface,
  },
  removeAvatarButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.error,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.surface,
    ...Shadows.md,
  },
  removeAvatarButtonText: {
    color: Colors.surface,
    fontSize: 24,
    fontWeight: Typography.bold,
  },
  avatarOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  avatarOptionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  avatarOptionSpacing: {
    // Using gap instead
  },
  avatarOptionText: {
    color: Colors.surface,
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
  },
  avatarHint: {
    fontSize: Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  label: {
    fontSize: Typography.body,
    fontWeight: Typography.semibold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.body,
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
  },
});

