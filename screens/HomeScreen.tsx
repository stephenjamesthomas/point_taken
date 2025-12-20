import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../constants/design';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={true}
      scrollEventThrottle={16}
      bounces={true}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Card Score Tracker</Text>
        <Text style={styles.subtitle}>Track your card game scores</Text>

        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={[styles.menuButton, styles.menuButtonSpacing]}
            onPress={() => navigation.navigate('StartGame')}
          >
            <Text style={styles.menuButtonText}>Start New Game</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, styles.menuButtonSpacing]}
            onPress={() => navigation.navigate('Players')}
          >
            <Text style={styles.menuButtonText}>Manage Players</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuButton, styles.menuButtonSpacing]}
            onPress={() => navigation.navigate('Templates')}
          >
            <Text style={styles.menuButtonText}>Game Templates</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => navigation.navigate('GameHistory')}
          >
            <Text style={styles.menuButtonText}>Game History</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    flexGrow: 1,
  },
  content: {
    padding: Spacing.xl,
    paddingTop: 60,
    paddingBottom: Spacing.huge,
  },
  title: {
    fontSize: Typography.h1,
    fontWeight: Typography.bold,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.huge,
    color: Colors.textSecondary,
    fontWeight: Typography.regular,
  },
  menuContainer: {
    gap: Spacing.lg,
  },
  menuButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  menuButtonSpacing: {
    // Using gap in container instead
  },
  menuButtonText: {
    color: Colors.surface,
    fontSize: Typography.h5,
    fontWeight: Typography.semibold,
    letterSpacing: 0.3,
  },
});

